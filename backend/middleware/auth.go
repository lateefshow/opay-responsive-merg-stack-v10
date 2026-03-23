package middleware

import (
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/opay/backend/services"
	"github.com/opay/backend/utils"
)

// AuthRequired validates JWT from Authorization header or access_token cookie
func AuthRequired(c *fiber.Ctx) error {
	var tokenStr string

	// Try Authorization header first
	authHeader := c.Get("Authorization")
	if strings.HasPrefix(authHeader, "Bearer ") {
		tokenStr = strings.TrimPrefix(authHeader, "Bearer ")
	}

	// Fall back to cookie
	if tokenStr == "" {
		tokenStr = c.Cookies("access_token")
	}

	if tokenStr == "" {
		return utils.Unauthorized(c, "authentication required")
	}

	// Check blacklist
	if services.IsTokenBlacklisted(tokenStr) {
		return utils.Unauthorized(c, "token revoked")
	}

	// Validate token
	claims, err := services.ValidateAccessToken(tokenStr)
	if err != nil {
		return utils.Unauthorized(c, "invalid or expired token")
	}

	// Store claims in locals for downstream handlers
	c.Locals("userId", claims.UserID)
	c.Locals("email", claims.Email)
	c.Locals("token", tokenStr)

	return c.Next()
}
