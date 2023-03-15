package models

type Project struct {
	ID          uint            `json:"id" gorm:"primaryKey"`
	Title       string          `json:"title"`
	Description string          `json:"description"`
	Workers     []ProjectWorker `json:"workers" gorm:"foreignKey:ProjectID"`
	OwnerID     *uint           `json:"owner_id"` // we use a pointer to allow for null values
}

type ProjectWorker struct {
	ID         uint   `json:"id" gorm:"primaryKey"`
	Type       string `json:"type"`
	NumWorkers int    `json:"num_workers"`
	HourlyRate int    `json:"hourly_rate"`
	NumHours   int    `json:"num_hours"`
	ProjectID  uint   `json:"project_id"`
}
