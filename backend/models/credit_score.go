package models

import (
	"time"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// CreditScore stores a user's computed credit profile
type CreditScore struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID      primitive.ObjectID `bson:"userId"        json:"userId"`
	Score       int                `bson:"score"         json:"score"`
	Tier        string             `bson:"tier"          json:"tier"`   // poor | fair | good | excellent
	Factors     []CreditFactor     `bson:"factors"       json:"factors"`
	History     []CreditHistory    `bson:"history"       json:"history"`
	LastUpdated time.Time          `bson:"lastUpdated"   json:"lastUpdated"`
	CreatedAt   time.Time          `bson:"createdAt"     json:"createdAt"`
}

type CreditFactor struct {
	Label    string `bson:"label"    json:"label"`
	Score    int    `bson:"score"     json:"score"`
	MaxScore int    `bson:"maxScore"  json:"maxScore"`
	Status   string `bson:"status"   json:"status"`  // good | fair | poor
	Tip      string `bson:"tip"      json:"tip"`
}

type CreditHistory struct {
	Month string `bson:"month" json:"month"`
	Score int    `bson:"score" json:"score"`
}

// SimulateRequest for score-boost simulations
type SimulateRequest struct {
	Action string `json:"action" validate:"required"`
}
