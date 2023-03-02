package main

import (
	"enterpriseweb/routes"
	"github.com/gofiber/fiber/v2"
)

func main() {

	app := fiber.New()

	// Setup public folder
	app.Static("/", "./public")
	setupRoutes(app)

	err := app.Listen(":8080")
	if err != nil {
		return
	}

}

func setupRoutes(app *fiber.App) {
	app.Get("/", routes.Home)

}
