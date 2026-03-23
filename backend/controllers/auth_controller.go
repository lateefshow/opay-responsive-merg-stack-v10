package controllers

import (
	"context"
	"strings"
	"time"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/opay/backend/config"
	"github.com/opay/backend/models"
	"github.com/opay/backend/services"
	"github.com/opay/backend/utils"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"golang.org/x/crypto/bcrypt"
)

var validate = validator.New()

// Register handles POST /api/auth/register
func Register(c *fiber.Ctx) error {
	var req models.RegisterRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.BadRequest(c, "invalid request body")
	}
	if err := validate.Struct(req); err != nil {
		return utils.BadRequest(c, err.Error())
	}

	ctx := context.Background()
	col := config.DB.Collection("users")

	// Check email uniqueness
	count, _ := col.CountDocuments(ctx, bson.M{"email": strings.ToLower(req.Email)})
	if count > 0 {
		return utils.Conflict(c, "email already registered")
	}

	// Hash password
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), config.AppConfig.BcryptCost)
	if err != nil {
		return utils.InternalError(c, "failed to secure password")
	}

	now := time.Now()
	referralCode := strings.ToUpper(uuid.New().String()[:8])

	user := &models.User{
		ID:           primitive.NewObjectID(),
		FirstName:    req.FirstName,
		LastName:     req.LastName,
		Email:        strings.ToLower(req.Email),
		Phone:        req.Phone,
		PasswordHash: string(hash),
		ReferralCode: referralCode,
		ReferredBy:   req.ReferredBy,
		IsVerified:   true, // Auto-verify for demo
		IsActive:     true,
		CreatedAt:    now,
		UpdatedAt:    now,
	}

	if _, err := col.InsertOne(ctx, user); err != nil {
		return utils.InternalError(c, "failed to create account")
	}

	// Create wallet
	_, _ = services.GetOrCreateWallet(user.ID)

	// Handle referral bonus
	if req.ReferredBy != "" {
		go processReferralBonus(user.ID, req.ReferredBy)
	}

	// Generate tokens
	tokens, err := services.GenerateTokenPair(user.ID.Hex(), user.Email)
	if err != nil {
		return utils.InternalError(c, "failed to generate tokens")
	}

	setAuthCookies(c, tokens)

	return utils.Created(c, "account created successfully", fiber.Map{
		"user":        user.ToPublic(),
		"accessToken": tokens.AccessToken,
	})
}

// Login handles POST /api/auth/login
func Login(c *fiber.Ctx) error {
	var req models.LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.BadRequest(c, "invalid request body")
	}
	if err := validate.Struct(req); err != nil {
		return utils.BadRequest(c, err.Error())
	}

	ctx := context.Background()
	col := config.DB.Collection("users")

	var user models.User
	err := col.FindOne(ctx, bson.M{"email": strings.ToLower(req.Email)}).Decode(&user)
	if err == mongo.ErrNoDocuments {
		return utils.Unauthorized(c, "invalid email or password")
	}
	if err != nil {
		return utils.InternalError(c, "login failed")
	}

	if !user.IsActive {
		return utils.Unauthorized(c, "account is deactivated")
	}

	if err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return utils.Unauthorized(c, "invalid email or password")
	}

	tokens, err := services.GenerateTokenPair(user.ID.Hex(), user.Email)
	if err != nil {
		return utils.InternalError(c, "failed to generate tokens")
	}

	setAuthCookies(c, tokens)

	return utils.OK(c, "login successful", fiber.Map{
		"user":        user.ToPublic(),
		"accessToken": tokens.AccessToken,
	})
}

// Logout handles POST /api/auth/logout
func Logout(c *fiber.Ctx) error {
	// Blacklist access token
	token := c.Locals("token").(string)
	_ = services.BlacklistToken(token, time.Now().Add(config.AppConfig.JWTAccessExpiry))

	// Blacklist refresh token from cookie
	refreshToken := c.Cookies("refresh_token")
	if refreshToken != "" {
		_ = services.BlacklistToken(refreshToken, time.Now().Add(config.AppConfig.JWTRefreshExpiry))
	}

	// Clear cookies
	clearAuthCookies(c)

	return utils.OK(c, "logged out successfully", nil)
}

