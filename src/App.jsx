import React, { useState, useEffect } from 'react';
import './App.css';
import AppRouter from './AppRouter';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  async function fetchUserData() {
    try {
      const response = await fetch('http://localhost:8085/verify-user', {
        method: 'GET',
        mode: 'cors',
        credentials: 'include',
      });

      if (response.status === 200) {
        const data = await response.json();
        console.log('data', data.message);
        setIsAdmin(data.message);
      }
    } catch (error) {
      console.error('Error fetching admin status:', error);
    }
  }

  useEffect(() => {
    const cookieExists = document.cookie.includes('session=');
    console.log("checked cookie exists", cookieExists);

    setIsLoggedIn(cookieExists);

    if (cookieExists) {
      fetchUserData();
    }
  }, []);

  const [activeRoute, setActiveRoute] = useState(window.location.pathname);

  const handleLogout = async () => {
    try {
      const response = await fetch('http://localhost:8085/logout', {
        method: 'POST',
        mode: 'cors',
        credentials: 'include',
      });

      if (response.status === 200) {
        // Remove the "session" cookie and set isLoggedIn and isAdmin to false
        document.cookie = 'session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        setIsLoggedIn(false);
        setIsAdmin(false);
        // redirect to home
        setActiveRoute('/');
      } else {
        console.error('Error logging out:', response.statusText);
      }
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <ul id="nav-list">
          {isAdmin ? (
            <>
              {/* Admin nav items */}
              <li>
                <a
                  className={activeRoute === '/' ? 'active' : ''}
                  href="/"
                  onClick={() => setActiveRoute('/')}
                >
                  Home
                </a>
              </li>
              <li>
                <a
                  className={activeRoute === '/projects' ? 'active' : ''}
                  href="/projects"
                  onClick={() => setActiveRoute('/projects')}
                >
                  Projects
                </a>
              </li>
              {/* ... other nav items ... */}
              <li>
                <a
                  className={activeRoute === '/admin' ? 'active' : ''}
                  href="/admin"
                  onClick={() => setActiveRoute('/admin')}
                >
                  Admin Home
                </a>
              </li>
              <li>
                <a
                  className={activeRoute === '/admin/quotes' ? 'active' : ''}
                  href="/admin/quotes"
                  onClick={() => setActiveRoute('/admin/quotes')}
                >
                  Admin Quotes
                </a>
              </li>
              <li>
              <a href="#" onClick={handleLogout}>
                Logout
              </a>
            </li>
            </>
          ) : (
            <>
              {/* Non-admin nav items */}
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
              <a
                className={activeRoute === '/get-projects' ? 'active' : ''}
                href="/get-projects"
                onClick={() => setActiveRoute('/get-projects')}
              >
                Get Projects
              </a>
            </li>
            <li>
            <a href="#" onClick={handleLogout}>
                Logout
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
            </>
          )}
        </ul>
      </header>
      <AppRouter isLoggedIn={isLoggedIn} isAdmin={isAdmin} />
    </div>
  );
}

export default App;