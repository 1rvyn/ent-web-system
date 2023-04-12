import React, {useEffect, useState} from 'react';
import './assets/getproj.css';


function Getprojs(props) {
    const [projects, setProjects] = useState([]);
    const { isLoggedIn } = props;
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasLoadedProjects, setHasLoadedProjects] = useState(false);
    const [editingProjectId, setEditingProjectId] = useState(null);



    const [mergeMode, setMergeMode] = useState(false);
    const [selectedProjects, setSelectedProjects] = useState(new Set());


    // // Fetch projects on component mount -- we might use this to refresh to show the new combined quote/project
    // useEffect(() => {
    //     fetchProjects();
    // }, []);

    // toggle merge mode
    const toggleMergeMode = () => {
        setMergeMode(!mergeMode);
        setSelectedProjects(new Set());
    };

    // handle selecting cards

    const handleProjectCardClick = (projectId) => {
        if (!mergeMode) return;

        const newSelectedProjects = new Set(selectedProjects);
        if (newSelectedProjects.has(projectId)) {
            newSelectedProjects.delete(projectId);
        } else {
            newSelectedProjects.add(projectId);
        }
        setSelectedProjects(newSelectedProjects);
    };


    // combine projects
    const mergeSelectedProjects = async () => {
        console.log('Merging projects:', selectedProjects); // debug
        console.log("projects are ", Array.from(selectedProjects))

        try {
            const response = await fetch('http://localhost:8085/merge-projects', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                mode: 'cors',
                credentials: 'include',
                body: JSON.stringify({
                    projectIds: Array.from(selectedProjects)
                })
            });

            if (!response.ok) {
                throw new Error('Failed to merge projects');
            }

            const data = await response.json();
            console.log(data.MergedQuote)
            alert("Merged Quote: £" + data.MergedQuote.toFixed(2))
            // setProjects(data.projects);
            setHasLoadedProjects(true); // Set to true after successfully loading projects
        } catch (error) {
            alert(error.message);
        }
        finally {
        setMergeMode(false); // these two lines un select the projects after merging
        setSelectedProjects(new Set());

        }
    };


    const fetchProjects = async () => {
        setIsSubmitting(true);

        try {
            const response = await fetch('http://localhost:8085/get-projects', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                mode: 'cors',
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Failed to fetch projects');
            }

            const data = await response.json();
            console.log(data.projects)
            setProjects(data.projects);
            setHasLoadedProjects(true); // Set to true after successfully loading projects


        } catch (error) {
            alert(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const editProject = (e, projectId) => {
        e.stopPropagation(); // Prevent triggering project card click
        setEditingProjectId(projectId);
    };

    const updateProject = async (projectId, title, workers, nonHumanResources) => {
        console.log('Updating project with ID:', projectId)
        console.log('New project title:', title, 'New workers:', workers, 'New non-human resources:', nonHumanResources)
        const response = await fetch(`http://localhost:8085/projects/${projectId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            mode: 'cors',
            credentials: 'include',
            body: JSON.stringify({
                title,
                workers,
                nonHumanResources
            })
        });
        
        if (response.ok) {
            // If the update was successful, update the UI
            // You can fetch the updated list of projects or update the local state
            const updatedProject = await response.json();
            console.log('Updated project:', updatedProject)
            setProjects((prevProjects) =>
                prevProjects.map((project) => (project.id === projectId ? updatedProject : project))
            );
        } else {
            // Handle error, show a message to the user
        }
    };

    const saveChanges = async (e, projectId) => {
        e.stopPropagation(); // Prevent triggering project card click

        // Collect the updated values from the input fields
        const updatedTitle = document.getElementById(`project-title-${projectId}`).value;
        const updatedWorkers = (projects.find((proj) => proj.id === projectId).workers || []).map(
            (worker, idx) => {
                return {
                    ...worker,
                    numWorkers: parseInt(document.getElementById(`worker-num-${projectId}-${idx}`).value, 10),
                    numHours: parseInt(document.getElementById(`worker-hours-${projectId}-${idx}`).value, 10),
                };
            }
        );
        const updatedNonHumanResources = (projects.find((proj) => proj.id === projectId).nonHumanResources || []).map(
            (resource, idx) => {
                return {
                    ...resource,
                    name: document.getElementById(`resource-name-${projectId}-${idx}`).value,
                    cost: parseFloat(document.getElementById(`resource-cost-${projectId}-${idx}`).value),
                    mode: document.getElementById(`resource-mode-${projectId}-${idx}`).value,
                };
            }
        );

        // Call the updateProject function to send the updates to the backend
        await updateProject(projectId, updatedTitle, updatedWorkers, updatedNonHumanResources);

        setEditingProjectId(null); // Exit edit mode
    };

    const ConfirmDelete = ({ projectId, onDelete }) => {
        const [isConfirming, setIsConfirming] = useState(false);

        const handleDeleteClick = () => {
          if (isConfirming) {
            onDelete(projectId);
          }
          setIsConfirming(!isConfirming);
        };

      
        return (
          <button className="delete-button" onClick={handleDeleteClick}>
            {isConfirming ? (
              <i className="fas fa-check-circle"></i>
            ) : (
              <i className="fas fa-trash-alt"></i>
            )}
          </button>
        );
      };
      
    
      async function sendDelete(id) {
        console.log('Deleting project with ID:', id)
        try {
          const response = await fetch(`http://localhost:8085/delete-project/${id}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            mode: 'cors',
            credentials: 'include',
          });
      
          if (!response.ok) {
            throw new Error('Failed to delete project');
          }
      
          const data = await response.json();
          console.log('Project deletion response:', data);

        } catch (error) {
            console.error(`Failed to delete project with ID ${id}:`, error);
        }
    }
      

    const deleteProject = async (projectId) => {
        try {
            // Replace with your backend API call to delete a project by ID
            await sendDelete(projectId);
    
            // Update the projects array by filtering out the deleted project
            setProjects((prevProjects) =>
                prevProjects.filter((project) => project.id !== projectId)
            );
        } catch (error) {
            console.error(`Failed to delete project with ID ${projectId}:`, error);
            throw error;
        }
    };

    // for sub tasks
    const MinifiedProjectCard = ({ project }) => (
        <div className="minified-project-card">
          <h4>{project.title || 'Untitled Project'}</h4>
          <p>ID: {project.id || 'No project ID provided.'}</p>
          <p>Quote: £{project.quote.toFixed(2) !== null ? project.quote.toFixed(2) : 'No quote available.'}</p>
        </div>
      );
      

      return (
        <div className="getprojs">
            <button onClick={fetchProjects} disabled={isSubmitting}>
                {isSubmitting ? 'Loading...' : 'Load Projects'}
            </button>
            {hasLoadedProjects && (
                <button onClick={toggleMergeMode}>
                    {mergeMode ? 'Cancel Merge' : 'Merge Projects'}
                </button>

            )}
            {mergeMode && (
                <button onClick={mergeSelectedProjects} disabled={selectedProjects.size < 2}>
                    Submit Merge
                </button>
            )}
            <div className="projects-container">
                {projects.map((project, index) => (
                    <div
                        key={index}
                        className={`project-card ${mergeMode ? 'merge-mode' : ''} ${
                            selectedProjects.has(project.id) ? 'selected' : ''}`}
                        onClick={() => handleProjectCardClick(project.id)}
                    >
                        {editingProjectId === project.id ? (
                            <input
                                id={`project-title-${project.id}`}
                                type="text"
                                defaultValue={project.title || 'Untitled Project'}
                            />
                        ) : (
                            <h3>{project.title || 'Untitled Project'}</h3>
                        )}
                        <p>ID: {project.id || 'No project ID provided.'}</p>
                        <ConfirmDelete projectId={project.id} onDelete={deleteProject} />
                        <button
                            className="edit-button"
                            onClick={(e) =>
                                editingProjectId === project.id
                                    ? saveChanges(e, project.id)
                                    : editProject(e, project.id)
                            }
                        >
                            {editingProjectId === project.id ? (
                                <i className="fas fa-check-circle"></i>

                            ) : (
                                <i className="fas fa-pencil-alt"></i>
                            )}
                        </button>

                        {editingProjectId === project.id && (
                            <button
                                className="cancel-button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingProjectId(null);
                                }}
                            >
                                <i className="fas fa-times-circle"></i>
                            </button>
                        )}

                        <p>Quote: £{project.quote.toFixed(2) !== null ? project.quote.toFixed(2) : 'No quote available.'}</p>
    
                        {!project.subTaskIDs && (
                            <>
                                <div className="workers-container">
                                    <h4>Workers</h4>
                                    {(project.workers || []).map((worker, idx) => (
                                        <div key={idx} className="worker-info">
                                            {editingProjectId === project.id ? (
                                                <>
                                                    <label>Type: {worker.type}</label>
                                                    <input
                                                        id={`worker-num-${project.id}-${idx}`}
                                                        type="number"
                                                        defaultValue={worker.numWorkers}
                                                    />
                                                    <input
                                                        id={`worker-hours-${project.id}-${idx}`}
                                                        type="number"
                                                        defaultValue={worker.numHours}
                                                    />
                                                </>
                                            ) : (
                                                <>
                                                    <p>Type: {worker.type}</p>
                                                    <p>Number of workers: {worker.numWorkers}</p>
                                                    <p>Weekly Hours: {worker.numHours}</p>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <div className="non-human-resources-container">
                                    <h4>Non-Human Resources</h4>
                                    {(project.nonHumanResources || []).map((resource, idx) => (
                                        <div key={idx} className="resource-info">
                                            {editingProjectId === project.id ? (
                                                <>
                                                    <input
                                                        id={`resource-name-${project.id}-${idx}`}
                                                        type="text"
                                                        defaultValue={resource.name}
                                                    />
                                                    <input
                                                        id={`resource-cost-${project.id}-${idx}`}
                                                        type="number"
                                                        defaultValue={resource.cost}
                                                    />
                                                    <select
                                                        id={`resource-mode-${project.id}-${idx}`}
                                                        defaultValue={resource.mode}
                                                    >
                                                        <option value="Daily">Daily</option>
                                                        <option value="Monthly">Monthly</option>
                                                    </select>
                                                </>
                                            ) : (
                                                <>
                                                    <p>Name: {resource.name}</p>
                                                    <p>Cost: {resource.cost}</p>
                                                    <p>Mode: {resource.mode}</p>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
    
                        {project.subTaskIDs && project.subTaskIDs.length > 0 && (
                            <div className="subtasks-container">
                                <h4>Subtasks</h4>
                                {project.subTaskIDs.map((subTaskID) => {
                                    const subTask = projects.find((proj) => proj.id === subTaskID);
                                    return subTask ? <MinifiedProjectCard key={subTask.id} project={subTask} /> : null;
                                })}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
    }
    
    export default Getprojs;
    
