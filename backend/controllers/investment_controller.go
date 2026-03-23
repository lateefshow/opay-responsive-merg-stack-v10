package controllers

import (
	"context"
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

var investmentRates = map[models.InvestmentType]float64{
	models.InvMoneyMarket:  12.5,
	models.InvTreasuryBill: 19.2,
	models.InvFixedIncome:  15.5,
	models.InvMutualFund:   22.0,
}

var investmentNames = map[models.InvestmentType]string{
	models.InvMoneyMarket:  "Money Market",
	models.InvTreasuryBill: "Treasury Bills",
	models.InvFixedIncome:  "Fixed Income",
	models.InvMutualFund:   "Mutual Fund",
}

func GetInvestments(c *fiber.Ctx) error {
	userID, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }
	var investments []models.Investment
	cursor, err := config.DB.Collection("investments").Find(context.Background(), bson.M{"userId": userID})
	if err != nil { return utils.InternalError(c, "failed to fetch investments") }
	defer cursor.Close(context.Background())
	_ = cursor.All(context.Background(), &investments)
	if investments == nil { investments = []models.Investment{} }
	return utils.OK(c, "investments fetched", fiber.Map{"investments": investments})
}

func CreateInvestment(c *fiber.Ctx) error {
	userID, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }
	var req models.CreateInvestmentRequest
	if err := c.BodyParser(&req); err != nil { return utils.BadRequest(c, "invalid body") }
	if err := validate.Struct(req); err != nil { return utils.BadRequest(c, err.Error()) }

	rate := investmentRates[req.Type]
	returnAmt := (req.Amount * rate / 100) * (float64(req.Tenure) / 365.0)
	returnAmt = math.Round(returnAmt*100) / 100
	maturity := time.Now().AddDate(0, 0, req.Tenure)

	inv := &models.Investment{
		ID:              primitive.NewObjectID(),
		UserID:          userID,
		Name:            investmentNames[req.Type],
		Type:            req.Type,
		PrincipalAmount: req.Amount,
		CurrentValue:    req.Amount + returnAmt,
		ReturnRate:      rate,
		ReturnAmount:    returnAmt,
		Tenure:          req.Tenure,
		TenureUnit:      "days",
		MaturityDate:    maturity,
		Status:          models.InvActive,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}

	if _, err := config.DB.Collection("investments").InsertOne(context.Background(), inv); err != nil {
		return utils.InternalError(c, "failed to create investment")
	}

	// Debit wallet
	_, err = services.FundWallet(userID, -req.Amount)
	if err != nil { return utils.InternalError(c, "wallet debit failed") }

	ref := "INV-" + uuid.New().String()[:8]
	_ = ref

	return utils.Created(c, "investment created", inv)
}

func LiquidateInvestment(c *fiber.Ctx) error {
	userID, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }
	invID, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil { return utils.BadRequest(c, "invalid investment id") }

	var inv models.Investment
	err = config.DB.Collection("investments").FindOne(context.Background(), bson.M{"_id": invID, "userId": userID}).Decode(&inv)
	if err != nil { return utils.NotFound(c, "investment not found") }
	if inv.Status != models.InvActive { return utils.BadRequest(c, "investment is not active") }

	_, err = config.DB.Collection("investments").UpdateOne(context.Background(),
		bson.M{"_id": invID},
		bson.M{"$set": bson.M{"status": models.InvLiquidated, "updatedAt": time.Now()}},
	)
	if err != nil { return utils.InternalError(c, "failed to liquidate") }

	// Credit wallet with current value
	_, _ = services.FundWallet(userID, inv.CurrentValue)
	return utils.OK(c, "investment liquidated", fiber.Map{"credited": inv.CurrentValue})
}
