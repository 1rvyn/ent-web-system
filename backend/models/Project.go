package models

import "encoding/json"

type Project struct {
	ID          uint            `json:"id" gorm:"primaryKey"`
	Title       string          `json:"title"`
	Description string          `json:"description"`
	Workers     []ProjectWorker `json:"workers" gorm:"foreignKey:ProjectID"`
	OwnerID     *uint           `json:"owner_id"` // we use a pointer to allow for null values
}

type ProjectWorker struct {
	ID         uint    `json:"id" gorm:"primaryKey"`
	Type       string  `json:"type"`
	NumWorkers int     `json:"numWorkers" gorm:"column:num_workers"`
	HourlyRate float64 `json:"hourlyRate" gorm:"column:hourly_rate"`
	NumHours   int     `json:"numHours" gorm:"column:num_hours"`
	ProjectID  uint    `json:"projectId" gorm:"column:project_id"`
}

// handle parsing json properly

func (p *Project) UnmarshalJSON(data []byte) error {
	type Alias Project
	aux := &struct {
		Workers []json.RawMessage `json:"workers"`
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
	return nil
}
