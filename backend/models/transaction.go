package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// TransactionType enumerates transaction kinds
type TransactionType string

const (
	TxFund       TransactionType = "fund"
	TxTransfer   TransactionType = "transfer"
	TxWithdraw   TransactionType = "withdraw"
	TxReceive    TransactionType = "receive"
	TxReferral   TransactionType = "referral"
)

// TransactionStatus enumerates possible states
type TransactionStatus string

const (
	TxStatusPending   TransactionStatus = "pending"
	TxStatusSuccess   TransactionStatus = "success"
	TxStatusFailed    TransactionStatus = "failed"
)

// Transaction is a ledger entry
type Transaction struct {
	ID              primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID          primitive.ObjectID `bson:"userId" json:"userId"`
	Type            TransactionType    `bson:"type" json:"type"`
	Amount          float64            `bson:"amount" json:"amount"`
	Fee             float64            `bson:"fee" json:"fee"`
	BalanceBefore   float64            `bson:"balanceBefore" json:"balanceBefore"`
	BalanceAfter    float64            `bson:"balanceAfter" json:"balanceAfter"`
	Status          TransactionStatus  `bson:"status" json:"status"`
	Reference       string             `bson:"reference" json:"reference"`
	Description     string             `bson:"description" json:"description"`
	CounterpartyName string            `bson:"counterpartyName" json:"counterpartyName,omitempty"`
	CounterpartyID  string             `bson:"counterpartyId" json:"counterpartyId,omitempty"`
	Metadata        map[string]string  `bson:"metadata" json:"metadata,omitempty"`
	CreatedAt       time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt       time.Time          `bson:"updatedAt" json:"updatedAt"`
}
