package controllers

import (
	"context"

	"github.com/gofiber/fiber/v2"
	"github.com/opay/backend/config"
	"github.com/opay/backend/models"
	"github.com/opay/backend/services"
	"github.com/opay/backend/utils"
	"go.mongodb.org/mongo-driver/bson"
)

// CreateCard handles POST /api/cards
func CreateCard(c *fiber.Ctx) error {
	userID, err := getUserID(c)
	if err != nil {
		return utils.Unauthorized(c, "invalid session")
	}

	var req models.CreateCardRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.BadRequest(c, "invalid request body")
	}
	if err := validate.Struct(req); err != nil {
		return utils.BadRequest(c, err.Error())
	}

	// Fetch user to get full name for card holder
	var user models.User
	err = config.DB.Collection("users").FindOne(
		context.Background(), bson.M{"_id": userID},
	).Decode(&user)
	if err != nil {
		return utils.NotFound(c, "user not found")
	}
	fullName := user.FirstName + " " + user.LastName

	card, err := services.CreateVirtualCard(userID, fullName)
	if err != nil {
		return utils.InternalError(c, "failed to create card: "+err.Error())
	}

	return utils.Created(c, "card created successfully", card.ToPublic())
}

// GetCards handles GET /api/cards
func GetCards(c *fiber.Ctx) error {
	userID, err := getUserID(c)
	if err != nil {
		return utils.Unauthorized(c, "invalid session")
	}

	cards, err := services.GetUserCards(userID)
	if err != nil {
		return utils.InternalError(c, "failed to fetch cards")
	}

	if cards == nil { cards = []models.CardPublic{} }
	return utils.OK(c, "cards fetched", fiber.Map{
		"cards": cards,
	})
}
