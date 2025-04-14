
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/api';
import { toast } from '@/components/ui/sonner';

type UserRole = 'admin' | 'hod' | 'faculty' | 'student' | null;

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  profile_image?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; needsOtp?: boolean; userId?: string }>;
  verifyOtp: (userId: string, otp: string) => Promise<boolean>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<boolean>;
  resetPassword: (userId: string, otp: string, newPassword: string) => Promise<boolean>;
  resendOtp: (userId: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in when component mounts
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    const userData = localStorage.getItem('userData');
    
    if (token && userRole && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Failed to parse user data', error);
        localStorage.removeItem('userData');
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
      }
    }
    
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await authService.login({ username, password });
      
      // For students, OTP verification is needed
      if (response.data.needs_otp) {
        return { 
          success: true, 
          needsOtp: true, 
          userId: response.data.user_id 
        };
      }
      
      // For faculty, HOD, admin, token is directly provided
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userRole', response.data.role);
      localStorage.setItem('userData', JSON.stringify({
        id: response.data.user_id,
        name: response.data.name,
        email: response.data.email,
        role: response.data.role,
        department: response.data.department,
        profile_image: response.data.profile_image
      }));
      
      setUser({
        id: response.data.user_id,
        name: response.data.name,
        email: response.data.email,
        role: response.data.role,
        department: response.data.department,
        profile_image: response.data.profile_image
      });
      
      return { success: true };
      
    } catch (error) {
      console.error('Login failed', error);
      toast.error('Login failed. Please check your credentials.');
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };
  
  const verifyOtp = async (userId: string, otp: string) => {
    try {
      setIsLoading(true);
      const response = await authService.verifyOtp({ user_id: userId, otp });
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userRole', response.data.role);
      localStorage.setItem('userData', JSON.stringify({
        id: response.data.user_id,
        name: response.data.name,
        email: response.data.email,
        role: response.data.role,
        department: response.data.department,
        profile_image: response.data.profile_image
      }));
      
      setUser({
        id: response.data.user_id,
        name: response.data.name,
        email: response.data.email,
        role: response.data.role,
        department: response.data.department,
        profile_image: response.data.profile_image
      });
      
      return true;
    } catch (error) {
      console.error('OTP verification failed', error);
      toast.error('OTP verification failed. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userData');
    setUser(null);
    navigate('/login');
  };

  const forgotPassword = async (email: string) => {
    try {
      setIsLoading(true);
      await authService.forgotPassword(email);
      toast.success('OTP sent to your email');
      return true;
    } catch (error) {
      console.error('Forgot password failed', error);
      toast.error('Failed to send OTP. Please check your email.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (userId: string, otp: string, newPassword: string) => {
    try {
      setIsLoading(true);
      await authService.resetPassword({ user_id: userId, otp, new_password: newPassword });
      toast.success('Password reset successful');
      return true;
    } catch (error) {
      console.error('Password reset failed', error);
      toast.error('Failed to reset password. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const resendOtp = async (userId: string) => {
    try {
      setIsLoading(true);
      await authService.resendOtp(userId);
      toast.success('New OTP sent to your email');
      return true;
    } catch (error) {
      console.error('Failed to resend OTP', error);
      toast.error('Failed to send new OTP. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        verifyOtp,
        logout,
        forgotPassword,
        resetPassword,
        resendOtp,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
