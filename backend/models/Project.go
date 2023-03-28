package models

import (
	"encoding/json"
	"gorm.io/gorm"
)

type Project struct {
	ID                uint               `json:"id" gorm:"primaryKey"`
	Title             string             `json:"title"`
	Description       string             `json:"description"`
	Workers           []ProjectWorker    `json:"workers" gorm:"foreignKey:ProjectID"`
	NonHumanResources []NonHumanResource `json:"nonHumanResources" gorm:"foreignKey:ProjectID"`
	OwnerID           *uint              `json:"owner_id"` // we use a pointer to allow for null values
}

type ProjectWorker struct {
	ID         uint    `json:"id" gorm:"primaryKey"`
	Type       string  `json:"type"`
	NumWorkers int     `json:"numWorkers" gorm:"column:num_workers"`
	NumHours   float64 `json:"numHours" gorm:"column:num_hours"`
	Rate       float64 `json:"rate" gorm:"column:rate"`
	ProjectID  uint    `json:"projectId" gorm:"column:project_id"`
}

type NonHumanResource struct {
	ID        uint   `json:"id" gorm:"primaryKey"`
	Name      string `json:"name"`
	Cost      int    `json:"cost"`
	Mode      string `json:"mode"`
	ProjectID uint   `json:"projectId" gorm:"column:project_id"`
}

func (pw *ProjectWorker) BeforeCreate(tx *gorm.DB) (err error) {
	pw.setBaseRate()
	return
}

func (pw *ProjectWorker) setBaseRate() {
	switch pw.Type {
	case "intern":
		pw.Rate = 15
	case "junior":
		pw.Rate = 25
	case "mid":
		pw.Rate = 60
	case "senior":
		pw.Rate = 120
	default:
		pw.Rate = 10
	}
}

// handle parsing json properly

func (p *Project) UnmarshalJSON(data []byte) error {
	type Alias Project
	aux := &struct {
		Workers           []json.RawMessage `json:"workers"`
		NonHumanResources []json.RawMessage `json:"nonHumanResources"`
		*Alias
	}{
		Alias: (*Alias)(p),
	}
	if err := json.Unmarshal(data, &aux); err != nil {
		return err
	}
	for _, raw := range aux.Workers {
		var worker ProjectWorker
		if err := json.Unmarshal(raw, &worker); err != nil {
			return err
		}
		p.Workers = append(p.Workers, worker)
	}
	for _, raw := range aux.NonHumanResources {
		var resource NonHumanResource
		if err := json.Unmarshal(raw, &resource); err != nil {
			return err
		}
		p.NonHumanResources = append(p.NonHumanResources, resource)
	}
	return nil
}
