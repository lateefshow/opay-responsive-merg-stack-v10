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

var loanRates = map[string]float64{
	"quickloan":    4.0,
	"salaryadvance":2.5,
	"businessloan": 3.5,
	"emergencyloan":5.0,
}

func calcLoanRepayment(principal, monthlyRate float64, tenureMonths int) (monthly, total, interest float64) {
	r := monthlyRate / 100
	n := float64(tenureMonths)
	if r == 0 { return principal / n, principal, 0 }
	monthly = principal * r * math.Pow(1+r,n) / (math.Pow(1+r,n) - 1)
	total = monthly * n
	interest = total - principal
	return
}

func GetLoans(c *fiber.Ctx) error {
	userID, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }
	var loans []models.Loan
	cursor, _ := config.DB.Collection("loans").Find(context.Background(), bson.M{"userId": userID})
	if cursor != nil { defer cursor.Close(context.Background()); _ = cursor.All(context.Background(), &loans) }
	if loans == nil { loans = []models.Loan{} }
	return utils.OK(c, "loans fetched", fiber.Map{"loans": loans})
}

func ApplyLoan(c *fiber.Ctx) error {
	userID, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }
	var req models.ApplyLoanRequest
	if err := c.BodyParser(&req); err != nil { return utils.BadRequest(c, "invalid body") }
	if err := validate.Struct(req); err != nil { return utils.BadRequest(c, err.Error()) }

	rate := loanRates[req.ProductID]
	if rate == 0 { rate = 4.0 }
	monthly, total, interest := calcLoanRepayment(req.Amount, rate, req.Tenure)
	now := time.Now()
	due := now.AddDate(0, req.Tenure, 0)

	loan := &models.Loan{
		ID:               primitive.NewObjectID(),
		UserID:           userID,
		ProductID:        req.ProductID,
		Amount:           req.Amount,
		Tenure:           req.Tenure,
		InterestRate:     rate,
		MonthlyRepayment: math.Round(monthly*100) / 100,
		TotalRepayment:   math.Round(total*100) / 100,
		InterestAmount:   math.Round(interest*100) / 100,
		Purpose:          req.Purpose,
		Status:           models.LoanApproved,
		DisbursedAt:      &now,
		DueDate:          &due,
		CreatedAt:        now,
		UpdatedAt:        now,
	}
	if _, err := config.DB.Collection("loans").InsertOne(context.Background(), loan); err != nil {
		return utils.InternalError(c, "failed to create loan")
	}
	_, _ = services.FundWallet(userID, req.Amount)
	return utils.Created(c, "loan approved and disbursed", loan)
}

func RepayLoan(c *fiber.Ctx) error {
	userID, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }
	loanID, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil { return utils.BadRequest(c, "invalid loan id") }

	type RepayReq struct { Amount float64 `json:"amount" validate:"required,gt=0"` }
	var req RepayReq
	if err := c.BodyParser(&req); err != nil { return utils.BadRequest(c, "invalid body") }

	var loan models.Loan
	if err := config.DB.Collection("loans").FindOne(context.Background(), bson.M{"_id": loanID, "userId": userID}).Decode(&loan); err != nil {
		return utils.NotFound(c, "loan not found")
	}

	newBalance := loan.TotalRepayment - req.Amount
	status := models.LoanActive
	if newBalance <= 0 { status = models.LoanRepaid; newBalance = 0 }

	_, _ = config.DB.Collection("loans").UpdateOne(context.Background(), bson.M{"_id": loanID},
		bson.M{"$set": bson.M{"totalRepayment": newBalance, "status": status, "updatedAt": time.Now()}})
	_, _ = services.FundWallet(userID, -req.Amount)

	return utils.OK(c, "repayment successful", fiber.Map{"remainingBalance": newBalance, "status": status})
}
