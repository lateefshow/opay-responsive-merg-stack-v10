package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// CardType differentiates virtual and physical cards
type CardType string

const (
	CardVirtual  CardType = "virtual"
	CardPhysical CardType = "physical"
)

// CardStatus enumerates card lifecycle states
type CardStatus string

const (
	CardActive   CardStatus = "active"
	CardFrozen   CardStatus = "frozen"
	CardCanceled CardStatus = "canceled"
)

// Card represents an OPay payment card
type Card struct {
	ID         primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID     primitive.ObjectID `bson:"userId" json:"userId"`
	Type       CardType           `bson:"type" json:"type"`
	CardNumber string             `bson:"cardNumber" json:"cardNumber"` // masked on output
	CVV        string             `bson:"cvv" json:"-"`
	ExpiryMonth int               `bson:"expiryMonth" json:"expiryMonth"`
	ExpiryYear  int               `bson:"expiryYear" json:"expiryYear"`
	CardHolder  string             `bson:"cardHolder" json:"cardHolder"`
	Network     string             `bson:"network" json:"network"` // e.g. "Verve"
	Status      CardStatus         `bson:"status" json:"status"`
	Color       string             `bson:"color" json:"color"`
	CreatedAt   time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt   time.Time          `bson:"updatedAt" json:"updatedAt"`
}

// CardPublic masks sensitive fields for API responses
type CardPublic struct {
	ID           string     `json:"id"`
	Type         CardType   `json:"type"`
	MaskedNumber string     `json:"maskedNumber"`
	ExpiryMonth  int        `json:"expiryMonth"`
	ExpiryYear   int        `json:"expiryYear"`
	CardHolder   string     `json:"cardHolder"`
	Network      string     `json:"network"`
	Status       CardStatus `json:"status"`
	Color        string     `json:"color"`
	CreatedAt    time.Time  `json:"createdAt"`
}

// ToPublic converts Card to CardPublic with masked number
func (c *Card) ToPublic() CardPublic {
	masked := "****  ****  ****  " + c.CardNumber[len(c.CardNumber)-4:]
	return CardPublic{
		ID:           c.ID.Hex(),
		Type:         c.Type,
		MaskedNumber: masked,
		ExpiryMonth:  c.ExpiryMonth,
		ExpiryYear:   c.ExpiryYear,
		CardHolder:   c.CardHolder,
		Network:      c.Network,
		Status:       c.Status,
		Color:        c.Color,
		CreatedAt:    c.CreatedAt,
	}
}

// CreateCardRequest for card issuance endpoint
type CreateCardRequest struct {
	Type CardType `json:"type" validate:"required,oneof=virtual physical"`
}
