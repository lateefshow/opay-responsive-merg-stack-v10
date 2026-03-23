package controllers

import (
	"context"
	"math/rand"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/opay/backend/config"
	"github.com/opay/backend/models"
	"github.com/opay/backend/utils"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func GetInsurances(c *fiber.Ctx) error {
	userID, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }
	var policies []models.Insurance
	cursor, _ := config.DB.Collection("insurances").Find(context.Background(), bson.M{"userId": userID})
	if cursor != nil { defer cursor.Close(context.Background()); _ = cursor.All(context.Background(), &policies) }
	if policies == nil { policies = []models.Insurance{} }
	return utils.OK(c, "policies fetched", fiber.Map{"policies": policies})
}

func CreateInsurance(c *fiber.Ctx) error {
	userID, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }

	var req models.CreateInsuranceRequest
	if err := c.BodyParser(&req); err != nil { return utils.BadRequest(c, "invalid body") }

	premiums := map[models.InsuranceType]float64{
		models.InsuranceHealth: 3500,
		models.InsuranceLife:   2500,
		models.InsuranceAuto:   12000,
	}
	premium := premiums[req.Type]
	if premium == 0 { premium = 2000 }

	now := time.Now()
	policy := &models.Insurance{
		ID:           primitive.NewObjectID(),
		UserID:       userID,
		Type:         req.Type,
		Name:         string(req.Type) + " Insurance — Standard",
		Provider:     "AXA Mansard",
		Premium:      premium,
		Coverage:     5000000,
		PolicyNumber: "OPY-" + strconv.Itoa(rand.Intn(9000000)+1000000),
		Status:       models.InsuranceActive,
		StartDate:    now,
		EndDate:      now.AddDate(1, 0, 0),
		CreatedAt:    now,
	}
	if _, err := config.DB.Collection("insurances").InsertOne(context.Background(), policy); err != nil {
		return utils.InternalError(c, "failed to create policy")
	}
	return utils.Created(c, "insurance activated", policy)
}

func CancelInsurance(c *fiber.Ctx) error {
	userID, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }
	polID, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil { return utils.BadRequest(c, "invalid id") }
	_, _ = config.DB.Collection("insurances").UpdateOne(context.Background(),
		bson.M{"_id": polID, "userId": userID},
		bson.M{"$set": bson.M{"status": "cancelled"}},
	)
	return utils.OK(c, "insurance cancelled", nil)
}
