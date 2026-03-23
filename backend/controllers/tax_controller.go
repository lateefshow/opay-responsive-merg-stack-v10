package controllers

import (
	"context"
	"math"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/opay/backend/config"
	"github.com/opay/backend/models"
	"github.com/opay/backend/utils"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

// Nigerian PAYE brackets 2024 (annual NGN)
var taxBrackets = []struct{ from, to, rate float64 }{
	{0, 300000, 0.07},
	{300000, 600000, 0.11},
	{600000, 1100000, 0.15},
	{1100000, 1600000, 0.19},
	{1600000, 3200000, 0.21},
	{3200000, math.MaxFloat64, 0.24},
}

var bracketLabels = []string{"First ₦300K", "Next ₦300K", "Next ₦500K", "Next ₦500K", "Next ₦1.6M", "Above ₦3.2M"}

func computeNigerianTax(taxableIncome float64) (taxOwed float64, breakdown []models.TaxBracket) {
	remaining := taxableIncome
	for i, b := range taxBrackets {
		if remaining <= 0 { break }
		bandWidth := b.to - b.from
		taxable := math.Min(remaining, bandWidth)
		tax := taxable * b.rate
		breakdown = append(breakdown, models.TaxBracket{
			Label: bracketLabels[i], Rate: b.rate * 100,
			From: b.from, To: math.Min(b.to, taxableIncome), Tax: math.Round(tax*100) / 100,
		})
		taxOwed += tax
		remaining -= taxable
	}
	return math.Round(taxOwed*100) / 100, breakdown
}

// GetTaxSummary GET /api/tax
func GetTaxSummary(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }
	ctx := context.Background()
	year := time.Now().Year()

	var taxYear models.TaxYear
	err = config.DB.Collection("tax_years").FindOne(ctx, bson.M{"userId": uid, "year": year}).Decode(&taxYear)
	if err == mongo.ErrNoDocuments {
		// Seed a default for demo: estimate gross from wallet transactions
		gross := 3600000.0 // ₦300K/month * 12
		ded   := 200000.0
		taxable := gross - ded
		taxOwed, breakdown := computeNigerianTax(taxable)
		taxYear = models.TaxYear{
			ID: primitive.NewObjectID(), UserID: uid, Year: year,
			GrossIncome: gross, Deductions: ded, TaxableIncome: taxable,
			TaxOwed: taxOwed, TaxPaid: 0, TaxRefund: 0,
			Status: "draft", Breakdown: breakdown, CreatedAt: time.Now(), UpdatedAt: time.Now(),
		}
		_, _ = config.DB.Collection("tax_years").InsertOne(ctx, &taxYear)
	}

	// Fetch documents
	var docs []models.TaxDocument
	cur, _ := config.DB.Collection("tax_documents").Find(ctx, bson.M{"userId": uid})
	if cur != nil { defer cur.Close(ctx); _ = cur.All(ctx, &docs) }
	if docs == nil { docs = []models.TaxDocument{} }

	// Effective rate
	effectiveRate := 0.0
	if taxYear.GrossIncome > 0 { effectiveRate = math.Round(taxYear.TaxOwed/taxYear.GrossIncome*10000) / 100 }

	return utils.OK(c, "tax summary fetched", fiber.Map{
		"taxYear":       taxYear,
		"documents":     docs,
		"effectiveRate": effectiveRate,
		"brackets":      taxYear.Breakdown,
		"summary": fiber.Map{
			"grossIncome":  taxYear.GrossIncome,
			"deductions":   taxYear.Deductions,
			"taxableIncome":taxYear.TaxableIncome,
			"taxOwed":      taxYear.TaxOwed,
			"taxPaid":      taxYear.TaxPaid,
			"balance":      taxYear.TaxOwed - taxYear.TaxPaid,
		},
	})
}

// ComputeTax POST /api/tax/compute
func ComputeTax(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }
	var req models.ComputeTaxRequest
	if err := c.BodyParser(&req); err != nil { return utils.BadRequest(c, "invalid body") }
	if err := validate.Struct(req); err != nil  { return utils.BadRequest(c, err.Error()) }

	taxable := req.GrossIncome - req.Deductions
	if taxable < 0 { taxable = 0 }
	taxOwed, breakdown := computeNigerianTax(taxable)
	effectiveRate := 0.0
	if req.GrossIncome > 0 { effectiveRate = math.Round(taxOwed/req.GrossIncome*10000)/100 }

	// Upsert
	update := bson.M{
		"grossIncome": req.GrossIncome, "deductions": req.Deductions,
		"taxableIncome": taxable, "taxOwed": taxOwed,
		"breakdown": breakdown, "updatedAt": time.Now(),
	}
	ctx := context.Background()
	count, _ := config.DB.Collection("tax_years").CountDocuments(ctx, bson.M{"userId": uid, "year": req.Year})
	if count > 0 {
		_, _ = config.DB.Collection("tax_years").UpdateOne(ctx, bson.M{"userId": uid, "year": req.Year}, bson.M{"$set": update})
	}

	return utils.OK(c, "tax computed", fiber.Map{
		"taxOwed": taxOwed, "taxableIncome": taxable,
		"breakdown": breakdown, "effectiveRate": effectiveRate,
	})
}

// GenerateTaxDoc POST /api/tax/documents
func GenerateTaxDoc(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }
	var req struct{ DocType string `json:"docType" validate:"required"` }
	if err := c.BodyParser(&req); err != nil { return utils.BadRequest(c, "invalid body") }

	names := map[string]string{
		"annual_statement": "Annual Tax Statement 2025",
		"paye_certificate": "PAYE Tax Certificate 2025",
		"tax_clearance":    "Tax Clearance Certificate 2025",
	}
	name, ok := names[req.DocType]
	if !ok { return utils.BadRequest(c, "unknown document type") }

	var ty models.TaxYear
	_ = config.DB.Collection("tax_years").FindOne(context.Background(), bson.M{"userId": uid}).Decode(&ty)

	doc := &models.TaxDocument{
		ID: primitive.NewObjectID(), UserID: uid, TaxYearID: ty.ID,
		DocType: req.DocType, Name: name, Status: "ready", CreatedAt: time.Now(),
	}
	_, _ = config.DB.Collection("tax_documents").InsertOne(context.Background(), doc)
	return utils.Created(c, "document generated", doc)
}
