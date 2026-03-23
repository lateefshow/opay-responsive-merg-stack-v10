package models
import ("time";"go.mongodb.org/mongo-driver/bson/primitive")
type MerchantProfile struct {
  ID               primitive.ObjectID `bson:"_id,omitempty"     json:"id"`
  UserID           primitive.ObjectID `bson:"userId"            json:"userId"`
  BusinessName     string             `bson:"businessName"      json:"businessName"`
  Category         string             `bson:"category"          json:"category"`
  Description      string             `bson:"description"       json:"description"`
  QRCode           string             `bson:"qrCode"            json:"qrCode"`
  AccountNumber    string             `bson:"accountNumber"     json:"accountNumber"`
  TotalReceived    float64            `bson:"totalReceived"     json:"totalReceived"`
  TotalTransactions int               `bson:"totalTransactions" json:"totalTransactions"`
  IsVerified       bool               `bson:"isVerified"        json:"isVerified"`
  CreatedAt        time.Time          `bson:"createdAt"         json:"createdAt"`
  UpdatedAt        time.Time          `bson:"updatedAt"         json:"updatedAt"`
}
type MerchantTransaction struct {
  ID           primitive.ObjectID `bson:"_id,omitempty" json:"id"`
  MerchantID   primitive.ObjectID `bson:"merchantId"    json:"merchantId"`
  UserID       primitive.ObjectID `bson:"userId"        json:"userId"`
  Amount       float64            `bson:"amount"        json:"amount"`
  Fee          float64            `bson:"fee"           json:"fee"`
  NetAmount    float64            `bson:"netAmount"     json:"netAmount"`
  CustomerName string             `bson:"customerName"  json:"customerName"`
  Reference    string             `bson:"reference"     json:"reference"`
  Status       string             `bson:"status"        json:"status"`
  CreatedAt    time.Time          `bson:"createdAt"     json:"createdAt"`
}
type CreateMerchantRequest struct {
  BusinessName string `json:"businessName" validate:"required,min=3"`
  Category     string `json:"category"     validate:"required"`
  Description  string `json:"description"  validate:"required,min=10"`
}
type MerchantPaymentRequest struct {
  Amount      float64 `json:"amount"      validate:"required,gt=0"`
  Description string  `json:"description" validate:"required"`
}
