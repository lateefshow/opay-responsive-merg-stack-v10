package models
import ("time";"go.mongodb.org/mongo-driver/bson/primitive")
type BillCategory string
const (BillElectricity BillCategory="electricity";BillCableTV BillCategory="cable_tv";BillInternet BillCategory="internet";BillWater BillCategory="water";BillBetting BillCategory="betting")
type BillPayment struct {
  ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
  UserID      primitive.ObjectID `bson:"userId"        json:"userId"`
  Category    BillCategory       `bson:"category"      json:"category"`
  Provider    string             `bson:"provider"      json:"provider"`
  AccountNum  string             `bson:"accountNum"    json:"accountNum"`
  AccountName string             `bson:"accountName"   json:"accountName,omitempty"`
  Amount      float64            `bson:"amount"        json:"amount"`
  Token       string             `bson:"token"         json:"token,omitempty"`
  Reference   string             `bson:"reference"     json:"reference"`
  Status      string             `bson:"status"        json:"status"`
  CreatedAt   time.Time          `bson:"createdAt"     json:"createdAt"`
}
type PayBillRequest struct {
  Category   string  `json:"category"   validate:"required"`
  Provider   string  `json:"provider"   validate:"required"`
  AccountNum string  `json:"accountNum" validate:"required"`
  Amount     float64 `json:"amount"     validate:"required,gt=0"`
}
