package database

import (
	"context"
	"log"

	"github.com/go-redis/redis/v8"
)

var RedisClient *redis.Client

func ConnectToRedis() {
	RedisClient = redis.NewClient(&redis.Options{
		Addr:     "redis:6379", // Redis service name on the Docker network
		Password: "",
		DB:       0,
	})

	// Test the connection
	if err := RedisClient.Ping(context.Background()).Err(); err != nil {
		log.Fatalf("Failed to connect to Redis: %s", err)
	}

	log.Println("Connected to Redis")
}

func Set(key string, value string) error {
	return RedisClient.Set(context.Background(), key, value, 0).Err()
}

func Get(key string) (string, error) {
	return RedisClient.Get(context.Background(), key).Result()
}
