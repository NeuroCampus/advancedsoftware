
import { useState } from "react";
import { resetPassword } from "../../utils/authService";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

interface ResetPasswordProps {
  setPage: (page: string) => void;
}

const ResetPassword = ({ setPage }: ResetPasswordProps) => {
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const user_id = localStorage.getItem("temp_user_id") || "";

  const handleResetPassword = async () => {
    if (!otp || !newPassword || !confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await resetPassword(user_id, otp, newPassword, confirmPassword);
      
      if (response.success) {
        setSuccess("Password reset successfully");
        localStorage.removeItem("temp_user_id");
        setTimeout(() => {
          setPage("login");
        }, 2000);
      } else {
        setError(response.message || "Failed to reset password");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Reset Password</CardTitle>
          <CardDescription className="text-center">Enter the OTP and your new password</CardDescription>
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
          
          <div className="space-y-2">
            <label htmlFor="newPassword" className="text-sm font-medium">New Password</label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full"
            />
          </div>
          
          <Button 
            onClick={handleResetPassword} 
            className="w-full" 
            disabled={loading}
          >
            {loading ? "Resetting..." : "Reset Password"}
          </Button>
          
          <div className="text-center">
            <span 
              className="text-blue-500 cursor-pointer hover:underline text-sm"
              onClick={() => setPage("login")}
            >
              Back to Login
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
