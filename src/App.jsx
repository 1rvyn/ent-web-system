import React, { useState, useEffect } from 'react';
import './App.css';
import AppRouter from './AppRouter';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  useEffect(() => {
    // Check if the "session" cookie is present
    const cookieExists = document.cookie.includes('session=');
    console.log("checked cookie exists", cookieExists)

    setIsLoggedIn(cookieExists);

    
  }, []);

  const [activeRoute, setActiveRoute] = useState(window.location.pathname);

  const handleLogout = () => {
    // Remove the "session" cookie and set isLoggedIn to false
    document.cookie = 'session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    setIsLoggedIn(false);
  };

  return (
      <div className="App">
        <header className="App-header">
          <ul id="nav-list">
            <li>
              <a
                className={activeRoute === '/' ? 'active' : ''}
                href="/"
                onClick={() => setActiveRoute('/')}
              >
                Home
              </a>
            </li>
            {isLoggedIn ? (
              <>
                <li>
                  <a
                    className={activeRoute === '/projects' ? 'active' : ''}
                    href="/projects"
                    onClick={() => setActiveRoute('/projects')}
                  >
                    Projects
                  </a>
                </li>
                <li>
                  <a href="#" onClick={handleLogout}>
                    Logout
                  </a>
                </li>
                <li>
                  <a
                    className={activeRoute === '/test' ? 'active' : ''}
                    href="/test"
                    onClick={() => setActiveRoute('/test')}
                  >
                    Test
                  </a>
                </li>
                <li>
                    <a
                        className={activeRoute === '/get-projects' ? 'active' : ''}
                        href="/get-projects"
                        onClick={() => setActiveRoute('/get-projects')}
                    >
                        Get Projects
                    </a>
                </li>
              </>
            ) : (
              <>
                <li>
                  <a
                    className={activeRoute === '/login' ? 'active' : ''}
                    href="/login"
                    onClick={() => setActiveRoute('/login')}
                  >
                    Login
                  </a>
                </li>
                <li>
                  <a
                    className={activeRoute === '/register' ? 'active' : ''}
                    href="/register"
                    onClick={() => setActiveRoute('/register')}
                  >
                    Register
                  </a>
                </li>
              </>
            )}
          </ul>
        </header>
        <AppRouter isLoggedIn={isLoggedIn} />
      </div>
  );
}

export default App;
