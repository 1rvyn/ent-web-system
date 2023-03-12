import React, { useState } from 'react';

function Projects(props) {
  const [isFetching, setIsFetching] = useState(false);
  const [projects, setProjects] = useState([]);
  const [currentWorkerType, setCurrentWorkerType] = useState('intern');
  const [workerDetails, setWorkerDetails] = useState({
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
    console.log(JSON.stringify(projects))

    try {
      const response = await fetch('http://localhost:8085/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(projects),
        mode: 'cors',
      });

      if (!response.ok) {
        console.log(response)
        throw new Error('Failed to create project');
      }

      const newProject = await response.json();
      setProjects([...projects, newProject]);
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
            <form onSubmit={handleCreateProject}>
              <ul>
                {projects.map((project, index) => (
                  <li key={index}>
                    {project.type && project.type.charAt(0).toUpperCase() + project.type.slice(1)} Workers:{' '}
                    {project.numWorkers} x {project.hourlyWage}$ / h x {project.numHours}h
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
