package services

import (
	"context"
	"crypto/rand"
	"fmt"
	"math/big"
	"time"

	"github.com/opay/backend/config"
	"github.com/opay/backend/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

// CreateVirtualCard issues a new virtual card for a user
func CreateVirtualCard(userID primitive.ObjectID, cardHolderName string) (*models.Card, error) {
	ctx := context.Background()
	col := config.DB.Collection("cards")

	// Check if user already has an active virtual card
	existing := col.FindOne(ctx, bson.M{
		"userId": userID,
		"type":   models.CardVirtual,
		"status": models.CardActive,
	})
	if existing.Err() == nil {
		// Already has a card — return it
		var card models.Card
		_ = existing.Decode(&card)
		return &card, nil
	}
	if existing.Err() != mongo.ErrNoDocuments {
		return nil, existing.Err()
	}

	// Generate unique card number
	cardNumber, err := generateUniqueCardNumber(ctx, col)
	if err != nil {
		return nil, err
	}

	cvv, err := generateCVV()
	if err != nil {
		return nil, err
	}

	now := time.Now()
	expiryYear := now.Year() + 4

	card := &models.Card{
		ID:          primitive.NewObjectID(),
		UserID:      userID,
		Type:        models.CardVirtual,
		CardNumber:  cardNumber,
		CVV:         cvv,
		ExpiryMonth: int(now.Month()),
		ExpiryYear:  expiryYear,
		CardHolder:  cardHolderName,
		Network:     "Verve",
		Status:      models.CardActive,
		Color:       "#16a34a",
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	_, err = col.InsertOne(ctx, card)
	if err != nil {
		return nil, err
	}
	return card, nil
}

// GetUserCards returns all cards for a user
func GetUserCards(userID primitive.ObjectID) ([]models.CardPublic, error) {
	ctx := context.Background()
	col := config.DB.Collection("cards")

	cursor, err := col.Find(ctx, bson.M{"userId": userID})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var cards []models.Card
	if err = cursor.All(ctx, &cards); err != nil {
		return nil, err
	}

	result := make([]models.CardPublic, len(cards))
	for i, c := range cards {
		result[i] = c.ToPublic()
	}
	return result, nil
}

// generateUniqueCardNumber creates a Luhn-valid 16-digit card number
func generateUniqueCardNumber(ctx context.Context, col *mongo.Collection) (string, error) {
	for attempts := 0; attempts < 10; attempts++ {
		num := generateCardNumber()
		count, _ := col.CountDocuments(ctx, bson.M{"cardNumber": num})
		if count == 0 {
			return num, nil
		}
	}
	return "", fmt.Errorf("could not generate unique card number")
}

func generateCardNumber() string {
	prefix := "5061" // Verve-style prefix
	var digits [16]byte
	prefix_bytes := []byte(prefix)
	for i, b := range prefix_bytes {
		digits[i] = b - '0'
	}
	for i := 4; i < 15; i++ {
		n, _ := rand.Int(rand.Reader, big.NewInt(10))
		digits[i] = byte(n.Int64())
	}

	// Luhn check digit
	sum := 0
	for i := 0; i < 15; i++ {
		d := int(digits[i])
		if i%2 == 0 {
			d *= 2
			if d > 9 {
				d -= 9
			}
		}
		sum += d
	}
	checkDigit := (10 - (sum % 10)) % 10
	digits[15] = byte(checkDigit)

	result := ""
	for _, d := range digits {
		result += fmt.Sprintf("%d", d)
	}
	return result
}

func generateCVV() (string, error) {
	n, err := rand.Int(rand.Reader, big.NewInt(900))
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%03d", n.Int64()+100), nil
}
