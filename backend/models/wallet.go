package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Wallet holds the user's balance
type Wallet struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID    primitive.ObjectID `bson:"userId" json:"userId"`
	Balance   float64            `bson:"balance" json:"balance"`
	Currency  string             `bson:"currency" json:"currency"`
	CreatedAt time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt time.Time          `bson:"updatedAt" json:"updatedAt"`
}

// FundWalletRequest for adding money to wallet
type FundWalletRequest struct {
	Amount float64 `json:"amount" validate:"required,gt=0,lte=10000000"`
}

// TransferRequest for peer-to-peer transfers
type TransferRequest struct {
	RecipientEmail string  `json:"recipientEmail" validate:"required,email"`
	Amount         float64 `json:"amount" validate:"required,gt=0"`
	Note           string  `json:"note" validate:"omitempty,max=200"`
}

// BankTransferRequest for bank withdrawals
type BankTransferRequest struct {
	BankCode      string  `json:"bankCode" validate:"required"`
	AccountNumber string  `json:"accountNumber" validate:"required,len=10"`
	Amount        float64 `json:"amount" validate:"required,gt=0"`
	Note          string  `json:"note" validate:"omitempty,max=200"`
}
