package models

import (
	"time"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type LoanStatus string

const (
	LoanPending   LoanStatus = "pending"
	LoanApproved  LoanStatus = "approved"
	LoanActive    LoanStatus = "active"
	LoanRepaid    LoanStatus = "repaid"
	LoanOverdue   LoanStatus = "overdue"
	LoanRejected  LoanStatus = "rejected"
)

type Loan struct {
	ID               primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID           primitive.ObjectID `bson:"userId"        json:"userId"`
	ProductID        string             `bson:"productId"     json:"productId"`
	Amount           float64            `bson:"amount"        json:"amount"`
	Tenure           int                `bson:"tenure"        json:"tenure"`
	InterestRate     float64            `bson:"interestRate"  json:"interestRate"`
	MonthlyRepayment float64            `bson:"monthlyRepayment" json:"monthlyRepayment"`
	TotalRepayment   float64            `bson:"totalRepayment" json:"totalRepayment"`
	InterestAmount   float64            `bson:"interestAmount" json:"interestAmount"`
	Purpose          string             `bson:"purpose"       json:"purpose"`
	Status           LoanStatus         `bson:"status"        json:"status"`
	DisbursedAt      *time.Time         `bson:"disbursedAt"   json:"disbursedAt,omitempty"`
	DueDate          *time.Time         `bson:"dueDate"       json:"dueDate,omitempty"`
	CreatedAt        time.Time          `bson:"createdAt"     json:"createdAt"`
	UpdatedAt        time.Time          `bson:"updatedAt"     json:"updatedAt"`
}

type ApplyLoanRequest struct {
	ProductID string  `json:"productId" validate:"required"`
	Amount    float64 `json:"amount"    validate:"required,gt=0"`
	Tenure    int     `json:"tenure"    validate:"required,gt=0"`
	Purpose   string  `json:"purpose"   validate:"required,min=10"`
}
