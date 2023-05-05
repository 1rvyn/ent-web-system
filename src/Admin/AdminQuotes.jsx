import React, { useState } from 'react';

function AdminQuotes(props) {
    const [projects, setProjects] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasLoadedProjects, setHasLoadedProjects] = useState(false);

    const [editingWorkerRate, setEditingWorkerRate] = useState(null);
    const [workerRateUpdates, setWorkerRateUpdates] = useState([]);

    const updateWorkerRate = (workerId, newRate) => {
        setWorkerRateUpdates((prevWorkerRateUpdates) => {
            const existingIndex = prevWorkerRateUpdates.findIndex((update) => update.workerId === workerId);
            if (existingIndex !== -1) {
                return prevWorkerRateUpdates.map((update) =>
                    update.workerId === workerId ? { workerId, newRate } : update,
                );
            } else {
                return [...prevWorkerRateUpdates, { workerId, newRate }];
            }
        });
    };
    


    const fetchProjects = async () => {
        setIsSubmitting(true);

        try {
            const response = await fetch('https://irvyn.love/get-projects', {
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
            setHasLoadedProjects(true);

        } catch (error) {
            alert(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRateChange = async (projectId) => {

        const currentProject = projects.find((project) => project.id === projectId);

        const updatedWorkers = currentProject.workers.map((worker) => {
            const newRate = workerRateUpdates.find(update => update.workerId === worker.id)?.newRate || worker.rate;
            return {
                ...worker,
                rate: newRate,
            };
        });
          
        console.log(JSON.stringify({ projectId, workerUpdates: updatedWorkers }))
        try {
            const response = await fetch(`https://irvyn.love/update-worker-rate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                mode: 'cors',
                credentials: 'include',
                body: JSON.stringify({ projectId, workerUpdates: updatedWorkers }),
            });
    
            if (!response.ok) {
                throw new Error('Failed to update worker rate');
            }
    
            const data = await response.json();
            console.log('Worker rate update response:', data);
    
            // Replace the local project with the updated project from the backend
            const updatedProject = data.project;
            setProjects((prevProjects) =>
                prevProjects.map((project) => (project.id === projectId ? updatedProject : project))
            );
        } catch (error) {
            console.error(`Failed to update worker rate for worker ID ${workerId} in project ID ${projectId}:`, error);
        }
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
            const response = await fetch(`https://irvyn.love/delete-project/${id}`, {
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
            await sendDelete(projectId);

            setProjects((prevProjects) =>
                prevProjects.filter((project) => project.id !== projectId)
            );
        } catch (error) {
            console.error(`Failed to delete project with ID ${projectId}:`, error);
            throw error;
        }
    };

    return (
        <div className="getprojs">
          <p>Load the admin quotes</p>
            <button onClick={fetchProjects} disabled={isSubmitting}>
                {isSubmitting ? 'Loading...' : 'Load Projects'}
            </button>
            <div className="projects-container">
            {projects.filter(project => !!project).map((project, index) => (
                    <div
                        key={index}
                        className="project-card"
                    >
                        <h3>{project.title || 'Untitled Project'}</h3>
                        <p>ID: {project.id || 'No project ID provided.'}</p>
                        <ConfirmDelete projectId={project.id} onDelete={deleteProject} />
                        <p>Fudge Quote: £{project.quote.toFixed(2) !== null ? project.quote.toFixed(2) : 'No quote available.'}</p>
                        <p>Overhead: £{project.overhead.toFixed(2) !== null ? project.overhead.toFixed(2) : 'No quote available.'}</p>

                        <button onClick={() => handleRateChange(project.id)}>
                            Update Worker Rates
                        </button>


                        <div className="workers-container">
                            <h4>Workers</h4>
                            {(project.workers || []).map((worker, idx) => (
                            <div key={idx} className="worker-info">
                                <p>Type: {worker.type}</p>
                                <p>Number of workers: {worker.numWorkers}</p>
                                <p>Weekly Hours: {worker.numHours}</p>
                                {/* <p>Rate: £{worker.rate.toFixed(2)}</p> */}
                                <p>Rate: £
                                    {editingWorkerRate === worker.id ? (
                                        <input
                                        id={`worker-rate-${project.id}-${worker.id}`}
                                        type="number"
                                        defaultValue={worker.rate.toFixed(2)}
                                        onBlur={(e) => {
                                            setEditingWorkerRate(null);
                                            updateWorkerRate(worker.id, parseFloat(e.target.value));
                                        }}
                                    />
                                    
                                    ) : (
                                        <span
                                            onClick={() => setEditingWorkerRate(worker.id)}
                                        >
                                            {worker.rate.toFixed(2)}
                                        </span>
                                    )}
                                </p>
                            </div>
                        ))}

                            
                        </div>
                        <div className="non-human-resources-container">
                            <h4>Non-Human Resources</h4>
                            {(project.nonHumanResources || []).map((resource, idx) => (
                                <div key={idx} className="resource-info">
                                    <p>Name: {resource.name}</p>
                                    <p>Fudge Cost: {resource.cost}</p>
                                    <p>Mode: {resource.mode}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
export default AdminQuotes;


