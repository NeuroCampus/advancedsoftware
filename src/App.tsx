// src/App.tsx
import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ParallaxProvider } from 'react-scroll-parallax';
import { motion } from 'framer-motion';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import StudentDashboard from './pages/StudentDashboard';
import HODDashboard from './pages/HODDashboard';
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import ChooseSemesterPage from './pages/faculty/ChooseSemesterPage';
import OptionsPage from './pages/faculty/OptionsPage';
import EnrollPage from './pages/faculty/EnrollPage';
import TakeAttendancePage from './pages/faculty/TakeAttendancePage';
import AttendanceStatisticsPage from './pages/faculty/AttendanceStatisticsPage';

const MainContent = () => {
  const location = useLocation();
  const showNavbarRoutes = ['/', '/about', '/contact'];

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100"
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
        <Route path="/" element={<LandingPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/faculty-dashboard"
          element={
            <ProtectedRoute requiredRoles={['teacher']}>
              <FacultyDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/choose-semester"
          element={
            <ProtectedRoute requiredRoles={['teacher', 'hod']}>
              <ChooseSemesterPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/options"
          element={
            <ProtectedRoute requiredRoles={['teacher', 'hod']}>
              <OptionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/enroll"
          element={
            <ProtectedRoute requiredRoles={['teacher']}>
              <EnrollPage />
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
        <Route
          path="/attendance-statistics"
          element={
            <ProtectedRoute requiredRoles={['teacher', 'hod']}>
              <AttendanceStatisticsPage />
            </ProtectedRoute>
          }
        />
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </motion.div>
  );
};

const App = () => (
  <ParallaxProvider>
    <MainContent />
  </ParallaxProvider>
);

export default App;