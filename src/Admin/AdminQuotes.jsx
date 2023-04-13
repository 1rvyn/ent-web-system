import React, { useState } from 'react';

function AdminQuotes(props) {
    const [projects, setProjects] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasLoadedProjects, setHasLoadedProjects] = useState(false);

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
            setHasLoadedProjects(true);

        } catch (error) {
            alert(error.message);
        } finally {
            setIsSubmitting(false);
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
                {projects.map((project, index) => (
                    <div
                        key={index}
                        className="project-card"
                    >
                        <h3>{project.title || 'Untitled Project'}</h3>
                        <p>ID: {project.id || 'No project ID provided.'}</p>
                        <ConfirmDelete projectId={project.id} onDelete={deleteProject} />
                        <p>Fudge Quote: £{project.quote.toFixed(2) !== null ? project.quote.toFixed(2) : 'No quote available.'}</p>
                        <p>Overhead: £{project.overhead.toFixed(2) !== null ? project.overhead.toFixed(2) : 'No quote available.'}</p>

                        <div className="workers-container">
                            <h4>Workers</h4>
                            {(project.workers || []).map((worker, idx) => (
                                <div key={idx} className="worker-info">
                                    <p>Type: {worker.type}</p>
                                    <p>Number of workers: {worker.numWorkers}</p>
                                    <p>Weekly Hours: {worker.numHours}</p>
                                    <p>Rate: £{worker.rate.toFixed(2)}</p>
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


