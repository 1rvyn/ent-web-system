import React from 'react';

function Home({ isLoggedIn }) {
  return (
    <div className="container mt-5">
      {isLoggedIn ? (
        <div>
          <h1>Welcome back!</h1>
          <p>You are now authenticated.</p>
        </div>
      ) : (
        <div>
          <h1>Welcome to my website!</h1>
          <p>Please log in to access the protected content.</p>
        </div>
      )}
    </div>
  );
}

export default Home;
