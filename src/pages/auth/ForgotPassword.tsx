import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/sonner';

// TypeScript interfaces for API responses
interface ForgotPasswordResult {
  success: boolean;
  userId?: string;
  error?: string;
}

interface ResetPasswordResult {
  success: boolean;
  error?: string;
}

const ForgotPassword: React.FC = () => {
  const [step, setStep] = useState<number>(1);
  const [email, setEmail] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const navigate = useNavigate();
  const { forgotPassword, verifyOtp, resetPassword, resendOtp } = useAuth();

  // Handle OTP resend cooldown
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    setIsLoading(true);
    const result: ForgotPasswordResult = await forgotPassword(email);

    if (result.success && result.userId) {
      setStep(2);
      setUserId(result.userId);
      toast.success('OTP sent to your email');
    } else {
      toast.error(result.error || 'Failed to send OTP');
    }

    setIsLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otp) {
      toast.error('Please enter the OTP');
      return;
    }

    // Validate OTP format (6-digit number)
    if (!/^\d{6}$/.test(otp)) {
      toast.error('OTP must be a 6-digit number');
      return;
    }

    setIsLoading(true);
    const success: boolean = await verifyOtp(userId, otp);

    if (success) {
      setStep(3);
      toast.success('OTP verified successfully');
    } else {
      toast.error('Invalid OTP');
    }

    setIsLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    // Basic password strength check
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);
    const result: ResetPasswordResult = await resetPassword(userId, otp, newPassword);

    if (result.success) {
      toast.success('Password reset successfully');
      navigate('/login');
    } else {
      toast.error(result.error || 'Failed to reset password');
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center" aria-live="polite">
          <h2 className="text-2xl font-bold">Reset Password</h2>
          <p className="text-gray-500 mt-1">
            {step === 1 && 'Enter your email to receive OTP'}
            {step === 2 && 'Enter OTP sent to your email'}
            {step === 3 && 'Create a new password'}
          </p>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
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
                {isLoading ? 'Sending...' : 'Send OTP'}
              </Button>
              <div className="text-center">
                <a
                  href="/login"
                  className="text-blue-500 text-sm hover:underline"
                  aria-label="Back to login"
                >
                  Back to Login
                </a>
              </div>
            </form>
          )}

          {step === 2 && (
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
              <div className="text-center space-y-2">
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
                <div>
                  <a
                    href="/login"
                    className="text-blue-500 text-sm hover:underline"
                    aria-label="Back to login"
                  >
                    Back to Login
                  </a>
                </div>
              </div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  aria-required="true"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
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
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </Button>
              <div className="text-center">
                <a
                  href="/login"
                  className="text-blue-500 text-sm hover:underline"
                  aria-label="Back to login"
                >
                  Back to Login
                </a>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;