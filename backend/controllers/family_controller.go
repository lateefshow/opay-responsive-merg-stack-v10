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
	"go.mongodb.org/mongo-driver/mongo"
)

// GetFamilyAccount GET /api/family
func GetFamilyAccount(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }

	var fa models.FamilyAccount
	err = config.DB.Collection("family_accounts").FindOne(context.Background(), bson.M{"ownerId": uid}).Decode(&fa)
	if err == mongo.ErrNoDocuments {
		return utils.NotFound(c, "no family account found")
	}
	return utils.OK(c, "family account fetched", fa)
}

// CreateFamilyAccount POST /api/family
func CreateFamilyAccount(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }

	count, _ := config.DB.Collection("family_accounts").CountDocuments(context.Background(), bson.M{"ownerId": uid})
	if count > 0 { return utils.Conflict(c, "family account already exists") }

	var req models.CreateFamilyRequest
	if err := c.BodyParser(&req); err != nil { return utils.BadRequest(c, "invalid body") }
	if err := validate.Struct(req); err != nil  { return utils.BadRequest(c, err.Error()) }

	var user models.User
	_ = config.DB.Collection("users").FindOne(context.Background(), bson.M{"_id": uid}).Decode(&user)
	initials := string([]rune(user.FirstName)[0:1]) + string([]rune(user.LastName)[0:1])

	fa := &models.FamilyAccount{
		ID:      primitive.NewObjectID(),
		OwnerID: uid,
		Name:    req.Name,
		Members: []models.FamilyMember{{
			UserID: uid, Name: user.FirstName + " " + user.LastName,
			Email: user.Email, Role: models.RoleOwner,
			AvatarColor: "#16a34a", Initials: initials,
			SpendLimit: 0, SpentThisMonth: 0, JoinedAt: time.Now(),
		}},
		SharedBalance:      0,
		TotalMonthlySpend:  0,
		CreatedAt:          time.Now(),
		UpdatedAt:          time.Now(),
	}
	_, _ = config.DB.Collection("family_accounts").InsertOne(context.Background(), fa)
	return utils.Created(c, "family account created", fa)
}

// InviteMember POST /api/family/invite
func InviteMember(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }
	var req models.InviteMemberRequest
	if err := c.BodyParser(&req); err != nil { return utils.BadRequest(c, "invalid body") }
	if err := validate.Struct(req); err != nil  { return utils.BadRequest(c, err.Error()) }

	ctx := context.Background()
	var fa models.FamilyAccount
	if err := config.DB.Collection("family_accounts").FindOne(ctx, bson.M{"ownerId": uid}).Decode(&fa); err != nil {
		return utils.NotFound(c, "family account not found")
	}

	// Look up invited user
	var invited models.User
	avatarColor := "#3b82f6"
	initials    := string([]rune(req.Name)[:1])
	if err := config.DB.Collection("users").FindOne(ctx, bson.M{"email": req.Email}).Decode(&invited); err == nil {
		initials = string([]rune(invited.FirstName)[0:1]) + string([]rune(invited.LastName)[0:1])
	}

	member := models.FamilyMember{
		UserID: primitive.NewObjectID(), Name: req.Name, Email: req.Email,
		Role: models.RoleMember, AvatarColor: avatarColor, Initials: initials,
		SpendLimit: req.SpendLimit, SpentThisMonth: 0, JoinedAt: time.Now(),
	}
	_, _ = config.DB.Collection("family_accounts").UpdateOne(ctx,
		bson.M{"_id": fa.ID},
		bson.M{"$push": bson.M{"members": member}, "$set": bson.M{"updatedAt": time.Now()}},
	)
	return utils.Created(c, "member invited", member)
}

// FundFamily POST /api/family/fund
func FundFamily(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }
	var req models.FundFamilyRequest
	if err := c.BodyParser(&req); err != nil { return utils.BadRequest(c, "invalid body") }
	if err := validate.Struct(req); err != nil  { return utils.BadRequest(c, err.Error()) }

	bal, _ := services.GetWalletBalance(uid)
	if bal < req.Amount { return utils.BadRequest(c, "insufficient wallet balance") }
	_, _ = services.FundWallet(uid, -req.Amount)

	ctx := context.Background()
	_, _ = config.DB.Collection("family_accounts").UpdateOne(ctx,
		bson.M{"ownerId": uid},
		bson.M{"$inc": bson.M{"sharedBalance": req.Amount}, "$set": bson.M{"updatedAt": time.Now()}},
	)
	newBal, _ := services.GetWalletBalance(uid)
	return utils.OK(c, "family account funded", fiber.Map{"funded": req.Amount, "newBalance": newBal})
}

// SetSpendLimit PATCH /api/family/members/:email/limit
func SetSpendLimit(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }
	email := c.Params("email")
	var req struct{ SpendLimit float64 `json:"spendLimit" validate:"min=0"` }
	if err := c.BodyParser(&req); err != nil { return utils.BadRequest(c, "invalid body") }

	ctx := context.Background()
	_, _ = config.DB.Collection("family_accounts").UpdateOne(ctx,
		bson.M{"ownerId": uid, "members.email": email},
		bson.M{"$set": bson.M{"members.$.spendLimit": req.SpendLimit, "updatedAt": time.Now()}},
	)
	return utils.OK(c, "spend limit updated", nil)
}
