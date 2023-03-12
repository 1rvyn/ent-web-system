package main

import (
	"bytes"
	"enterpriseweb/database"
	"enterpriseweb/models"
	"enterpriseweb/routes"
	"enterpriseweb/utils"
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2/middleware/cors"
	"gorm.io/gorm"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/template/html"
	"github.com/golang-jwt/jwt"
)

// load the env variables from the .env file
var SecretKey = os.Getenv("SECRET_KEY")
var SALT = os.Getenv("SALT")

func main() {
	database.ConnectDb()
	database.ConnectToRedis()
	fmt.Println("SALT IS", SALT)

	engine := html.New("./views", ".html")

	app := fiber.New(fiber.Config{
		Views: engine,
	})

	app.Use(cors.New(cors.Config{
		AllowOrigins:     "http://localhost:5173", // Replace with your React app's URL
		AllowHeaders:     "Origin, Content-Type, Accept, Set-Cookie, Cookie , Content-Type",
		AllowMethods:     "POST, OPTIONS, GET, PUT, DELETE, PREFLIGHT",
		AllowCredentials: true,
	}))

	// Setup public folder
	app.Static("/", "/public")

	setupRoutes(app)

	err := app.Listen(":8085")
	if err != nil {
		return
	}

}

func setupRoutes(app *fiber.App) {
	app.Get("/", routes.Home)
	app.Post("/login", Login)
	app.Post("/register", Register)
	app.Post("/projects", Project)
	app.Post("/test", Test)
}

func Test(c *fiber.Ctx) error {
	// print all cookies

	cookieHeader := c.Request().Header.Peek("cookie")
	if cookieHeader != nil {
		cookies := string(cookieHeader)
		fmt.Println("cookies: \n", cookies)
	}

	// Get the session cookie from the request context
	sessionCookie := c.Cookies("session")

	fmt.Println("session cookieeeeeeee: \n", sessionCookie)

	return c.JSON(fiber.Map{
		"message": "test",
	})
}

func Project(c *fiber.Ctx) error {
	// TODO save projects for each user in the database
	var projects []map[string]interface{}

	if err := c.BodyParser(&projects); err != nil {
		return err
	}

	fmt.Println("projects: ", projects)

	// Get the user ID from the cookie
	cookieHeader := c.Request().Header.Peek("cookie")
	if cookieHeader != nil {
		cookies := string(cookieHeader)
		fmt.Println("cookies: \n", cookies)
	}

	return c.JSON(fiber.Map{
		"message": "project",
	})
}

func Register(c *fiber.Ctx) error {
	var registerData map[string]string

	fmt.Println("register data... ", registerData)

	if err := c.BodyParser(&registerData); err != nil {
		return err
	}

	existingUser := &models.Users{}

	if err := database.Database.Db.Where("email = ?", registerData["email"]).First(existingUser).Error; err != nil {
		if err != gorm.ErrRecordNotFound {
			return err
		}
	} else {
		return c.JSON(fiber.Map{
			"success": false,
			"message": "email already in use",
		})
	}

	hashedPassword := make(chan []byte) // channel to recieve the hashed password

	go func() {
		hashedPassword <- utils.HashPassword(registerData["password"], []byte(SALT))
		close(hashedPassword)
	}()

	encryptedPassword := <-hashedPassword

	if encryptedPassword == nil {
		return c.JSON(fiber.Map{
			"success": false,
			"message": "could not encrypt password",
		})
	}

	// TODO: hash the password + send email verification

	user := models.Users{
		Email:    registerData["email"],
		Password: encryptedPassword,
	}

	if err := database.Database.Db.Create(&user).Error; err != nil {
		return err
	}

	fmt.Println("Registered this: ", registerData)

	return c.JSON(fiber.Map{
		"message": "successfully registered",
	})
}

func Login(c *fiber.Ctx) error {
	var loginData map[string]string

	if err := c.BodyParser(&loginData); err != nil {
		return err
	}

	// hande login
	fmt.Println("Login", loginData)

	user := &models.Users{}

	// get user from DB & check if the email exists + matches
	if err := database.Database.Db.Where("email = ?", loginData["email"]).First(user).Error; err != nil {
		c.Status(fiber.StatusBadRequest)
		return c.JSON(fiber.Map{
			"success": false,
			"message": "email not found",
		})
	} else {
		// check the hashed password

		hashedPassword := make(chan []byte) // channel to recieve the hashed password

		go func() {
			hashedPassword <- utils.HashPassword(loginData["password"], []byte(SALT))
			close(hashedPassword)
		}()

		encryptedPassword := <-hashedPassword

		if !bytes.Equal(user.Password, encryptedPassword) {
			return c.Status(401).JSON(fiber.Map{
				"message": "incorrect password",
			})
		} else {
			fmt.Println("passwords match")
			// make and send cookie - with claims

			// TODO: Make a session and store it in redis with the users details
			claims := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.StandardClaims{
				Issuer:    strconv.Itoa(int(user.ID)),
				ExpiresAt: time.Now().Add(time.Hour * 24).Unix(), //1 day
			})

			token, err := claims.SignedString([]byte(SecretKey))

			if err != nil {
				c.Status(fiber.StatusInternalServerError)
				return c.JSON(fiber.Map{
					"message": "could not create cookie",
				})
			}

			cookie := fiber.Cookie{
				Name:   "session",
				Value:  token,
				Domain: "localhost", // Replace with your domain name
				Path:   "/",
				// HTTPOnly: true,
				SameSite: "None",
				MaxAge:   86400, // 1 day
			}

			c.Cookie(&cookie)

			fmt.Println("Cookie is: ", cookie)

			return c.JSON(fiber.Map{
				"success": true,
				"message": "login was successful",
			})

		}
	}
}
