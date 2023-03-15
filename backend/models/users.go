package models

import "time"

type Users struct {
	ID        int       `json:"id" gorm:"primaryKey"`
	Email     string    `json:"email"`
	Password  []byte    `json:"password"`
	UserRole  int       `gorm:"default:1"`
	CreatedAt time.Time `json:"created_at"`
}
