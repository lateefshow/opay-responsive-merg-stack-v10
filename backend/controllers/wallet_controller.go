package controllers

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/opay/backend/models"
	"github.com/opay/backend/services"
	"github.com/opay/backend/utils"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// GetBalance handles GET /api/wallet/balance
func GetBalance(c *fiber.Ctx) error {
	userID, err := getUserID(c)
	if err != nil {
		return utils.Unauthorized(c, "invalid session")
	}

	balance, err := services.GetWalletBalance(userID)
	if err != nil {
		return utils.InternalError(c, "failed to fetch balance")
	}

	return utils.OK(c, "balance fetched", fiber.Map{
		"balance":  balance,
		"currency": "NGN",
	})
}

// FundWallet handles POST /api/wallet/fund
func FundWallet(c *fiber.Ctx) error {
	userID, err := getUserID(c)
	if err != nil {
		return utils.Unauthorized(c, "invalid session")
	}

	var req models.FundWalletRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.BadRequest(c, "invalid request body")
	}
	if err := validate.Struct(req); err != nil {
		return utils.BadRequest(c, err.Error())
	}

	tx, err := services.FundWallet(userID, req.Amount)
	if err != nil {
		return utils.InternalError(c, err.Error())
	}

	newBalance, _ := services.GetWalletBalance(userID)

	return utils.OK(c, "wallet funded successfully", fiber.Map{
		"transaction": tx,
		"newBalance":  newBalance,
	})
}

// TransferToOpay handles POST /api/wallet/transfer/opay
func TransferToOpay(c *fiber.Ctx) error {
	userID, err := getUserID(c)
	if err != nil {
		return utils.Unauthorized(c, "invalid session")
	}

	var req models.TransferRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.BadRequest(c, "invalid request body")
	}
	if err := validate.Struct(req); err != nil {
		return utils.BadRequest(c, err.Error())
	}

	tx, err := services.TransferFunds(userID, req.RecipientEmail, req.Amount, req.Note)
	if err != nil {
		return utils.BadRequest(c, err.Error())
	}

	newBalance, _ := services.GetWalletBalance(userID)

	return utils.OK(c, "transfer successful", fiber.Map{
		"transaction": tx,
		"newBalance":  newBalance,
	})
}

// GetTransactions handles GET /api/wallet/transactions
func GetTransactions(c *fiber.Ctx) error {
	userID, err := getUserID(c)
	if err != nil {
		return utils.Unauthorized(c, "invalid session")
	}

	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "20"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	txs, total, err := services.GetTransactions(userID, page, limit)
	if err != nil {
		return utils.InternalError(c, "failed to fetch transactions")
	}

	// Always return empty slice not null
	if txs == nil {
		txs = []models.Transaction{}
	}
	return utils.OK(c, "transactions fetched", fiber.Map{
		"transactions": txs,
		"total":        total,
		"page":         page,
		"limit":        limit,
		"pages":        (total + int64(limit) - 1) / int64(limit),
	})
}

// getUserID is a helper to extract the ObjectID from Locals
func getUserID(c *fiber.Ctx) (primitive.ObjectID, error) {
	userIDStr := c.Locals("userId").(string)
	return primitive.ObjectIDFromHex(userIDStr)
}
