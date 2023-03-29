import React, { useState } from 'react';
import './assets/getproj.css';


function Getprojs(props) {
    const [projects, setProjects] = useState([]);
    const { isLoggedIn } = props;
    const [isSubmitting, setIsSubmitting] = useState(false);

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

        } catch (error) {
            alert(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="getprojs">
            <button onClick={fetchProjects} disabled={isSubmitting}>
                {isSubmitting ? 'Loading...' : 'Load Projects'}
            </button>
            <div className="projects-container">
                {projects.map((project, index) => (
                    <div key={index} className="project-card">
                        <h3>{project.title || 'Untitled Project'}</h3>
                        <p>{project.description || 'No description provided.'}</p>
                        <div className="workers-container">
                            <h4>Workers</h4>
                            {project.workers.map((worker, idx) => (
                                <div key={idx} className="worker-info">
                                    <p>Type: {worker.type}</p>
                                    <p>Number of Workers: {worker.numWorkers}</p>
                                    <p>Hours: {worker.numHours}</p>
                                </div>
                            ))}
                        </div>
                        <div className="non-human-resources-container">
                            <h4>Non-Human Resources</h4>
                            {project.nonHumanResources.map((resource, idx) => (
                                <div key={idx} className="resource-info">
                                    <p>Name: {resource.name}</p>
                                    <p>Cost: {resource.cost}</p>
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


export default Getprojs;
