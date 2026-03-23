package controllers

import (
	"context"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/opay/backend/config"
	"github.com/opay/backend/models"
	"github.com/opay/backend/utils"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

var defaultFactors = []models.CreditFactor{
	{Label:"Payment History",    Score:85, MaxScore:100, Status:"good", Tip:"You have paid 17/18 loans on time. Keep it up!"},
	{Label:"Credit Utilization", Score:72, MaxScore:100, Status:"good", Tip:"Using 28% of your credit limit. Aim for below 30%."},
	{Label:"Credit Age",         Score:60, MaxScore:100, Status:"fair", Tip:"Your oldest account is 8 months. Age improves over time."},
	{Label:"Credit Mix",         Score:68, MaxScore:100, Status:"fair", Tip:"You have loans only. Adding a card improves this."},
	{Label:"New Inquiries",      Score:90, MaxScore:100, Status:"good", Tip:"Only 1 hard inquiry in the last 12 months. Excellent!"},
	{Label:"Total Debt",         Score:55, MaxScore:100, Status:"fair", Tip:"Reduce outstanding loan balance to improve this factor."},
}

var defaultHistory = []models.CreditHistory{
	{Month:"Sep 2025", Score:698},{Month:"Oct 2025", Score:712},
	{Month:"Nov 2025", Score:705},{Month:"Dec 2025", Score:718},
	{Month:"Jan 2026", Score:725},{Month:"Feb 2026", Score:730},
	{Month:"Mar 2026", Score:742},
}

func scoreTier(score int) string {
	switch { case score >= 740: return "excellent"; case score >= 670: return "good"; case score >= 580: return "fair"; default: return "poor" }
}

func getOrCreateCS(userID primitive.ObjectID) (*models.CreditScore, error) {
	col := config.DB.Collection("credit_scores")
	ctx := context.Background()
	var cs models.CreditScore
	err := col.FindOne(ctx, bson.M{"userId": userID}).Decode(&cs)
	if err == mongo.ErrNoDocuments {
		cs = models.CreditScore{ID:primitive.NewObjectID(), UserID:userID, Score:742, Tier:"good", Factors:defaultFactors, History:defaultHistory, LastUpdated:time.Now(), CreatedAt:time.Now()}
		_, _ = col.InsertOne(ctx, &cs)
	}
	return &cs, nil
}

func GetCreditScore(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }
	cs, err := getOrCreateCS(uid)
	if err != nil { return utils.InternalError(c, "failed to fetch credit score") }
	return utils.OK(c, "credit score fetched", cs)
}

func SimulateCreditBoost(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }
	var req models.SimulateRequest
	if err := c.BodyParser(&req); err != nil { return utils.BadRequest(c, "invalid body") }
	if err := validate.Struct(req); err != nil { return utils.BadRequest(c, err.Error()) }

	bumps := map[string]int{"pay_loan":8,"reduce_debt":12,"add_card":5,"verify_kyc":10,"auto_save":3}
	delta, ok := bumps[req.Action]
	if !ok { delta = 5 }

	cs, _ := getOrCreateCS(uid)
	newScore := cs.Score + delta
	if newScore > 850 { newScore = 850 }
	tier := scoreTier(newScore)
	_, _ = config.DB.Collection("credit_scores").UpdateOne(context.Background(),
		bson.M{"userId": uid},
		bson.M{"$set": bson.M{"score": newScore, "tier": tier, "lastUpdated": time.Now()}},
	)
	cs.Score = newScore; cs.Tier = tier
	return utils.OK(c, "score simulated", cs)
}
