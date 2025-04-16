
import { useState, useEffect } from "react";
import { verifyOTP, resendOTP } from "../../utils/authService";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

interface OTPPageProps {
  setRole: (role: string) => void;
  setPage: (page: string) => void;
}

const OTPPage = ({ setRole, setPage }: OTPPageProps) => {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const user_id = localStorage.getItem("temp_user_id") || "";

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && resendDisabled) {
      setResendDisabled(false);
    }
  }, [countdown, resendDisabled]);

  const handleVerifyOTP = async () => {
    if (!otp) {
      setError("Please enter the OTP");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await verifyOTP(user_id, otp);
      
      if (response.success) {
        setSuccess("OTP verified successfully");
        localStorage.removeItem("temp_user_id");
        localStorage.setItem("access_token", response.access);
        localStorage.setItem("refresh_token", response.refresh);
        localStorage.setItem("role", response.role);
        localStorage.setItem("user", JSON.stringify(response.profile));
        
        // Redirect to appropriate dashboard
        setRole(response.role);
        setTimeout(() => {
          setPage(response.role);
        }, 1000);
      } else {
        setError(response.message || "Verification failed");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError(null);
    setSuccess(null);
    setResendDisabled(true);
    setCountdown(60); // 60 seconds cooldown

    try {
      const response = await resendOTP(user_id);
      
      if (response.success) {
        setSuccess("OTP resent successfully");
      } else {
        setError(response.message || "Failed to resend OTP");
        setResendDisabled(false);
        setCountdown(0);
      }
    } catch (err) {
      setError("Network error. Please try again.");
      setResendDisabled(false);
      setCountdown(0);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Verify OTP</CardTitle>
          <CardDescription className="text-center">Enter the OTP sent to your registered email</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <div className="bg-red-500 text-white p-2 rounded text-sm">{error}</div>}
          {success && <div className="bg-green-500 text-white p-2 rounded text-sm">{success}</div>}
          
          <div className="space-y-2">
            <label htmlFor="otp" className="text-sm font-medium">OTP</label>
            <Input
              id="otp"
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter OTP"
              className="w-full"
            />
          </div>
          
          <Button 
            onClick={handleVerifyOTP} 
            className="w-full" 
            disabled={loading}
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </Button>
          
          <div className="flex justify-between items-center mt-4">
            <Button 
              variant="outline" 
              onClick={() => setPage("login")}
              size="sm"
            >
              Back to Login
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleResendOTP} 
              disabled={resendDisabled}
              size="sm"
            >
              {resendDisabled 
                ? `Resend OTP (${countdown}s)` 
                : "Resend OTP"
              }
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OTPPage;
