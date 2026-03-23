package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/helmet"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/opay/backend/config"
	"github.com/opay/backend/middleware"
	"github.com/opay/backend/routes"
)

func main() {
	config.Load()
	config.ConnectDB()
	defer config.DisconnectDB()

	app := fiber.New(fiber.Config{
		ErrorHandler:          middleware.ErrorHandler,
		AppName:               "OPay API v1",
		ServerHeader:          "OPay",
		DisableStartupMessage: false,
		BodyLimit:             4 * 1024 * 1024,
	})

	app.Use(recover.New())
	app.Use(logger.New(logger.Config{
		Format: "[${time}] ${status} ${method} ${path} ${latency}\n",
	}))
	app.Use(helmet.New())
	app.Use(middleware.CORS())

	routes.Setup(app)

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		addr := ":" + config.AppConfig.Port
		log.Printf("[server] Starting on %s", addr)
		if err := app.Listen(addr); err != nil {
			log.Fatalf("[server] Fatal: %v", err)
		}
	}()

	<-quit
	log.Println("[server] Shutting down gracefully...")
	_ = app.Shutdown()
}
