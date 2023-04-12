import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Home from './Home';
import Login from './Login';
import Register from './Register';
import Projects from './Projects';
import Test from './Test';
import Getprojs from './Getprojs';
import AdminHome from './Admin/Home';
import AdminWrapper from './Admin/AdminWrapper';
import AdminQuotes from './Admin/AdminQuotes';

function AppRouter({ isLoggedIn, isAdmin }) {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home isLoggedIn={isLoggedIn} />} />

        <Route path="/projects" element={<Projects isLoggedIn={isLoggedIn} />} />

        <Route path="/test" element={<Test isLoggedIn={isLoggedIn} />} />

        <Route path="/get-projects" element={<Getprojs isLoggedIn={isLoggedIn} />} />

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route path="/admin/*" element={<AdminWrapper isAdmin={isAdmin} />}>
          <Route path="" element={<AdminHome />} />
          {/* Add other admin routes here */}
          <Route path="quotes" element={<AdminQuotes />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
