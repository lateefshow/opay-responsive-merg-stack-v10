package models
import ("time";"go.mongodb.org/mongo-driver/bson/primitive")
type BNPLStatus string
const (BNPLActive BNPLStatus="active";BNPLCompleted BNPLStatus="completed";BNPLOverdue BNPLStatus="overdue";BNPLCancelled BNPLStatus="cancelled")
type BNPLInstallment struct {
  Number   int        `bson:"number"          json:"number"`
  Amount   float64    `bson:"amount"          json:"amount"`
  DueDate  time.Time  `bson:"dueDate"         json:"dueDate"`
  PaidDate *time.Time `bson:"paidDate,omitempty" json:"paidDate,omitempty"`
  Paid     bool       `bson:"paid"            json:"paid"`
}
type BNPLPlan struct {
  ID           primitive.ObjectID `bson:"_id,omitempty"  json:"id"`
  UserID       primitive.ObjectID `bson:"userId"         json:"userId"`
  Merchant     string             `bson:"merchant"       json:"merchant"`
  MerchantLogo string             `bson:"merchantLogo"   json:"merchantLogo"`
  Description  string             `bson:"description"    json:"description"`
  TotalAmount  float64            `bson:"totalAmount"    json:"totalAmount"`
  AmountPaid   float64            `bson:"amountPaid"     json:"amountPaid"`
  Installments []BNPLInstallment  `bson:"installments"   json:"installments"`
  Frequency    string             `bson:"frequency"      json:"frequency"`
  Status       BNPLStatus         `bson:"status"         json:"status"`
  InterestRate float64            `bson:"interestRate"   json:"interestRate"`
  CreatedAt    time.Time          `bson:"createdAt"      json:"createdAt"`
  UpdatedAt    time.Time          `bson:"updatedAt"      json:"updatedAt"`
}
type CreateBNPLRequest struct {
  Merchant     string  `json:"merchant"      validate:"required"`
  MerchantLogo string  `json:"merchantLogo"  validate:"required"`
  Description  string  `json:"description"   validate:"required,min=5"`
  TotalAmount  float64 `json:"totalAmount"   validate:"required,gt=0"`
  Installments int     `json:"installments"  validate:"required,min=2,max=12"`
  Frequency    string  `json:"frequency"     validate:"required,oneof=weekly biweekly monthly"`
}
type PayInstallmentRequest struct {
  InstallmentNumber int `json:"installmentNumber" validate:"required,min=1"`
}
