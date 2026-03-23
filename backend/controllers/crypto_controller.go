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
	"go.mongodb.org/mongo-driver/mongo"
)

// NGN prices per 1 crypto unit
var cryptoPrices = map[string]float64{
	"BTC":  97000000, "ETH": 5400000, "BNB": 920000, "SOL": 590000,
	"USDT": 1590,     "ADA": 2300,   "XRP": 4200,   "DOGE": 640,
}
var cryptoNames = map[string]string{
	"BTC":"Bitcoin","ETH":"Ethereum","BNB":"BNB","SOL":"Solana",
	"USDT":"Tether","ADA":"Cardano","XRP":"Ripple","DOGE":"Dogecoin",
}
var cryptoColors = map[string]string{
	"BTC":"#f97316","ETH":"#6366f1","BNB":"#f59e0b","SOL":"#8b5cf6",
	"USDT":"#22c55e","ADA":"#0ea5e9","XRP":"#3b82f6","DOGE":"#f59e0b",
}
const cryptoFeeRate = 0.005 // 0.5%

func roundCrypto(v float64) float64 { return math.Round(v*1e8) / 1e8 }

func getOrCreateCryptoWallet(uid primitive.ObjectID) (*models.CryptoWallet, error) {
	col := config.DB.Collection("crypto_wallets")
	ctx := context.Background()
	var w models.CryptoWallet
	err := col.FindOne(ctx, bson.M{"userId": uid}).Decode(&w)
	if err == mongo.ErrNoDocuments {
		w = models.CryptoWallet{ID:primitive.NewObjectID(), UserID:uid, Balances:map[string]float64{}, UpdatedAt:time.Now()}
		_, _ = col.InsertOne(ctx, &w)
	}
	return &w, nil
}

// GetCryptoWallet GET /api/crypto/wallet
func GetCryptoWallet(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }

	w, _ := getOrCreateCryptoWallet(uid)
	// Compute NGN values
	holdings := []fiber.Map{}
	totalNGN := 0.0
	for sym, qty := range w.Balances {
		if qty <= 0 { continue }
		price := cryptoPrices[sym]
		ngnVal := qty * price
		totalNGN += ngnVal
		holdings = append(holdings, fiber.Map{
			"symbol":sym,"name":cryptoNames[sym],"quantity":qty,
			"price":price,"ngnValue":math.Round(ngnVal*100)/100,
			"color":cryptoColors[sym],
		})
	}
	// Get transaction history
	var txs []models.CryptoTransaction
	cursor, _ := config.DB.Collection("crypto_transactions").Find(context.Background(), bson.M{"userId": uid})
	if cursor != nil { defer cursor.Close(context.Background()); _ = cursor.All(context.Background(), &txs) }
	if txs == nil { txs = []models.CryptoTransaction{} }

	prices := fiber.Map{}
	for sym, p := range cryptoPrices { prices[sym] = p }

	return utils.OK(c, "crypto wallet fetched", fiber.Map{
		"holdings":holdings,"totalNGN":math.Round(totalNGN*100)/100,
		"transactions":txs,"prices":prices,
		"coins": []fiber.Map{
			{"symbol":"BTC","name":"Bitcoin",  "color":cryptoColors["BTC"],"price":cryptoPrices["BTC"]},
			{"symbol":"ETH","name":"Ethereum", "color":cryptoColors["ETH"],"price":cryptoPrices["ETH"]},
			{"symbol":"BNB","name":"BNB",       "color":cryptoColors["BNB"],"price":cryptoPrices["BNB"]},
			{"symbol":"SOL","name":"Solana",    "color":cryptoColors["SOL"],"price":cryptoPrices["SOL"]},
			{"symbol":"USDT","name":"Tether",   "color":cryptoColors["USDT"],"price":cryptoPrices["USDT"]},
			{"symbol":"ADA","name":"Cardano",   "color":cryptoColors["ADA"],"price":cryptoPrices["ADA"]},
			{"symbol":"XRP","name":"Ripple",    "color":cryptoColors["XRP"],"price":cryptoPrices["XRP"]},
			{"symbol":"DOGE","name":"Dogecoin","color":cryptoColors["DOGE"],"price":cryptoPrices["DOGE"]},
		},
	})
}

