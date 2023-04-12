package utils

import (
	"encoding/json"
	"enterpriseweb/models"
)

type ProjectResponse struct {
	ID                uint                      `json:"id"`
	Title             string                    `json:"title"`
	Description       string                    `json:"description"`
	Workers           []ProjectWorkerResponse   `json:"workers"`
	NonHumanResources []models.NonHumanResource `json:"nonHumanResources"`
	Quote             float64                   `json:"quote"`
	OwnerID           *uint                     `json:"owner_id"`
	SubTaskIDs        json.RawMessage           `json:"subTaskIDs"`
}

type ProjectWorkerResponse struct {
	ID         uint    `json:"id"`
	Type       string  `json:"type"`
	NumWorkers int     `json:"numWorkers"`
	NumHours   float64 `json:"numHours"`
	ProjectID  uint    `json:"projectId"`
}

type NonHumanResource struct {
	ID        uint   `json:"id"`
	Name      string `json:"name"`
	Cost      int    `json:"cost"`
	Mode      string `json:"mode"`
	ProjectID uint   `json:"projectId"`
}

func ProjectToResponse(project *models.Project) ProjectResponse {
	var workerResponses []ProjectWorkerResponse
	for _, worker := range project.Workers {
		workerResponses = append(workerResponses, ProjectWorkerResponse{
			ID:         worker.ID,
			Type:       worker.Type,
			NumWorkers: worker.NumWorkers,
			NumHours:   worker.NumHours,
			ProjectID:  worker.ProjectID,
		})
	}

	return ProjectResponse{
		ID:                project.ID,
		Title:             project.Title,
		Description:       project.Description,
		Workers:           workerResponses,
		NonHumanResources: project.NonHumanResources,
		Quote:             project.Quote,
		OwnerID:           project.OwnerID,
		SubTaskIDs:        project.SubTaskIDs,
	}
}
