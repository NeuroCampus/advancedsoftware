import { useState } from "react";
import { loginUser } from "../../utils/authService";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { LockKeyhole, User } from "lucide-react";

interface LoginProps {
  setRole: (role: string) => void;
  setPage: (page: string) => void;
}

const Login = ({ setRole, setPage }: LoginProps) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      setError("Please enter both username and password");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await loginUser(username, password);
      
      if (response.success) {
        if (response.message === "OTP sent") {
          // For students, store user_id and navigate to OTP page
          localStorage.setItem("temp_user_id", response.user_id);
          setPage("otp");
        } else {
          // For admin, HOD, faculty - direct login
          localStorage.setItem("access_token", response.access);
          localStorage.setItem("refresh_token", response.refresh);
          localStorage.setItem("role", response.role);
          localStorage.setItem("user", JSON.stringify(response.profile));
          setRole(response.role);
          setPage(response.role);
        }
      } else {
        setError(response.message || "Login failed");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-cover bg-center relative" 
      style={{ backgroundImage: "url('https://images.unsplash.com/photo-1497604401993-f2e922e5cb0a?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80')" }}>
      
      {/* Overlay for better text visibility */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/70 to-indigo-900/60 backdrop-blur-[2px]"></div>
      
      <div className="container relative z-10 px-4 mx-auto flex flex-col items-center">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-2 text-white drop-shadow-lg">
            NEURO CAMPUS
          </h1>
          <p className="text-xl text-blue-100 font-light tracking-wide">
            AI-powered campus management system
          </p>
          <p className="text-sm text-blue-200 mt-1">
            Developed under Starlight Technology
          </p>
        </div>
        
        <Card className="w-full max-w-md backdrop-blur-xl bg-white/20 border border-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.37)]">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center text-white">Welcome Back</CardTitle>
            <CardDescription className="text-center text-blue-100">Enter your credentials to login</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-500/80 text-white p-3 rounded-md text-sm backdrop-blur-sm">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium text-white">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-5 w-5 text-blue-100" />
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="pl-10 w-full bg-white/10 border-white/20 text-white placeholder:text-blue-200/70 focus-visible:ring-blue-400"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-white">Password</label>
              <div className="relative">
                <LockKeyhole className="absolute left-3 top-2.5 h-5 w-5 text-blue-100" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="pl-10 w-full bg-white/10 border-white/20 text-white placeholder:text-blue-200/70 focus-visible:ring-blue-400"
                />
              </div>
            </div>
            
            <Button 
              onClick={handleLogin} 
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium shadow-lg shadow-blue-600/30" 
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </Button>
            
            <div className="text-center">
              <span 
                className="text-blue-100 cursor-pointer hover:text-white text-sm transition-colors"
                onClick={() => setPage("forgot-password")}
              >
                Forgot password?
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-xs text-center text-blue-200/80">
          © {new Date().getFullYear()} NEURO CAMPUS. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default Login;