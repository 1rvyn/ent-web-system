package models

type Users struct {
	Id       int    `json:"id" gorm:"primaryKey"`
	Email    string `json:"email"`
	Password []byte `json:"password"`
}