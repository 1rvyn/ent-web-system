package main

import (
	"enterpriseweb/routes"
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2/middleware/cors"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/template/html"
	"github.com/golang-jwt/jwt"
)

const SecretKey = "cookies are yum"

func main() {

	engine := html.New("./views", ".html")

	app := fiber.New(fiber.Config{
		Views: engine,
	})

	app.Use(cors.New(cors.Config{
		AllowOrigins:     "http://localhost:5173", // Replace with your React app's URL
		AllowHeaders:     "Origin, Content-Type, Accept, Set-Cookie, Cookie , Content-Type",
		AllowMethods:     "POST, OPTIONS",
		AllowCredentials: true,
	}))

	// Setup public folder
	app.Static("/", "/public")

	setupRoutes(app)

	err := app.Listen(":8080")
	if err != nil {
		return
	}

}

func setupRoutes(app *fiber.App) {
	app.Get("/", routes.Home)
	app.Post("/login", Login)

}

func Login(c *fiber.Ctx) error {
	var loginData map[string]string

	if err := c.BodyParser(&loginData); err != nil {
		return err
	}

	// hande login
	fmt.Println("Login", loginData)

	// make a cookie for the user

	claims := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.StandardClaims{
		Issuer:    loginData["email"],
		ExpiresAt: time.Now().Add(time.Hour * 24).Unix(), //1 day
	})

	token, err := claims.SignedString([]byte(SecretKey))

	if err != nil {
		c.Status(fiber.StatusInternalServerError)
		return c.JSON(fiber.Map{
			"message": "could not create cookie",
		})
	}

	c.Cookie(&fiber.Cookie{
		Name:     "session",
		Value:    token,       // Replace with a unique session ID
		Domain:   "localhost", // Replace with your domain name
		Path:     "/",
		HTTPOnly: true,
		SameSite: "None",
		MaxAge:   3600, // Expires in 1 hour
	})

	return c.JSON(fiber.Map{
		"message": "successfully logged in",
	})

}
