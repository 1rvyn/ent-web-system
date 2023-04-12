import React from 'react';
import { Outlet } from 'react-router-dom';

function AdminWrapper({ isAdmin }) {
  if (!isAdmin) {
    return <div>You are not authorized to view this page.</div>;
  }

  return <Outlet />;
}

export default AdminWrapper;
