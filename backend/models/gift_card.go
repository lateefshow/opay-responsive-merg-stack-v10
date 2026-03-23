package models

import (
	"time"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type GiftCardStatus string
const (
	GiftCardActive  GiftCardStatus = "active"
	GiftCardUsed    GiftCardStatus = "used"
	GiftCardExpired GiftCardStatus = "expired"
)

type GiftCard struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID      primitive.ObjectID `bson:"userId"        json:"userId"`
	Brand       string             `bson:"brand"         json:"brand"`
	Logo        string             `bson:"logo"          json:"logo"`
	Color       string             `bson:"color"         json:"color"`
	Amount      float64            `bson:"amount"        json:"amount"`
	Balance     float64            `bson:"balance"       json:"balance"`
	Code        string             `bson:"code"          json:"code"`
	Pin         string             `bson:"pin"           json:"pin"`
	Status      GiftCardStatus     `bson:"status"        json:"status"`
	ExpiryDate  time.Time          `bson:"expiryDate"    json:"expiryDate"`
	PurchasedAt time.Time          `bson:"purchasedAt"   json:"purchasedAt"`
}

type PurchaseGiftCardRequest struct {
	Brand       string  `json:"brand"       validate:"required"`
	Logo        string  `json:"logo"        validate:"required"`
	Color       string  `json:"color"       validate:"required"`
	Amount      float64 `json:"amount"      validate:"required,gt=0"`
}

type UseGiftCardRequest struct {
	Amount float64 `json:"amount" validate:"required,gt=0"`
}
