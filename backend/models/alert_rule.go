package models
import ("time";"go.mongodb.org/mongo-driver/bson/primitive")
type AlertTrigger string
type AlertChannel string
const (
  TriggerBalance     AlertTrigger = "balance_below"
  TriggerLargeDebit  AlertTrigger = "large_debit"
  TriggerLargeCredit AlertTrigger = "large_credit"
  TriggerLoanDue     AlertTrigger = "loan_due"
  TriggerSavingsGoal AlertTrigger = "savings_goal"
  TriggerForeignLogin AlertTrigger = "foreign_login"
  ChannelPush  AlertChannel = "push"
  ChannelEmail AlertChannel = "email"
  ChannelSMS   AlertChannel = "sms"
)
type AlertRule struct {
  ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
  UserID      primitive.ObjectID `bson:"userId"        json:"userId"`
  Name        string             `bson:"name"          json:"name"`
  Trigger     AlertTrigger       `bson:"trigger"       json:"trigger"`
  Threshold   float64            `bson:"threshold"     json:"threshold"`
  Channel     AlertChannel       `bson:"channel"       json:"channel"`
  IsActive    bool               `bson:"isActive"      json:"isActive"`
  TriggeredCount int             `bson:"triggeredCount" json:"triggeredCount"`
  LastTriggered *time.Time       `bson:"lastTriggered,omitempty" json:"lastTriggered,omitempty"`
  CreatedAt   time.Time          `bson:"createdAt"     json:"createdAt"`
}
type CreateAlertRuleRequest struct {
  Name      string  `json:"name"      validate:"required,min=3"`
  Trigger   string  `json:"trigger"   validate:"required"`
  Threshold float64 `json:"threshold" validate:"min=0"`
  Channel   string  `json:"channel"   validate:"required,oneof=push email sms"`
}
