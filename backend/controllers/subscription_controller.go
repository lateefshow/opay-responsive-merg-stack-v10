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

// GetSubscriptions GET /api/subscriptions
func GetSubscriptions(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }

	var subs []models.Subscription
	cursor, _ := config.DB.Collection("subscriptions").Find(context.Background(), bson.M{"userId": uid})
	if cursor != nil { defer cursor.Close(context.Background()); _ = cursor.All(context.Background(), &subs) }
	if subs == nil { subs = []models.Subscription{} }

	// Compute monthly total
	total := 0.0
	for _, s := range subs {
		if s.Status == models.SubActive || s.Status == models.SubTrial {
			switch s.Frequency {
			case models.SubMonthly:   total += s.Amount
			case models.SubQuarterly: total += s.Amount / 3
			case models.SubAnnual:    total += s.Amount / 12
			}
		}
	}
	return utils.OK(c, "subscriptions fetched", fiber.Map{"subscriptions": subs, "monthlyTotal": total})
}

// AddSubscription POST /api/subscriptions
func AddSubscription(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }

	var req models.CreateSubscriptionRequest
	if err := c.BodyParser(&req); err != nil { return utils.BadRequest(c, "invalid body") }
	if err := validate.Struct(req); err != nil  { return utils.BadRequest(c, err.Error()) }

	// Compute next billing date
	nextBilling := time.Now()
	switch req.Frequency {
	case models.SubMonthly:   nextBilling = time.Now().AddDate(0, 1, 0)
	case models.SubQuarterly: nextBilling = time.Now().AddDate(0, 3, 0)
	case models.SubAnnual:    nextBilling = time.Now().AddDate(1, 0, 0)
	}

	sub := &models.Subscription{
		ID:              primitive.NewObjectID(),
		UserID:          uid,
		Name:            req.Name,
		Logo:            req.Logo,
		Color:           req.Color,
		Category:        req.Category,
		Amount:          req.Amount,
		Currency:        "NGN",
		Frequency:       req.Frequency,
		NextBillingDate: nextBilling,
		Status:          models.SubActive,
		CardLast4:       req.CardLast4,
		StartedAt:       time.Now(),
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}
	if _, err := config.DB.Collection("subscriptions").InsertOne(context.Background(), sub); err != nil {
		return utils.InternalError(c, "failed to track subscription")
	}
	return utils.Created(c, "subscription tracked", sub)
}

// ToggleSubscription PATCH /api/subscriptions/:id/toggle
func ToggleSubscription(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }

	subID, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil { return utils.BadRequest(c, "invalid subscription id") }

	var sub models.Subscription
	ctx := context.Background()
	if err := config.DB.Collection("subscriptions").FindOne(ctx, bson.M{"_id": subID, "userId": uid}).Decode(&sub); err != nil {
		return utils.NotFound(c, "subscription not found")
	}

	newStatus := models.SubPaused
	if sub.Status == models.SubPaused { newStatus = models.SubActive }

	_, _ = config.DB.Collection("subscriptions").UpdateOne(ctx,
		bson.M{"_id": subID},
		bson.M{"$set": bson.M{"status": newStatus, "updatedAt": time.Now()}},
	)
	sub.Status = newStatus
	return utils.OK(c, "subscription toggled", sub)
}

// CancelSubscription DELETE /api/subscriptions/:id
func CancelSubscription(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }

	subID, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil { return utils.BadRequest(c, "invalid subscription id") }

	_, _ = config.DB.Collection("subscriptions").UpdateOne(context.Background(),
		bson.M{"_id": subID, "userId": uid},
		bson.M{"$set": bson.M{"status": models.SubCancelled, "updatedAt": time.Now()}},
	)
	return utils.OK(c, "subscription cancelled", nil)
}

// GetSubscriptionStats GET /api/subscriptions/stats
func GetSubscriptionStats(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }

	var subs []models.Subscription
	cursor, _ := config.DB.Collection("subscriptions").Find(context.Background(), bson.M{"userId": uid})
	if cursor != nil { defer cursor.Close(context.Background()); _ = cursor.All(context.Background(), &subs) }

	monthly, annual, active := 0.0, 0.0, 0
	byCategory := map[string]float64{}
	for _, s := range subs {
		if s.Status == models.SubActive || s.Status == models.SubTrial {
			var mo float64
			switch s.Frequency { case models.SubMonthly: mo = s.Amount; case models.SubQuarterly: mo = s.Amount/3; case models.SubAnnual: mo = s.Amount/12 }
			monthly += mo; active++
			byCategory[s.Category] += mo
		}
	}
	annual = monthly * 12

	return utils.OK(c, "stats fetched", fiber.Map{
		"monthly":    monthly,
		"annual":     annual,
		"active":     active,
		"byCategory": byCategory,
	})
}
