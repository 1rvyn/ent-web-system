package main

import (
	"bytes"
	"encoding/json"
	"enterpriseweb/database"
	"enterpriseweb/models"
	"enterpriseweb/routes"
	"enterpriseweb/utils"
	"fmt"
	"os"
	"regexp"
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

const (
	MinPasswordLength = 8
	MaxPasswordLength = 32
)

func validateEmail(email string) bool {
	// Using a simple regex pattern to validate the email
	// You can use more sophisticated patterns if necessary
	r := regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)
	return r.MatchString(email)
}

func validatePassword(password string) bool {
	length := len(password)
	return length >= MinPasswordLength && length <= MaxPasswordLength
}

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
	app.Get("/proj", GetProjects)
	app.Post("/test", Test)
	app.Get("/verify-user", VerifyUser)
	app.Delete("/delete-project/:id", DeleteProject)

	app.Post("/session", getUserfromSession)

	app.Get("/get-projects", RetrieveProjects)

	app.Post("/merge-projects", MergeProjects)

	app.Post("/logout", Logout)

	app.Put("/projects/:id", UpdateProject)

	app.Post("/update-worker-rate", UpdateWorkerRate)

	//app.Post("/update-project", UpdateProject)
}

func UpdateWorkerRate(c *fiber.Ctx) error {
	fmt.Println("UpdateWorkerRate endpoint hit")

	// Retrieve user ID
	sessionCookie := c.Cookies("session")

	if sessionCookie == "" {
		return c.SendStatus(401)
	}

	// search for the session in redis
	session, err := database.Redis.GetHMap(sessionCookie)
	if err != nil {
		c.Status(fiber.StatusInternalServerError)
		return c.JSON(fiber.Map{
			"message": "failed to get session",
		})
	}

	if session["user_role"] == "2" {
		fmt.Println("user is an admin")

		// Parse the JSON body - its just 3 numbers
		var updateData models.UpdateRate

		// Parse the JSON body into the updateData instance
		if err := json.Unmarshal(c.Body(), &updateData); err != nil {
			fmt.Println("error parsing JSON body")
			return c.Status(400).SendString("error parsing JSON body")
		}

		fmt.Println("updated workers data is", updateData.Workers)

		var project models.Project

		database.Database.Db.Preload("Workers").Preload("NonHumanResources").First(&project, updateData.ProjectID)

		// update the workers with the new ones

		database.Database.Db.Delete(&models.ProjectWorker{}, "project_id = ?", updateData.ProjectID)

		for _, worker := range updateData.Workers {
			database.Database.Db.Create(&models.ProjectWorker{
				ProjectID:  worker.ProjectID,
				ID:         worker.ID,
				Rate:       worker.Rate,
				Type:       worker.Type,
				NumWorkers: worker.NumWorkers,
				NumHours:   worker.NumHours,
			})
		}

		var project2 models.Project

		database.Database.Db.Preload("Workers").Preload("NonHumanResources").First(&project2, updateData.ProjectID)

		fmt.Println("updated project2 is", project2)

		models.CalculateOverheadAndQuote(&project2)

		database.Database.Db.Save(&project2)

		// update the workers rate from the database

		return c.Status(200).JSON(project2)

		// Get the projects from the database

	} else {
		return c.SendStatus(401)
	}

}

