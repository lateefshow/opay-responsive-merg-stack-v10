package controllers

import (
	"context"
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/opay/backend/config"
	"github.com/opay/backend/models"
	"github.com/opay/backend/services"
	"github.com/opay/backend/utils"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

const escrowFee = 0.01 // 1% escrow fee

// GetEscrows GET /api/escrow
func GetEscrows(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }
	var contracts []models.EscrowContract
	cursor, _ := config.DB.Collection("escrow_contracts").Find(context.Background(), bson.M{"buyerId": uid})
	if cursor != nil { defer cursor.Close(context.Background()); _ = cursor.All(context.Background(), &contracts) }
	if contracts == nil { contracts = []models.EscrowContract{} }

	totalHeld := 0.0
	for _, ec := range contracts { totalHeld += ec.AmountHeld }
	return utils.OK(c, "escrows fetched", fiber.Map{"contracts": contracts, "totalHeld": totalHeld})
}

// CreateEscrow POST /api/escrow
func CreateEscrow(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }
	var req models.CreateEscrowRequest
	if err := c.BodyParser(&req); err != nil { return utils.BadRequest(c, "invalid body") }
	if err := validate.Struct(req); err != nil  { return utils.BadRequest(c, err.Error()) }

	total := 0.0
	for _, ms := range req.Milestones { total += ms.Amount }
	fee     := total * escrowFee
	totalWithFee := total + fee

	bal, _ := services.GetWalletBalance(uid)
	if bal < totalWithFee { return utils.BadRequest(c, fmt.Sprintf("insufficient balance — need ₦%.2f (₦%.2f + ₦%.2f fee)", totalWithFee, total, fee)) }
	_, _ = services.FundWallet(uid, -totalWithFee)

	// Assign IDs to milestones
	for i := range req.Milestones {
		req.Milestones[i].ID     = uuid.New().String()[:8]
		req.Milestones[i].Status = models.MilestonePending
	}

	ec := &models.EscrowContract{
		ID:             primitive.NewObjectID(),
		BuyerID:        uid,
		SellerEmail:    req.SellerEmail,
		SellerName:     req.SellerName,
		Title:          req.Title,
		Description:    req.Description,
		TotalAmount:    total,
		AmountHeld:     total,
		AmountReleased: 0,
		Milestones:     req.Milestones,
		Status:         models.EscrowFunded,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}
	_, _ = config.DB.Collection("escrow_contracts").InsertOne(context.Background(), ec)
	newBal, _ := services.GetWalletBalance(uid)
	return utils.Created(c, "escrow created", fiber.Map{"contract": ec, "newBalance": newBal, "fee": fee})
}

// ReleaseMilestone POST /api/escrow/:id/release
func ReleaseMilestone(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }
	ecID, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil { return utils.BadRequest(c, "invalid escrow id") }
	var req models.ReleaseMilestoneRequest
	if err := c.BodyParser(&req); err != nil { return utils.BadRequest(c, "invalid body") }

	var ec models.EscrowContract
	ctx := context.Background()
	if err := config.DB.Collection("escrow_contracts").FindOne(ctx, bson.M{"_id": ecID, "buyerId": uid}).Decode(&ec); err != nil {
		return utils.NotFound(c, "escrow not found")
	}

	released := 0.0
	for i, ms := range ec.Milestones {
		if ms.ID == req.MilestoneID && ms.Status == models.MilestonePending {
			now := time.Now()
			ec.Milestones[i].Status     = models.MilestoneReleased
			ec.Milestones[i].ReleasedAt = &now
			released                    = ms.Amount
			break
		}
	}
	if released == 0 { return utils.BadRequest(c, "milestone not found or already released") }

	ec.AmountReleased += released
	ec.AmountHeld     -= released
	ec.UpdatedAt       = time.Now()

	allReleased := true
	for _, ms := range ec.Milestones { if ms.Status != models.MilestoneReleased { allReleased = false; break } }
	if allReleased { ec.Status = models.EscrowCompleted }

	_, _ = config.DB.Collection("escrow_contracts").ReplaceOne(ctx, bson.M{"_id": ecID}, ec)

	// Credit seller wallet (find seller by email)
	var seller models.User
	if err := config.DB.Collection("users").FindOne(ctx, bson.M{"email": ec.SellerEmail}).Decode(&seller); err == nil {
		_, _ = services.FundWallet(seller.ID, released)
	}
	return utils.OK(c, "milestone released", ec)
}

// CancelEscrow DELETE /api/escrow/:id
func CancelEscrow(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }
	ecID, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil { return utils.BadRequest(c, "invalid escrow id") }

	var ec models.EscrowContract
	ctx := context.Background()
	if err := config.DB.Collection("escrow_contracts").FindOne(ctx, bson.M{"_id": ecID, "buyerId": uid}).Decode(&ec); err != nil {
		return utils.NotFound(c, "escrow not found")
	}
	if ec.Status == models.EscrowCompleted { return utils.BadRequest(c, "completed escrow cannot be cancelled") }

	// Refund remaining held amount
	if ec.AmountHeld > 0 { _, _ = services.FundWallet(uid, ec.AmountHeld) }
	_, _ = config.DB.Collection("escrow_contracts").UpdateOne(ctx, bson.M{"_id": ecID},
		bson.M{"$set": bson.M{"status": models.EscrowCancelled, "amountHeld": 0, "updatedAt": time.Now()}},
	)
	return utils.OK(c, "escrow cancelled and refunded", nil)
}
