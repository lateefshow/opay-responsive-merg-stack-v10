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
	"go.mongodb.org/mongo-driver/mongo"
)

func calcPension(currentAge, retirementAge int, currentBalance, monthly, matchPct, returnRate float64) (projected, monthlyIncome float64) {
	years := retirementAge - currentAge
	months := years * 12
	r := returnRate / 100 / 12
	totalMonthly := monthly * (1 + matchPct/100)
	// Future value of current balance + future value of contributions
	fvCurrent := currentBalance * math.Pow(1+r, float64(months))
	fvContrib := 0.0
	if r > 0 {
		fvContrib = totalMonthly * (math.Pow(1+r, float64(months)) - 1) / r
	} else {
		fvContrib = totalMonthly * float64(months)
	}
	projected = math.Round((fvCurrent+fvContrib)*100) / 100
	// Safe withdrawal rate: 4% per year / 12 months
	monthlyIncome = math.Round(projected*0.04/12*100) / 100
	return
}

// GetPensionPlan GET /api/pension
func GetPensionPlan(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }

	var plan models.PensionPlan
	err = config.DB.Collection("pension_plans").FindOne(context.Background(), bson.M{"userId": uid}).Decode(&plan)
	if err == mongo.ErrNoDocuments {
		// Create default plan
		projected, income := calcPension(30, 60, 500000, 25000, 50, 10)
		plan = models.PensionPlan{
			ID:                      primitive.NewObjectID(),
			UserID:                  uid,
			CurrentAge:              30,
			RetirementAge:           60,
			CurrentBalance:          500000,
			MonthlyContribution:     25000,
			EmployerMatchPct:        50,
			ExpectedReturn:          10,
			ProjectedBalance:        projected,
			MonthlyRetirementIncome: income,
			YearsToRetirement:       30,
			Contributions:           buildContribHistory(25000, 50),
			CreatedAt:               time.Now(),
			UpdatedAt:               time.Now(),
		}
		_, _ = config.DB.Collection("pension_plans").InsertOne(context.Background(), &plan)
	}
	return utils.OK(c, "pension plan fetched", plan)
}

// UpdatePensionPlan PUT /api/pension
func UpdatePensionPlan(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }

	var req models.UpdatePensionRequest
	if err := c.BodyParser(&req); err != nil { return utils.BadRequest(c, "invalid body") }
	if err := validate.Struct(req); err != nil  { return utils.BadRequest(c, err.Error()) }
	if req.RetirementAge <= req.CurrentAge      { return utils.BadRequest(c, "retirement age must be after current age") }

	projected, income := calcPension(req.CurrentAge, req.RetirementAge, req.CurrentBalance, req.MonthlyContribution, req.EmployerMatchPct, req.ExpectedReturn)

	update := bson.M{
		"currentAge":              req.CurrentAge,
		"retirementAge":           req.RetirementAge,
		"currentBalance":          req.CurrentBalance,
		"monthlyContribution":     req.MonthlyContribution,
		"employerMatchPct":        req.EmployerMatchPct,
		"expectedReturn":          req.ExpectedReturn,
		"projectedBalance":        projected,
		"monthlyRetirementIncome": income,
		"yearsToRetirement":       req.RetirementAge - req.CurrentAge,
		"updatedAt":               time.Now(),
	}
	_, _ = config.DB.Collection("pension_plans").UpdateOne(context.Background(),
		bson.M{"userId": uid},
		bson.M{"$set": update},
	)
	return utils.OK(c, "pension plan updated", fiber.Map{
		"projectedBalance":        projected,
		"monthlyRetirementIncome": income,
		"yearsToRetirement":       req.RetirementAge - req.CurrentAge,
	})
}

// ContributePension POST /api/pension/contribute
func ContributePension(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }

	var req struct{ Amount float64 `json:"amount" validate:"required,gt=0"` }
	if err := c.BodyParser(&req); err != nil { return utils.BadRequest(c, "invalid body") }
	if err := validate.Struct(req); err != nil  { return utils.BadRequest(c, err.Error()) }

	bal, _ := services.GetWalletBalance(uid)
	if bal < req.Amount { return utils.BadRequest(c, "insufficient wallet balance") }
	_, _ = services.FundWallet(uid, -req.Amount)

	// Add to pension balance
	_, _ = config.DB.Collection("pension_plans").UpdateOne(context.Background(),
		bson.M{"userId": uid},
		bson.M{"$inc": bson.M{"currentBalance": req.Amount}, "$set": bson.M{"updatedAt": time.Now()}},
	)
	newBal, _ := services.GetWalletBalance(uid)
	return utils.OK(c, "contribution made", fiber.Map{"contributed": req.Amount, "newBalance": newBal})
}

func buildContribHistory(monthly, matchPct float64) []models.PensionContribution {
	months := []string{"Oct 2025","Nov 2025","Dec 2025","Jan 2026","Feb 2026","Mar 2026"}
	hist := make([]models.PensionContribution, len(months))
	running := 500000.0
	for i, m := range months {
		match   := monthly * matchPct / 100
		returns := running * 0.10 / 12
		running += monthly + match + returns
		hist[i] = models.PensionContribution{Month: m, Amount: monthly, EmployerMatch: match, Returns: math.Round(returns*100)/100, Total: math.Round(running*100)/100}
	}
	return hist
}
