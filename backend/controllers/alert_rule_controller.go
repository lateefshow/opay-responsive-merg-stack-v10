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

// GetAlertRules GET /api/alerts
func GetAlertRules(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }

	var rules []models.AlertRule
	cursor, _ := config.DB.Collection("alert_rules").Find(context.Background(), bson.M{"userId": uid})
	if cursor != nil { defer cursor.Close(context.Background()); _ = cursor.All(context.Background(), &rules) }
	if rules == nil { rules = []models.AlertRule{} }

	// Seed defaults for new users
	if len(rules) == 0 {
		defaults := []models.AlertRule{
			{ID:primitive.NewObjectID(), UserID:uid, Name:"Low Balance Alert", Trigger:models.TriggerBalance, Threshold:5000, Channel:models.ChannelPush, IsActive:true, TriggeredCount:0, CreatedAt:time.Now()},
			{ID:primitive.NewObjectID(), UserID:uid, Name:"Large Debit Alert", Trigger:models.TriggerLargeDebit, Threshold:50000, Channel:models.ChannelPush, IsActive:true, TriggeredCount:3, CreatedAt:time.Now()},
			{ID:primitive.NewObjectID(), UserID:uid, Name:"Large Credit Alert", Trigger:models.TriggerLargeCredit, Threshold:100000, Channel:models.ChannelEmail, IsActive:false, TriggeredCount:1, CreatedAt:time.Now()},
		}
		var docs []interface{}
		for _, d := range defaults { docs = append(docs, d) }
		_, _ = config.DB.Collection("alert_rules").InsertMany(context.Background(), docs)
		rules = defaults
	}
	return utils.OK(c, "alert rules fetched", fiber.Map{"rules": rules})
}

// CreateAlertRule POST /api/alerts
func CreateAlertRule(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }
	var req models.CreateAlertRuleRequest
	if err := c.BodyParser(&req); err != nil { return utils.BadRequest(c, "invalid body") }
	if err := validate.Struct(req); err != nil  { return utils.BadRequest(c, err.Error()) }

	rule := &models.AlertRule{
		ID: primitive.NewObjectID(), UserID: uid,
		Name: req.Name, Trigger: models.AlertTrigger(req.Trigger),
		Threshold: req.Threshold, Channel: models.AlertChannel(req.Channel),
		IsActive: true, TriggeredCount: 0, CreatedAt: time.Now(),
	}
	_, _ = config.DB.Collection("alert_rules").InsertOne(context.Background(), rule)
	return utils.Created(c, "alert rule created", rule)
}

// ToggleAlertRule PATCH /api/alerts/:id/toggle
func ToggleAlertRule(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }
	rid, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil { return utils.BadRequest(c, "invalid rule id") }

	var rule models.AlertRule
	ctx := context.Background()
	if err := config.DB.Collection("alert_rules").FindOne(ctx, bson.M{"_id": rid, "userId": uid}).Decode(&rule); err != nil {
		return utils.NotFound(c, "alert rule not found")
	}
	_, _ = config.DB.Collection("alert_rules").UpdateOne(ctx,
		bson.M{"_id": rid},
		bson.M{"$set": bson.M{"isActive": !rule.IsActive}},
	)
	return utils.OK(c, "alert toggled", fiber.Map{"isActive": !rule.IsActive})
}

// DeleteAlertRule DELETE /api/alerts/:id
func DeleteAlertRule(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }
	rid, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil { return utils.BadRequest(c, "invalid rule id") }
	_, _ = config.DB.Collection("alert_rules").DeleteOne(context.Background(), bson.M{"_id": rid, "userId": uid})
	return utils.OK(c, "alert rule deleted", nil)
}
