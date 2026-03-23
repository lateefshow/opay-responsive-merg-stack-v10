package controllers

import (
	"context"
	"math"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/opay/backend/config"
	"github.com/opay/backend/models"
	"github.com/opay/backend/services"
	"github.com/opay/backend/utils"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func round2BNPL(v float64) float64 { return math.Round(v*100) / 100 }

// GetBNPLPlans GET /api/pay-later
func GetBNPLPlans(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }
	var plans []models.BNPLPlan
	cursor, _ := config.DB.Collection("bnpl_plans").Find(context.Background(), bson.M{"userId": uid})
	if cursor != nil { defer cursor.Close(context.Background()); _ = cursor.All(context.Background(), &plans) }
	if plans == nil { plans = []models.BNPLPlan{} }

	totalOutstanding := 0.0
	for _, p := range plans {
		if p.Status == models.BNPLActive { totalOutstanding += p.TotalAmount - p.AmountPaid }
	}
	return utils.OK(c, "plans fetched", fiber.Map{"plans": plans, "totalOutstanding": totalOutstanding})
}

// CreateBNPLPlan POST /api/pay-later
func CreateBNPLPlan(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }

	var req models.CreateBNPLRequest
	if err := c.BodyParser(&req); err != nil { return utils.BadRequest(c, "invalid body") }
	if err := validate.Struct(req); err != nil  { return utils.BadRequest(c, err.Error()) }

	// Check credit limit: max ₦500K outstanding
	var existing []models.BNPLPlan
	cursor, _ := config.DB.Collection("bnpl_plans").Find(context.Background(), bson.M{"userId": uid, "status": "active"})
	if cursor != nil { defer cursor.Close(context.Background()); _ = cursor.All(context.Background(), &existing) }
	outstanding := 0.0
	for _, p := range existing { outstanding += p.TotalAmount - p.AmountPaid }
	if outstanding+req.TotalAmount > 500000 { return utils.BadRequest(c, "exceeds BNPL credit limit of ₦500,000") }

	// Build installment schedule
	perInstall := round2BNPL(req.TotalAmount / float64(req.Installments))
	var installments []models.BNPLInstallment
	now := time.Now()
	for i := 1; i <= req.Installments; i++ {
		daysAhead := 0
		switch req.Frequency {
		case "weekly":   daysAhead = i * 7
		case "biweekly": daysAhead = i * 14
		case "monthly":  daysAhead = i * 30
		}
		installments = append(installments, models.BNPLInstallment{
			Number:  i,
			Amount:  perInstall,
			DueDate: now.AddDate(0, 0, daysAhead),
			Paid:    false,
		})
	}

	plan := &models.BNPLPlan{
		ID:           primitive.NewObjectID(),
		UserID:       uid,
		Merchant:     req.Merchant,
		MerchantLogo: req.MerchantLogo,
		Description:  req.Description,
		TotalAmount:  req.TotalAmount,
		AmountPaid:   0,
		Installments: installments,
		Frequency:    req.Frequency,
		Status:       models.BNPLActive,
		InterestRate: 0, // 0% intro rate for demo
		CreatedAt:    now,
		UpdatedAt:    now,
	}
	if _, err := config.DB.Collection("bnpl_plans").InsertOne(context.Background(), plan); err != nil {
		return utils.InternalError(c, "failed to create BNPL plan")
	}
	return utils.Created(c, "buy now pay later plan created", plan)
}

// PayBNPLInstallment POST /api/pay-later/:id/pay
func PayBNPLInstallment(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }

	planID, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil { return utils.BadRequest(c, "invalid plan id") }

	var req models.PayInstallmentRequest
	if err := c.BodyParser(&req); err != nil { return utils.BadRequest(c, "invalid body") }

	var plan models.BNPLPlan
	ctx := context.Background()
	if err := config.DB.Collection("bnpl_plans").FindOne(ctx, bson.M{"_id": planID, "userId": uid}).Decode(&plan); err != nil {
		return utils.NotFound(c, "BNPL plan not found")
	}
	if plan.Status != models.BNPLActive { return utils.BadRequest(c, "plan is not active") }

	// Find installment
	installIdx := -1
	for i, inst := range plan.Installments {
		if inst.Number == req.InstallmentNumber {
			installIdx = i; break
		}
	}
	if installIdx < 0  { return utils.NotFound(c, "installment not found") }
	if plan.Installments[installIdx].Paid { return utils.BadRequest(c, "installment already paid") }

	amt := plan.Installments[installIdx].Amount
	bal, _ := services.GetWalletBalance(uid)
	if bal < amt { return utils.BadRequest(c, "insufficient wallet balance") }

	// Debit wallet
	_, _ = services.FundWallet(uid, -amt)

	now := time.Now()
	plan.Installments[installIdx].Paid    = true
	plan.Installments[installIdx].PaidDate = &now
	plan.AmountPaid  = round2BNPL(plan.AmountPaid + amt)
	plan.UpdatedAt   = now

	// Check if all paid → complete
	allPaid := true
	for _, i := range plan.Installments { if !i.Paid { allPaid = false; break } }
	if allPaid { plan.Status = models.BNPLCompleted }

	_, _ = config.DB.Collection("bnpl_plans").ReplaceOne(ctx, bson.M{"_id": planID}, plan)
	newBal, _ := services.GetWalletBalance(uid)
	return utils.OK(c, "installment paid", fiber.Map{"plan": plan, "newBalance": newBal})
}
