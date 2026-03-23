package models
import ("time";"go.mongodb.org/mongo-driver/bson/primitive")
type LoginDevice struct {
  ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
  UserID    primitive.ObjectID `bson:"userId"        json:"userId"`
  Name      string             `bson:"name"          json:"name"`
  Browser   string             `bson:"browser"       json:"browser"`
  OS        string             `bson:"os"            json:"os"`
  IP        string             `bson:"ip"            json:"ip"`
  Location  string             `bson:"location"      json:"location"`
  LastSeen  time.Time          `bson:"lastSeen"      json:"lastSeen"`
  IsCurrent bool               `bson:"isCurrent"     json:"isCurrent"`
  Trust     string             `bson:"trust"         json:"trust"` // trusted | untrusted | blocked
  CreatedAt time.Time          `bson:"createdAt"     json:"createdAt"`
}
type LoginHistory struct {
  ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
  UserID    primitive.ObjectID `bson:"userId"        json:"userId"`
  Device    string             `bson:"device"        json:"device"`
  IP        string             `bson:"ip"            json:"ip"`
  Location  string             `bson:"location"      json:"location"`
  Success   bool               `bson:"success"       json:"success"`
  Timestamp time.Time          `bson:"timestamp"     json:"timestamp"`
}
type SecurityAlert struct {
  ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
  UserID      primitive.ObjectID `bson:"userId"        json:"userId"`
  Type        string             `bson:"type"          json:"type"`
  Title       string             `bson:"title"         json:"title"`
  Description string             `bson:"description"   json:"description"`
  Severity    string             `bson:"severity"      json:"severity"`
  IsRead      bool               `bson:"isRead"        json:"isRead"`
  CreatedAt   time.Time          `bson:"createdAt"     json:"createdAt"`
}
