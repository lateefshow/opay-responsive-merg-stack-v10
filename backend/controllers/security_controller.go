package controllers

import (
	"context"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/opay/backend/config"
	"github.com/opay/backend/models"
	"github.com/opay/backend/utils"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// GetSecurityOverview GET /api/security/overview
func GetSecurityOverview(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }
	ctx := context.Background()

	var devices []models.LoginDevice
	cur1, _ := config.DB.Collection("login_devices").Find(ctx, bson.M{"userId": uid})
	if cur1 != nil { defer cur1.Close(ctx); _ = cur1.All(ctx, &devices) }
	if devices == nil { devices = []models.LoginDevice{} }

	var history []models.LoginHistory
	cur2, _ := config.DB.Collection("login_history").Find(ctx, bson.M{"userId": uid})
	if cur2 != nil { defer cur2.Close(ctx); _ = cur2.All(ctx, &history) }
	if history == nil { history = []models.LoginHistory{} }

	var alerts []models.SecurityAlert
	cur3, _ := config.DB.Collection("security_alerts").Find(ctx, bson.M{"userId": uid})
	if cur3 != nil { defer cur3.Close(ctx); _ = cur3.All(ctx, &alerts) }
	if alerts == nil { alerts = []models.SecurityAlert{} }

	// Fetch user's 2FA status
	var userDoc struct{ TwoFactorEnabled bool `bson:"twoFactorEnabled"` }
	_ = config.DB.Collection("users").FindOne(ctx, bson.M{"_id": uid}).Decode(&userDoc)

	unread := 0
	for _, a := range alerts { if !a.IsRead { unread++ } }

	return utils.OK(c, "security overview fetched", fiber.Map{
		"devices":          devices,
		"loginHistory":     history,
		"alerts":           alerts,
		"unreadAlerts":     unread,
		"twoFactorEnabled": userDoc.TwoFactorEnabled,
	})
}

// BlockDevice POST /api/security/devices/:id/block
func BlockDevice(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }

	devID, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil { return utils.BadRequest(c, "invalid device id") }

	_, _ = config.DB.Collection("login_devices").UpdateOne(context.Background(),
		bson.M{"_id": devID, "userId": uid},
		bson.M{"$set": bson.M{"trust": "blocked"}},
	)
	return utils.OK(c, "device blocked", nil)
}

// MarkAlertRead PATCH /api/security/alerts/:id/read
func MarkAlertRead(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }

	alertID, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil { return utils.BadRequest(c, "invalid alert id") }

	_, _ = config.DB.Collection("security_alerts").UpdateOne(context.Background(),
		bson.M{"_id": alertID, "userId": uid},
		bson.M{"$set": bson.M{"isRead": true}},
	)
	return utils.OK(c, "alert marked as read", nil)
}

// MarkAllAlertsRead POST /api/security/alerts/read-all
func MarkAllAlertsRead(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }
	_, _ = config.DB.Collection("security_alerts").UpdateMany(context.Background(),
		bson.M{"userId": uid, "isRead": false},
		bson.M{"$set": bson.M{"isRead": true}},
	)
	return utils.OK(c, "all alerts read", nil)
}

// Toggle2FA POST /api/security/2fa/toggle
func Toggle2FA(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }
	ctx := context.Background()

	var userDoc struct{ TwoFactorEnabled bool `bson:"twoFactorEnabled"` }
	_ = config.DB.Collection("users").FindOne(ctx, bson.M{"_id": uid}).Decode(&userDoc)
	newVal := !userDoc.TwoFactorEnabled
	_, _ = config.DB.Collection("users").UpdateOne(ctx, bson.M{"_id": uid}, bson.M{"$set": bson.M{"twoFactorEnabled": newVal}})
	return utils.OK(c, "2FA toggled", fiber.Map{"twoFactorEnabled": newVal})
}

