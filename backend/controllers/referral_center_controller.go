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
)

// GetReferralCenter GET /api/referral-center
func GetReferralCenter(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }
	ctx := context.Background()

	// Fetch user's referral code
	var user models.User
	_ = config.DB.Collection("users").FindOne(ctx, bson.M{"_id": uid}).Decode(&user)

	// Fetch all referrals where this user is the referrer
	var referrals []models.Referral
	cursor, _ := config.DB.Collection("referrals").Find(ctx, bson.M{"referrerId": uid})
	if cursor != nil { defer cursor.Close(ctx); _ = cursor.All(ctx, &referrals) }
	if referrals == nil { referrals = []models.Referral{} }

	// Compute stats
	totalEarned := 0.0
	paid := 0
	pending := 0
	for _, r := range referrals {
		if r.Status == "paid" { totalEarned += r.BonusAmount; paid++ } else { pending++ }
	}
	total := len(referrals)
	tier := "Bronze"
	nextAt := 5
	switch {
	case total >= 20: tier = "Diamond"; nextAt = 0
	case total >= 10: tier = "Gold"; nextAt = 20
	case total >= 5:  tier = "Silver"; nextAt = 10
	}

	// Build entries list
	var entries []fiber.Map
	for _, r := range referrals {
		entries = append(entries, fiber.Map{
			"id":           r.ID.Hex(),
			"refereeName":  r.RefereeName,
			"bonusAmount":  r.BonusAmount,
			"status":       r.Status,
			"joinedAt":     r.CreatedAt,
		})
	}
	if entries == nil { entries = []fiber.Map{} }

	return utils.OK(c, "referral center fetched", fiber.Map{
		"referralCode": user.ReferralCode,
		"referralLink": "https://opay.ng/join?ref=" + user.ReferralCode,
		"stats": fiber.Map{
			"totalReferrals": total,
			"paidBonuses":    paid,
			"pendingBonuses": pending,
			"totalEarned":    totalEarned,
			"tierLevel":      tier,
			"nextTierAt":     nextAt,
		},
		"referrals": entries,
		"bonusPerReferral": 3000,
		"milestones": []fiber.Map{
			{"referrals": 5,  "reward": 5000,  "bonus": "Silver badge + ₦5,000"},
			{"referrals": 10, "reward": 10000, "bonus": "Gold badge + ₦10,000"},
			{"referrals": 20, "reward": 25000, "bonus": "Diamond badge + ₦25,000"},
		},
	})
}

// GenerateShareLink GET /api/referral-center/share — returns a pre-populated share message
func GenerateShareLink(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }
	var user models.User
	_ = config.DB.Collection("users").FindOne(context.Background(), bson.M{"_id": uid}).Decode(&user)
	msg := "Join OPay with my referral code " + user.ReferralCode + " and get ₦3,000 bonus! Sign up at https://opay.ng/join?ref=" + user.ReferralCode
	return utils.OK(c, "share link generated", fiber.Map{"message": msg, "code": user.ReferralCode, "link": "https://opay.ng/join?ref=" + user.ReferralCode})
}

// Helper — ensure seeded referrals for demo users
func ensureReferralEntries(uid primitive.ObjectID, referralCode string) {
	ctx := context.Background()
	count, _ := config.DB.Collection("referrals").CountDocuments(ctx, bson.M{"referrerId": uid})
	if count > 0 { return }
	names := []struct{ name, email string }{
		{"Chukwuemeka Nwosu", "emeka@opay.ng"},
		{"Fatimah Abdullahi", "fatimah@opay.ng"},
		{"Amara Osei", "amara@opay.ng"},
	}
	var docs []interface{}
	for i, n := range names {
		status := "paid"
		if i == 2 { status = "pending" }
		docs = append(docs, models.Referral{
			ID: primitive.NewObjectID(), ReferrerID: uid,
			RefereeName: n.name, BonusAmount: 3000, Status: status,
			CreatedAt: time.Now().AddDate(0, 0, -(30 - i*10)),
		})
	}
	_, _ = config.DB.Collection("referrals").InsertMany(ctx, docs)
}
