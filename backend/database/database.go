package database

import (
	"enterpriseweb/models"
	"fmt"
	"log"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

type Dbinstance struct {
	Db *gorm.DB
}

var host = "localhost" // "db" when docker-compose
var port = "5432"
var user = "irvyn" // "postgres" when docker-compose
var password = "password"
var dbname = "postgres"

var Database Dbinstance

func ConnectDb() {
	psqlconn := fmt.Sprintf("user=%s password=%s host=%s port=%s dbname=%s sslmode=disable", user, password, host, port, dbname)

	db, err := gorm.Open(postgres.Open(psqlconn), &gorm.Config{})
	if err != nil {
		log.Fatal("failed to connect to the database \n", err.Error())
	}

	log.Printf("there was a successful connection to the: %s Database", dbname)

	db.Logger = logger.Default.LogMode(logger.Info)
	log.Println("Running Migrations")

	err = db.AutoMigrate(&models.Users{})
	if err != nil {
		return
	}

	Database = Dbinstance{Db: db}
}
