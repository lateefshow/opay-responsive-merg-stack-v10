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

// GetSplits GET /api/split-pay
func GetSplits(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }

	var splits []models.SplitRequest
	cursor, _ := config.DB.Collection("splits").Find(context.Background(), bson.M{"creatorId": uid})
	if cursor != nil { defer cursor.Close(context.Background()); _ = cursor.All(context.Background(), &splits) }
	if splits == nil { splits = []models.SplitRequest{} }
	return utils.OK(c, "splits fetched", fiber.Map{"splits": splits})
}

// CreateSplit POST /api/split-pay
func CreateSplit(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }

	var req models.CreateSplitRequest
	if err := c.BodyParser(&req); err != nil { return utils.BadRequest(c, "invalid body") }
	if err := validate.Struct(req); err != nil  { return utils.BadRequest(c, err.Error()) }

	// Build per-person amount
	perPerson := req.TotalAmount / float64(len(req.Participants)+1)

	// Creator is auto-marked as paid
	for i := range req.Participants {
		req.Participants[i].Amount = perPerson
	}

	// Fetch creator name
	var creator models.User
	_ = config.DB.Collection("users").FindOne(context.Background(), bson.M{"_id": uid}).Decode(&creator)

	split := &models.SplitRequest{
		ID:           primitive.NewObjectID(),
		CreatorID:    uid,
		Title:        req.Title,
		Description:  req.Description,
		TotalAmount:  req.TotalAmount,
		CreatedBy:    creator.FirstName + " " + creator.LastName,
		Participants: req.Participants,
		Status:       models.SplitPartial,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	if _, err := config.DB.Collection("splits").InsertOne(context.Background(), split); err != nil {
		return utils.InternalError(c, "failed to create split")
	}
	return utils.Created(c, "split created", split)
}

// MarkParticipantPaid POST /api/split-pay/:id/mark-paid
func MarkParticipantPaid(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }

	splitID, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil { return utils.BadRequest(c, "invalid split id") }

	var req models.MarkPaidRequest
	if err := c.BodyParser(&req); err != nil { return utils.BadRequest(c, "invalid body") }

	var split models.SplitRequest
	ctx := context.Background()
	if err := config.DB.Collection("splits").FindOne(ctx, bson.M{"_id": splitID, "creatorId": uid}).Decode(&split); err != nil {
		return utils.NotFound(c, "split not found")
	}

	now := time.Now()
	allPaid := true
	for i, p := range split.Participants {
		if p.UserID == req.UserID {
			split.Participants[i].Paid   = true
			split.Participants[i].PaidAt = &now
		}
		if !split.Participants[i].Paid { allPaid = false }
	}

	status := models.SplitPartial
	if allPaid { status = models.SplitComplete }
	split.Status    = status
	split.UpdatedAt = now

	_, _ = config.DB.Collection("splits").ReplaceOne(ctx, bson.M{"_id": splitID}, split)
	return utils.OK(c, "participant marked as paid", split)
}

// CancelSplit DELETE /api/split-pay/:id
func CancelSplit(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }

	splitID, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil { return utils.BadRequest(c, "invalid split id") }

	_, _ = config.DB.Collection("splits").UpdateOne(context.Background(),
		bson.M{"_id": splitID, "creatorId": uid},
		bson.M{"$set": bson.M{"status": models.SplitCancelled, "updatedAt": time.Now()}},
	)
	return utils.OK(c, "split cancelled", nil)
}
