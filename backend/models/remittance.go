package models

import (
	"time"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type RemittanceStatus string
const (
	RemittancePending    RemittanceStatus = "pending"
	RemittanceProcessing RemittanceStatus = "processing"
	RemittanceDelivered  RemittanceStatus = "delivered"
	RemittanceFailed     RemittanceStatus = "failed"
	RemittanceCancelled  RemittanceStatus = "cancelled"
)

type RemittanceRecipient struct {
	ID            primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	OwnerID       primitive.ObjectID `bson:"ownerId"       json:"ownerId"`
	Name          string             `bson:"name"          json:"name"`
	Country       string             `bson:"country"       json:"country"`
	Flag          string             `bson:"flag"          json:"flag"`
	Bank          string             `bson:"bank"          json:"bank"`
	AccountNumber string             `bson:"accountNumber" json:"accountNumber"`
	Currency      string             `bson:"currency"      json:"currency"`
	IsFavorite    bool               `bson:"isFavorite"    json:"isFavorite"`
	CreatedAt     time.Time          `bson:"createdAt"     json:"createdAt"`
}

type RemittanceTransaction struct {
	ID              primitive.ObjectID `bson:"_id,omitempty"  json:"id"`
	UserID          primitive.ObjectID `bson:"userId"         json:"userId"`
	RecipientID     primitive.ObjectID `bson:"recipientId"    json:"recipientId"`
	RecipientName   string             `bson:"recipientName"  json:"recipientName"`
	Country         string             `bson:"country"        json:"country"`
	Flag            string             `bson:"flag"           json:"flag"`
	SendAmount      float64            `bson:"sendAmount"     json:"sendAmount"`
	ReceiveAmount   float64            `bson:"receiveAmount"  json:"receiveAmount"`
	SendCurrency    string             `bson:"sendCurrency"   json:"sendCurrency"`
	ReceiveCurrency string             `bson:"receiveCurrency" json:"receiveCurrency"`
	Rate            float64            `bson:"rate"           json:"rate"`
	Fee             float64            `bson:"fee"            json:"fee"`
	Status          RemittanceStatus   `bson:"status"         json:"status"`
	Reference       string             `bson:"reference"      json:"reference"`
	EstimatedArrival time.Time         `bson:"estimatedArrival" json:"estimatedArrival"`
	CreatedAt       time.Time          `bson:"createdAt"      json:"createdAt"`
}

type CreateRemittanceRequest struct {
	RecipientID string  `json:"recipientId"    validate:"required"`
	SendAmount  float64 `json:"sendAmount"     validate:"required,gt=0"`
	Currency    string  `json:"currency"       validate:"required,len=3"`
}

type CreateRecipientRequest struct {
	Name          string `json:"name"          validate:"required,min=2"`
	Country       string `json:"country"       validate:"required"`
	Flag          string `json:"flag"          validate:"required"`
	Bank          string `json:"bank"          validate:"required"`
	AccountNumber string `json:"accountNumber" validate:"required"`
	Currency      string `json:"currency"      validate:"required,len=3"`
}
