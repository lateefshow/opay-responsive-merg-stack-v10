package config

import (
	"context"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var DB *mongo.Database
var MongoClient *mongo.Client

// ConnectDB establishes MongoDB connection and creates indexes
func ConnectDB() {
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	clientOpts := options.Client().ApplyURI(AppConfig.MongoURI)
	client, err := mongo.Connect(ctx, clientOpts)
	if err != nil {
		log.Fatalf("[db] Failed to connect: %v", err)
	}

	if err = client.Ping(ctx, nil); err != nil {
		log.Fatalf("[db] Ping failed: %v", err)
	}

	MongoClient = client
	DB = client.Database(AppConfig.MongoDB)
	log.Printf("[db] Connected to MongoDB: %s", AppConfig.MongoDB)

	createIndexes()
}

// DisconnectDB closes the MongoDB connection gracefully
func DisconnectDB() {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := MongoClient.Disconnect(ctx); err != nil {
		log.Printf("[db] Disconnect error: %v", err)
	}
}

// createIndexes sets up all collection indexes for performance + uniqueness
func createIndexes() {
	ctx := context.Background()

	// Users: unique email + phone
	userCol := DB.Collection("users")
	_, _ = userCol.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "email", Value: 1}},
			Options: options.Index().SetUnique(true),
		},
		{
			Keys:    bson.D{{Key: "phone", Value: 1}},
			Options: options.Index().SetUnique(true).SetSparse(true),
		},
		{
			Keys: bson.D{{Key: "referralCode", Value: 1}},
		},
	})

	// Cards: unique card number
	cardCol := DB.Collection("cards")
	_, _ = cardCol.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "cardNumber", Value: 1}},
			Options: options.Index().SetUnique(true),
		},
		{
			Keys: bson.D{{Key: "userId", Value: 1}},
		},
	})

	// Transactions: index on userId + createdAt for sorted queries
	txCol := DB.Collection("transactions")
	_, _ = txCol.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{
			Keys: bson.D{{Key: "userId", Value: 1}, {Key: "createdAt", Value: -1}},
		},
	})

	// Refresh token blacklist: TTL index
	tokenCol := DB.Collection("token_blacklist")
	ttlOpts := options.Index().SetExpireAfterSeconds(int32((7 * 24 * time.Hour).Seconds()))
	_, _ = tokenCol.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "expiresAt", Value: 1}},
		Options: ttlOpts,
	})

	log.Println("[db] Indexes created")
}
