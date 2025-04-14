// src/App.tsx
import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ParallaxProvider } from 'react-scroll-parallax';
import { motion } from 'framer-motion';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './components/DashboardLayout';
import StudentDashboard from './pages/student/StudentDashboard';
import HODDashboard from './pages/hod/HODDashboard';
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import TakeAttendancePage from './pages/faculty/TakeAttendancePage';

const MainContent: React.FC = () => {
  const location = useLocation();
  const showNavbarRoutes = ['/login']; // Show navbar only on login page

  return (
    <motion.div
      className="min-h-screen bg-[#1A1A1A] text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    >
      {showNavbarRoutes.includes(location.pathname) && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Navbar />
        </motion.div>
      )}
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />
        <Route element={<DashboardLayout />}>
          <Route
            path="/student-dashboard"
            element={
              <ProtectedRoute requiredRoles={['student']}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hod-dashboard"
            element={
              <ProtectedRoute requiredRoles={['hod']}>
                <HODDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty-dashboard"
            element={
              <ProtectedRoute requiredRoles={['teacher']}>
                <FacultyDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/take-attendance"
            element={
              <ProtectedRoute requiredRoles={['teacher']}>
                <TakeAttendancePage />
              </ProtectedRoute>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </motion.div>
  );
};

const App: React.FC = () => (
  <ParallaxProvider>
    <MainContent />
  </ParallaxProvider>
);

export default App;