func UpdateProject(c *fiber.Ctx) error {
	// get the project id from the url
	id := c.Params("id")

	fmt.Println("id is", id)

	// get the users session
	sessionCookie := c.Cookies("session")

	if sessionCookie == "" {
		fmt.Println("no session cookie")
		return c.SendStatus(401)
	}

	session, err := database.Redis.GetHMap(sessionCookie)
	if err != nil {
		fmt.Println("error getting session from redis")
		return c.SendStatus(401)
	}

	fmt.Println("session is", session)

	userID := session["user_id"]

	fmt.Println("user id is", userID)

	userIDUint, err := strconv.ParseUint(userID, 10, 32)
	if err != nil {
		fmt.Println("error converting user id to uint")
	}

	// verify user owns the project
	var project models.Project
	database.Database.Db.Preload("Workers").Preload("NonHumanResources").First(&project, id)

	fmt.Println("existing workers rates: ", project.Workers)

	if *project.OwnerID != uint(userIDUint) {
		return c.Status(401).SendString("user does not own project")
	}

	// update the project

	var updateData models.UpdateProjectData

	// Parse the JSON body into the updateData instance
	if err := json.Unmarshal(c.Body(), &updateData); err != nil {
		fmt.Println("error parsing JSON body")
		return c.Status(400).SendString("Invalid JSON body")
	}

	workersChanged := len(project.Workers) != len(updateData.Workers)
	if !workersChanged {
		for i, worker := range updateData.Workers {
			if project.Workers[i].Type != worker.Type || project.Workers[i].NumWorkers != worker.NumWorkers || project.Workers[i].NumHours != worker.NumHours {
				workersChanged = true
			}
		}
	}

	// fmt.Println("aaaa", updateData.NonHumanResources[0].Mode, "EXISTING", project.NonHumanResources[0].Mode)
	// Compare and update non-human-resources
	nonHumanResourcesChanged := false
	if len(project.NonHumanResources) != len(updateData.NonHumanResources) {
		nonHumanResourcesChanged = true
	} else {
		for i, resource := range updateData.NonHumanResources {
			if project.NonHumanResources[i].Name != resource.Name ||
				project.NonHumanResources[i].Cost != resource.Cost ||
				project.NonHumanResources[i].Mode != resource.Mode {
				nonHumanResourcesChanged = true
				break
			}
		}
	}
	if workersChanged {
		database.Database.Db.Delete(&models.ProjectWorker{}, "project_id = ?", project.ID)

		// Update workers with the rate from the original project's workers
		for i, worker := range updateData.Workers {
			for _, existingWorker := range project.Workers {
				if worker.Type == existingWorker.Type {
					updateData.Workers[i].Rate = existingWorker.Rate
					break
				}
			}
		}

		// Add updated workers
		for _, worker := range updateData.Workers {
			worker.ProjectID = project.ID
			database.Database.Db.Create(&worker)
		}
		// Update project with the new workers
		project.Workers = updateData.Workers
	}

	if nonHumanResourcesChanged {
		// Delete existing non-human-resources
		database.Database.Db.Delete(&models.NonHumanResource{}, "project_id = ?", project.ID)

		// Add updated non-human-resources
		for _, resource := range updateData.NonHumanResources {
			resource.ProjectID = project.ID
			database.Database.Db.Create(&resource)
		}
		// Update project with the new non-human-resources
		project.NonHumanResources = updateData.NonHumanResources

	}

	if workersChanged || nonHumanResourcesChanged || project.Title != updateData.Title {

		project.Title = updateData.Title

		models.CalculateOverheadAndQuote(&project)

		// Save the updated project to the database
		database.Database.Db.Save(&project)
	}

	response := utils.ProjectToResponse(&project) // prevent user from seeing overhead

	return c.Status(200).JSON(response)
}

func Logout(c *fiber.Ctx) error {
	fmt.Println("logging out")
	// validate its a logged in user trying to logout
	sessionCookie := c.Cookies("session")

	if sessionCookie == "" {
		fmt.Println("no session cookie")
		return c.SendStatus(401)
	}

	// search for the session in redis
	session, err := database.Redis.GetHMap(sessionCookie)
	if err != nil {
		fmt.Println("error getting session from redis")
		return c.SendStatus(401)
	}

	// fmt.Println("deleting the token", session["token"])
	// since there is a session, delete it from redis
	err = database.Redis.DeleteHMap(session["token"])
	if err != nil {
		fmt.Println("error deleting session from redis")
		return c.SendStatus(401)
	}

	// delete the session cookie
	c.ClearCookie("session")
	return c.SendStatus(200)
}

