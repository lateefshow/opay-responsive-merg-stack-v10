package controllers

import (
	"context"
	"fmt"
	"math/rand"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/opay/backend/config"
	"github.com/opay/backend/models"
	"github.com/opay/backend/services"
	"github.com/opay/backend/utils"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Flight fare estimates (NGN per person one-way)
var flightFares = map[string]map[string]float64{
	"LOS": {"ABV":35000,"KAN":45000,"PHC":38000,"ENO":42000,"CBQ":55000},
	"ABV": {"LOS":35000,"KAN":32000,"PHC":50000},
	"KAN": {"LOS":45000,"ABV":32000},
	"PHC": {"LOS":38000,"ABV":50000},
}

var hotelRates = map[string]float64{
	"Lagos":30000,"Abuja":35000,"Kano":20000,"Port Harcourt":25000,
	"Enugu":18000,"Ibadan":15000,"Calabar":22000,
}

// GetTravelBookings GET /api/travel
func GetTravelBookings(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }
	var bookings []models.TravelBooking
	cursor, _ := config.DB.Collection("travel_bookings").Find(context.Background(), bson.M{"userId": uid})
	if cursor != nil { defer cursor.Close(context.Background()); _ = cursor.All(context.Background(), &bookings) }
	if bookings == nil { bookings = []models.TravelBooking{} }
	totalSpent := 0.0
	for _, b := range bookings { totalSpent += b.Amount }
	return utils.OK(c, "bookings fetched", fiber.Map{"bookings": bookings, "totalSpent": totalSpent})
}

// GetFlightPrices GET /api/travel/flights?from=LOS&to=ABV&passengers=1
func GetFlightPrices(c *fiber.Ctx) error {
	from := c.Query("from", "LOS")
	to   := c.Query("to", "ABV")
	pax  := 1

	baseFare := 40000.0
	if routes, ok := flightFares[from]; ok {
		if f, ok2 := routes[to]; ok2 { baseFare = f }
	}

	airlines := []fiber.Map{
		{"airline":"Air Peace",    "logo":"✈️","class":"economy","fare": baseFare * float64(pax),    "duration":"1h 15m","departure":"06:00","arrival":"07:15"},
		{"airline":"Ibom Air",     "logo":"🛩️","class":"economy","fare": baseFare*0.9 * float64(pax),"duration":"1h 20m","departure":"09:30","arrival":"10:50"},
		{"airline":"Arik Air",     "logo":"✈️","class":"business","fare":baseFare*2.5 * float64(pax),"duration":"1h 10m","departure":"12:00","arrival":"13:10"},
		{"airline":"United Nigeria","logo":"🛩️","class":"economy","fare":baseFare*0.95 * float64(pax),"duration":"1h 25m","departure":"15:45","arrival":"17:10"},
	}
	return utils.OK(c, "flight prices fetched", fiber.Map{"flights": airlines, "from": from, "to": to})
}

// BookFlight POST /api/travel/flights/book
func BookFlight(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }
	var req models.BookFlightRequest
	if err := c.BodyParser(&req); err != nil { return utils.BadRequest(c, "invalid body") }
	if err := validate.Struct(req); err != nil  { return utils.BadRequest(c, err.Error()) }

	// Determine fare
	baseFare := 40000.0
	if routes, ok := flightFares[req.From]; ok {
		if f, ok2 := routes[req.To]; ok2 { baseFare = f }
	}
	multiplier := 1.0
	switch req.ClassType { case "business": multiplier = 2.5; case "first": multiplier = 4.0 }
	total := baseFare * multiplier * float64(req.Passengers)

	bal, _ := services.GetWalletBalance(uid)
	if bal < total { return utils.BadRequest(c, fmt.Sprintf("insufficient balance — need %s", fmt.Sprintf("₦%.2f", total))) }
	_, _ = services.FundWallet(uid, -total)

	seats := fmt.Sprintf("%s%d", string(rune('A'+rand.Intn(6))), rand.Intn(30)+1)
	booking := &models.TravelBooking{
		ID: primitive.NewObjectID(), UserID: uid,
		Type: models.TravelFlight,
		Title: fmt.Sprintf("%s → %s", req.From, req.To),
		Provider: "Air Peace",
		From: req.From, To: req.To,
		DepartDate: req.DepartDate,
		Passengers: req.Passengers,
		Amount: total,
		Reference: "FLT-" + uuid.New().String()[:8],
		Status: models.TravelActive,
		SeatInfo: seats,
		CreatedAt: time.Now(),
	}
	_, _ = config.DB.Collection("travel_bookings").InsertOne(context.Background(), booking)
	newBal, _ := services.GetWalletBalance(uid)
	return utils.Created(c, "flight booked", fiber.Map{"booking": booking, "newBalance": newBal})
}

// BookHotel POST /api/travel/hotels/book
func BookHotel(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }
	var req models.BookHotelRequest
	if err := c.BodyParser(&req); err != nil { return utils.BadRequest(c, "invalid body") }
	if err := validate.Struct(req); err != nil  { return utils.BadRequest(c, err.Error()) }

	nights := int(req.CheckOut.Sub(req.CheckIn).Hours()/24)
	if nights < 1 { return utils.BadRequest(c, "check-out must be after check-in") }

	ratePerNight := 30000.0
	if r, ok := hotelRates[req.City]; ok { ratePerNight = r }
	total := ratePerNight * float64(nights) * float64(req.Rooms)

	bal, _ := services.GetWalletBalance(uid)
	if bal < total { return utils.BadRequest(c, fmt.Sprintf("insufficient balance — need ₦%.2f", total)) }
	_, _ = services.FundWallet(uid, -total)

	checkout := req.CheckOut
	booking := &models.TravelBooking{
		ID: primitive.NewObjectID(), UserID: uid,
		Type: models.TravelHotel,
		Title: fmt.Sprintf("%s — %s (%d night%s)", req.Hotel, req.City, nights, map[bool]string{true:"s",false:""}[nights>1]),
		Provider: req.Hotel,
		From: req.City, To: req.City,
		DepartDate: req.CheckIn, ReturnDate: &checkout,
		Passengers: req.Rooms,
		Amount: total,
		Reference: "HTL-" + uuid.New().String()[:8],
		Status: models.TravelActive,
		SeatInfo: fmt.Sprintf("Room %d", 100+rand.Intn(500)),
		CreatedAt: time.Now(),
	}
	_, _ = config.DB.Collection("travel_bookings").InsertOne(context.Background(), booking)
	newBal, _ := services.GetWalletBalance(uid)
	return utils.Created(c, "hotel booked", fiber.Map{"booking": booking, "newBalance": newBal})
}
