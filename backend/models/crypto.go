package models
import ("time";"go.mongodb.org/mongo-driver/bson/primitive")
type CryptoTxType string
const (CryptoBuy CryptoTxType="buy";CryptoSell CryptoTxType="sell";CryptoConvert CryptoTxType="convert";CryptoReceive CryptoTxType="receive";CryptoSend CryptoTxType="send_crypto")
type CryptoWallet struct {
  ID        primitive.ObjectID     `bson:"_id,omitempty" json:"id"`
  UserID    primitive.ObjectID     `bson:"userId"        json:"userId"`
  Balances  map[string]float64     `bson:"balances"      json:"balances"`
  UpdatedAt time.Time              `bson:"updatedAt"     json:"updatedAt"`
}
type CryptoTransaction struct {
  ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
  UserID      primitive.ObjectID `bson:"userId"        json:"userId"`
  Type        CryptoTxType       `bson:"type"          json:"type"`
  Symbol      string             `bson:"symbol"        json:"symbol"`
  Amount      float64            `bson:"amount"        json:"amount"`
  NGNValue    float64            `bson:"ngnValue"      json:"ngnValue"`
  Price       float64            `bson:"price"         json:"price"`
  Fee         float64            `bson:"fee"           json:"fee"`
  Reference   string             `bson:"reference"     json:"reference"`
  CreatedAt   time.Time          `bson:"createdAt"     json:"createdAt"`
}
type BuyCryptoRequest struct {
  Symbol string  `json:"symbol" validate:"required"`
  Amount float64 `json:"amount" validate:"required,gt=0"` // NGN amount to spend
}
type SellCryptoRequest struct {
  Symbol   string  `json:"symbol"   validate:"required"`
  Quantity float64 `json:"quantity" validate:"required,gt=0"`
}
type ConvertCryptoRequest struct {
  FromSymbol string  `json:"fromSymbol" validate:"required"`
  ToSymbol   string  `json:"toSymbol"   validate:"required"`
  Quantity   float64 `json:"quantity"   validate:"required,gt=0"`
}
