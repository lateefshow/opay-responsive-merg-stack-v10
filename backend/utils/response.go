package utils

import "github.com/gofiber/fiber/v2"

// APIResponse is the standard JSON envelope
type APIResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

// OK sends a 200 success response
func OK(c *fiber.Ctx, message string, data interface{}) error {
	return c.Status(fiber.StatusOK).JSON(APIResponse{
		Success: true,
		Message: message,
		Data:    data,
	})
}

// Created sends a 201 created response
func Created(c *fiber.Ctx, message string, data interface{}) error {
	return c.Status(fiber.StatusCreated).JSON(APIResponse{
		Success: true,
		Message: message,
		Data:    data,
	})
}

// BadRequest sends a 400 error response
func BadRequest(c *fiber.Ctx, message string) error {
	return c.Status(fiber.StatusBadRequest).JSON(APIResponse{
		Success: false,
		Message: "Bad Request",
		Error:   message,
	})
}

// Unauthorized sends a 401 error response
func Unauthorized(c *fiber.Ctx, message string) error {
	return c.Status(fiber.StatusUnauthorized).JSON(APIResponse{
		Success: false,
		Message: "Unauthorized",
		Error:   message,
	})
}

// Forbidden sends a 403 error response
func Forbidden(c *fiber.Ctx, message string) error {
	return c.Status(fiber.StatusForbidden).JSON(APIResponse{
		Success: false,
		Message: "Forbidden",
		Error:   message,
	})
}

// NotFound sends a 404 error response
func NotFound(c *fiber.Ctx, message string) error {
	return c.Status(fiber.StatusNotFound).JSON(APIResponse{
		Success: false,
		Message: "Not Found",
		Error:   message,
	})
}

// InternalError sends a 500 error response
func InternalError(c *fiber.Ctx, message string) error {
	return c.Status(fiber.StatusInternalServerError).JSON(APIResponse{
		Success: false,
		Message: "Internal Server Error",
		Error:   message,
	})
}

// Conflict sends a 409 error response
func Conflict(c *fiber.Ctx, message string) error {
	return c.Status(fiber.StatusConflict).JSON(APIResponse{
		Success: false,
		Message: "Conflict",
		Error:   message,
	})
}
