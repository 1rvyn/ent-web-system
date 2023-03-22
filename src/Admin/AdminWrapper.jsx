import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';

function AdminWrapper() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const response = await fetch('http://localhost:8085/verify-user', {
          method: 'GET',
          mode: 'cors',
          credentials: 'include',
        });

        if (response.status === 200) {
          const data = await response.json();
          console.log('data', data.message)
          setIsAdmin(data.message);
        }
      } catch (error) {
        console.error('Error fetching admin status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const cookieExists = document.cookie.includes('session=');
    if (cookieExists) {
      checkAdminStatus();
    } else {
      setIsLoading(false);
    }
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAdmin) {
    return <div>You are not authorized to view this page.</div>;
  }

  return <Outlet />;
}

export default AdminWrapper;
