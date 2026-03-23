package controllers

import (
	"context"

	"github.com/gofiber/fiber/v2"
	"github.com/opay/backend/config"
	"github.com/opay/backend/models"
	"github.com/opay/backend/utils"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func GetReferrals(c *fiber.Ctx) error {
	userID, err := getUserID(c)
	if err != nil {
		return utils.Unauthorized(c, "invalid session")
	}
	cursor, err := config.DB.Collection("referrals").Find(
		context.Background(), bson.M{"referrerId": userID},
	)
	if err != nil {
		return utils.InternalError(c, "failed to fetch referrals")
	}
	defer cursor.Close(context.Background())
	var referrals []models.Referral
	_ = cursor.All(context.Background(), &referrals)

	userIDObj, _ := primitive.ObjectIDFromHex(c.Locals("userId").(string))
	var user models.User
	_ = config.DB.Collection("users").FindOne(
		context.Background(), bson.M{"_id": userIDObj},
	).Decode(&user)

	return utils.OK(c, "referrals fetched", fiber.Map{
		"referralCode": user.ReferralCode,
		"referrals":    referrals,
		"totalEarned":  calculateEarnings(referrals),
	})
}

func calculateEarnings(refs []models.Referral) float64 {
	total := 0.0
	for _, r := range refs {
		if r.Status == "paid" {
			total += r.BonusAmount
		}
	}
	return total
}