// TODO: Save the projects added properly
func MergeProjects(c *fiber.Ctx) error {
	sessionCookie := c.Cookies("session")

	if sessionCookie == "" {
		return c.SendStatus(401)
	}

	session, err := database.Redis.GetHMap(sessionCookie)
	if err != nil {
		fmt.Println("error getting session from redis")
		return c.SendStatus(401)
	}

	userID := session["user_id"]

	userIDUint, err := strconv.ParseUint(userID, 10, 32)
	if err != nil {
		fmt.Println("error converting user id to uint")
	}

	// fmt.Println("user id is: ", userIDUint)

	type ProjectID struct {
		ProjectIds []int `json:"projectIds"`
	}

	var request ProjectID
	if err := json.Unmarshal(c.Body(), &request); err != nil {
		return c.SendStatus(400)
	}

	// fmt.Println("project ID's are: ", request.ProjectIds)

	var projects []models.Project
	for _, projectID := range request.ProjectIds {
		var project models.Project
		database.Database.Db.First(&project, projectID)
		projects = append(projects, project)
	}

	var totalOverhead float64
	for _, project := range projects {
		if *project.OwnerID != uint(userIDUint) {
			fmt.Println("user is not the owner of the project")
			return c.SendStatus(401)
		}
		totalOverhead += project.Overhead
		fmt.Println("project overhead is: ", project.Overhead, "for project: ", project.Title)
	}

	quote := totalOverhead * utils.RandomFloat64(0.89, 1.11)
	// fmt.Println("random num", utils.RandomFloat64(0.89, 1.11))
	// fmt.Println("quote we made", quote)

	// Create a new project
	var newProject models.Project
	newProject.OwnerID = new(uint)         // initialize a new *uint
	*newProject.OwnerID = uint(userIDUint) // assign the value
	newProject.Overhead = totalOverhead
	newProject.Quote = quote

	// super inefficient way of doing this - making a json array of project IDs
	subTaskIDsJSON := []uint{}
	for _, project := range projects {
		subTaskIDsJSON = append(subTaskIDsJSON, project.ID)
	}
	subTaskIDsJSONBytes, err := json.Marshal(subTaskIDsJSON)
	if err != nil {
		return c.Status(500).SendString("Failed to marshal subtask IDs")
	}
	newProject.SubTaskIDs = json.RawMessage(subTaskIDsJSONBytes)

	// Save the new project to the database
	database.Database.Db.Create(&newProject)

	return c.Status(200).JSON(fiber.Map{
		"MergedQuote":  quote,
		"NewProjectID": newProject.ID,
	})
}

func DeleteProject(c *fiber.Ctx) error {
	// get the users session
	sessionCookie := c.Cookies("session")

	if sessionCookie == "" {
		return c.SendStatus(401)
	}

	// search for the session in redis
	session, err := database.Redis.GetHMap(sessionCookie)
	if err != nil {
		fmt.Println("error getting session from redis")
	}

	// get the user id from the session
	userID := session["user_id"]

	// convert the user id to a uint from string
	userIDUint, err := strconv.ParseUint(userID, 10, 32)
	if err != nil {
		fmt.Println("error converting user id to uint")
	}

	// get the project id from the url
	projectID := c.Params("id")

	// check to make sure the user owns the project
	var project models.Project
	database.Database.Db.First(&project, projectID)

	// fmt.Println("project id is: ", project.ID)
	// fmt.Println("user id from the URL param is: ", projectID)
	// fmt.Println("user id from the session is: ", userIDUint)

	projectIDUint, err := strconv.ParseUint(projectID, 10, 32)
	if err != nil {
		fmt.Println("error converting project id to uint")
	}

	// Ensure the user owns the project
	if project.OwnerID == nil || uint(userIDUint) != *project.OwnerID {
		return c.Status(401).JSON(fiber.Map{
			"message": "you do not own this project",
		})
	}

	// delete the project from the database using a transaction
	err = database.Database.Db.Transaction(func(tx *gorm.DB) error {
		// delete project workers
		if err := tx.Where("project_id = ?", projectIDUint).Delete(&models.ProjectWorker{}).Error; err != nil {
			return err
		}

		// delete non-human resources
		if err := tx.Where("project_id = ?", projectIDUint).Delete(&models.NonHumanResource{}).Error; err != nil {
			return err
		}

		// delete the project
		if err := tx.Delete(&project).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		// handle transaction error
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": "failed to delete the project",
			"error":   err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "project deleted",
	})
}

