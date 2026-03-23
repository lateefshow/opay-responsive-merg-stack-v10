package models
import ("time";"go.mongodb.org/mongo-driver/bson/primitive")
type PensionContribution struct {
  Month         string  `bson:"month"         json:"month"`
  Amount        float64 `bson:"amount"        json:"amount"`
  EmployerMatch float64 `bson:"employerMatch" json:"employerMatch"`
  Returns       float64 `bson:"returns"       json:"returns"`
  Total         float64 `bson:"total"         json:"total"`
}
type PensionPlan struct {
  ID                      primitive.ObjectID    `bson:"_id,omitempty"          json:"id"`
  UserID                  primitive.ObjectID    `bson:"userId"                 json:"userId"`
  CurrentAge              int                   `bson:"currentAge"             json:"currentAge"`
  RetirementAge           int                   `bson:"retirementAge"          json:"retirementAge"`
  CurrentBalance          float64               `bson:"currentBalance"         json:"currentBalance"`
  MonthlyContribution     float64               `bson:"monthlyContribution"    json:"monthlyContribution"`
  EmployerMatchPct        float64               `bson:"employerMatchPct"       json:"employerMatchPct"`
  ExpectedReturn          float64               `bson:"expectedReturn"         json:"expectedReturn"`
  ProjectedBalance        float64               `bson:"projectedBalance"       json:"projectedBalance"`
  MonthlyRetirementIncome float64               `bson:"monthlyRetirementIncome" json:"monthlyRetirementIncome"`
  YearsToRetirement       int                   `bson:"yearsToRetirement"      json:"yearsToRetirement"`
  Contributions           []PensionContribution `bson:"contributions"          json:"contributions"`
  CreatedAt               time.Time             `bson:"createdAt"              json:"createdAt"`
  UpdatedAt               time.Time             `bson:"updatedAt"              json:"updatedAt"`
}
type UpdatePensionRequest struct {
  CurrentAge          int     `json:"currentAge"          validate:"required,min=18,max=65"`
  RetirementAge       int     `json:"retirementAge"       validate:"required,min=50,max=75"`
  CurrentBalance      float64 `json:"currentBalance"      validate:"min=0"`
  MonthlyContribution float64 `json:"monthlyContribution" validate:"required,gt=0"`
  EmployerMatchPct    float64 `json:"employerMatchPct"    validate:"min=0,max=100"`
  ExpectedReturn      float64 `json:"expectedReturn"      validate:"required,min=1,max=30"`
}
