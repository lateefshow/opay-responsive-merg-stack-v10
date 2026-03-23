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

// Simulated live prices (in NGN — approx)
var livePrices = map[string]float64{
	"DANGOTE": 380.50, "GTCO": 58.20, "ZENITH": 42.80, "MTNN": 248.00,
	"AIRTEL": 2180.00, "FBNH": 28.50, "UBA": 26.10, "SEPLAT": 4200.00,
	"BTC": 97000000, "ETH": 5400000, "BNB": 920000, "SOL": 590000,
	"USDT": 1590.00, "ADA": 2300.00,
}

func round2P(v float64) float64 { return math.Round(v*100) / 100 }

// GetPortfolio GET /api/portfolio
func GetPortfolio(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }
	var holdings []models.PortfolioHolding
	cursor, _ := config.DB.Collection("portfolio_holdings").Find(context.Background(), bson.M{"userId": uid})
	if cursor != nil { defer cursor.Close(context.Background()); _ = cursor.All(context.Background(), &holdings) }
	if holdings == nil { holdings = []models.PortfolioHolding{} }

	// Apply live prices
	totalValue, totalCost, totalPnL := 0.0, 0.0, 0.0
	for i, h := range holdings {
		if price, ok := livePrices[h.Symbol]; ok {
			holdings[i].CurrentPrice = price
			holdings[i].CurrentValue = round2P(h.Quantity * price)
			holdings[i].PnL         = round2P(holdings[i].CurrentValue - h.TotalCost)
			if h.TotalCost > 0 { holdings[i].PnLPercent = round2P(holdings[i].PnL / h.TotalCost * 100) }
		}
		totalValue += holdings[i].CurrentValue
		totalCost  += h.TotalCost
		totalPnL   += holdings[i].PnL
	}
	totalPnLPct := 0.0
	if totalCost > 0 { totalPnLPct = round2P(totalPnL / totalCost * 100) }

	return utils.OK(c, "portfolio fetched", fiber.Map{
		"holdings": holdings, "totalValue": totalValue,
		"totalCost": totalCost, "totalPnL": totalPnL, "totalPnLPercent": totalPnLPct,
	})
}

// BuyAsset POST /api/portfolio/buy
func BuyAsset(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }
	var req models.BuyAssetRequest
	if err := c.BodyParser(&req); err != nil { return utils.BadRequest(c, "invalid body") }
	if err := validate.Struct(req); err != nil  { return utils.BadRequest(c, err.Error()) }

	total := round2P(req.Quantity * req.Price)
	bal, _ := services.GetWalletBalance(uid)
	if bal < total { return utils.BadRequest(c, "insufficient wallet balance") }
	_, _ = services.FundWallet(uid, -total)

	ctx := context.Background()
	// Check if already holding
	var existing models.PortfolioHolding
	err = config.DB.Collection("portfolio_holdings").FindOne(ctx, bson.M{"userId": uid, "symbol": req.Symbol}).Decode(&existing)
	if err == nil {
		// Average up
		newQty    := existing.Quantity + req.Quantity
		newCost   := existing.TotalCost + total
		newAvg    := round2P(newCost / newQty)
		curPrice  := req.Price
		curVal    := round2P(newQty * curPrice)
		pnl       := round2P(curVal - newCost)
		pnlPct    := 0.0
		if newCost > 0 { pnlPct = round2P(pnl / newCost * 100) }
		_, _ = config.DB.Collection("portfolio_holdings").UpdateOne(ctx, bson.M{"userId": uid, "symbol": req.Symbol},
			bson.M{"$set": bson.M{"quantity": newQty, "totalCost": newCost, "avgBuyPrice": newAvg, "currentPrice": curPrice, "currentValue": curVal, "pnl": pnl, "pnlPercent": pnlPct, "updatedAt": time.Now()}},
		)
	} else {
		curVal  := round2P(req.Quantity * req.Price)
		holding := &models.PortfolioHolding{
			ID: primitive.NewObjectID(), UserID: uid, Symbol: req.Symbol, Name: req.Name,
			Type: models.AssetType(req.Type), Quantity: req.Quantity, AvgBuyPrice: req.Price,
			CurrentPrice: req.Price, TotalCost: total, CurrentValue: curVal, PnL: 0, PnLPercent: 0,
			Color: req.Color, CreatedAt: time.Now(), UpdatedAt: time.Now(),
		}
		_, _ = config.DB.Collection("portfolio_holdings").InsertOne(ctx, holding)
	}
	newBal, _ := services.GetWalletBalance(uid)
	return utils.Created(c, "asset purchased", fiber.Map{"cost": total, "newBalance": newBal})
}

// SellAsset POST /api/portfolio/:id/sell
func SellAsset(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }
	hid, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil { return utils.BadRequest(c, "invalid holding id") }

	var req struct{ Quantity float64 `json:"quantity" validate:"required,gt=0"` }
	if err := c.BodyParser(&req); err != nil { return utils.BadRequest(c, "invalid body") }

	var h models.PortfolioHolding
	ctx := context.Background()
	if err := config.DB.Collection("portfolio_holdings").FindOne(ctx, bson.M{"_id": hid, "userId": uid}).Decode(&h); err != nil {
		return utils.NotFound(c, "holding not found")
	}
	if req.Quantity > h.Quantity { return utils.BadRequest(c, "cannot sell more than you hold") }

	price := h.CurrentPrice
	if p, ok := livePrices[h.Symbol]; ok { price = p }
	proceeds := round2P(req.Quantity * price)
	_, _ = services.FundWallet(uid, proceeds)

	newQty := h.Quantity - req.Quantity
	if newQty <= 0 {
		_, _ = config.DB.Collection("portfolio_holdings").DeleteOne(ctx, bson.M{"_id": hid})
	} else {
		_, _ = config.DB.Collection("portfolio_holdings").UpdateOne(ctx, bson.M{"_id": hid},
			bson.M{"$set": bson.M{"quantity": newQty, "currentValue": round2P(newQty * price), "updatedAt": time.Now()}},
		)
	}
	newBal, _ := services.GetWalletBalance(uid)
	return utils.OK(c, "asset sold", fiber.Map{"proceeds": proceeds, "newBalance": newBal})
}
