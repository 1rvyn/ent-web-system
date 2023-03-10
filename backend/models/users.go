package models

type Users struct {
	ID       int    `json:"id" gorm:"primaryKey"`
	Email    string `json:"email"`
	Password []byte `json:"password"`
}
