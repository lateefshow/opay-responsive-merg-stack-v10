package models
import ("time";"go.mongodb.org/mongo-driver/bson/primitive")
type FamilyMemberRole string
const (RoleOwner FamilyMemberRole="owner";RoleAdmin FamilyMemberRole="admin";RoleMember FamilyMemberRole="member")
type FamilyMember struct {
  UserID       primitive.ObjectID `bson:"userId"        json:"userId"`
  Name         string             `bson:"name"          json:"name"`
  Email        string             `bson:"email"         json:"email"`
  Role         FamilyMemberRole   `bson:"role"          json:"role"`
  AvatarColor  string             `bson:"avatarColor"   json:"avatarColor"`
  Initials     string             `bson:"initials"      json:"initials"`
  SpendLimit   float64            `bson:"spendLimit"    json:"spendLimit"`
  SpentThisMonth float64          `bson:"spentThisMonth" json:"spentThisMonth"`
  JoinedAt     time.Time          `bson:"joinedAt"      json:"joinedAt"`
}
type FamilyAccount struct {
  ID           primitive.ObjectID `bson:"_id,omitempty" json:"id"`
  OwnerID      primitive.ObjectID `bson:"ownerId"       json:"ownerId"`
  Name         string             `bson:"name"          json:"name"`
  SharedBalance float64           `bson:"sharedBalance" json:"sharedBalance"`
  Members      []FamilyMember     `bson:"members"       json:"members"`
  TotalMonthlySpend float64       `bson:"totalMonthlySpend" json:"totalMonthlySpend"`
  CreatedAt    time.Time          `bson:"createdAt"     json:"createdAt"`
  UpdatedAt    time.Time          `bson:"updatedAt"     json:"updatedAt"`
}
type CreateFamilyRequest struct {
  Name string `json:"name" validate:"required,min=3"`
}
type InviteMemberRequest struct {
  Email      string  `json:"email"      validate:"required,email"`
  Name       string  `json:"name"       validate:"required"`
  SpendLimit float64 `json:"spendLimit" validate:"required,min=0"`
}
type FundFamilyRequest struct {
  Amount float64 `json:"amount" validate:"required,gt=0"`
}
