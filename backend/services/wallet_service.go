package services

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/opay/backend/config"
	"github.com/opay/backend/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// GetOrCreateWallet returns existing wallet or creates one for userId
func GetOrCreateWallet(userID primitive.ObjectID) (*models.Wallet, error) {
	col := config.DB.Collection("wallets")
	ctx := context.Background()

	var wallet models.Wallet
	err := col.FindOne(ctx, bson.M{"userId": userID}).Decode(&wallet)
	if err == mongo.ErrNoDocuments {
		// Create new wallet with zero balance
		wallet = models.Wallet{
			ID:        primitive.NewObjectID(),
			UserID:    userID,
			Balance:   0,
			Currency:  "NGN",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}
		_, err = col.InsertOne(ctx, wallet)
		if err != nil {
			return nil, err
		}
		return &wallet, nil
	}
	if err != nil {
		return nil, err
	}
	return &wallet, nil
}

// GetWalletBalance returns the current balance for a user
func GetWalletBalance(userID primitive.ObjectID) (float64, error) {
	wallet, err := GetOrCreateWallet(userID)
	if err != nil {
		return 0, err
	}
	return wallet.Balance, nil
}

// FundWallet adds funds to a user's wallet and records transaction
func FundWallet(userID primitive.ObjectID, amount float64) (*models.Transaction, error) {
	if amount <= 0 {
		return nil, errors.New("amount must be positive")
	}

	col := config.DB.Collection("wallets")
	ctx := context.Background()

	// Get current wallet
	wallet, err := GetOrCreateWallet(userID)
	if err != nil {
		return nil, err
	}

	balanceBefore := wallet.Balance
	balanceAfter := balanceBefore + amount

	// Update wallet balance atomically
	_, err = col.UpdateOne(ctx,
		bson.M{"userId": userID},
		bson.M{
			"$inc": bson.M{"balance": amount},
			"$set": bson.M{"updatedAt": time.Now()},
		},
		options.Update().SetUpsert(true),
	)
	if err != nil {
		return nil, err
	}

	// Record transaction
	tx := &models.Transaction{
		ID:            primitive.NewObjectID(),
		UserID:        userID,
		Type:          models.TxFund,
		Amount:        amount,
		Fee:           0,
		BalanceBefore: balanceBefore,
		BalanceAfter:  balanceAfter,
		Status:        models.TxStatusSuccess,
		Reference:     generateReference("FND"),
		Description:   fmt.Sprintf("Wallet funded with ₦%.2f", amount),
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	_, err = config.DB.Collection("transactions").InsertOne(ctx, tx)
	if err != nil {
		return nil, err
	}

	return tx, nil
}

// TransferFunds moves money between two OPay users
func TransferFunds(senderID primitive.ObjectID, recipientEmail string, amount float64, note string) (*models.Transaction, error) {
	if amount <= 0 {
		return nil, errors.New("amount must be positive")
	}

	ctx := context.Background()

	// Fetch recipient user
	var recipient models.User
	err := config.DB.Collection("users").FindOne(ctx, bson.M{"email": recipientEmail}).Decode(&recipient)
	if err == mongo.ErrNoDocuments {
		return nil, errors.New("recipient not found")
	}
	if err != nil {
		return nil, err
	}
	if recipient.ID == senderID {
		return nil, errors.New("cannot transfer to yourself")
	}

	// Check sender balance
	senderWallet, err := GetOrCreateWallet(senderID)
	if err != nil {
		return nil, err
	}
	if senderWallet.Balance < amount {
		return nil, errors.New("insufficient balance")
	}

	recipientWallet, err := GetOrCreateWallet(recipient.ID)
	if err != nil {
		return nil, err
	}

	walletCol := config.DB.Collection("wallets")
	senderBefore := senderWallet.Balance
	recipientBefore := recipientWallet.Balance
	ref := generateReference("TRF")

	// Debit sender
	_, err = walletCol.UpdateOne(ctx,
		bson.M{"userId": senderID},
		bson.M{
			"$inc": bson.M{"balance": -amount},
			"$set": bson.M{"updatedAt": time.Now()},
		},
	)
	if err != nil {
		return nil, err
	}

	// Credit recipient
	_, err = walletCol.UpdateOne(ctx,
		bson.M{"userId": recipient.ID},
		bson.M{
			"$inc": bson.M{"balance": amount},
			"$set": bson.M{"updatedAt": time.Now()},
		},
	)
	if err != nil {
		// Rollback sender debit on failure
		_, _ = walletCol.UpdateOne(ctx,
			bson.M{"userId": senderID},
			bson.M{"$inc": bson.M{"balance": amount}, "$set": bson.M{"updatedAt": time.Now()}},
		)
		return nil, err
	}

	txCol := config.DB.Collection("transactions")
	recipientFullName := recipient.FirstName + " " + recipient.LastName
	description := note
	if description == "" {
		description = fmt.Sprintf("Transfer to %s", recipientFullName)
	}

	// Sender debit record
	senderTx := &models.Transaction{
		ID:               primitive.NewObjectID(),
		UserID:           senderID,
		Type:             models.TxTransfer,
		Amount:           -amount,
		Fee:              0,
		BalanceBefore:    senderBefore,
		BalanceAfter:     senderBefore - amount,
		Status:           models.TxStatusSuccess,
		Reference:        ref,
		Description:      description,
		CounterpartyName: recipientFullName,
		CounterpartyID:   recipient.ID.Hex(),
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}
	_, _ = txCol.InsertOne(ctx, senderTx)

	// Recipient credit record
	var senderUser models.User
	_ = config.DB.Collection("users").FindOne(ctx, bson.M{"_id": senderID}).Decode(&senderUser)
	senderFullName := senderUser.FirstName + " " + senderUser.LastName

	recipientTx := &models.Transaction{
		ID:               primitive.NewObjectID(),
		UserID:           recipient.ID,
		Type:             models.TxReceive,
		Amount:           amount,
		Fee:              0,
		BalanceBefore:    recipientBefore,
		BalanceAfter:     recipientBefore + amount,
		Status:           models.TxStatusSuccess,
		Reference:        ref,
		Description:      fmt.Sprintf("Transfer from %s", senderFullName),
		CounterpartyName: senderFullName,
		CounterpartyID:   senderID.Hex(),
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}
	_, _ = txCol.InsertOne(ctx, recipientTx)

	return senderTx, nil
}

// GetTransactions returns paginated transactions for a user
func GetTransactions(userID primitive.ObjectID, page, limit int) ([]models.Transaction, int64, error) {
	col := config.DB.Collection("transactions")
	ctx := context.Background()

	filter := bson.M{"userId": userID}
	total, err := col.CountDocuments(ctx, filter)
	if err != nil {
		return nil, 0, err
	}

	skip := int64((page - 1) * limit)
	opts := options.Find().
		SetSort(bson.D{{Key: "createdAt", Value: -1}}).
		SetSkip(skip).
		SetLimit(int64(limit))

	cursor, err := col.Find(ctx, filter, opts)
	if err != nil {
		return nil, 0, err
	}
	defer cursor.Close(ctx)

	var txs []models.Transaction
	if err = cursor.All(ctx, &txs); err != nil {
		return nil, 0, err
	}
	// Always return empty slice, never nil — prevents JSON null in response
	if txs == nil {
		txs = []models.Transaction{}
	}
	return txs, total, nil
}

// generateReference creates a unique transaction reference
func generateReference(prefix string) string {
	id := uuid.New().String()
	return fmt.Sprintf("%s-%s", prefix, id[:8])
}
