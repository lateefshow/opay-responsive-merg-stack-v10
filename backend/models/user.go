package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// User represents a registered OPay user
type User struct {
	ID           primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	FirstName    string             `bson:"firstName" json:"firstName" validate:"required,min=2,max=50"`
	LastName     string             `bson:"lastName" json:"lastName" validate:"required,min=2,max=50"`
	Email        string             `bson:"email" json:"email" validate:"required,email"`
	Phone        string             `bson:"phone" json:"phone,omitempty" validate:"omitempty,min=10,max=15"`
	PasswordHash string             `bson:"passwordHash" json:"-"`
	AvatarURL    string             `bson:"avatarUrl" json:"avatarUrl,omitempty"`
	ReferralCode string             `bson:"referralCode" json:"referralCode"`
	ReferredBy   string             `bson:"referredBy" json:"referredBy,omitempty"`
	IsVerified   bool               `bson:"isVerified" json:"isVerified"`
	IsActive     bool               `bson:"isActive" json:"isActive"`
	CreatedAt    time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt    time.Time          `bson:"updatedAt" json:"updatedAt"`
}

// UserPublic is the safe-to-expose user representation
type UserPublic struct {
	ID           string    `json:"id"`
	FirstName    string    `json:"firstName"`
	LastName     string    `json:"lastName"`
	Email        string    `json:"email"`
	Phone        string    `json:"phone,omitempty"`
	AvatarURL    string    `json:"avatarUrl,omitempty"`
	ReferralCode string    `json:"referralCode"`
	IsVerified   bool      `json:"isVerified"`
	CreatedAt    time.Time `json:"createdAt"`
}

// ToPublic converts a User to UserPublic
func (u *User) ToPublic() UserPublic {
	return UserPublic{
		ID:           u.ID.Hex(),
		FirstName:    u.FirstName,
		LastName:     u.LastName,
		Email:        u.Email,
		Phone:        u.Phone,
		AvatarURL:    u.AvatarURL,
		ReferralCode: u.ReferralCode,
		IsVerified:   u.IsVerified,
		CreatedAt:    u.CreatedAt,
	}
}

// RegisterRequest is the body for POST /auth/register
type RegisterRequest struct {
	FirstName   string `json:"firstName" validate:"required,min=2,max=50"`
	LastName    string `json:"lastName" validate:"required,min=2,max=50"`
	Email       string `json:"email" validate:"required,email"`
	Phone       string `json:"phone" validate:"omitempty,min=10,max=15"`
	Password    string `json:"password" validate:"required,min=8,max=72"`
	ReferredBy  string `json:"referredBy,omitempty"`
}

// LoginRequest is the body for POST /auth/login
type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}
