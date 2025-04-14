// src/components/DashboardLayout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';

const DashboardLayout: React.FC = () => {
  const { state } = useAuth();
  const showSidebar = state.user?.token && state.user.role !== null;

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        {showSidebar && <Sidebar />}
        <main className="flex-1 p-6 overflow-auto bg-[#1A1A1A]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;