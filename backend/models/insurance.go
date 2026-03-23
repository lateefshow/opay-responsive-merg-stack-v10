package models
import ("time";"go.mongodb.org/mongo-driver/bson/primitive")
type InsuranceType   string
type InsuranceStatus string
const (InsuranceHealth InsuranceType="health";InsuranceLife InsuranceType="life";InsuranceAuto InsuranceType="auto")
const (InsuranceActive InsuranceStatus="active";InsuranceExpired InsuranceStatus="expired")
type Insurance struct {
  ID           primitive.ObjectID `bson:"_id,omitempty" json:"id"`
  UserID       primitive.ObjectID `bson:"userId"        json:"userId"`
  Type         InsuranceType      `bson:"type"          json:"type"`
  Name         string             `bson:"name"          json:"name"`
  Provider     string             `bson:"provider"      json:"provider"`
  Premium      float64            `bson:"premium"       json:"premium"`
  Coverage     float64            `bson:"coverage"      json:"coverage"`
  PolicyNumber string             `bson:"policyNumber"  json:"policyNumber"`
  Status       InsuranceStatus    `bson:"status"        json:"status"`
  StartDate    time.Time          `bson:"startDate"     json:"startDate"`
  EndDate      time.Time          `bson:"endDate"       json:"endDate"`
  CreatedAt    time.Time          `bson:"createdAt"     json:"createdAt"`
}
type CreateInsuranceRequest struct {
  Type    InsuranceType `json:"type"    validate:"required"`
  PlanID  string        `json:"planId"  validate:"required"`
}
