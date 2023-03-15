import React, { useState } from 'react';

function Projects(props) {
  const [isFetching, setIsFetching] = useState(false);
  const [projects, setProjects] = useState([]);
  const [createdProjects, setCreatedProjects] = useState([]);
  const [currentWorkerType, setCurrentWorkerType] = useState('intern');
  const [workerDetails, setWorkerDetails] = useState({
    title: '',
    intern: { numWorkers: 0, hourlyWage: 0, numHours: 0 },
    junior: { numWorkers: 0, hourlyWage: 0, numHours: 0 },
    mid: { numWorkers: 0, hourlyWage: 0, numHours: 0 },
    senior: { numWorkers: 0, hourlyWage: 0, numHours: 0 },
  });
  const { isLoggedIn } = props;

  const handleAddWorker = () => {
    const updatedProjects = [...projects];
    const workerDetailsCopy = { ...workerDetails };
    const currentDetails = workerDetailsCopy[currentWorkerType];

    const newWorker = {
      type: currentWorkerType,
      numWorkers: Number(currentDetails.numWorkers),
      hourlyWage: Number(currentDetails.hourlyWage),
      numHours: Number(currentDetails.numHours),
    };

    // allow for titles to be added to projects


    updatedProjects.push(newWorker);

    setProjects(updatedProjects);

    setCurrentWorkerType('intern');
    setWorkerDetails({
      ...workerDetailsCopy,
      [currentWorkerType]: { numWorkers: 0, hourlyWage: 0, numHours: 0 },
    });
  };

  const handleCreateProject = async (event) => {
    event.preventDefault();
    setIsFetching(true);

    const projectToCreate = {
        title: workerDetails.title,
        workers: projects
    }

    console.log("New project:", JSON.stringify(projectToCreate));


    try {
      const response = await fetch('http://localhost:8085/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(projectToCreate),
        mode: 'cors',
      });

      if (!response.ok) {
        console.log(response)
        throw new Error('Failed to create project');
      }

      const newProject = await response.json();
      // Update createdProjects state
      setCreatedProjects([...createdProjects, newProject]);
      console.log(newProject)
    } catch (error) {
      console.error(error);
    } finally {
      setIsFetching(false);
    }
  };

  const handleWorkerTypeClick = (workerType) => {
    setCurrentWorkerType(workerType);
  };

  const handleNumWorkersChange = (event) => {
    const { value } = event.target;
    setWorkerDetails({
      ...workerDetails,
      [currentWorkerType]: {
        ...workerDetails[currentWorkerType],
        numWorkers: value,
      },
    });
  };

  const handleTitleChange = (event) => {
    const { value } = event.target;
    setWorkerDetails({
      ...workerDetails,
      title: value,
    });
  };

  const handleHourlyWageChange = (event) => {
    const { value } = event.target;
    setWorkerDetails({
      ...workerDetails,
      [currentWorkerType]: {
        ...workerDetails[currentWorkerType],
        hourlyWage: value,
      },
    });
  };

  const handleNumHoursChange = (event) => {
    const { value } = event.target;
    setWorkerDetails({
      ...workerDetails,
      [currentWorkerType]: {
        ...workerDetails[currentWorkerType],
        numHours: value,
      },
    });
  };

  const renderWorkerButton = (workerType) => {
    const isActive = workerType === currentWorkerType;
    const className = isActive ? 'active' : '';
    const buttonText = workerType.charAt(0).toUpperCase() + workerType.slice(1);

    return (
      <button
        key={workerType}
        className={className}
        onClick={() => handleWorkerTypeClick(workerType)}
      >
        {buttonText}
      </button>
    );
  };
  

  const currentDetails = workerDetails[currentWorkerType];

  return (
    <div>
      {isLoggedIn ? (
        <>
          <p>You are logged in. Welcome back!</p>
          <div className="worker-buttons">
            {['intern', 'junior', 'mid', 'senior'].map(renderWorkerButton)}
          </div>
          <div className="worker-form">
            <h3>
              {currentWorkerType.charAt(0).toUpperCase() + currentWorkerType.slice(1)} Workers
            </h3>
            <label>
              Number of Workers:
              <input
                type="number"
                value={currentDetails.numWorkers}
                onChange={handleNumWorkersChange}
              />
            </label>
            <br />
            <label>
              Hourly Wage:
              <input
                type="number"
                value={currentDetails.hourlyWage}
                onChange={handleHourlyWageChange}
              />
            </label>
            <br />
            <label>
              Number of Hours:
              <input
                type="number"
                value={currentDetails.numHours}
                onChange={handleNumHoursChange}
              />
            </label>
            <br />
            <button onClick={handleAddWorker}>Add {currentWorkerType} Workers</button>
          </div>
          <div className="project-form">
            <h3>Current project:</h3>
            <form onSubmit={handleCreateProject}>
              <label>
                Project Title:
                <input type="text" value={workerDetails.title} onChange={handleTitleChange} />
              </label>
              <br />
              <ul>
                {projects.map((project, index) => (
                    <li key={index}>
                      {project.numWorkers} x {project.type && project.type.charAt(0).toUpperCase() + project.type.slice(1)} Employees
                      <br />
                      {project.numHours}h/week | @ ${project.hourlyWage}/h
                      <br />
                      Total: ${project.numWorkers * project.numHours * project.hourlyWage}/h
                    </li>
                ))}
              </ul>
              <button type="submit" disabled={isFetching}>
                {isFetching ? 'Creating...' : 'Create a Project'}
              </button>
            </form>
          </div>

        </>
      ) : (
        <p>Please log in to create projects.</p>
      )}
    </div>
  );
}

export default Projects;
