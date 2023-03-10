import React, {useEffect, useState} from 'react';
function Profile(props) {

    const { isLoggedIn } = props;

  return (
    <div>

        {isLoggedIn ? (
            <p>You are logged in. Welcome back!</p>
        ) : (
            <p>Please log in to access additional features.</p>
        )}
    </div>
  );
}


export default Profile;
