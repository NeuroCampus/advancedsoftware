
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut } from 'lucide-react';

interface SidebarItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  end?: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ to, icon, label, end = false }) => {
  const location = useLocation();
  const isActive = end ? location.pathname === to : location.pathname.startsWith(to);

  return (
    <Link
      to={to}
      className={cn('navbar-item', isActive && 'active')}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
};

interface SidebarProps {
  items: {
    to: string;
    icon: React.ReactNode;
    label: string;
    end?: boolean;
  }[];
  appName: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ items, appName }) => {
  const { logout } = useAuth();

  return (
    <div className="bg-sidebar h-screen w-64 fixed left-0 top-0 flex flex-col text-white">
      <div className="p-4 border-b border-sidebar-border">
        <h1 className="text-xl font-bold">{appName}</h1>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4 px-3">
        <nav className="space-y-2">
          {items.map((item, index) => (
            <SidebarItem
              key={index}
              to={item.to}
              icon={item.icon}
              label={item.label}
              end={item.end}
            />
          ))}
        </nav>
      </div>
      
      <div className="p-4 border-t border-sidebar-border">
        <button onClick={logout} className="navbar-item justify-center w-full">
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};
