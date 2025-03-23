import React from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import { UserPlus, UserCheck, BarChart } from 'lucide-react';
import Header from '../../components/Header';
import { motion } from 'framer-motion';

const OptionsPage: React.FC = () => {
  const { semester, section, subject } = useUser();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 flex flex-col">
      <Header />
      <main className="flex-grow p-6">
        <motion.div
          className="max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <motion.div
            className="bg-white p-6 rounded-xl shadow-2xl mb-8"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h2 className="text-3xl font-extrabold text-gray-800 mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
              Class Information
            </h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Semester</p>
                <p className="text-xl font-semibold">{semester || 'Not set'}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Section</p>
                <p className="text-xl font-semibold">{section || 'Not set'}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Subject</p>
                <p className="text-xl font-semibold">{subject || 'Not set'}</p>
              </div>
            </div>
          </motion.div>
          <h2 className="text-3xl font-extrabold text-gray-800 mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
            What would you like to do?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Link to="/enroll">
              <motion.div
                className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow text-center h-full flex flex-col"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="flex justify-center mb-4"><UserPlus size={48} className="text-blue-600" /></div>
                <h3 className="text-xl font-semibold mb-2">Enroll Students</h3>
                <p className="text-gray-600 flex-grow">Add new students to the system with facial recognition</p>
                <button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors w-full">
                  Enroll
                </button>
              </motion.div>
            </Link>
            <Link to="/take-attendance">
              <motion.div
                className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow text-center h-full flex flex-col"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="flex justify-center mb-4"><UserCheck size={48} className="text-blue-600" /></div>
                <h3 className="text-xl font-semibold mb-2">Take Attendance</h3>
                <p className="text-gray-600 flex-grow">Capture attendance using facial recognition</p>
                <button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors w-full">
                  Take Attendance
                </button>
              </motion.div>
            </Link>
            <Link to="/attendance-statistics">
              <motion.div
                className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow text-center h-full flex flex-col"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="flex justify-center mb-4"><BarChart size={48} className="text-blue-600" /></div>
                <h3 className="text-xl font-semibold mb-2">View Statistics</h3>
                <p className="text-gray-600 flex-grow">Generate and view attendance reports and statistics</p>
                <button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors w-full">
                  View Statistics
                </button>
              </motion.div>
            </Link>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default OptionsPage;