// src/pages/faculty/FacultyDashboard.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext'; // Adjust path if needed
import { Calendar, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import Header from '../../components/Header'; // Adjust path if needed

const FacultyDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { token, role, logout } = useUser();

  if (!token || role !== 'teacher') {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 flex flex-col">
      <Header />
      <main className="flex-grow p-6">
        <motion.div
          className="max-w-4xl mx-auto bg-white rounded-xl shadow-2xl p-8"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-4xl font-extrabold text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
              Faculty Dashboard
            </h1>
            <motion.button
              onClick={logout}
              className="flex items-center bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <LogOut size={18} className="mr-2" />
              Logout
            </motion.button>
          </div>
          <p className="text-lg text-gray-600 mb-6">Welcome, Faculty! Ready to take attendance?</p>
          <motion.button
            onClick={() => navigate('/choose-semester')}
            className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-full transition-colors shadow-md w-full max-w-xs mx-auto"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Calendar size={24} className="mr-2" />
            Take Attendance Now
          </motion.button>
        </motion.div>
      </main>
    </div>
  );
};

export default FacultyDashboard;