// SeedSecurityData creates initial seeded data for the user (helper, called internally)
func ensureSecurityData(uid primitive.ObjectID) {
	ctx := context.Background()
	count, _ := config.DB.Collection("login_devices").CountDocuments(ctx, bson.M{"userId": uid})
	if count > 0 { return }

	// Create demo devices
	devices := []models.LoginDevice{
		{ID:primitive.NewObjectID(), UserID:uid, Name:"Chrome on Windows", Browser:"Chrome 122", OS:"Windows 11", IP:"102.89.23.14", Location:"Lagos, NG", LastSeen:time.Now(), IsCurrent:true, Trust:"trusted", CreatedAt:time.Now().AddDate(0,-2,0)},
		{ID:primitive.NewObjectID(), UserID:uid, Name:"OPay Mobile App", Browser:"OPay App", OS:"Android 14", IP:"102.89.23.15", Location:"Lagos, NG", LastSeen:time.Now().AddDate(0,0,-2), IsCurrent:false, Trust:"trusted", CreatedAt:time.Now().AddDate(0,-1,0)},
		{ID:primitive.NewObjectID(), UserID:uid, Name:"Unknown iPhone", Browser:"Safari", OS:"iOS 17", IP:"196.207.10.22", Location:"Abuja, NG", LastSeen:time.Now().AddDate(0,0,-5), IsCurrent:false, Trust:"untrusted", CreatedAt:time.Now().AddDate(0,0,-5)},
	}
	var devDocs []interface{}
	for _, d := range devices { devDocs = append(devDocs, d) }
	_, _ = config.DB.Collection("login_devices").InsertMany(ctx, devDocs)

	// Login history
	history := []models.LoginHistory{
		{ID:primitive.NewObjectID(), UserID:uid, Device:"Chrome on Windows",  IP:"102.89.23.14", Location:"Lagos, NG",  Success:true,  Timestamp:time.Now().Add(-2*time.Hour)},
		{ID:primitive.NewObjectID(), UserID:uid, Device:"OPay Mobile App",    IP:"102.89.23.15", Location:"Lagos, NG",  Success:true,  Timestamp:time.Now().AddDate(0,0,-1)},
		{ID:primitive.NewObjectID(), UserID:uid, Device:"Unknown iPhone",     IP:"196.207.10.22",Location:"Abuja, NG",  Success:false, Timestamp:time.Now().AddDate(0,0,-5)},
		{ID:primitive.NewObjectID(), UserID:uid, Device:"Chrome on Windows",  IP:"102.89.23.14", Location:"Lagos, NG",  Success:true,  Timestamp:time.Now().AddDate(0,0,-7)},
	}
	var histDocs []interface{}
	for _, h := range history { histDocs = append(histDocs, h) }
	_, _ = config.DB.Collection("login_history").InsertMany(ctx, histDocs)

	// Security alerts
	alerts := []models.SecurityAlert{
		{ID:primitive.NewObjectID(), UserID:uid, Type:"device",   Title:"New device sign-in",           Description:"A new device (iPhone, Abuja) signed into your account", Severity:"high",   IsRead:false, CreatedAt:time.Now().AddDate(0,0,-5)},
		{ID:primitive.NewObjectID(), UserID:uid, Type:"login",    Title:"Failed login attempt",          Description:"3 failed login attempts from IP 196.207.10.22",           Severity:"medium", IsRead:false, CreatedAt:time.Now().AddDate(0,0,-5)},
		{ID:primitive.NewObjectID(), UserID:uid, Type:"transfer", Title:"Large transfer processed",      Description:"₦100,000 transferred to Chukwuemeka Nwosu",                Severity:"low",    IsRead:true,  CreatedAt:time.Now().AddDate(0,0,-30)},
	}
	var alertDocs []interface{}
	for _, a := range alerts { alertDocs = append(alertDocs, a) }
	_, _ = config.DB.Collection("security_alerts").InsertMany(ctx, alertDocs)
}

// GetSecurityOverviewWithSeed — calls ensureSecurityData first
func GetSecurityOverviewSeeded(c *fiber.Ctx) error {
	uid, err := getUserID(c)
	if err != nil { return utils.Unauthorized(c, "invalid session") }
	ensureSecurityData(uid)
	return GetSecurityOverview(c)
}
