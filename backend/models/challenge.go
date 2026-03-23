package models
import ("time";"go.mongodb.org/mongo-driver/bson/primitive")
type ChallengeStatus string
const (ChallengeActive ChallengeStatus="active";ChallengeCompleted ChallengeStatus="completed";ChallengeFailed ChallengeStatus="failed";ChallengeAbandoned ChallengeStatus="abandoned")
type ChallengeType string
const (ChallengeSavings ChallengeType="savings";ChallengeSpending ChallengeType="spending";ChallengeNoSpend ChallengeType="no_spend";ChallengeDebt ChallengeType="debt")
type UserChallenge struct {
  ID              primitive.ObjectID `bson:"_id,omitempty" json:"id"`
  UserID          primitive.ObjectID `bson:"userId"        json:"userId"`
  ChallengeID     string             `bson:"challengeId"   json:"challengeId"`
  Name            string             `bson:"name"          json:"name"`
  Type            ChallengeType      `bson:"type"          json:"type"`
  Description     string             `bson:"description"   json:"description"`
  TargetAmount    float64            `bson:"targetAmount"  json:"targetAmount"`
  CurrentAmount   float64            `bson:"currentAmount" json:"currentAmount"`
  Duration        int                `bson:"duration"      json:"duration"`
  DurationUnit    string             `bson:"durationUnit"  json:"durationUnit"`
  Reward          float64            `bson:"reward"        json:"reward"`
  Status          ChallengeStatus    `bson:"status"        json:"status"`
  Progress        float64            `bson:"progress"      json:"progress"`
  StartDate       time.Time          `bson:"startDate"     json:"startDate"`
  EndDate         time.Time          `bson:"endDate"       json:"endDate"`
  Milestones      []Milestone        `bson:"milestones"    json:"milestones"`
  CreatedAt       time.Time          `bson:"createdAt"     json:"createdAt"`
}
type Milestone struct {
  Label     string  `bson:"label"     json:"label"`
  Target    float64 `bson:"target"    json:"target"`
  Reward    float64 `bson:"reward"    json:"reward"`
  Achieved  bool    `bson:"achieved"  json:"achieved"`
}
type JoinChallengeRequest struct {
  ChallengeID string `json:"challengeId" validate:"required"`
}
