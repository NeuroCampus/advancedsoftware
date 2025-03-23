import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Mail, LogOut } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { motion } from 'framer-motion';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [userId, setUserId] = useState<number | null>(null);
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { token, role, login, logout } = useUser();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post('http://localhost:8000/api/login/', { username, password });
      if (response.data.success) {
        if (response.data.message === 'OTP sent to your email') {
          setUserId(response.data.user_id);
          setIsOtpStep(true);
          setSuccess('OTP sent to your email');
        } else {
          login(response.data.access, response.data.user_id, response.data.role);
          navigateRole(response.data.role);
        }
      } else {
        setError(response.data.message || 'Login failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) {
      setError('Please enter the OTP');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post('http://localhost:8000/api/verify-otp/', { user_id: userId, otp });
      if (response.data.success) {
        login(response.data.access, response.data.user_id, response.data.role);
        navigateRole(response.data.role);
      } else {
        setError(response.data.message || 'OTP verification failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post('http://localhost:8000/api/forgot-password/', { email });
      if (response.data.success) {
        setUserId(response.data.user_id);
        setSuccess(response.data.message);
        setIsForgotPassword(false);
        setIsResetPassword(true);
      } else {
        setError(response.data.message || 'Failed to send OTP');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || !newPassword) {
      setError('Please enter OTP and new password');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post('http://localhost:8000/api/reset-password/', {
        user_id: userId,
        otp,
        new_password: newPassword,
      });
      if (response.data.success) {
        setSuccess(response.data.message);
        setTimeout(() => {
          setIsResetPassword(false);
          setIsOtpStep(false);
          setEmail('');
          setOtp('');
          setNewPassword('');
          setUserId(null);
          setSuccess('');
        }, 2000);
      } else {
        setError(response.data.message || 'Password reset failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const navigateRole = (userRole: string) => {
    if (userRole === 'student') {
      navigate('/student-dashboard');
    } else if (userRole === 'hod') {
      navigate('/hod-dashboard');
    } else if (userRole === 'teacher') { // Changed from 'faculty' to 'teacher'
      navigate('/faculty-dashboard');
    } else if (userRole === 'admin') {
      navigate('/admin-dashboard');
    } else {
      navigate('/home');
    }
  };

  const handleRegisterClick = () => navigate('/register');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100">
      <motion.div
        className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <h1 className="text-3xl font-extrabold text-gray-800 mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
          {isForgotPassword || isResetPassword ? 'Reset Password' : 'Welcome Back'}
        </h1>

        {token && !isForgotPassword && !isResetPassword && (
          <motion.div
            className="mb-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-gray-600">Logged in as: {username || 'User'}</p>
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="flex items-center mx-auto mt-2 text-red-600 hover:text-red-800 transition-colors"
            >
              <LogOut size={18} className="mr-2" /> Logout
            </button>
          </motion.div>
        )}

        {error && (
          <motion.div
            className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {error}
          </motion.div>
        )}
        {success && (
          <motion.div
            className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {success}
          </motion.div>
        )}

        {!isOtpStep && !isForgotPassword && !isResetPassword ? (
          <form onSubmit={handleLogin}>
            <motion.div className="mb-4" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
              <label className="block text-gray-700 font-medium mb-2 flex items-center">
                <User size={18} className="mr-2 text-blue-500" /> Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                required
              />
            </motion.div>
            <motion.div className="mb-6" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
              <label className="block text-gray-700 font-medium mb-2 flex items-center">
                <Lock size={18} className="mr-2 text-blue-500" /> Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                required
              />
            </motion.div>
            <motion.button
              type="submit"
              disabled={loading}
              className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded transition-colors ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </motion.button>
            <motion.button
              type="button"
              onClick={handleRegisterClick}
              className="w-full mt-4 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 rounded transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Register
            </motion.button>
            <motion.button
              type="button"
              onClick={() => setIsForgotPassword(true)}
              className="w-full mt-4 text-blue-600 hover:text-blue-800 underline"
              whileHover={{ scale: 1.02 }}
            >
              Forgot Password?
            </motion.button>
          </form>
        ) : isOtpStep ? (
          <form onSubmit={handleOtpVerify}>
            <motion.div className="mb-6" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
              <label className="block text-gray-700 font-medium mb-2 flex items-center">
                <Mail size={18} className="mr-2 text-blue-500" /> Enter OTP
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                required
              />
            </motion.div>
            <motion.button
              type="submit"
              disabled={loading}
              className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded transition-colors ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </motion.button>
          </form>
        ) : isForgotPassword ? (
          <form onSubmit={handleForgotPassword}>
            <motion.div className="mb-6" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
              <label className="block text-gray-700 font-medium mb-2 flex items-center">
                <Mail size={18} className="mr-2 text-blue-500" /> Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                required
              />
            </motion.div>
            <motion.button
              type="submit"
              disabled={loading}
              className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded transition-colors ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </motion.button>
            <motion.button
              type="button"
              onClick={() => setIsForgotPassword(false)}
              className="w-full mt-4 text-gray-600 hover:text-gray-800 underline"
              whileHover={{ scale: 1.02 }}
            >
              Back to Login
            </motion.button>
          </form>
        ) : isResetPassword ? (
          <form onSubmit={handleResetPassword}>
            <motion.div className="mb-4" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
              <label className="block text-gray-700 font-medium mb-2 flex items-center">
                <Mail size={18} className="mr-2 text-blue-500" /> OTP
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                required
              />
            </motion.div>
            <motion.div className="mb-6" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
              <label className="block text-gray-700 font-medium mb-2 flex items-center">
                <Lock size={18} className="mr-2 text-blue-500" /> New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                required
              />
            </motion.div>
            <motion.button
              type="submit"
              disabled={loading}
              className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded transition-colors ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </motion.button>
          </form>
        ) : null}
      </motion.div>
    </div>
  );
};

export default LoginPage;