func RetrieveProjects(c *fiber.Ctx) error {
	fmt.Println("RetrieveProjects endpoint hit")

	// Retrieve user ID
	sessionCookie := c.Cookies("session")

	if sessionCookie == "" {
		return c.SendStatus(401)
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

	if session["user_role"] == "2" {
		fmt.Println("user is an admin")
		userIDUint, err := strconv.ParseUint(userID, 10, 32)
		if err != nil {
			fmt.Println("error converting user id to uint")
		}

		fmt.Println("getting projects for the user with the ID of: ", userIDUint)

		// Get the projects from the database
		var projects []models.Project
		database.Database.Db.Preload("Workers").Preload("NonHumanResources").Where("owner_id = ?", userIDUint).Find(&projects)

		return c.JSON(fiber.Map{
			"message":  "success",
			"projects": projects,
		})
	} else {

		// convert the user id to a uint from string
		userIDUint, err := strconv.ParseUint(userID, 10, 32)
		if err != nil {
			fmt.Println("error converting user id to uint")
		}

		fmt.Println("getting projects for the user with the ID of: ", userIDUint)

		// Get the projects from the database
		var projects []models.Project
		database.Database.Db.Preload("Workers").Preload("NonHumanResources").Where("owner_id = ?", userIDUint).Find(&projects)

		// Create a slice to store the project responses
		var projectResponses []utils.ProjectResponse

		// Loop through the projects and convert each project to a ProjectResponse
		for _, project := range projects {
			projectResponse := utils.ProjectToResponse(&project)
			projectResponses = append(projectResponses, projectResponse)
		}

		fmt.Println("projects", projectResponses)

		return c.JSON(fiber.Map{
			"message":  "success",
			"projects": projectResponses,
		})
	}
}

//func UpdateProject(c *fiber.Ctx) error {
//
//}

func GetProjects(c *fiber.Ctx) error {
	fmt.Println("GetProjects endpoint hit")

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
	fmt.Println("getting projects for the user with the ID of: ", userID)

	// Get the projects from the database

	var projects []models.Project
	if err := database.Database.Db.Where("owner_id = ?", userID).Find(&projects).Error; err != nil {
		return err
	}

	// Create a slice to store the project responses
	var projectResponses []utils.ProjectResponse

	// Loop through the projects and convert each project to a ProjectResponse
	for _, project := range projects {
		projectResponse := utils.ProjectToResponse(&project)
		projectResponses = append(projectResponses, projectResponse)
	}

	return c.JSON(fiber.Map{
		"message":  "success",
		"projects": projectResponses,
	})
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

	// calulate the total cost of the project (fudge + real)
	models.CalculateOverheadAndQuote(&project)

	fmt.Println("project: ", project)

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
		"quote":   project.Quote,
	})
}

func Register(c *fiber.Ctx) error {
	var registerData map[string]string

	fmt.Println("register data... ", registerData)

	if err := c.BodyParser(&registerData); err != nil {
		return err
	}

	if !validateEmail(registerData["email"]) {
		return c.JSON(fiber.Map{
			"success": false,
			"message": "invalid email",
		})
	}

	if !validatePassword(registerData["password"]) {
		return c.JSON(fiber.Map{
			"success": false,
			"message": "password must be at least 8 characters",
		})
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

	// if the email is pamj@rgu.ac.uk
	// give admin role
	if user.Email == "pamj@rgu.ac.uk" {
		user.UserRole = 2
	} else {
		user.UserRole = 1
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
