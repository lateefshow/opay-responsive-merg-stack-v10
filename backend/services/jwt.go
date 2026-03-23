package services

import (
	"context"
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/opay/backend/config"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// TokenClaims are the JWT payload fields
type TokenClaims struct {
	UserID string `json:"userId"`
	Email  string `json:"email"`
	jwt.RegisteredClaims
}

// TokenPair contains both access and refresh tokens
type TokenPair struct {
	AccessToken  string
	RefreshToken string
}

// GenerateTokenPair creates signed access + refresh JWTs
func GenerateTokenPair(userID, email string) (*TokenPair, error) {
	cfg := config.AppConfig

	// Access token
	accessClaims := TokenClaims{
		UserID: userID,
		Email:  email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(cfg.JWTAccessExpiry)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Subject:   userID,
		},
	}
	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims)
	accessSigned, err := accessToken.SignedString([]byte(cfg.JWTAccessSecret))
	if err != nil {
		return nil, err
	}

	// Refresh token
	refreshClaims := TokenClaims{
		UserID: userID,
		Email:  email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(cfg.JWTRefreshExpiry)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Subject:   userID,
		},
	}
	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
	refreshSigned, err := refreshToken.SignedString([]byte(cfg.JWTRefreshSecret))
	if err != nil {
		return nil, err
	}

	return &TokenPair{
		AccessToken:  accessSigned,
		RefreshToken: refreshSigned,
	}, nil
}

// ValidateAccessToken parses and validates an access token
func ValidateAccessToken(tokenStr string) (*TokenClaims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &TokenClaims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(config.AppConfig.JWTAccessSecret), nil
	})
	if err != nil {
		return nil, err
	}
	claims, ok := token.Claims.(*TokenClaims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token")
	}
	return claims, nil
}

// ValidateRefreshToken parses and validates a refresh token
func ValidateRefreshToken(tokenStr string) (*TokenClaims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &TokenClaims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(config.AppConfig.JWTRefreshSecret), nil
	})
	if err != nil {
		return nil, err
	}
	claims, ok := token.Claims.(*TokenClaims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token")
	}
	return claims, nil
}

// BlacklistToken stores a revoked token in MongoDB (TTL-indexed)
func BlacklistToken(tokenStr string, expiresAt time.Time) error {
	col := config.DB.Collection("token_blacklist")
	_, err := col.InsertOne(context.Background(), bson.M{
		"token":     tokenStr,
		"expiresAt": expiresAt,
		"createdAt": time.Now(),
	})
	return err
}

// IsTokenBlacklisted checks if a token was revoked
func IsTokenBlacklisted(tokenStr string) bool {
	col := config.DB.Collection("token_blacklist")
	count, err := col.CountDocuments(context.Background(), bson.M{"token": tokenStr})
	if err != nil {
		return false
	}
	return count > 0
}

// ExtractUserIDFromToken is a convenience helper
func ExtractUserIDFromToken(tokenStr string) (primitive.ObjectID, error) {
	claims, err := ValidateAccessToken(tokenStr)
	if err != nil {
		return primitive.NilObjectID, err
	}
	return primitive.ObjectIDFromHex(claims.UserID)
}
