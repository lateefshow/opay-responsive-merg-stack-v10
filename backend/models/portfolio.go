package models
import ("time";"go.mongodb.org/mongo-driver/bson/primitive")
type AssetType string
const (AssetStock AssetType="stock";AssetCrypto AssetType="crypto";AssetETF AssetType="etf")
type PortfolioHolding struct {
  ID            primitive.ObjectID `bson:"_id,omitempty" json:"id"`
  UserID        primitive.ObjectID `bson:"userId"        json:"userId"`
  Symbol        string             `bson:"symbol"        json:"symbol"`
  Name          string             `bson:"name"          json:"name"`
  Type          AssetType          `bson:"type"          json:"type"`
  Quantity      float64            `bson:"quantity"      json:"quantity"`
  AvgBuyPrice   float64            `bson:"avgBuyPrice"   json:"avgBuyPrice"`
  CurrentPrice  float64            `bson:"currentPrice"  json:"currentPrice"`
  TotalCost     float64            `bson:"totalCost"     json:"totalCost"`
  CurrentValue  float64            `bson:"currentValue"  json:"currentValue"`
  PnL           float64            `bson:"pnl"           json:"pnl"`
  PnLPercent    float64            `bson:"pnlPercent"    json:"pnlPercent"`
  Color         string             `bson:"color"         json:"color"`
  CreatedAt     time.Time          `bson:"createdAt"     json:"createdAt"`
  UpdatedAt     time.Time          `bson:"updatedAt"     json:"updatedAt"`
}
type BuyAssetRequest struct {
  Symbol   string  `json:"symbol"   validate:"required"`
  Name     string  `json:"name"     validate:"required"`
  Type     string  `json:"type"     validate:"required,oneof=stock crypto etf"`
  Quantity float64 `json:"quantity" validate:"required,gt=0"`
  Price    float64 `json:"price"    validate:"required,gt=0"`
  Color    string  `json:"color"    validate:"required"`
}
