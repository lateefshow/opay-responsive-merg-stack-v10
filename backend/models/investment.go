package models

import (
	"time"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type InvestmentType   string
type InvestmentStatus string

const (
	InvMoneyMarket  InvestmentType = "money_market"
	InvTreasuryBill InvestmentType = "treasury_bill"
	InvFixedIncome  InvestmentType = "fixed_income"
	InvMutualFund   InvestmentType = "mutual_fund"
	InvActive       InvestmentStatus = "active"
	InvMatured      InvestmentStatus = "matured"
	InvLiquidated   InvestmentStatus = "liquidated"
)

type Investment struct {
	ID              primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID          primitive.ObjectID `bson:"userId"        json:"userId"`
	Name            string             `bson:"name"          json:"name"`
	Type            InvestmentType     `bson:"type"          json:"type"`
	PrincipalAmount float64            `bson:"principalAmount" json:"principalAmount"`
	CurrentValue    float64            `bson:"currentValue"  json:"currentValue"`
	ReturnRate      float64            `bson:"returnRate"    json:"returnRate"`
	ReturnAmount    float64            `bson:"returnAmount"  json:"returnAmount"`
	Tenure          int                `bson:"tenure"        json:"tenure"`
	TenureUnit      string             `bson:"tenureUnit"    json:"tenureUnit"`
	MaturityDate    time.Time          `bson:"maturityDate"  json:"maturityDate"`
	Status          InvestmentStatus   `bson:"status"        json:"status"`
	CreatedAt       time.Time          `bson:"createdAt"     json:"createdAt"`
	UpdatedAt       time.Time          `bson:"updatedAt"     json:"updatedAt"`
}

type CreateInvestmentRequest struct {
	Type    InvestmentType `json:"type"    validate:"required"`
	Amount  float64        `json:"amount"  validate:"required,gt=4999"`
	Tenure  int            `json:"tenure"  validate:"required,gt=0"`
}
