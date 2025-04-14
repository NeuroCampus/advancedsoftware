
import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardLayoutProps {
  children: React.ReactNode;
  sidebarItems: {
    to: string;
    icon: React.ReactNode;
    label: string;
    end?: boolean;
  }[];
  appName: string;
  notifications?: number;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  sidebarItems,
  appName,
  notifications = 0,
}) => {
  const { user } = useAuth();

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex">
      <Sidebar items={sidebarItems} appName={appName} />
      <div className="pl-64 w-full">
        <Header notifications={notifications} />
        <main className="pt-16 p-6">{children}</main>
      </div>
    </div>
  );
};