// BuyCrypto POST /api/crypto/buy
func BuyCrypto(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }
	var req models.BuyCryptoRequest
	if err := c.BodyParser(&req); err != nil { return utils.BadRequest(c, "invalid body") }
	if err := validate.Struct(req); err != nil  { return utils.BadRequest(c, err.Error()) }

	price, ok := cryptoPrices[req.Symbol]
	if !ok { return utils.BadRequest(c, "unsupported cryptocurrency") }

	fee       := req.Amount * cryptoFeeRate
	totalCost := req.Amount + fee
	bal, _    := services.GetWalletBalance(uid)
	if bal < totalCost { return utils.BadRequest(c, fmt.Sprintf("insufficient balance — need ₦%.2f (₦%.2f + ₦%.2f fee)", totalCost, req.Amount, fee)) }

	qty := roundCrypto(req.Amount / price)
	_, _ = services.FundWallet(uid, -totalCost)

	ctx := context.Background()
	w, _ := getOrCreateCryptoWallet(uid)
	w.Balances[req.Symbol] = roundCrypto(w.Balances[req.Symbol] + qty)
	_, _ = config.DB.Collection("crypto_wallets").UpdateOne(ctx, bson.M{"userId": uid},
		bson.M{"$set": bson.M{"balances": w.Balances, "updatedAt": time.Now()}},
	)

	tx := &models.CryptoTransaction{
		ID:primitive.NewObjectID(), UserID:uid, Type:models.CryptoBuy,
		Symbol:req.Symbol, Amount:qty, NGNValue:req.Amount, Price:price,
		Fee:fee, Reference:"CRY-"+uuid.New().String()[:8], CreatedAt:time.Now(),
	}
	_, _ = config.DB.Collection("crypto_transactions").InsertOne(ctx, tx)
	newBal, _ := services.GetWalletBalance(uid)
	return utils.Created(c, "crypto purchased", fiber.Map{"transaction":tx,"quantity":qty,"newBalance":newBal})
}

// SellCrypto POST /api/crypto/sell
func SellCrypto(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }
	var req models.SellCryptoRequest
	if err := c.BodyParser(&req); err != nil { return utils.BadRequest(c, "invalid body") }
	if err := validate.Struct(req); err != nil  { return utils.BadRequest(c, err.Error()) }

	w, _ := getOrCreateCryptoWallet(uid)
	if w.Balances[req.Symbol] < req.Quantity { return utils.BadRequest(c, "insufficient crypto balance") }

	price    := cryptoPrices[req.Symbol]
	grossNGN := req.Quantity * price
	fee      := grossNGN * cryptoFeeRate
	netNGN   := grossNGN - fee

	_, _ = services.FundWallet(uid, netNGN)

	ctx := context.Background()
	w.Balances[req.Symbol] = roundCrypto(w.Balances[req.Symbol] - req.Quantity)
	if w.Balances[req.Symbol] <= 0 { delete(w.Balances, req.Symbol) }
	_, _ = config.DB.Collection("crypto_wallets").UpdateOne(ctx, bson.M{"userId": uid},
		bson.M{"$set": bson.M{"balances": w.Balances, "updatedAt": time.Now()}},
	)
	tx := &models.CryptoTransaction{
		ID:primitive.NewObjectID(), UserID:uid, Type:models.CryptoSell,
		Symbol:req.Symbol, Amount:req.Quantity, NGNValue:netNGN, Price:price,
		Fee:fee, Reference:"CRY-"+uuid.New().String()[:8], CreatedAt:time.Now(),
	}
	_, _ = config.DB.Collection("crypto_transactions").InsertOne(ctx, tx)
	newBal, _ := services.GetWalletBalance(uid)
	return utils.OK(c, "crypto sold", fiber.Map{"transaction":tx,"ngnReceived":netNGN,"newBalance":newBal})
}

// ConvertCrypto POST /api/crypto/convert
func ConvertCrypto(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }
	var req models.ConvertCryptoRequest
	if err := c.BodyParser(&req); err != nil { return utils.BadRequest(c, "invalid body") }
	if err := validate.Struct(req); err != nil  { return utils.BadRequest(c, err.Error()) }
	if req.FromSymbol == req.ToSymbol { return utils.BadRequest(c, "cannot convert to same asset") }

	w, _ := getOrCreateCryptoWallet(uid)
	if w.Balances[req.FromSymbol] < req.Quantity { return utils.BadRequest(c, "insufficient crypto balance") }

	fromPrice := cryptoPrices[req.FromSymbol]
	toPrice   := cryptoPrices[req.ToSymbol]
	ngnValue  := req.Quantity * fromPrice
	fee       := ngnValue * cryptoFeeRate
	toQty     := roundCrypto((ngnValue - fee) / toPrice)

	ctx := context.Background()
	w.Balances[req.FromSymbol] = roundCrypto(w.Balances[req.FromSymbol] - req.Quantity)
	if w.Balances[req.FromSymbol] <= 0 { delete(w.Balances, req.FromSymbol) }
	w.Balances[req.ToSymbol]   = roundCrypto(w.Balances[req.ToSymbol] + toQty)
	_, _ = config.DB.Collection("crypto_wallets").UpdateOne(ctx, bson.M{"userId": uid},
		bson.M{"$set": bson.M{"balances": w.Balances, "updatedAt": time.Now()}},
	)
	return utils.OK(c, "crypto converted", fiber.Map{
		"from":req.FromSymbol,"fromQty":req.Quantity,
		"to":req.ToSymbol,"toQty":toQty,"fee":fee,
	})
}
