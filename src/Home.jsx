import React from 'react';

function Home(props) {

  const { isLoggedIn } = props;

  return (
    <div>
      <h1>Home</h1>
      {isLoggedIn ? (
        <p>You are logged in. Weelcome back!</p>
      ) : (
        <p>Please log in to access additional features.</p>
      )}
    </div>
  );
}


export default Home;
