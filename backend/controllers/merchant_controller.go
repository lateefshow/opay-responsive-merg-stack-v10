package controllers

import (
	"context"
	"fmt"
	"math/rand"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/opay/backend/config"
	"github.com/opay/backend/models"
	"github.com/opay/backend/services"
	"github.com/opay/backend/utils"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

const merchantFeeRate = 0.015 // 1.5% transaction fee

// GetMerchantProfile GET /api/merchant/profile
func GetMerchantProfile(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }

	var profile models.MerchantProfile
	err = config.DB.Collection("merchant_profiles").FindOne(context.Background(), bson.M{"userId": uid}).Decode(&profile)
	if err == mongo.ErrNoDocuments { return utils.NotFound(c, "no merchant profile") }
	if err != nil { return utils.InternalError(c, "failed to fetch profile") }
	return utils.OK(c, "profile fetched", profile)
}

// CreateMerchantProfile POST /api/merchant/profile
func CreateMerchantProfile(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }

	var req models.CreateMerchantRequest
	if err := c.BodyParser(&req); err != nil { return utils.BadRequest(c, "invalid body") }
	if err := validate.Struct(req); err != nil  { return utils.BadRequest(c, err.Error()) }

	// Check no existing profile
	count, _ := config.DB.Collection("merchant_profiles").CountDocuments(context.Background(), bson.M{"userId": uid})
	if count > 0 { return utils.Conflict(c, "merchant profile already exists") }

	accNum := fmt.Sprintf("%010d", rand.Intn(9000000000)+1000000000)
	qrCode := fmt.Sprintf("opay://pay/%s?v=1", uuid.New().String()[:16])

	profile := &models.MerchantProfile{
		ID:           primitive.NewObjectID(),
		UserID:       uid,
		BusinessName: req.BusinessName,
		Category:     req.Category,
		Description:  req.Description,
		QRCode:       qrCode,
		AccountNumber: accNum,
		IsVerified:   false,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}
	if _, err := config.DB.Collection("merchant_profiles").InsertOne(context.Background(), profile); err != nil {
		return utils.InternalError(c, "failed to create merchant profile")
	}
	return utils.Created(c, "merchant profile created", profile)
}

// GetMerchantTransactions GET /api/merchant/transactions
func GetMerchantTransactions(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }

	var profile models.MerchantProfile
	if err := config.DB.Collection("merchant_profiles").FindOne(context.Background(), bson.M{"userId": uid}).Decode(&profile); err != nil {
		return utils.NotFound(c, "merchant profile not found")
	}

	var txs []models.MerchantTransaction
	cursor, _ := config.DB.Collection("merchant_transactions").Find(context.Background(), bson.M{"merchantId": profile.ID})
	if cursor != nil { defer cursor.Close(context.Background()); _ = cursor.All(context.Background(), &txs) }
	if txs == nil { txs = []models.MerchantTransaction{} }

	// Stats
	today := time.Now().Truncate(24 * time.Hour)
	todayAmt := 0.0
	for _, t := range txs {
		if t.CreatedAt.After(today) { todayAmt += t.NetAmount }
	}

	return utils.OK(c, "transactions fetched", fiber.Map{
		"transactions":  txs,
		"totalReceived": profile.TotalReceived,
		"todayAmount":   todayAmt,
		"count":         profile.TotalTransactions,
	})
}

// ReceiveMerchantPayment POST /api/merchant/receive
// Simulates a customer paying the merchant
func ReceiveMerchantPayment(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }

	var req models.MerchantPaymentRequest
	if err := c.BodyParser(&req); err != nil { return utils.BadRequest(c, "invalid body") }
	if err := validate.Struct(req); err != nil  { return utils.BadRequest(c, err.Error()) }

	var profile models.MerchantProfile
	ctx := context.Background()
	if err := config.DB.Collection("merchant_profiles").FindOne(ctx, bson.M{"userId": uid}).Decode(&profile); err != nil {
		return utils.NotFound(c, "merchant profile not found")
	}

	fee      := req.Amount * merchantFeeRate
	netAmt   := req.Amount - fee
	ref      := "MCH-" + uuid.New().String()[:8]

	// Credit wallet with net amount
	_, _ = services.FundWallet(uid, netAmt)

	tx := &models.MerchantTransaction{
		ID:           primitive.NewObjectID(),
		MerchantID:   profile.ID,
		UserID:       uid,
		Amount:       req.Amount,
		Fee:          fee,
		NetAmount:    netAmt,
		CustomerName: "Walk-in Customer",
		Reference:    ref,
		Status:       "success",
		CreatedAt:    time.Now(),
	}
	_, _ = config.DB.Collection("merchant_transactions").InsertOne(ctx, tx)

	// Update merchant stats
	_, _ = config.DB.Collection("merchant_profiles").UpdateOne(ctx,
		bson.M{"_id": profile.ID},
		bson.M{"$inc": bson.M{"totalReceived": netAmt, "totalTransactions": 1}, "$set": bson.M{"updatedAt": time.Now()}},
	)

	newBal, _ := services.GetWalletBalance(uid)
	return utils.OK(c, "payment received", fiber.Map{"transaction": tx, "newBalance": newBal})
}
