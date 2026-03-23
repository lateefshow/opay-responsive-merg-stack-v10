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

// Pre-defined challenges catalogue
var challengeCatalogue = []fiber.Map{
	{"id":"52week",  "name":"52-Week Savings",       "type":"savings",   "description":"Start with ₦1,000 week 1, add ₦1,000 each week — save ₦1.38M in a year!", "targetAmount":1378000,"duration":52,"durationUnit":"weeks",  "reward":10000,"milestones":[]fiber.Map{{"label":"Month 1","target":10000,"reward":500},{"label":"Month 3","target":70000,"reward":2000},{"label":"Month 6","target":280000,"reward":5000}}},
	{"id":"noeat",   "name":"No Eating Out — 30 Days","type":"no_spend",  "description":"Skip restaurants and takeaway for 30 days. Save your food budget!",          "targetAmount":30000, "duration":30,"durationUnit":"days",   "reward":3000, "milestones":[]fiber.Map{{"label":"1 Week","target":7000,"reward":500},{"label":"2 Weeks","target":14000,"reward":1000}}},
	{"id":"debt100", "name":"Pay Off ₦100K Debt",     "type":"debt",      "description":"Pay down ₦100,000 in loan/BNPL balance within 60 days",                      "targetAmount":100000,"duration":60,"durationUnit":"days",   "reward":5000, "milestones":[]fiber.Map{{"label":"25% paid","target":25000,"reward":500},{"label":"50% paid","target":50000,"reward":1500}}},
	{"id":"save10",  "name":"Save 10% Every Month",   "type":"savings",   "description":"Automatically save 10% of every incoming transaction for 3 months",           "targetAmount":50000, "duration":3, "durationUnit":"months", "reward":7500, "milestones":[]fiber.Map{{"label":"Month 1","target":10000,"reward":1000},{"label":"Month 2","target":25000,"reward":2500}}},
	{"id":"invest",  "name":"₦200K Investment Sprint", "type":"savings",   "description":"Build ₦200,000 in investments within 6 months from zero",                   "targetAmount":200000,"duration":6, "durationUnit":"months", "reward":15000,"milestones":[]fiber.Map{{"label":"₦50K","target":50000,"reward":2000},{"label":"₦100K","target":100000,"reward":5000}}},
	{"id":"zero",    "name":"Zero Spend Weekend",      "type":"no_spend",  "description":"Don't spend a kobo Friday–Sunday. Complete 4 weekends in a row.",            "targetAmount":0,     "duration":4, "durationUnit":"weekends","reward":2000, "milestones":[]fiber.Map{{"label":"Week 2","target":0,"reward":500}}},
}

// GetChallenges GET /api/challenges
func GetChallenges(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }

	var joined []models.UserChallenge
	cursor, _ := config.DB.Collection("user_challenges").Find(context.Background(), bson.M{"userId": uid})
	if cursor != nil { defer cursor.Close(context.Background()); _ = cursor.All(context.Background(), &joined) }
	if joined == nil { joined = []models.UserChallenge{} }

	// Mark which catalogue items are joined
	joinedIDs := map[string]bool{}
	for _, j := range joined { joinedIDs[j.ChallengeID] = true }

	available := []fiber.Map{}
	for _, ch := range challengeCatalogue {
		chCopy := fiber.Map{}
		for k, v := range ch { chCopy[k] = v }
		chCopy["joined"] = joinedIDs[ch["id"].(string)]
		available = append(available, chCopy)
	}

	totalRewards := 0.0
	for _, j := range joined { if j.Status == models.ChallengeCompleted { totalRewards += j.Reward } }

	return utils.OK(c, "challenges fetched", fiber.Map{
		"available":      available,
		"joined":         joined,
		"totalRewards":   totalRewards,
		"completedCount": countByStatus(joined, models.ChallengeCompleted),
		"activeCount":    countByStatus(joined, models.ChallengeActive),
	})
}

func countByStatus(challenges []models.UserChallenge, status models.ChallengeStatus) int {
	n := 0
	for _, c := range challenges { if c.Status == status { n++ } }
	return n
}

