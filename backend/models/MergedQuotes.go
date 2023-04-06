package models

type MergedQuotes struct {
	MergedQuoteID uint    `json:"merged_id" gorm:"primaryKey"`
	OwnerID       uint    `json:"ownerId"`
	Quote         float64 `json:"quote"`
	Overhead      float64 `json:"overhead"`
}
