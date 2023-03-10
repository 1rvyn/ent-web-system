import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Home from './Home';
import Login from './Login';
import Register from './Register';
import Profile from './Profile';
import Test from './Test';



function AppRouter ({ isLoggedIn }) {
  return (
    <BrowserRouter>
        <Routes>
            <Route path="/" element={<Home isLoggedIn={isLoggedIn} />} />

            <Route path="/profile" element={<Profile isLoggedIn={isLoggedIn} />} />

            <Route path="/test" element={<Test isLoggedIn={isLoggedIn} />} />

            <Route path="/login" element={<Login />} />

            <Route path="/register" element={<Register />} />

        </Routes>

    </BrowserRouter>

  );
}

export default AppRouter;
