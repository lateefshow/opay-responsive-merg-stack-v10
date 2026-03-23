package models
import ("time";"go.mongodb.org/mongo-driver/bson/primitive")
type PaymentLinkStatus string
const (LinkActive   PaymentLinkStatus="active";LinkInactive PaymentLinkStatus="inactive";LinkExpired PaymentLinkStatus="expired")
type PaymentLink struct {
  ID           primitive.ObjectID `bson:"_id,omitempty" json:"id"`
  UserID       primitive.ObjectID `bson:"userId"        json:"userId"`
  Title        string             `bson:"title"         json:"title"`
  Description  string             `bson:"description"   json:"description"`
  Amount       float64            `bson:"amount"        json:"amount"`
  IsFixedAmount bool              `bson:"isFixedAmount" json:"isFixedAmount"`
  Slug         string             `bson:"slug"          json:"slug"`
  URL          string             `bson:"url"           json:"url"`
  Status       PaymentLinkStatus  `bson:"status"        json:"status"`
  ExpiresAt    *time.Time         `bson:"expiresAt,omitempty" json:"expiresAt,omitempty"`
  TotalCollected float64          `bson:"totalCollected" json:"totalCollected"`
  PaymentCount  int               `bson:"paymentCount"  json:"paymentCount"`
  CreatedAt    time.Time          `bson:"createdAt"     json:"createdAt"`
}
type PaymentLinkPayment struct {
  ID            primitive.ObjectID `bson:"_id,omitempty" json:"id"`
  LinkID        primitive.ObjectID `bson:"linkId"        json:"linkId"`
  PayerName     string             `bson:"payerName"     json:"payerName"`
  PayerEmail    string             `bson:"payerEmail"    json:"payerEmail"`
  Amount        float64            `bson:"amount"        json:"amount"`
  Reference     string             `bson:"reference"     json:"reference"`
  CreatedAt     time.Time          `bson:"createdAt"     json:"createdAt"`
}
type CreatePaymentLinkRequest struct {
  Title         string     `json:"title"         validate:"required,min=3"`
  Description   string     `json:"description"   validate:"omitempty,max=200"`
  Amount        float64    `json:"amount"        validate:"min=0"`
  IsFixedAmount bool       `json:"isFixedAmount"`
  ExpiresAt     *time.Time `json:"expiresAt"`
}
