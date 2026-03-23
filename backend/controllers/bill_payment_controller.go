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

// Provider catalogue
var billProviders = map[string][]fiber.Map{
	"electricity": {
		{"id":"ekedc",  "name":"EKEDC (Eko)",       "logo":"⚡"},
		{"id":"ikedc",  "name":"IKEDC (Ikeja)",      "logo":"⚡"},
		{"id":"aedc",   "name":"AEDC (Abuja)",       "logo":"⚡"},
		{"id":"phedc",  "name":"PHEDC (Port Harcourt)","logo":"⚡"},
		{"id":"kedco",  "name":"KEDCO (Kano)",       "logo":"⚡"},
	},
	"cable_tv": {
		{"id":"dstv",   "name":"DStv",       "logo":"📺"},
		{"id":"gotv",   "name":"GOtv",       "logo":"📺"},
		{"id":"startimes","name":"StarTimes", "logo":"📺"},
	},
	"internet": {
		{"id":"spectranet","name":"Spectranet",  "logo":"🌐"},
		{"id":"smile",     "name":"Smile 4G",   "logo":"🌐"},
		{"id":"swift",     "name":"Swift",      "logo":"🌐"},
	},
	"water": {
		{"id":"lswc",   "name":"Lagos State Water Corp", "logo":"💧"},
		{"id":"abuja_water","name":"Abuja FCDA Water", "logo":"💧"},
	},
	"betting": {
		{"id":"bet9ja", "name":"Bet9ja",   "logo":"🎯"},
		{"id":"sportybet","name":"SportyBet","logo":"🎯"},
		{"id":"1xbet",  "name":"1xBet",    "logo":"🎯"},
	},
}

// GetBillProviders GET /api/bills/providers?category=electricity
func GetBillProviders(c *fiber.Ctx) error {
	category := c.Query("category", "electricity")
	providers, ok := billProviders[category]
	if !ok { providers = []fiber.Map{} }
	all := fiber.Map{}
	for k, v := range billProviders { all[k] = v }
	return utils.OK(c, "providers fetched", fiber.Map{"providers": providers, "category": category, "all": all})
}

// PayBill POST /api/bills/pay
func PayBill(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }

	var req models.PayBillRequest
	if err := c.BodyParser(&req); err != nil { return utils.BadRequest(c, "invalid body") }
	if err := validate.Struct(req); err != nil  { return utils.BadRequest(c, err.Error()) }

	bal, _ := services.GetWalletBalance(uid)
	if bal < req.Amount { return utils.BadRequest(c, fmt.Sprintf("insufficient balance — need ₦%.2f", req.Amount)) }
	_, _ = services.FundWallet(uid, -req.Amount)

	// Generate electricity token for prepaid
	token := ""
	if req.Category == "electricity" {
		token = fmt.Sprintf("%04d-%04d-%04d-%04d-%04d", rand.Intn(10000), rand.Intn(10000), rand.Intn(10000), rand.Intn(10000), rand.Intn(10000))
	}

	payment := &models.BillPayment{
		ID: primitive.NewObjectID(), UserID: uid,
		Category: models.BillCategory(req.Category), Provider: req.Provider,
		AccountNum: req.AccountNum, Amount: req.Amount,
		Token: token, Reference: "BIL-" + uuid.New().String()[:8],
		Status: "success", CreatedAt: time.Now(),
	}
	_, _ = config.DB.Collection("bill_payments").InsertOne(context.Background(), payment)
	newBal, _ := services.GetWalletBalance(uid)
	return utils.Created(c, "bill paid successfully", fiber.Map{"payment": payment, "newBalance": newBal, "token": token})
}

// GetBillHistory GET /api/bills/history
func GetBillHistory(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }
	var history []models.BillPayment
	cursor, _ := config.DB.Collection("bill_payments").Find(context.Background(), bson.M{"userId": uid})
	if cursor != nil { defer cursor.Close(context.Background()); _ = cursor.All(context.Background(), &history) }
	if history == nil { history = []models.BillPayment{} }
	totalSpent := 0.0
	for _, h := range history { totalSpent += h.Amount }
	return utils.OK(c, "history fetched", fiber.Map{"history": history, "totalSpent": totalSpent})
}
