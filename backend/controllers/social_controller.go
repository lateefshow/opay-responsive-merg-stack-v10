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
	"go.mongodb.org/mongo-driver/mongo/options"
)

// GetFeed GET /api/social/feed
func GetFeed(c *fiber.Ctx) error {
	ctx := context.Background()
	opts := options.Find().SetSort(bson.D{{Key: "createdAt", Value: -1}}).SetLimit(30)
	var activities []models.SocialActivity
	cursor, _ := config.DB.Collection("social_activities").Find(ctx, bson.M{"isPublic": true}, opts)
	if cursor != nil { defer cursor.Close(ctx); _ = cursor.All(ctx, &activities) }
	if activities == nil { activities = []models.SocialActivity{} }
	return utils.OK(c, "feed fetched", fiber.Map{"activities": activities})
}

// CreatePost POST /api/social/posts
func CreatePost(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }
	var req models.CreateSocialPostRequest
	if err := c.BodyParser(&req); err != nil { return utils.BadRequest(c, "invalid body") }
	if err := validate.Struct(req); err != nil  { return utils.BadRequest(c, err.Error()) }

	var user models.User
	_ = config.DB.Collection("users").FindOne(context.Background(), bson.M{"_id": uid}).Decode(&user)

	activity := &models.SocialActivity{
		ID:           primitive.NewObjectID(),
		UserID:       uid,
		UserName:     user.FirstName + " " + user.LastName,
		UserInitials: string([]rune(user.FirstName)[0:1]) + string([]rune(user.LastName)[0:1]),
		AvatarColor:  "#16a34a",
		Type:         models.SocialActivityType(req.Type),
		Caption:      req.Caption,
		Amount:       req.Amount,
		IsPublic:     req.IsPublic,
		Reactions:    []models.SocialReaction{},
		CommentCount: 0,
		CreatedAt:    time.Now(),
	}
	_, _ = config.DB.Collection("social_activities").InsertOne(context.Background(), activity)
	return utils.Created(c, "post created", activity)
}

// ReactToPost POST /api/social/posts/:id/react
func ReactToPost(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }
	postID, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil { return utils.BadRequest(c, "invalid post id") }
	var req models.ReactRequest
	if err := c.BodyParser(&req); err != nil { return utils.BadRequest(c, "invalid body") }

	reaction := models.SocialReaction{UserID: uid, Emoji: req.Emoji, CreatedAt: time.Now()}
	_, _ = config.DB.Collection("social_activities").UpdateOne(context.Background(),
		bson.M{"_id": postID},
		bson.M{"$push": bson.M{"reactions": reaction}},
	)
	return utils.OK(c, "reaction added", nil)
}

// GetMyPosts GET /api/social/mine
func GetMyPosts(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }
	var posts []models.SocialActivity
	cursor, _ := config.DB.Collection("social_activities").Find(context.Background(),
		bson.M{"userId": uid},
		options.Find().SetSort(bson.D{{Key: "createdAt", Value: -1}}),
	)
	if cursor != nil { defer cursor.Close(context.Background()); _ = cursor.All(context.Background(), &posts) }
	if posts == nil { posts = []models.SocialActivity{} }
	return utils.OK(c, "my posts fetched", fiber.Map{"posts": posts})
}
