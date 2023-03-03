import React, { useEffect } from 'react';
function Home() {
  useEffect(() => {
    const sessionCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('session='))
      ?.split('=')[1];
    console.log(sessionCookie);

    return () => {
      // Cleanup function to clear previous side effects
      console.log('Cleaning up previous effect');
    };
  }, []);
  return (
    <div>
      <h1>Home</h1>
      <p>
        This is the home.jsx page.
      </p>
    </div>
  );
}

export default Home;
