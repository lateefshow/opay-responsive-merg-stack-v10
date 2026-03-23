package models
import ("time";"go.mongodb.org/mongo-driver/bson/primitive")
type WireStatus string
const (WirePending WireStatus="pending";WireProcessing WireStatus="processing";WireCompleted WireStatus="completed";WireFailed WireStatus="failed";WireCancelled WireStatus="cancelled")
type BankAccount struct {
  ID            primitive.ObjectID `bson:"_id,omitempty" json:"id"`
  UserID        primitive.ObjectID `bson:"userId"        json:"userId"`
  BankName      string             `bson:"bankName"      json:"bankName"`
  BankCode      string             `bson:"bankCode"      json:"bankCode"`
  AccountNumber string             `bson:"accountNumber" json:"accountNumber"`
  AccountName   string             `bson:"accountName"   json:"accountName"`
  IsDefault     bool               `bson:"isDefault"     json:"isDefault"`
  CreatedAt     time.Time          `bson:"createdAt"     json:"createdAt"`
}
type WireTransfer struct {
  ID            primitive.ObjectID `bson:"_id,omitempty" json:"id"`
  UserID        primitive.ObjectID `bson:"userId"        json:"userId"`
  BankName      string             `bson:"bankName"      json:"bankName"`
  AccountNumber string             `bson:"accountNumber" json:"accountNumber"`
  AccountName   string             `bson:"accountName"   json:"accountName"`
  Amount        float64            `bson:"amount"        json:"amount"`
  Fee           float64            `bson:"fee"           json:"fee"`
  Narration     string             `bson:"narration"     json:"narration"`
  Reference     string             `bson:"reference"     json:"reference"`
  Status        WireStatus         `bson:"status"        json:"status"`
  CreatedAt     time.Time          `bson:"createdAt"     json:"createdAt"`
}
type AddBankRequest struct {
  BankName      string `json:"bankName"      validate:"required"`
  BankCode      string `json:"bankCode"      validate:"required,len=3"`
  AccountNumber string `json:"accountNumber" validate:"required,len=10"`
  AccountName   string `json:"accountName"   validate:"required,min=3"`
}
type WireTransferRequest struct {
  BankCode      string  `json:"bankCode"      validate:"required"`
  AccountNumber string  `json:"accountNumber" validate:"required,len=10"`
  AccountName   string  `json:"accountName"   validate:"required"`
  BankName      string  `json:"bankName"      validate:"required"`
  Amount        float64 `json:"amount"        validate:"required,gt=0"`
  Narration     string  `json:"narration"     validate:"omitempty,max=200"`
}
