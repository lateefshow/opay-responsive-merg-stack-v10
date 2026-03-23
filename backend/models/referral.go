package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Referral tracks each referral relationship and bonus
type Referral struct {
	ID           primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	ReferrerID   primitive.ObjectID `bson:"referrerId" json:"referrerId"`
	RefereeID    primitive.ObjectID `bson:"refereeId" json:"refereeId"`
	RefereeName  string             `bson:"refereeName" json:"refereeName"`
	BonusAmount  float64            `bson:"bonusAmount" json:"bonusAmount"`
	Status       string             `bson:"status" json:"status"` // pending | paid
	CreatedAt    time.Time          `bson:"createdAt" json:"createdAt"`
}
