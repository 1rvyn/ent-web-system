package models

import (
	"encoding/json"
	"fmt"
	"math/rand"
	"time"
)

type Project struct {
	ID                uint               `json:"id" gorm:"primaryKey"`
	Title             string             `json:"title"`
	Description       string             `json:"description"`
	Workers           []ProjectWorker    `json:"workers" gorm:"foreignKey:ProjectID"`
	NonHumanResources []NonHumanResource `json:"nonHumanResources" gorm:"foreignKey:ProjectID"`
	Overhead          float64            `json:"overhead"` // real cost
	Quote             float64            `json:"quote"`    // fudge factor adjusted cost
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

//func (pw *ProjectWorker) BeforeCreate(tx *gorm.DB) (err error) {
//	pw.setBaseRate()
//	return
//}

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
		worker.setBaseRate() // Set the worker rate here
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

func CalculateOverheadAndQuote(project *Project) {
	fmt.Println("Calculating overhead and quote for the project: " + project.Title)
	overhead := 0.0
	quote := 0.0

	// Seed the random number generator
	rand.Seed(time.Now().UnixNano())

	totalWorkers := 0
	for _, worker := range project.Workers {
		totalWorkers += worker.NumWorkers
		workerCost := float64(worker.NumWorkers) * worker.NumHours * worker.Rate
		fmt.Println("the worker rate is: " + fmt.Sprintf("%f", worker.Rate))
		overhead += workerCost

		var minFudgeFactor, maxFudgeFactor float64
		switch worker.Type {
		case "intern":
			minFudgeFactor, maxFudgeFactor = 0.95, 1.35
		case "junior":
			minFudgeFactor, maxFudgeFactor = 0.9, 1.3
		case "mid":
			minFudgeFactor, maxFudgeFactor = 0.95, 1.25
		case "senior":
			minFudgeFactor, maxFudgeFactor = 0.95, 1.2
		}
		// keep it within 10% either way of the actual cost per worker
		fudgeFactor := minFudgeFactor + rand.Float64()*(maxFudgeFactor-minFudgeFactor)
		quote += workerCost * fudgeFactor
	}

	for _, resource := range project.NonHumanResources {
		if resource.Mode == "daily" {
			overhead += float64(resource.Cost) * 30
			quote += float64(resource.Cost) * 30
		} else {
			overhead += float64(resource.Cost)
			quote += float64(resource.Cost)
		}
		fmt.Println("the resource mode is: " + resource.Mode)
	}

	// this will prevent users from creating quotes with low worker counts and getting information on our worker rates
	if totalWorkers < 10 {
		randomBaseCost := rand.Float64() * 10000
		quote += randomBaseCost
	}

	project.Overhead = overhead
	project.Quote = quote
}
