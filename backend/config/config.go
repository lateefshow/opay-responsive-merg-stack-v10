package config

import (
	"fmt"
	"log"
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
)

// Config holds all application configuration
type Config struct {
	Port              string
	MongoURI          string
	MongoDB           string
	JWTAccessSecret   string
	JWTRefreshSecret  string
	JWTAccessExpiry   time.Duration
	JWTRefreshExpiry  time.Duration
	FrontendURL       string
	BcryptCost        int
	Environment       string
}

var AppConfig *Config

// Load reads environment variables and populates AppConfig
func Load() {
	// Load .env only in dev
	if err := godotenv.Load(); err != nil {
		log.Println("[config] No .env file found, relying on system env")
	}

	accessExpiry, err := time.ParseDuration(getEnv("JWT_ACCESS_EXPIRY", "15m"))
	if err != nil {
		log.Fatalf("[config] Invalid JWT_ACCESS_EXPIRY: %v", err)
	}
	refreshExpiry, err := time.ParseDuration(getEnv("JWT_REFRESH_EXPIRY", "168h"))
	if err != nil {
		log.Fatalf("[config] Invalid JWT_REFRESH_EXPIRY: %v", err)
	}

	bcryptCost, _ := strconv.Atoi(getEnv("BCRYPT_COST", "12"))

	AppConfig = &Config{
		Port:             getEnv("PORT", "8080"),
		MongoURI:         getEnvRequired("MONGO_URI"),
		MongoDB:          getEnv("MONGO_DB", "opay_db"),
		JWTAccessSecret:  getEnvRequired("JWT_ACCESS_SECRET"),
		JWTRefreshSecret: getEnvRequired("JWT_REFRESH_SECRET"),
		JWTAccessExpiry:  accessExpiry,
		JWTRefreshExpiry: refreshExpiry,
		FrontendURL:      getEnv("FRONTEND_URL", "http://localhost:5173"),
		BcryptCost:       bcryptCost,
		Environment:      getEnv("ENVIRONMENT", "development"),
	}

	fmt.Printf("[config] Loaded: port=%s db=%s env=%s\n",
		AppConfig.Port, AppConfig.MongoDB, AppConfig.Environment)
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func getEnvRequired(key string) string {
	v := os.Getenv(key)
	if v == "" {
		log.Fatalf("[config] Required env var %s is missing", key)
	}
	return v
}
