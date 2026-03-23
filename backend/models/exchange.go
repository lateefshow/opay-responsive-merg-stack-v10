package models
import ("time";"go.mongodb.org/mongo-driver/bson/primitive")
type ExchangeTransaction struct {
  ID           primitive.ObjectID `bson:"_id,omitempty" json:"id"`
  UserID       primitive.ObjectID `bson:"userId"        json:"userId"`
  FromCurrency string             `bson:"fromCurrency"  json:"fromCurrency"`
  ToCurrency   string             `bson:"toCurrency"    json:"toCurrency"`
  FromAmount   float64            `bson:"fromAmount"    json:"fromAmount"`
  ToAmount     float64            `bson:"toAmount"      json:"toAmount"`
  Rate         float64            `bson:"rate"          json:"rate"`
  Fee          float64            `bson:"fee"           json:"fee"`
  Status       string             `bson:"status"        json:"status"`
  Reference    string             `bson:"reference"     json:"reference"`
  CreatedAt    time.Time          `bson:"createdAt"     json:"createdAt"`
}
type ExchangeRequest struct {
  FromCurrency string  `json:"fromCurrency" validate:"required,len=3"`
  ToCurrency   string  `json:"toCurrency"   validate:"required,len=3"`
  Amount       float64 `json:"amount"       validate:"required,gt=0"`
}
