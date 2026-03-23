package controllers

import (
	"context"
	"crypto/rand"
	"fmt"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/opay/backend/config"
	"github.com/opay/backend/models"
	"github.com/opay/backend/services"
	"github.com/opay/backend/utils"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// generateGiftCode creates a formatted XXXX-XXXX-XXXX-XXXX code
func generateGiftCode(brand string) string {
	prefix := strings.ToUpper(brand[:4])
	b := make([]byte, 3)
	rand.Read(b)
	part := func() string { return fmt.Sprintf("%04X", uint16(b[0])<<8|uint16(b[1])) }
	return fmt.Sprintf("%s-%s-%s-%s", prefix, part(), part(), part())
}

func generatePIN() string { return fmt.Sprintf("%04d", time.Now().UnixNano()%10000) }

// GetGiftCards GET /api/gift-cards
func GetGiftCards(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }

	var cards []models.GiftCard
	cursor, _ := config.DB.Collection("gift_cards").Find(context.Background(), bson.M{"userId": uid})
	if cursor != nil { defer cursor.Close(context.Background()); _ = cursor.All(context.Background(), &cards) }
	if cards == nil { cards = []models.GiftCard{} }
	return utils.OK(c, "gift cards fetched", fiber.Map{"cards": cards})
}

// PurchaseGiftCard POST /api/gift-cards
func PurchaseGiftCard(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }

	var req models.PurchaseGiftCardRequest
	if err := c.BodyParser(&req); err != nil { return utils.BadRequest(c, "invalid body") }
	if err := validate.Struct(req); err != nil  { return utils.BadRequest(c, err.Error()) }

	// Check balance
	bal, _ := services.GetWalletBalance(uid)
	if bal < req.Amount { return utils.BadRequest(c, "insufficient wallet balance") }

	// Debit wallet
	_, err = services.FundWallet(uid, -req.Amount)
	if err != nil { return utils.InternalError(c, "wallet debit failed") }

	gc := &models.GiftCard{
		ID:          primitive.NewObjectID(),
		UserID:      uid,
		Brand:       req.Brand,
		Logo:        req.Logo,
		Color:       req.Color,
		Amount:      req.Amount,
		Balance:     req.Amount,
		Code:        generateGiftCode(req.Brand),
		Pin:         generatePIN(),
		Status:      models.GiftCardActive,
		ExpiryDate:  time.Now().AddDate(1, 0, 0),
		PurchasedAt: time.Now(),
	}
	if _, err := config.DB.Collection("gift_cards").InsertOne(context.Background(), gc); err != nil {
		return utils.InternalError(c, "failed to create gift card")
	}
	newBal, _ := services.GetWalletBalance(uid)
	return utils.Created(c, "gift card purchased", fiber.Map{"card": gc, "newBalance": newBal})
}

// UseGiftCard POST /api/gift-cards/:id/use
func UseGiftCard(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }

	gcID, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil { return utils.BadRequest(c, "invalid gift card id") }

	var req models.UseGiftCardRequest
	if err := c.BodyParser(&req); err != nil { return utils.BadRequest(c, "invalid body") }

	var gc models.GiftCard
	if err := config.DB.Collection("gift_cards").FindOne(context.Background(), bson.M{"_id": gcID, "userId": uid}).Decode(&gc); err != nil {
		return utils.NotFound(c, "gift card not found")
	}
	if gc.Status != models.GiftCardActive { return utils.BadRequest(c, "gift card is not active") }
	if gc.Balance < req.Amount { return utils.BadRequest(c, "insufficient gift card balance") }

	newBal := gc.Balance - req.Amount
	status := models.GiftCardActive
	if newBal <= 0 { status = models.GiftCardUsed; newBal = 0 }

	_, _ = config.DB.Collection("gift_cards").UpdateOne(context.Background(),
		bson.M{"_id": gcID},
		bson.M{"$set": bson.M{"balance": newBal, "status": status}},
	)
	gc.Balance = newBal; gc.Status = status
	return utils.OK(c, "gift card used", fiber.Map{"card": gc, "amountUsed": req.Amount})
}
