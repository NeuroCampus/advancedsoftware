import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { login, verifyOtp, logout } from '../redux/slices/authSlice';
import { RootState } from '../redux/types';
import { User, Lock, Mail, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpStep, setIsOtpStep] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, loading, error } = useSelector((state: RootState) => state.auth);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    try {
      const result = await dispatch(login({ email, password })).unwrap();
      if (result.user.role === 'student') {
        setIsOtpStep(true);
        toast.info('OTP sent to your email');
      } else {
        toast.success('Login successful');
        navigateRole(result.user.role);
      }
    } catch (err) {
      toast.error(error || 'Login failed');
    }
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) {
      toast.error('Please enter the OTP');
      return;
    }

    try {
      await dispatch(verifyOtp({ email, otp })).unwrap();
      toast.success('Login successful');
      navigateRole('student');
    } catch (err) {
      toast.error(error || 'Invalid OTP');
    }
  };

  const navigateRole = (role: string) => {
    switch (role) {
      case 'student':
        navigate('/student/dashboard');
        break;
      case 'hod':
        navigate('/hod/dashboard');
        break;
      case 'teacher':
        navigate('/faculty/dashboard');
        break;
      case 'admin':
        navigate('/admin/dashboard');
        break;
      default:
        navigate('/');
    }
  };

  const handleRegisterClick = () => navigate('/register');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <motion.div
        className="bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-md text-white"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <h1 className="text-3xl font-extrabold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
          {isOtpStep ? 'Verify OTP' : 'Welcome Back'}
        </h1>

        {user?.token && (
          <motion.div
            className="mb-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-gray-300">Logged in as: {user.email || 'User'}</p>
            <button
              onClick={() => {
                dispatch(logout());
                navigate('/login');
              }}
              className="flex items-center mx-auto mt-2 text-red-400 hover:text-red-600 transition-colors"
            >
              <LogOut size={18} className="mr-2" /> Logout
            </button>
          </motion.div>
        )}

        {!user?.token && (
          <>
            {!isOtpStep ? (
              <form onSubmit={handleLogin}>
                <motion.div
                  className="mb-4"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <label className="block text-gray-300 font-medium mb-2 flex items-center">
                    <Mail size={18} className="mr-2 text-blue-400" /> Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all text-white"
                    required
                  />
                </motion.div>
                <motion.div
                  className="mb-6"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <label className="block text-gray-300 font-medium mb-2 flex items-center">
                    <Lock size={18} className="mr-2 text-blue-400" /> Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all text-white"
                    required
                  />
                </motion.div>
                <motion.button
                  type="submit"
                  disabled={loading}
                  className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded transition-colors ${
                    loading ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {loading ? 'Logging in...' : 'Login'}
                </motion.button>
                <motion.button
                  type="button"
                  onClick={handleRegisterClick}
                  className="w-full mt-4 bg-gray-700 hover:bg-gray-800 text-white font-bold py-3 rounded transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Register
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => toast.info('Forgot Password not implemented yet')}
                  className="w-full mt-4 text-blue-400 hover:text-blue-600 underline"
                  whileHover={{ scale: 1.02 }}
                >
                  Forgot Password?
                </motion.button>
              </form>
            ) : (
              <form onSubmit={handleOtpVerify}>
                <motion.div
                  className="mb-6"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <label className="block text-gray-300 font-medium mb-2 flex items-center">
                    <Mail size={18} className="mr-2 text-blue-400" /> Enter OTP
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all text-white"
                    required
                  />
                </motion.div>
                <motion.button
                  type="submit"
                  disabled={loading}
                  className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded transition-colors ${
                    loading ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => setIsOtpStep(false)}
                  className="w-full mt-4 text-gray-400 hover:text-gray-600 underline"
                  whileHover={{ scale: 1.02 }}
                >
                  Back to Login
                </motion.button>
              </form>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
};

export default LoginPage;