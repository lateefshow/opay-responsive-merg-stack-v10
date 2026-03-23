package controllers

import (
	"context"
	"fmt"
	"math"
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

// Live rates: NGN per 1 foreign unit → flip for NGN→foreign
var remittanceRates = map[string]struct{ Rate float64; Fee float64; DeliveryHrs int }{
	"GHS": {Rate: 126.0,    Fee: 1500, DeliveryHrs: 2},
	"GBP": {Rate: 2028.50,  Fee: 2500, DeliveryHrs: 48},
	"USD": {Rate: 1580.00,  Fee: 2000, DeliveryHrs: 24},
	"EUR": {Rate: 1720.25,  Fee: 2000, DeliveryHrs: 24},
	"CAD": {Rate: 1160.00,  Fee: 2000, DeliveryHrs: 72},
	"AED": {Rate: 430.00,   Fee: 2500, DeliveryHrs: 48},
	"XOF": {Rate: 2.62,     Fee: 1500, DeliveryHrs: 4},
}

// GetRemittanceRates GET /api/remittance/rates
func GetRemittanceRates(c *fiber.Ctx) error {
	rates := fiber.Map{}
	for cur, info := range remittanceRates {
		rates[cur] = fiber.Map{"rate": info.Rate, "fee": info.Fee, "deliveryHrs": info.DeliveryHrs}
	}
	return utils.OK(c, "rates fetched", rates)
}

// GetRecipients GET /api/remittance/recipients
func GetRecipients(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }

	var recs []models.RemittanceRecipient
	cursor, _ := config.DB.Collection("remittance_recipients").Find(context.Background(), bson.M{"ownerId": uid})
	if cursor != nil { defer cursor.Close(context.Background()); _ = cursor.All(context.Background(), &recs) }
	if recs == nil { recs = []models.RemittanceRecipient{} }
	return utils.OK(c, "recipients fetched", fiber.Map{"recipients": recs})
}

// AddRecipient POST /api/remittance/recipients
func AddRecipient(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }

	var req models.CreateRecipientRequest
	if err := c.BodyParser(&req); err != nil { return utils.BadRequest(c, "invalid body") }
	if err := validate.Struct(req); err != nil  { return utils.BadRequest(c, err.Error()) }

	rec := &models.RemittanceRecipient{
		ID:            primitive.NewObjectID(),
		OwnerID:       uid,
		Name:          req.Name,
		Country:       req.Country,
		Flag:          req.Flag,
		Bank:          req.Bank,
		AccountNumber: req.AccountNumber,
		Currency:      req.Currency,
		IsFavorite:    false,
		CreatedAt:     time.Now(),
	}
	if _, err := config.DB.Collection("remittance_recipients").InsertOne(context.Background(), rec); err != nil {
		return utils.InternalError(c, "failed to add recipient")
	}
	return utils.Created(c, "recipient added", rec)
}

// ToggleFavoriteRecipient PATCH /api/remittance/recipients/:id/favourite
func ToggleFavoriteRecipient(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }

	recID, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil { return utils.BadRequest(c, "invalid recipient id") }

	var rec models.RemittanceRecipient
	ctx := context.Background()
	if err := config.DB.Collection("remittance_recipients").FindOne(ctx, bson.M{"_id": recID, "ownerId": uid}).Decode(&rec); err != nil {
		return utils.NotFound(c, "recipient not found")
	}
	_, _ = config.DB.Collection("remittance_recipients").UpdateOne(ctx,
		bson.M{"_id": recID},
		bson.M{"$set": bson.M{"isFavorite": !rec.IsFavorite}},
	)
	return utils.OK(c, "favourite toggled", nil)
}

// GetRemittanceHistory GET /api/remittance/history
func GetRemittanceHistory(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }

	var txs []models.RemittanceTransaction
	cursor, _ := config.DB.Collection("remittance_transactions").Find(context.Background(), bson.M{"userId": uid})
	if cursor != nil { defer cursor.Close(context.Background()); _ = cursor.All(context.Background(), &txs) }
	if txs == nil { txs = []models.RemittanceTransaction{} }
	return utils.OK(c, "history fetched", fiber.Map{"transactions": txs})
}

// SendRemittance POST /api/remittance/send
func SendRemittance(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }

	var req models.CreateRemittanceRequest
	if err := c.BodyParser(&req); err != nil { return utils.BadRequest(c, "invalid body") }
	if err := validate.Struct(req); err != nil  { return utils.BadRequest(c, err.Error()) }

	rateInfo, ok := remittanceRates[req.Currency]
	if !ok { return utils.BadRequest(c, "unsupported currency") }

	fee       := rateInfo.Fee
	totalCost := req.SendAmount + fee
	bal, _    := services.GetWalletBalance(uid)
	if bal < totalCost { return utils.BadRequest(c, fmt.Sprintf("insufficient balance — need ₦%.2f (includes ₦%.2f fee)", totalCost, fee)) }

	// Fetch recipient
	recID, err := primitive.ObjectIDFromHex(req.RecipientID)
	if err != nil { return utils.BadRequest(c, "invalid recipient id") }

	var rec models.RemittanceRecipient
	if err := config.DB.Collection("remittance_recipients").FindOne(context.Background(), bson.M{"_id": recID}).Decode(&rec); err != nil {
		return utils.NotFound(c, "recipient not found")
	}

	// Debit wallet
	_, err = services.FundWallet(uid, -totalCost)
	if err != nil { return utils.InternalError(c, "wallet debit failed") }

	receiveAmt := math.Round((req.SendAmount/rateInfo.Rate)*100) / 100

	tx := &models.RemittanceTransaction{
		ID:              primitive.NewObjectID(),
		UserID:          uid,
		RecipientID:     recID,
		RecipientName:   rec.Name,
		Country:         rec.Country,
		Flag:            rec.Flag,
		SendAmount:      req.SendAmount,
		ReceiveAmount:   receiveAmt,
		SendCurrency:    "NGN",
		ReceiveCurrency: req.Currency,
		Rate:            1 / rateInfo.Rate,
		Fee:             fee,
		Status:          models.RemittanceProcessing,
		Reference:       "REM-" + uuid.New().String()[:8],
		EstimatedArrival: time.Now().Add(time.Duration(rateInfo.DeliveryHrs) * time.Hour),
		CreatedAt:       time.Now(),
	}
	if _, err := config.DB.Collection("remittance_transactions").InsertOne(context.Background(), tx); err != nil {
		return utils.InternalError(c, "failed to record transaction")
	}

	newBal, _ := services.GetWalletBalance(uid)
	return utils.Created(c, "remittance initiated", fiber.Map{"transaction": tx, "newBalance": newBal})
}
