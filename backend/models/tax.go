package models
import ("time";"go.mongodb.org/mongo-driver/bson/primitive")
type TaxYear struct {
  ID              primitive.ObjectID `bson:"_id,omitempty" json:"id"`
  UserID          primitive.ObjectID `bson:"userId"        json:"userId"`
  Year            int                `bson:"year"          json:"year"`
  GrossIncome     float64            `bson:"grossIncome"   json:"grossIncome"`
  TaxableIncome   float64            `bson:"taxableIncome" json:"taxableIncome"`
  TaxOwed         float64            `bson:"taxOwed"       json:"taxOwed"`
  Deductions      float64            `bson:"deductions"    json:"deductions"`
  TaxPaid         float64            `bson:"taxPaid"       json:"taxPaid"`
  TaxRefund       float64            `bson:"taxRefund"     json:"taxRefund"`
  Status          string             `bson:"status"        json:"status"` // draft | filed | assessed
  Breakdown       []TaxBracket       `bson:"breakdown"     json:"breakdown"`
  CreatedAt       time.Time          `bson:"createdAt"     json:"createdAt"`
  UpdatedAt       time.Time          `bson:"updatedAt"     json:"updatedAt"`
}
type TaxBracket struct {
  Label      string  `bson:"label"      json:"label"`
  Rate       float64 `bson:"rate"       json:"rate"`
  From       float64 `bson:"from"       json:"from"`
  To         float64 `bson:"to"         json:"to"`
  Tax        float64 `bson:"tax"        json:"tax"`
}
type TaxDocument struct {
  ID         primitive.ObjectID `bson:"_id,omitempty" json:"id"`
  UserID     primitive.ObjectID `bson:"userId"        json:"userId"`
  TaxYearID  primitive.ObjectID `bson:"taxYearId"     json:"taxYearId"`
  DocType    string             `bson:"docType"       json:"docType"`
  Name       string             `bson:"name"          json:"name"`
  Status     string             `bson:"status"        json:"status"` // ready | generating
  CreatedAt  time.Time          `bson:"createdAt"     json:"createdAt"`
}
type ComputeTaxRequest struct {
  GrossIncome  float64 `json:"grossIncome"  validate:"required,gt=0"`
  Deductions   float64 `json:"deductions"   validate:"min=0"`
  Year         int     `json:"year"         validate:"required,min=2020"`
}
