package models

import (
	"time"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type SplitStatus string
const (
	SplitPending   SplitStatus = "pending"
	SplitPartial   SplitStatus = "partial"
	SplitComplete  SplitStatus = "complete"
	SplitCancelled SplitStatus = "cancelled"
)

type SplitParticipant struct {
	UserID      string     `bson:"userId"      json:"userId"`
	Name        string     `bson:"name"        json:"name"`
	Email       string     `bson:"email"       json:"email"`
	AvatarColor string     `bson:"avatarColor" json:"avatarColor"`
	Initials    string     `bson:"initials"    json:"initials"`
	Amount      float64    `bson:"amount"      json:"amount"`
	Paid        bool       `bson:"paid"        json:"paid"`
	PaidAt      *time.Time `bson:"paidAt,omitempty" json:"paidAt,omitempty"`
}

type SplitRequest struct {
	ID           primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	CreatorID    primitive.ObjectID `bson:"creatorId"     json:"creatorId"`
	Title        string             `bson:"title"         json:"title"`
	Description  string             `bson:"description"   json:"description"`
	TotalAmount  float64            `bson:"totalAmount"   json:"totalAmount"`
	CreatedBy    string             `bson:"createdBy"     json:"createdBy"`
	Participants []SplitParticipant `bson:"participants"  json:"participants"`
	Status       SplitStatus        `bson:"status"        json:"status"`
	CreatedAt    time.Time          `bson:"createdAt"     json:"createdAt"`
	UpdatedAt    time.Time          `bson:"updatedAt"     json:"updatedAt"`
}

type CreateSplitRequest struct {
	Title        string             `json:"title"        validate:"required,min=3"`
	Description  string             `json:"description"  validate:"required,min=5"`
	TotalAmount  float64            `json:"totalAmount"  validate:"required,gt=0"`
	Participants []SplitParticipant `json:"participants" validate:"required,min=1"`
}

type MarkPaidRequest struct {
	UserID string `json:"userId" validate:"required"`
}
