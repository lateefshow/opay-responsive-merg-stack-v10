package models
import ("time";"go.mongodb.org/mongo-driver/bson/primitive")
type NetWorthCategory string
const (NetWorthCash NetWorthCategory="cash";NetWorthSavings NetWorthCategory="savings";NetWorthInvestment NetWorthCategory="investment";NetWorthProperty NetWorthCategory="property";NetWorthCrypto NetWorthCategory="crypto")
type NetWorthSnapshot struct {
  ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
  UserID      primitive.ObjectID `bson:"userId"        json:"userId"`
  TotalAssets float64            `bson:"totalAssets"   json:"totalAssets"`
  TotalLiab   float64            `bson:"totalLiab"     json:"totalLiabilities"`
  NetWorth    float64            `bson:"netWorth"      json:"netWorth"`
  Breakdown   map[string]float64 `bson:"breakdown"     json:"breakdown"`
  CreatedAt   time.Time          `bson:"createdAt"     json:"createdAt"`
}
