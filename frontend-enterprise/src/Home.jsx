import React, { useEffect } from 'react';
function Home(props) {

  const { isLoggedIn } = props;


  // console.log("logged in state: ", isLoggedIn)
  // useEffect(() => {
  //   const sessionCookie = document.cookie
  //     .split('; ')
  //     .find(row => row.startsWith('session='))
  //     ?.split('=')[1];
  //   console.log(sessionCookie);


  //   return () => {
  //     // Cleanup function to clear previous side effects
  //     console.log('Cleaning up ');
  //   };
  // }, []);
  return (
    <div>
      <h1>Home</h1>
      {isLoggedIn ? (
        <p>You are logged in. Welcome back!</p>
      ) : (
        <p>Please log in to access additional features.</p>
      )}
    </div>
  );
}


export default Home;
