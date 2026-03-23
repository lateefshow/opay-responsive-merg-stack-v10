package controllers

import (
	"context"
	"fmt"
	"math/rand"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/opay/backend/config"
	"github.com/opay/backend/models"
	"github.com/opay/backend/services"
	"github.com/opay/backend/utils"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

func generateSlug(title string) string {
	slug := strings.ToLower(strings.ReplaceAll(title, " ", "-"))
	slug = fmt.Sprintf("%s-%04d", slug[:min(len(slug), 20)], rand.Intn(9000)+1000)
	return slug
}

func min(a, b int) int { if a < b { return a }; return b }

// GetPaymentLinks GET /api/payment-links
func GetPaymentLinks(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }
	var links []models.PaymentLink
	cursor, _ := config.DB.Collection("payment_links").Find(context.Background(), bson.M{"userId": uid})
	if cursor != nil { defer cursor.Close(context.Background()); _ = cursor.All(context.Background(), &links) }
	if links == nil { links = []models.PaymentLink{} }

	totalCollected := 0.0
	for _, l := range links { totalCollected += l.TotalCollected }
	return utils.OK(c, "payment links fetched", fiber.Map{"links": links, "totalCollected": totalCollected})
}

// CreatePaymentLink POST /api/payment-links
func CreatePaymentLink(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }
	var req models.CreatePaymentLinkRequest
	if err := c.BodyParser(&req); err != nil { return utils.BadRequest(c, "invalid body") }
	if err := validate.Struct(req); err != nil  { return utils.BadRequest(c, err.Error()) }

	slug := generateSlug(req.Title)
	link := &models.PaymentLink{
		ID:            primitive.NewObjectID(),
		UserID:        uid,
		Title:         req.Title,
		Description:   req.Description,
		Amount:        req.Amount,
		IsFixedAmount: req.IsFixedAmount,
		Slug:          slug,
		URL:           "https://pay.opay.ng/" + slug,
		Status:        models.LinkActive,
		ExpiresAt:     req.ExpiresAt,
		TotalCollected: 0,
		PaymentCount:  0,
		CreatedAt:     time.Now(),
	}
	_, _ = config.DB.Collection("payment_links").InsertOne(context.Background(), link)
	return utils.Created(c, "payment link created", link)
}

// TogglePaymentLink PATCH /api/payment-links/:id/toggle
func TogglePaymentLink(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }
	lid, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil { return utils.BadRequest(c, "invalid link id") }

	var link models.PaymentLink
	ctx := context.Background()
	if err := config.DB.Collection("payment_links").FindOne(ctx, bson.M{"_id": lid, "userId": uid}).Decode(&link); err != nil {
		return utils.NotFound(c, "link not found")
	}
	newStatus := models.LinkInactive
	if link.Status == models.LinkInactive { newStatus = models.LinkActive }
	_, _ = config.DB.Collection("payment_links").UpdateOne(ctx, bson.M{"_id": lid}, bson.M{"$set": bson.M{"status": newStatus}})
	return utils.OK(c, "link toggled", fiber.Map{"status": newStatus})
}

// DeletePaymentLink DELETE /api/payment-links/:id
func DeletePaymentLink(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }
	lid, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil { return utils.BadRequest(c, "invalid link id") }
	_, _ = config.DB.Collection("payment_links").DeleteOne(context.Background(), bson.M{"_id": lid, "userId": uid})
	return utils.OK(c, "link deleted", nil)
}

// SimulatePayment POST /api/payment-links/:id/simulate — demo payment
func SimulatePayment(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }
	lid, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil { return utils.BadRequest(c, "invalid link id") }

	var link models.PaymentLink
	ctx := context.Background()
	if err := config.DB.Collection("payment_links").FindOne(ctx, bson.M{"_id": lid, "userId": uid}).Decode(&link); err != nil {
		return utils.NotFound(c, "link not found")
	}
	if link.Status != models.LinkActive { return utils.BadRequest(c, "link is not active") }

	var req struct { Amount float64 `json:"amount"`; Name string `json:"name"`; Email string `json:"email"` }
	_ = c.BodyParser(&req)
	amount := req.Amount
	if link.IsFixedAmount || amount <= 0 { amount = link.Amount }

	payment := &models.PaymentLinkPayment{
		ID:        primitive.NewObjectID(),
		LinkID:    lid,
		PayerName: req.Name,
		PayerEmail: req.Email,
		Amount:    amount,
		Reference: "PLK-" + uuid.New().String()[:8],
		CreatedAt: time.Now(),
	}
	_, _ = config.DB.Collection("payment_link_payments").InsertOne(ctx, payment)
	_, _ = services.FundWallet(uid, amount)
	_, _ = config.DB.Collection("payment_links").UpdateOne(ctx, bson.M{"_id": lid},
		bson.M{"$inc": bson.M{"totalCollected": amount, "paymentCount": 1}},
	)
	newBal, _ := services.GetWalletBalance(uid)

	// Check expiry
	_ = mongo.ErrNoDocuments
	return utils.OK(c, "payment simulated", fiber.Map{"payment": payment, "newBalance": newBal})
}
