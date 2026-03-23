package models
import ("time";"go.mongodb.org/mongo-driver/bson/primitive")
type TravelBookingType string
type TravelBookingStatus string
const (
  TravelFlight  TravelBookingType   = "flight"
  TravelHotel   TravelBookingType   = "hotel"
  TravelBus     TravelBookingType   = "bus"
  TravelActive  TravelBookingStatus = "active"
  TravelUsed    TravelBookingStatus = "used"
  TravelExpired TravelBookingStatus = "expired"
  TravelPending TravelBookingStatus = "pending"
)
type TravelBooking struct {
  ID          primitive.ObjectID  `bson:"_id,omitempty" json:"id"`
  UserID      primitive.ObjectID  `bson:"userId"        json:"userId"`
  Type        TravelBookingType   `bson:"type"          json:"type"`
  Title       string              `bson:"title"         json:"title"`
  Provider    string              `bson:"provider"      json:"provider"`
  From        string              `bson:"from"          json:"from"`
  To          string              `bson:"to"            json:"to"`
  DepartDate  time.Time           `bson:"departDate"    json:"departDate"`
  ReturnDate  *time.Time          `bson:"returnDate,omitempty" json:"returnDate,omitempty"`
  Passengers  int                 `bson:"passengers"    json:"passengers"`
  Amount      float64             `bson:"amount"        json:"amount"`
  Reference   string              `bson:"reference"     json:"reference"`
  Status      TravelBookingStatus `bson:"status"        json:"status"`
  SeatInfo    string              `bson:"seatInfo"      json:"seatInfo"`
  CreatedAt   time.Time           `bson:"createdAt"     json:"createdAt"`
}
type BookFlightRequest struct {
  From        string    `json:"from"        validate:"required"`
  To          string    `json:"to"          validate:"required"`
  DepartDate  time.Time `json:"departDate"  validate:"required"`
  Passengers  int       `json:"passengers"  validate:"required,min=1,max=9"`
  ClassType   string    `json:"classType"   validate:"required,oneof=economy business first"`
}
type BookHotelRequest struct {
  City        string    `json:"city"        validate:"required"`
  Hotel       string    `json:"hotel"       validate:"required"`
  CheckIn     time.Time `json:"checkIn"     validate:"required"`
  CheckOut    time.Time `json:"checkOut"    validate:"required"`
  Rooms       int       `json:"rooms"       validate:"required,min=1,max=5"`
}
