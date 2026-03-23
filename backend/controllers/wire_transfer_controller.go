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

// Nigerian bank list for validation
var nigerianBanks = map[string]string{
	"058": "GTBank", "044": "Access Bank", "011": "First Bank",
	"057": "Zenith Bank", "033": "UBA", "070": "Fidelity Bank",
	"215": "Unity Bank", "035": "Wema Bank", "032": "Union Bank",
	"023": "Citibank", "063": "Diamond Bank", "050": "Ecobank",
	"039": "Stanbic IBTC", "076": "Polaris Bank", "101": "ProvidusBank",
}

func calcWireFee(amount float64) float64 {
	switch {
	case amount <= 5000:   return 10.75
	case amount <= 50000:  return 25
	default:               return 50
	}
}

// GetBankAccounts GET /api/wire-transfer/banks
func GetBankAccounts(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }
	var accounts []models.BankAccount
	cursor, _ := config.DB.Collection("bank_accounts").Find(context.Background(), bson.M{"userId": uid})
	if cursor != nil { defer cursor.Close(context.Background()); _ = cursor.All(context.Background(), &accounts) }
	if accounts == nil { accounts = []models.BankAccount{} }
	// Return bank list too
	banks := []fiber.Map{}
	for code, name := range nigerianBanks {
		banks = append(banks, fiber.Map{"code": code, "name": name})
	}
	return utils.OK(c, "bank accounts fetched", fiber.Map{"accounts": accounts, "banks": banks})
}

// AddBankAccount POST /api/wire-transfer/banks
func AddBankAccount(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }
	var req models.AddBankRequest
	if err := c.BodyParser(&req); err != nil { return utils.BadRequest(c, "invalid body") }
	if err := validate.Struct(req); err != nil  { return utils.BadRequest(c, err.Error()) }

	if _, ok := nigerianBanks[req.BankCode]; !ok { return utils.BadRequest(c, "unsupported bank code") }

	acc := &models.BankAccount{
		ID: primitive.NewObjectID(), UserID: uid,
		BankName: req.BankName, BankCode: req.BankCode,
		AccountNumber: req.AccountNumber, AccountName: req.AccountName,
		IsDefault: false, CreatedAt: time.Now(),
	}
	// First account is default
	count, _ := config.DB.Collection("bank_accounts").CountDocuments(context.Background(), bson.M{"userId": uid})
	if count == 0 { acc.IsDefault = true }
	_, err = config.DB.Collection("bank_accounts").InsertOne(context.Background(), acc)
	if err != nil { return utils.InternalError(c, "failed to save bank account") }
	return utils.Created(c, "bank account added", acc)
}

// GetWireHistory GET /api/wire-transfer/history
func GetWireHistory(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }
	var transfers []models.WireTransfer
	cursor, _ := config.DB.Collection("wire_transfers").Find(context.Background(), bson.M{"userId": uid})
	if cursor != nil { defer cursor.Close(context.Background()); _ = cursor.All(context.Background(), &transfers) }
	if transfers == nil { transfers = []models.WireTransfer{} }
	totalSent := 0.0
	for _, t := range transfers { if t.Status == models.WireCompleted { totalSent += t.Amount } }
	return utils.OK(c, "history fetched", fiber.Map{"transfers": transfers, "totalSent": totalSent})
}

// SendWireTransfer POST /api/wire-transfer/send
func SendWireTransfer(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }
	var req models.WireTransferRequest
	if err := c.BodyParser(&req); err != nil { return utils.BadRequest(c, "invalid body") }
	if err := validate.Struct(req); err != nil  { return utils.BadRequest(c, err.Error()) }

	fee := calcWireFee(req.Amount)
	total := req.Amount + fee
	bal, _ := services.GetWalletBalance(uid)
	if bal < total { return utils.BadRequest(c, fmt.Sprintf("insufficient balance — need ₦%.2f (₦%.2f amount + ₦%.2f fee)", total, req.Amount, fee)) }

	// Debit wallet
	_, _ = services.FundWallet(uid, -total)

	narration := req.Narration
	if narration == "" { narration = fmt.Sprintf("Transfer to %s", req.AccountName) }

	tx := &models.WireTransfer{
		ID: primitive.NewObjectID(), UserID: uid,
		BankName:      req.BankName,
		AccountNumber: req.AccountNumber,
		AccountName:   req.AccountName,
		Amount:        req.Amount,
		Fee:           fee,
		Narration:     narration,
		Reference:     "WIR-" + uuid.New().String()[:8],
		Status:        models.WireCompleted, // instant for demo
		CreatedAt:     time.Now(),
	}
	_, _ = config.DB.Collection("wire_transfers").InsertOne(context.Background(), tx)
	newBal, _ := services.GetWalletBalance(uid)
	_ = math.Round(0) // keep import
	return utils.Created(c, "wire transfer sent", fiber.Map{"transfer": tx, "newBalance": newBal})
}
