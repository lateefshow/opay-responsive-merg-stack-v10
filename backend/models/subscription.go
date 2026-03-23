package models

import (
	"time"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type SubFrequency string
type SubStatus    string
const (
	SubMonthly   SubFrequency = "monthly"
	SubQuarterly SubFrequency = "quarterly"
	SubAnnual    SubFrequency = "annual"
	SubActive    SubStatus    = "active"
	SubPaused    SubStatus    = "paused"
	SubCancelled SubStatus    = "cancelled"
	SubTrial     SubStatus    = "trial"
)

type Subscription struct {
	ID              primitive.ObjectID `bson:"_id,omitempty"  json:"id"`
	UserID          primitive.ObjectID `bson:"userId"         json:"userId"`
	Name            string             `bson:"name"           json:"name"`
	Logo            string             `bson:"logo"           json:"logo"`
	Color           string             `bson:"color"          json:"color"`
	Category        string             `bson:"category"       json:"category"`
	Amount          float64            `bson:"amount"         json:"amount"`
	Currency        string             `bson:"currency"       json:"currency"`
	Frequency       SubFrequency       `bson:"frequency"      json:"frequency"`
	NextBillingDate time.Time          `bson:"nextBillingDate" json:"nextBillingDate"`
	Status          SubStatus          `bson:"status"         json:"status"`
	CardLast4       string             `bson:"cardLast4"      json:"cardLast4"`
	StartedAt       time.Time          `bson:"startedAt"      json:"startedAt"`
	TrialEndsAt     *time.Time         `bson:"trialEndsAt,omitempty" json:"trialEndsAt,omitempty"`
	CreatedAt       time.Time          `bson:"createdAt"      json:"createdAt"`
	UpdatedAt       time.Time          `bson:"updatedAt"      json:"updatedAt"`
}

type CreateSubscriptionRequest struct {
	Name      string       `json:"name"      validate:"required,min=2"`
	Logo      string       `json:"logo"      validate:"required"`
	Color     string       `json:"color"     validate:"required"`
	Category  string       `json:"category"  validate:"required"`
	Amount    float64      `json:"amount"    validate:"required,gt=0"`
	Frequency SubFrequency `json:"frequency" validate:"required,oneof=monthly quarterly annual"`
	CardLast4 string       `json:"cardLast4" validate:"required,len=4"`
}
