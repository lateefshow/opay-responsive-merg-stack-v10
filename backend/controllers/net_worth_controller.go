package controllers

import (
	"context"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/opay/backend/config"
	"github.com/opay/backend/models"
	"github.com/opay/backend/services"
	"github.com/opay/backend/utils"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// GetNetWorth GET /api/net-worth
// Aggregates wallet, savings, investments and loans into a snapshot
func GetNetWorth(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }
	ctx := context.Background()

	// Wallet balance
	walletBal, _ := services.GetWalletBalance(uid)

	// Savings (sum currentAmount from savings_plans)
	type savPlan struct{ CurrentAmount float64 `bson:"currentAmount"` }
	var savPlans []savPlan
	savCursor, _ := config.DB.Collection("savings_plans").Find(ctx, bson.M{"userId": uid})
	if savCursor != nil { defer savCursor.Close(ctx); _ = savCursor.All(ctx, &savPlans) }
	savingsTotal := 0.0
	for _, p := range savPlans { savingsTotal += p.CurrentAmount }

	// Investments (sum currentValue where status=active)
	type invPlan struct{ CurrentValue float64 `bson:"currentValue"`; Status string `bson:"status"` }
	var invPlans []invPlan
	invCursor, _ := config.DB.Collection("investments").Find(ctx, bson.M{"userId": uid, "status": "active"})
	if invCursor != nil { defer invCursor.Close(ctx); _ = invCursor.All(ctx, &invPlans) }
	investTotal := 0.0
	for _, i := range invPlans { investTotal += i.CurrentValue }

	// Loans (sum totalRepayment where status=active|approved)
	type loanDoc struct{ TotalRepayment float64 `bson:"totalRepayment"` }
	var loans []loanDoc
	loanCursor, _ := config.DB.Collection("loans").Find(ctx, bson.M{"userId": uid, "status": bson.M{"$in": []string{"active","approved"}}})
	if loanCursor != nil { defer loanCursor.Close(ctx); _ = loanCursor.All(ctx, &loans) }
	loansTotal := 0.0
	for _, l := range loans { loansTotal += l.TotalRepayment }

	// BNPL outstanding
	type bnplDoc struct{ TotalAmount float64 `bson:"totalAmount"`; AmountPaid float64 `bson:"amountPaid"`; Status string `bson:"status"` }
	var bnplPlans []bnplDoc
	bnplCursor, _ := config.DB.Collection("bnpl_plans").Find(ctx, bson.M{"userId": uid, "status": "active"})
	if bnplCursor != nil { defer bnplCursor.Close(ctx); _ = bnplCursor.All(ctx, &bnplPlans) }
	bnplTotal := 0.0
	for _, b := range bnplPlans { bnplTotal += b.TotalAmount - b.AmountPaid }

	totalAssets      := walletBal + savingsTotal + investTotal
	totalLiabilities := loansTotal + bnplTotal
	netWorth         := totalAssets - totalLiabilities

	// Save snapshot
	snap := models.NetWorthSnapshot{
		ID:      primitive.NewObjectID(),
		UserID:  uid,
		TotalAssets: totalAssets,
		TotalLiab:   totalLiabilities,
		NetWorth:    netWorth,
		Breakdown: map[string]float64{
			"wallet":      walletBal,
			"savings":     savingsTotal,
			"investments": investTotal,
			"loans":       loansTotal,
			"bnpl":        bnplTotal,
		},
		CreatedAt: time.Now(),
	}
	_, _ = config.DB.Collection("net_worth_snapshots").InsertOne(ctx, snap)

	// Fetch last 6 snapshots for trend
	var snapshots []models.NetWorthSnapshot
	snCursor, _ := config.DB.Collection("net_worth_snapshots").Find(ctx,
		bson.M{"userId": uid},
	)
	if snCursor != nil { defer snCursor.Close(ctx); _ = snCursor.All(ctx, &snapshots) }
	if len(snapshots) > 7 { snapshots = snapshots[len(snapshots)-7:] }

	return utils.OK(c, "net worth computed", fiber.Map{
		"current":   snap,
		"snapshots": snapshots,
	})
}
