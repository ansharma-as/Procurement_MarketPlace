import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import { useApiLogoutHandler } from '../../hooks/useApiLogoutHandler';

const Layout = () => {
  // Set up the API logout handler to use react-router navigation
  useApiLogoutHandler();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;