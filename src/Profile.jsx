import React, { useEffect, useState } from 'react';

function Profile(props) {
  const [isFetching, setIsFetching] = useState(false);
  const [projects, setProjects] = useState([]);
  const { isLoggedIn } = props;

  const handleGetProjects = async (event) => {
    event.preventDefault();
    setIsFetching(true);

    try {
      const response = await fetch('http://localhost:8085/projects', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to get projects');
      }

      const projectsData = await response.json();
      setProjects(projectsData);
    } catch (error) {
      alert(error.message);
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <div>
      {isLoggedIn ? (
        <>
          <p>You are logged in. Welcome back!</p>
          <button onClick={handleGetProjects} disabled={isFetching}>
            {isFetching ? 'Loading...' : 'Get Projects'}
          </button>
          <ul>
            {projects.map((project) => (
              <li key={project.id}>{project.name}</li>
            ))}
          </ul>
        </>
      ) : (
        <p>Please log in to access additional features.</p>
      )}
    </div>
  );
}

export default Profile;
