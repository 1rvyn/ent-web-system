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
var RedisKey = os.Getenv("REDIS_KEY")

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
	app.Get("/verify-user", VerifyUser)

	app.Post("/session", getUserfromSession)
}

func VerifyUser(c *fiber.Ctx) error {
	// get the token from the request

	fmt.Println("verifying user... ")

	sCookie := c.Cookies("session")

	if sCookie == "" {
		return c.JSON(fiber.Map{
			"message": false,
		})
	}

	// Get the session from redis
	session, err := database.Redis.GetHMap(sCookie)

	// fmt.Println("the session from redis in verify user is \n", session)

	// fmt.Println("the user role is \n", session["user_role"])
	if err != nil {
		return c.JSON(fiber.Map{
			"message": false,
		})
	}
	// fmt.Println("session: ", session)

	if session == nil {
		return c.JSON(fiber.Map{
			"message": false,
		})
	}

	if session["user_role"] == "2" {
		fmt.Println("authorized")
		return c.JSON(fiber.Map{
			"message": true,
		})
	} else {
		return c.JSON(fiber.Map{
			"message": false,
		})
	}

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
	fmt.Println("Project endpoint hit")

	var project models.Project
	if err := c.BodyParser(&project); err != nil {
		return err
	}

	// Retrieve user ID
	sessionCookie := c.Cookies("session")

	if sessionCookie == "" {
		return c.JSON(fiber.Map{
			"message": "user not found",
		})
	}

	// search for the session in redis
	session, err := database.Redis.GetHMap(sessionCookie)
	if err != nil {
		c.Status(fiber.StatusInternalServerError)
		return c.JSON(fiber.Map{
			"message": "failed to get session",
		})
	}

	userID := session["user_id"]

	fmt.Println("user id: ", userID)

	num, err := strconv.ParseUint(userID, 10, 0)
	if err != nil {
		return err
	}

	// TODO: Look into the use of pointers here - why? what is the difference?
	uintValue := uint(num)
	uintPointer := &uintValue
	project.OwnerID = uintPointer

	// Save the project to the database
	if err := database.Database.Db.Create(&project).Error; err != nil {
		return c.JSON(fiber.Map{
			"message": "failed to save project",
			"error":   err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "saved project",
		"project": project,
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
				Issuer:    string(rune(user.ID)),
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

			fmt.Println("The cookie we just made is: ", cookie)

			// Create a session and store it in redis

			SToken, err := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.StandardClaims{
				Issuer:    string(rune(user.ID)),
				ExpiresAt: time.Now().Add(time.Hour * 24).Unix(), //1 day
			}).SignedString([]byte(RedisKey))

			if err != nil {
				c.Status(fiber.StatusInternalServerError)
				return c.JSON(fiber.Map{
					"message": "failed to create session",
				})
			}

			session := make(map[string]interface{})
			session["user_id"] = user.ID
			session["email"] = user.Email
			session["token"] = SToken
			session["expires_at"] = time.Now().Add(time.Hour * 24).Unix()
			session["created_at"] = time.Now().Unix()
			session["user_role"] = user.UserRole
			// create a new token

			err = database.Redis.PutHMap(token, session)
			if err != nil {
				return err
			} else {
				fmt.Println("\nsuccessfully saved session to redis")
			}

			return c.JSON(fiber.Map{
				"success": true,
				"message": "login was successful",
			})

		}
	}
}

func getUserfromSession(c *fiber.Ctx) error {
	// get the users cookie
	cookie := c.Cookies("jwt")

	fmt.Println("the cookie is :", cookie)

	// search the cookie value in redis to get the session
	session, err := database.Redis.GetHMap(cookie)
	if err != nil {
		return err
	}

	// TODO: we need to validate the token (not a huge security risk but still)

	fmt.Println("\nthe session we got from redis is :", session)

	// get the user's ID from the session
	userID := session["userID"]
	sessionToken := session["sessionID"]

	fmt.Println("\nthe userID is :", userID)

	fmt.Println("\nthe sessionToken is :", sessionToken)

	return c.JSON(fiber.Map{
		"message": "successfully got user from session",
		"userID":  userID,
		"session": session,
	})
}