// RefreshToken handles POST /api/auth/refresh
func RefreshToken(c *fiber.Ctx) error {
	refreshToken := c.Cookies("refresh_token")
	if refreshToken == "" {
		return utils.Unauthorized(c, "refresh token missing")
	}

	if services.IsTokenBlacklisted(refreshToken) {
		return utils.Unauthorized(c, "refresh token revoked")
	}

	claims, err := services.ValidateRefreshToken(refreshToken)
	if err != nil {
		return utils.Unauthorized(c, "invalid refresh token")
	}

	// Rotate: blacklist old refresh token
	_ = services.BlacklistToken(refreshToken, time.Now().Add(config.AppConfig.JWTRefreshExpiry))

	// Issue new pair
	tokens, err := services.GenerateTokenPair(claims.UserID, claims.Email)
	if err != nil {
		return utils.InternalError(c, "token rotation failed")
	}

	setAuthCookies(c, tokens)

	return utils.OK(c, "tokens refreshed", fiber.Map{
		"accessToken": tokens.AccessToken,
	})
}

// GetMe handles GET /api/auth/me
func GetMe(c *fiber.Ctx) error {
	userIDStr := c.Locals("userId").(string)
	userID, err := primitive.ObjectIDFromHex(userIDStr)
	if err != nil {
		return utils.BadRequest(c, "invalid user id")
	}

	var user models.User
	err = config.DB.Collection("users").FindOne(
		context.Background(), bson.M{"_id": userID},
	).Decode(&user)
	if err != nil {
		return utils.NotFound(c, "user not found")
	}

	wallet, _ := services.GetOrCreateWallet(userID)

	return utils.OK(c, "user fetched", fiber.Map{
		"user":    user.ToPublic(),
		"balance": wallet.Balance,
	})
}

// setAuthCookies writes httpOnly access + refresh cookies
func setAuthCookies(c *fiber.Ctx, tokens *services.TokenPair) {
	cfg := config.AppConfig
	secure := cfg.Environment == "production"

	c.Cookie(&fiber.Cookie{
		Name:     "access_token",
		Value:    tokens.AccessToken,
		HTTPOnly: true,
		Secure:   secure,
		SameSite: "Lax",
		MaxAge:   int(cfg.JWTAccessExpiry.Seconds()),
		Path:     "/",
	})

	c.Cookie(&fiber.Cookie{
		Name:     "refresh_token",
		Value:    tokens.RefreshToken,
		HTTPOnly: true,
		Secure:   secure,
		SameSite: "Lax",
		MaxAge:   int(cfg.JWTRefreshExpiry.Seconds()),
		Path:     "/api/auth/refresh",
	})
}

// clearAuthCookies removes auth cookies
func clearAuthCookies(c *fiber.Ctx) {
	c.Cookie(&fiber.Cookie{Name: "access_token", Value: "", MaxAge: -1, Path: "/"})
	c.Cookie(&fiber.Cookie{Name: "refresh_token", Value: "", MaxAge: -1, Path: "/api/auth/refresh"})
}

// processReferralBonus awards bonus to referrer (runs in goroutine)
func processReferralBonus(newUserID primitive.ObjectID, referralCode string) {
	ctx := context.Background()
	var referrer models.User
	err := config.DB.Collection("users").FindOne(ctx, bson.M{"referralCode": referralCode}).Decode(&referrer)
	if err != nil {
		return
	}

	bonusAmount := 3000.0 // ₦3,000 referral bonus
	_, _ = services.FundWallet(referrer.ID, bonusAmount)

	referral := &models.Referral{
		ID:          primitive.NewObjectID(),
		ReferrerID:  referrer.ID,
		RefereeID:   newUserID,
		BonusAmount: bonusAmount,
		Status:      "paid",
		CreatedAt:   time.Now(),
	}
	_, _ = config.DB.Collection("referrals").InsertOne(ctx, referral)
}
