package models
import ("time";"go.mongodb.org/mongo-driver/bson/primitive")
type EscrowStatus string
type MilestoneStatus string
const (
  EscrowOpen       EscrowStatus     = "open"
  EscrowFunded     EscrowStatus     = "funded"
  EscrowInProgress EscrowStatus     = "in_progress"
  EscrowCompleted  EscrowStatus     = "completed"
  EscrowDisputed   EscrowStatus     = "disputed"
  EscrowCancelled  EscrowStatus     = "cancelled"
  MilestonePending  MilestoneStatus = "pending"
  MilestoneReleased MilestoneStatus = "released"
  MilestoneApproved MilestoneStatus = "approved"
)
type EscrowMilestone struct {
  ID          string          `bson:"id"          json:"id"`
  Title       string          `bson:"title"       json:"title"`
  Description string          `bson:"description" json:"description"`
  Amount      float64         `bson:"amount"      json:"amount"`
  Status      MilestoneStatus `bson:"status"      json:"status"`
  ReleasedAt  *time.Time      `bson:"releasedAt,omitempty"  json:"releasedAt,omitempty"`
}
type EscrowContract struct {
  ID             primitive.ObjectID `bson:"_id,omitempty"    json:"id"`
  BuyerID        primitive.ObjectID `bson:"buyerId"          json:"buyerId"`
  SellerEmail    string             `bson:"sellerEmail"      json:"sellerEmail"`
  SellerName     string             `bson:"sellerName"       json:"sellerName"`
  Title          string             `bson:"title"            json:"title"`
  Description    string             `bson:"description"      json:"description"`
  TotalAmount    float64            `bson:"totalAmount"      json:"totalAmount"`
  AmountHeld     float64            `bson:"amountHeld"       json:"amountHeld"`
  AmountReleased float64            `bson:"amountReleased"   json:"amountReleased"`
  Milestones     []EscrowMilestone  `bson:"milestones"       json:"milestones"`
  Status         EscrowStatus       `bson:"status"           json:"status"`
  CreatedAt      time.Time          `bson:"createdAt"        json:"createdAt"`
  UpdatedAt      time.Time          `bson:"updatedAt"        json:"updatedAt"`
}
type CreateEscrowRequest struct {
  SellerEmail string           `json:"sellerEmail"  validate:"required,email"`
  SellerName  string           `json:"sellerName"   validate:"required"`
  Title       string           `json:"title"        validate:"required,min=5"`
  Description string           `json:"description"  validate:"required,min=10"`
  Milestones  []EscrowMilestone `json:"milestones"  validate:"required,min=1"`
}
type ReleaseMilestoneRequest struct {
  MilestoneID string `json:"milestoneId" validate:"required"`
}
