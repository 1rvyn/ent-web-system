import React, { useState } from 'react';
import { Form, Button } from 'react-bootstrap';
import { createBrowserHistory } from 'history';

function Login() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const history = createBrowserHistory();


  const handleSubmit = (event) => {
    event.preventDefault();
    fetch('http://localhost:8085/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      mode: 'cors',
      credentials: 'include',
    })
      .then(response => {
        // Handle response
        if(response.status === 200){
          console.log("logged in, setting state");
          setIsLoggedIn(true);
          history.push('/');

        }
        console.log(response)
      })
      .catch(error => {
        // Handle error
      });
  };

  return (
    <div className="container mt-5">
      <h1>Login</h1>
      <Form onSubmit={handleSubmit}>
        <Form.Group controlId="formBasicEmail">
          <Form.Label>Email address</Form.Label>
          <Form.Control
            type="email"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Form.Group>

        <Form.Group controlId="formBasicPassword">
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Form.Group>

        <Button variant="primary" type="submit">
          Login
        </Button>
      </Form>
    </div>
  );
}

export default Login;
