package models
import ("time";"go.mongodb.org/mongo-driver/bson/primitive")
type SocialActivityType string
const (ActivitySend SocialActivityType="send";ActivityReceive SocialActivityType="receive";ActivitySavings SocialActivityType="savings";ActivityInvestment SocialActivityType="investment";ActivityChallenge SocialActivityType="challenge")
type SocialReaction struct {
  UserID    primitive.ObjectID `bson:"userId"    json:"userId"`
  Emoji     string             `bson:"emoji"     json:"emoji"`
  CreatedAt time.Time          `bson:"createdAt" json:"createdAt"`
}
type SocialActivity struct {
  ID          primitive.ObjectID   `bson:"_id,omitempty" json:"id"`
  UserID      primitive.ObjectID   `bson:"userId"        json:"userId"`
  UserName    string               `bson:"userName"      json:"userName"`
  UserInitials string              `bson:"userInitials"  json:"userInitials"`
  AvatarColor string               `bson:"avatarColor"   json:"avatarColor"`
  Type        SocialActivityType   `bson:"type"          json:"type"`
  Caption     string               `bson:"caption"       json:"caption"`
  Amount      float64              `bson:"amount"        json:"amount"`
  IsPublic    bool                 `bson:"isPublic"      json:"isPublic"`
  Reactions   []SocialReaction     `bson:"reactions"     json:"reactions"`
  CommentCount int                 `bson:"commentCount"  json:"commentCount"`
  CreatedAt   time.Time            `bson:"createdAt"     json:"createdAt"`
}
type CreateSocialPostRequest struct {
  Caption  string  `json:"caption"  validate:"required,min=3,max=280"`
  Amount   float64 `json:"amount"   validate:"required,gt=0"`
  Type     string  `json:"type"     validate:"required"`
  IsPublic bool    `json:"isPublic"`
}
type ReactRequest struct {
  Emoji string `json:"emoji" validate:"required"`
}
