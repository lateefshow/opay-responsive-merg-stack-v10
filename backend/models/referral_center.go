package models
import ("time";"go.mongodb.org/mongo-driver/bson/primitive")
type ReferralCenterStats struct {
  TotalReferrals   int     `bson:"totalReferrals"   json:"totalReferrals"`
  PaidBonuses      int     `bson:"paidBonuses"      json:"paidBonuses"`
  PendingBonuses   int     `bson:"pendingBonuses"   json:"pendingBonuses"`
  TotalEarned      float64 `bson:"totalEarned"      json:"totalEarned"`
  TierLevel        string  `bson:"tierLevel"        json:"tierLevel"`
  NextTierAt       int     `bson:"nextTierAt"       json:"nextTierAt"`
}
type ReferralEntry struct {
  ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
  ReferrerID  primitive.ObjectID `bson:"referrerId"    json:"referrerId"`
  RefereeName string             `bson:"refereeName"   json:"refereeName"`
  RefereeEmail string            `bson:"refereeEmail"  json:"refereeEmail"`
  BonusAmount float64            `bson:"bonusAmount"   json:"bonusAmount"`
  Status      string             `bson:"status"        json:"status"`
  JoinedAt    time.Time          `bson:"joinedAt"      json:"joinedAt"`
  CreatedAt   time.Time          `bson:"createdAt"     json:"createdAt"`
}
