
import React from 'react';
import { Bell, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface HeaderProps {
  notifications?: number;
}

export const Header: React.FC<HeaderProps> = ({ notifications = 0 }) => {
  const { user, logout } = useAuth();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <header className="bg-white shadow-sm h-16 flex items-center justify-between px-4 fixed top-0 right-0 left-64 z-10">
      <div className="relative w-96">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search faculty, students, subjects..."
          className="pl-10 pr-4 py-2 border rounded-md w-full bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div className="flex items-center gap-4">
        <div className="text-gray-600">
          <div className="text-sm">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
          <div className="text-xs text-gray-500">
            {new Date().toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        </div>
        
        <div className="relative">
          <Bell className="text-gray-600 cursor-pointer" />
          {notifications > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {notifications}
            </span>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-2 cursor-pointer">
              <Avatar>
                <AvatarImage src={user?.profile_image} alt={user?.name} />
                <AvatarFallback>{user?.name ? getInitials(user.name) : 'U'}</AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-sm text-left">
                <div className="font-medium">{user?.name}</div>
                <div className="text-xs text-gray-500">
                  {user?.role === 'hod' && 'HOD, '}
                  {user?.department}
                </div>
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="cursor-pointer">Profile</DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer" onClick={logout}>
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