// JoinChallenge POST /api/challenges/join
func JoinChallenge(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }
	var req models.JoinChallengeRequest
	if err := c.BodyParser(&req); err != nil { return utils.BadRequest(c, "invalid body") }
	if err := validate.Struct(req); err != nil  { return utils.BadRequest(c, err.Error()) }

	// Check not already joined
	count, _ := config.DB.Collection("user_challenges").CountDocuments(context.Background(), bson.M{"userId": uid, "challengeId": req.ChallengeID, "status": "active"})
	if count > 0 { return utils.Conflict(c, "already joined this challenge") }

	// Find template
	var tmpl fiber.Map
	for _, ch := range challengeCatalogue { if ch["id"].(string) == req.ChallengeID { tmpl = ch; break } }
	if tmpl == nil { return utils.NotFound(c, "challenge not found") }

	dur := tmpl["duration"].(int)
	unit := tmpl["durationUnit"].(string)
	end := time.Now()
	switch unit {
	case "days":     end = end.AddDate(0, 0, dur)
	case "weeks":    end = end.AddDate(0, 0, dur*7)
	case "months":   end = end.AddDate(0, dur, 0)
	case "weekends": end = end.AddDate(0, 0, dur*7)
	}

	// Build milestones
	rawMs := tmpl["milestones"].([]fiber.Map)
	ms := make([]models.Milestone, len(rawMs))
	for i, m := range rawMs {
		tgt := 0.0
		if v, ok := m["target"].(float64); ok { tgt = v }
		rwd := 0.0
		if v, ok := m["reward"].(float64); ok { rwd = v }
		ms[i] = models.Milestone{Label: m["label"].(string), Target: tgt, Reward: rwd, Achieved: false}
	}

	reward := 0.0
	if v, ok := tmpl["reward"].(float64); ok { reward = v }
	target := 0.0
	if v, ok := tmpl["targetAmount"].(float64); ok { target = v }

	uc := &models.UserChallenge{
		ID: primitive.NewObjectID(), UserID: uid,
		ChallengeID: req.ChallengeID,
		Name: tmpl["name"].(string), Type: models.ChallengeType(tmpl["type"].(string)),
		Description: tmpl["description"].(string),
		TargetAmount: target, CurrentAmount: 0,
		Duration: dur, DurationUnit: unit,
		Reward: reward, Status: models.ChallengeActive, Progress: 0,
		Milestones: ms, StartDate: time.Now(), EndDate: end, CreatedAt: time.Now(),
	}
	if _, err := config.DB.Collection("user_challenges").InsertOne(context.Background(), uc); err != nil {
		return utils.InternalError(c, "failed to join challenge")
	}
	return utils.Created(c, "challenge joined", uc)
}

// UpdateChallengeProgress POST /api/challenges/:id/progress
func UpdateChallengeProgress(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }
	cid, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil { return utils.BadRequest(c, "invalid id") }

	var req struct{ Amount float64 `json:"amount" validate:"required,gt=0"` }
	if err := c.BodyParser(&req); err != nil { return utils.BadRequest(c, "invalid body") }

	var uc models.UserChallenge
	ctx := context.Background()
	if err := config.DB.Collection("user_challenges").FindOne(ctx, bson.M{"_id": cid, "userId": uid}).Decode(&uc); err != nil {
		return utils.NotFound(c, "challenge not found")
	}
	if uc.Status != models.ChallengeActive { return utils.BadRequest(c, "challenge is not active") }

	uc.CurrentAmount += req.Amount
	if uc.TargetAmount > 0 { uc.Progress = uc.CurrentAmount / uc.TargetAmount * 100 }
	if uc.Progress > 100 { uc.Progress = 100 }

	// Check milestones
	for i, ms := range uc.Milestones {
		if !ms.Achieved && uc.CurrentAmount >= ms.Target {
			uc.Milestones[i].Achieved = true
			if ms.Reward > 0 { _, _ = services.FundWallet(uid, ms.Reward) }
		}
	}
	// Check completion
	if uc.TargetAmount > 0 && uc.CurrentAmount >= uc.TargetAmount {
		uc.Status = models.ChallengeCompleted
		if uc.Reward > 0 { _, _ = services.FundWallet(uid, uc.Reward) }
	}
	_, _ = config.DB.Collection("user_challenges").ReplaceOne(ctx, bson.M{"_id": cid}, uc)
	return utils.OK(c, "progress updated", uc)
}

// AbandonChallenge DELETE /api/challenges/:id
func AbandonChallenge(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }
	cid, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil { return utils.BadRequest(c, "invalid id") }
	_, _ = config.DB.Collection("user_challenges").UpdateOne(context.Background(),
		bson.M{"_id": cid, "userId": uid},
		bson.M{"$set": bson.M{"status": models.ChallengeAbandoned}},
	)
	return utils.OK(c, "challenge abandoned", nil)
}
