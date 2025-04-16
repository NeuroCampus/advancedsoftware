
import { useState } from "react";
import { forgotPassword } from "../../utils/authService";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

interface ForgotPasswordProps {
  setPage: (page: string) => void;
}

const ForgotPassword = ({ setPage }: ForgotPasswordProps) => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please enter your email");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await forgotPassword(email);
      
      if (response.success) {
        setSuccess("OTP sent successfully to your email");
        localStorage.setItem("temp_user_id", response.user_id);
        setTimeout(() => {
          setPage("reset-password");
        }, 2000);
      } else {
        setError(response.message || "Failed to process request");
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
          <CardTitle className="text-2xl font-bold text-center">Forgot Password</CardTitle>
          <CardDescription className="text-center">Enter your email to receive a password reset OTP</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <div className="bg-red-500 text-white p-2 rounded text-sm">{error}</div>}
          {success && <div className="bg-green-500 text-white p-2 rounded text-sm">{success}</div>}
          
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">Email</label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full"
            />
          </div>
          
          <Button 
            onClick={handleForgotPassword} 
            className="w-full" 
            disabled={loading}
          >
            {loading ? "Processing..." : "Send OTP"}
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

export default ForgotPassword;
