package middleware

import (
	"log"

	"github.com/gofiber/fiber/v2"
)

// ErrorHandler is the global Fiber error handler
func ErrorHandler(c *fiber.Ctx, err error) error {
	code := fiber.StatusInternalServerError
	msg := "Something went wrong"

	if e, ok := err.(*fiber.Error); ok {
		code = e.Code
		msg = e.Message
	} else {
		log.Printf("[error] Unhandled: %v", err)
	}

	return c.Status(code).JSON(fiber.Map{
		"success": false,
		"message": msg,
		"error":   err.Error(),
	})
}
