import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { LogOut, User } from 'lucide-react';

const Header: React.FC = () => {
  const { user, logout } = useUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-blue-600 text-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <h1 className="text-xl font-bold">Attendance System</h1>
        {user && (
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <User size={18} className="mr-1" />
              <span>{user}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center bg-red-500 hover:bg-red-600 px-3 py-1 rounded transition-colors"
            >
              <LogOut size={18} className="mr-1" />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;