// backend/models/airtime.go
package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type AirtimeNetwork string

const (
	NetworkMTN     AirtimeNetwork = "MTN"
	NetworkAirtel  AirtimeNetwork = "Airtel"
	NetworkGlo     AirtimeNetwork = "Glo"
	Network9mobile AirtimeNetwork = "9mobile"
)

type AirtimePurchase struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID    primitive.ObjectID `bson:"userId"        json:"userId"`
	Network   AirtimeNetwork     `bson:"network"       json:"network"`
	Phone     string             `bson:"phone"         json:"phone"`
	Amount    float64            `bson:"amount"        json:"amount"`
	PlanType  string             `bson:"planType"      json:"planType"` // airtime | data
	DataPlan  string             `bson:"dataPlan,omitempty" json:"dataPlan,omitempty"`
	Reference string             `bson:"reference"     json:"reference"`

	// ✅ FIX: Add Token field (optional)
	Token     string             `bson:"token,omitempty" json:"token,omitempty"`

	Status    string             `bson:"status"        json:"status"`
	CreatedAt time.Time          `bson:"createdAt"     json:"createdAt"`
}

type BuyAirtimeRequest struct {
	Network  string  `json:"network"  validate:"required,oneof=MTN Airtel Glo 9mobile"`
	Phone    string  `json:"phone"    validate:"required,min=10,max=14"`
	Amount   float64 `json:"amount"   validate:"required,gt=0"`
	PlanType string  `json:"planType" validate:"required,oneof=airtime data"`
	DataPlan string  `json:"dataPlan"`
}