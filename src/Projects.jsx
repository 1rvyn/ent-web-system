import React, { useState } from 'react';

function Projects(props) {
  const [isFetching, setIsFetching] = useState(false);
  const [projects, setProjects] = useState([]);
  const [createdProjects, setCreatedProjects] = useState([]);
  const [currentWorkerType, setCurrentWorkerType] = useState('intern');
  const [nonHumanResources, setNonHumanResources] = useState([]);
  const [nonHumanResourceName, setNonHumanResourceName] = useState('');
  const [nonHumanResourceCost, setNonHumanResourceCost] = useState(0);
  const [nonHumanResourceMode, setNonHumanResourceMode] = useState('daily');
  const [workerDetails, setWorkerDetails] = useState({
    title: '',
    intern: { numWorkers: 0, numHours: 0 },
    junior: { numWorkers: 0, numHours: 0 },
    mid: { numWorkers: 0, numHours: 0 },
    senior: { numWorkers: 0, numHours: 0 },
  });
  const { isLoggedIn } = props;

  const handleAddNonHumanResource = () => {
    const newResource = {
      name: nonHumanResourceName,
      cost: nonHumanResourceCost,
      mode: nonHumanResourceMode,
    };

    setNonHumanResources([...nonHumanResources, newResource]);
    setNonHumanResourceName('');
    setNonHumanResourceCost(0);
  };

  const handleNonHumanResourceNameChange = (event) => {
    setNonHumanResourceName(event.target.value);
  };

  const handleNonHumanResourceCostChange = (event) => {
    setNonHumanResourceCost(Number(event.target.value));
  };

  const handleNonHumanResourceModeToggle = () => {
    setNonHumanResourceMode(nonHumanResourceMode === 'daily' ? 'monthly' : 'daily');
  };

  const currentDetails = workerDetails[currentWorkerType];

  const handleAddWorker = () => {
    const updatedProjects = [...projects];
    const workerDetailsCopy = { ...workerDetails };
    const currentDetails = workerDetailsCopy[currentWorkerType];

  
    const newWorker = {
      type: currentWorkerType,
      numWorkers: Number(currentDetails.numWorkers),
      numHours: Number(currentDetails.numHours),
    };

    updatedProjects.push(newWorker);

    setProjects(updatedProjects);

    setCurrentWorkerType('intern');
    setWorkerDetails({
      ...workerDetailsCopy,
      [currentWorkerType]: { numWorkers: 0, numHours: 0 },
    });
  };

  const handleCreateProject = async (event) => {
    event.preventDefault();
    setIsFetching(true);

    const projectToCreate = {
      title: workerDetails.title,
      workers: projects,
      nonHumanResources: nonHumanResources,
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

  return (
      <div>
        {isLoggedIn ? (
            <>
              <p>You are logged in. Create a new project!</p>

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
                  Hours per Week:
                  <input
                      type="number"
                      value={currentDetails.numHours}
                      onChange={handleNumHoursChange}
                  />
                </label>
                <br />

                <button onClick={handleAddWorker}>Add {currentWorkerType} Workers</button>
              </div>

              <div className="non-human-resources-form">
            <h3>Non-human Resources</h3>
            <label>
              Name:
              <input
                type="text"
                value={nonHumanResourceName}
                onChange={handleNonHumanResourceNameChange}
              />
            </label>
            <br />
            <button onClick={handleNonHumanResourceModeToggle}>
              {nonHumanResourceMode === 'daily' ? 'Switch to Monthly' : 'Switch to Daily'}
            </button>
            <label>
              {nonHumanResourceMode.charAt(0).toUpperCase() + nonHumanResourceMode.slice(1)} Cost:
              <input
                type="number"
                value={nonHumanResourceCost}
                onChange={handleNonHumanResourceCostChange}
              />
            </label>
            <br />
            <button onClick={handleAddNonHumanResource}>Add Non-human Resource</button>
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
                    {projects.map((project, index) => {
                    
                      return (
                          <li key={index}>
                            {project.numWorkers} x {project.type.charAt(0).toUpperCase() + project.type.slice(1)} Employees
                            <br />
                            {project.numHours} h/week |                           
                          </li>
                      );
                    })}
                  </ul>

                  <ul>
                  {nonHumanResources.map((resource, index) => {
                return (
                  <li key={index}>
                    {resource.name}
                    <br />
                    {resource.mode}: ${resource.cost}
                  </li>
                );
              })}
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
