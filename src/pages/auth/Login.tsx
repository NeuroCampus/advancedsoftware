import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/sonner';

// TypeScript interfaces for API responses
interface LoginResult {
  success: boolean;
  needsOtp?: boolean;
  userId?: string;
  error?: string;
}

const Login: React.FC = () => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [userId, setUserId] = useState<string | null>(null);
  const [needsOtp, setNeedsOtp] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const navigate = useNavigate();
  const { login, verifyOtp, resendOtp, userRole } = useAuth();

  // Handle OTP resend cooldown
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!username || !password) {
      toast.error('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    const result: LoginResult = await login(username, password);

    if (result.success) {
      if (result.needsOtp && result.userId) {
        setNeedsOtp(true);
        setUserId(result.userId);
        toast.success('OTP sent to your registered email');
      } else {
        navigateByRole(userRole);
      }
    } else {
      toast.error(result.error || 'Login failed');
    }

    setIsLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId || !otp) {
      toast.error('Please enter the OTP');
      return;
    }

    // Basic OTP validation (e.g., 6-digit number)
    if (!/^\d{6}$/.test(otp)) {
      toast.error('OTP must be a 6-digit number');
      return;
    }

    setIsLoading(true);
    const success: boolean = await verifyOtp(userId, otp);

    if (success) {
      navigateByRole(userRole);
    } else {
      toast.error('Invalid OTP');
    }

    setIsLoading(false);
  };

  const handleResendOtp = async () => {
    if (!userId || resendCooldown > 0) return;

    setIsLoading(true);
    const success: boolean = await resendOtp(userId);
    if (success) {
      toast.success('OTP resent to your email');
      setResendCooldown(30); // 30-second cooldown
    } else {
      toast.error('Failed to resend OTP');
    }
    setIsLoading(false);
  };

  const navigateByRole = (role: string | null) => {
    switch (role) {
      case 'admin':
        navigate('/admin');
        break;
      case 'hod':
        navigate('/hod');
        break;
      case 'faculty':
        navigate('/faculty');
        break;
      case 'student':
        navigate('/student');
        break;
      default:
        toast.error('Unknown user role');
        navigate('/login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center" aria-live="polite">
          <h2 className="text-2xl font-bold">College Management System</h2>
          <p className="text-gray-500 mt-1">
            {needsOtp ? 'Enter OTP sent to your email' : 'Sign in to your account'}
          </p>
        </CardHeader>
        <CardContent>
          {!needsOtp ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  required
                  aria-required="true"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="password">Password</Label>
                  <a
                    href="/forgot-password"
                    className="text-blue-500 text-sm hover:underline"
                    aria-label="Forgot your password?"
                  >
                    Forgot Password?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  aria-required="true"
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                aria-busy={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">OTP</Label>
                <Input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter OTP from your email"
                  required
                  aria-required="true"
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                aria-busy={isLoading}
              >
                {isLoading ? 'Verifying...' : 'Verify OTP'}
              </Button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="text-blue-500 text-sm hover:underline"
                  disabled={isLoading || resendCooldown > 0}
                  aria-label="Resend OTP"
                >
                  {resendCooldown > 0
                    ? `Resend OTP in ${resendCooldown}s`
                    : 'Resend OTP'}
                </button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;