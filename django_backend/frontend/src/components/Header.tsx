// src/components/Header.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface Notification {
  id: number;
  text: string;
  time: string;
  type?: 'new';
}

const Header: React.FC = () => {
  const { state, dispatch } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const currentTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = state.user?.token;
        if (token) {
          const response = await axios.get(`http://localhost:8000/api/notifications`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setNotifications(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };
    fetchNotifications();
  }, [state.user?.token]);

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
    navigate('/login');
  };

  const getRoleSpecificContent = () => {
    switch (state.user?.role) {
      case 'teacher':
        return { title: 'FacultyHub' };
      case 'hod':
        return { title: 'HODPortal' };
      case 'student':
        return { title: 'StudentHub' };
      default:
        return { title: 'Dashboard' };
    }
  };

  const { title } = getRoleSpecificContent();
  const userName = state.user?.email?.split('@')[0] || 'User';
  const unreadCount = notifications.filter((n) => n.type === 'new').length;

  return (
    <motion.header
      className="bg-[#2D2D2D] p-4 flex justify-between items-center text-white shadow-md"
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center space-x-4">
        <h1 className="text-2xl font-bold">{title}</h1>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search students, courses, assignments..."
          className="bg-[#3A3A3A] text-white p-2 rounded w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="text-sm">{currentDate} | {currentTime}</div>
      <div className="flex items-center space-x-4">
        <div className="relative">
          <span className="cursor-pointer">🔔</span>
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
          {notifications.length > 0 && (
            <div className="absolute right-0 mt-2 w-64 bg-[#3A3A3A] rounded shadow-lg p-2 z-10">
              {notifications.map((notif) => (
                <div key={notif.id} className="text-sm mb-2">
                  <p>{notif.text}</p>
                  <p className="text-xs text-gray-400">{notif.time} {notif.type === 'new' && <span className="bg-blue-500 text-white text-xs px-1 rounded">new</span>}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span>{userName}</span>
          <img
            src={`https://ui-avatars.com/api/?name=${userName}&background=2D2D2D&color=fff`}
            alt="User Avatar"
            className="w-8 h-8 rounded-full"
          />
          <motion.button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Logout
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;