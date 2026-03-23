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

var exchangeRates = map[string]float64{
	"NGN-USD": 0.000633, "NGN-GBP": 0.000493, "NGN-EUR": 0.000581,
	"NGN-GHS": 0.0079,   "NGN-KES": 0.082,
	"USD-NGN": 1580,     "GBP-NGN": 2028,     "EUR-NGN": 1720,
	"GHS-NGN": 126,      "KES-NGN": 12.18,
}

func GetExchangeRates(c *fiber.Ctx) error {
	rates := []fiber.Map{}
	for key, rate := range exchangeRates {
		rates = append(rates, fiber.Map{"pair": key, "rate": rate})
	}
	return utils.OK(c, "rates fetched", fiber.Map{"rates": rates})
}

func ExchangeCurrency(c *fiber.Ctx) error {
	userID, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }

	var req models.ExchangeRequest
	if err := c.BodyParser(&req); err != nil { return utils.BadRequest(c, "invalid body") }
	if err := validate.Struct(req); err != nil { return utils.BadRequest(c, err.Error()) }

	pair := fmt.Sprintf("%s-%s", req.FromCurrency, req.ToCurrency)
	rate, ok := exchangeRates[pair]
	if !ok { return utils.BadRequest(c, "unsupported currency pair") }

	fee     := math.Round(req.Amount*0.005*100) / 100
	toAmt   := math.Round(req.Amount*rate*100) / 100
	totalCost := req.Amount + fee

	// Debit wallet
	_, err = services.FundWallet(userID, -totalCost)
	if err != nil { return utils.BadRequest(c, "insufficient balance") }

	tx := &models.ExchangeTransaction{
		ID:           primitive.NewObjectID(),
		UserID:       userID,
		FromCurrency: req.FromCurrency,
		ToCurrency:   req.ToCurrency,
		FromAmount:   req.Amount,
		ToAmount:     toAmt,
		Rate:         rate,
		Fee:          fee,
		Status:       "success",
		Reference:    "FX-" + uuid.New().String()[:8],
		CreatedAt:    time.Now(),
	}
	_, _ = config.DB.Collection("exchange_transactions").InsertOne(context.Background(), tx)

	newBalance, _ := services.GetWalletBalance(userID)
	return utils.OK(c, "exchange successful", fiber.Map{
		"transaction": tx, "newBalance": newBalance,
	})
}

func GetExchangeHistory(c *fiber.Ctx) error {
	userID, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }

	var txs []models.ExchangeTransaction
	cursor, _ := config.DB.Collection("exchange_transactions").Find(
		context.Background(), bson.M{"userId": userID},
	)
	if cursor != nil { defer cursor.Close(context.Background()); _ = cursor.All(context.Background(), &txs) }
	if txs == nil { txs = []models.ExchangeTransaction{} }
	return utils.OK(c, "history fetched", fiber.Map{"transactions": txs})
}
