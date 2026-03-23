// backend/controllers/airtime_data_controller.go
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
)

// Data plans catalogue per network
var dataPlans = map[string][]fiber.Map{
	"MTN": {
		{"id":"mtn1gb","label":"1GB — 1 day","amount":350},
		{"id":"mtn2gb","label":"2GB — 2 days","amount":600},
		{"id":"mtn5gb","label":"5GB — 7 days","amount":1500},
		{"id":"mtn10gb","label":"10GB — 30 days","amount":3000},
		{"id":"mtn20gb","label":"20GB — 30 days","amount":5000},
		{"id":"mtn30gb","label":"30GB — 30 days","amount":7500},
	},
	"Airtel": {
		{"id":"air1gb","label":"1GB — 1 day","amount":300},
		{"id":"air2gb","label":"2GB — 3 days","amount":500},
		{"id":"air5gb","label":"5GB — 7 days","amount":1400},
		{"id":"air10gb","label":"10GB — 30 days","amount":2800},
		{"id":"air25gb","label":"25GB — 30 days","amount":6000},
	},
	"Glo": {
		{"id":"glo500mb","label":"500MB — 1 day","amount":200},
		{"id":"glo2gb","label":"2GB — 7 days","amount":500},
		{"id":"glo5gb","label":"5GB — 30 days","amount":1200},
		{"id":"glo15gb","label":"15GB — 30 days","amount":3000},
	},
	"9mobile": {
		{"id":"9m1gb","label":"1GB — 30 days","amount":800},
		{"id":"9m3gb","label":"3GB — 30 days","amount":1200},
		{"id":"9m10gb","label":"10GB — 30 days","amount":3500},
	},
}

// GetDataPlans GET /api/airtime/plans?network=MTN
func GetDataPlans(c *fiber.Ctx) error {
	network := c.Query("network", "MTN")
	plans, ok := dataPlans[network]
	if !ok { plans = []fiber.Map{} }
	return utils.OK(c, "data plans fetched", fiber.Map{"plans": plans, "network": network})
}

// BuyAirtime POST /api/airtime/buy
func BuyAirtime(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }

	var req models.BuyAirtimeRequest
	if err := c.BodyParser(&req); err != nil { return utils.BadRequest(c, "invalid body") }
	if err := validate.Struct(req); err != nil  { return utils.BadRequest(c, err.Error()) }

	// Get amount from data plan if applicable
	amount := req.Amount
	if req.PlanType == "data" && req.DataPlan != "" {
		if plans, ok := dataPlans[req.Network]; ok {
			for _, p := range plans {
				if p["id"] == req.DataPlan {
					if v, ok := p["amount"].(int); ok { amount = float64(v) }
					break
				}
			}
		}
	}

	bal, _ := services.GetWalletBalance(uid)
	if bal < amount { return utils.BadRequest(c, fmt.Sprintf("insufficient balance — need ₦%.2f", amount)) }
	_, _ = services.FundWallet(uid, -amount)

	ref := "AIR-" + uuid.New().String()[:8]
	// Simulate token for electricity
	token := ""
	if rand.Intn(2) == 0 { token = fmt.Sprintf("%04d-%04d-%04d-%04d-%04d", rand.Intn(10000), rand.Intn(10000), rand.Intn(10000), rand.Intn(10000), rand.Intn(10000)) }

	purchase := &models.AirtimePurchase{
		ID: primitive.NewObjectID(), UserID: uid,
		Network: models.AirtimeNetwork(req.Network), Phone: req.Phone,
		Amount: amount, PlanType: req.PlanType, DataPlan: req.DataPlan,
		Reference: ref, Token: token, Status: "success", CreatedAt: time.Now(),
	}
	_, _ = config.DB.Collection("airtime_purchases").InsertOne(context.Background(), purchase)
	newBal, _ := services.GetWalletBalance(uid)
	return utils.Created(c, "purchase successful", fiber.Map{"purchase": purchase, "newBalance": newBal})
}

// GetAirtimeHistory GET /api/airtime/history
func GetAirtimeHistory(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }
	var history []models.AirtimePurchase
	cursor, _ := config.DB.Collection("airtime_purchases").Find(context.Background(), bson.M{"userId": uid})
	if cursor != nil { defer cursor.Close(context.Background()); _ = cursor.All(context.Background(), &history) }
	if history == nil { history = []models.AirtimePurchase{} }
	totalSpent := 0.0
	for _, h := range history { totalSpent += h.Amount }
	return utils.OK(c, "history fetched", fiber.Map{"history": history, "totalSpent": totalSpent})
}
