import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { BurhanNewLogo } from "./BurhanNewLogo";
import { Lock, User } from "lucide-react";
import heroBackground from "figma:asset/12215aafd42e6652da7545d3c96a489c909772f0.png";

interface LoginFormProps {
  onLogin: () => void;
  onSignup?: () => void;
}

export function LoginForm({ onLogin, onSignup }: LoginFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtp, setShowOtp] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showOtp) {
      // Simulate OTP request
      setShowOtp(true);
    } else {
      // Simulate successful login
      onLogin();
    }
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers and limit to 6 digits
    if (/^\d{0,6}$/.test(value)) {
      setOtp(value);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Background Image with Logo */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('${heroBackground}')`
          }}
        />
        {/* Light Overlay */}
        <div className="absolute inset-0 bg-[#F6F7ED]/95" />
        
        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12">
          <div className="flex-1 flex items-center justify-center">
            <BurhanNewLogo size="3xl" />
          </div>
          
          {/* Institutional Footer */}
          <div className="text-center">
            <p className="text-[#001F3F]/70 text-sm">
              Enterprise Compliance Management Platform
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white p-8">
        <div className="w-full max-w-md">
          {/* Logo at Top */}
          <div className="mb-12 flex justify-center">
            <BurhanNewLogo size="lg" />
          </div>

          {/* Title */}
          <div className="mb-10 text-center">
            <h1 className="text-xl text-gray-600">
              Secure Compliance Management System
            </h1>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm text-gray-900">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 h-12 border-gray-300 focus:border-[#001F3F] focus:ring-[#001F3F] rounded-md"
                  required
                  disabled={showOtp}
                />
              </div>
            </div>
            
            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm text-gray-900">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12 border-gray-300 focus:border-[#001F3F] focus:ring-[#001F3F] rounded-md"
                  required
                  disabled={showOtp}
                />
              </div>
              {/* Forgot Password Link */}
              {!showOtp && (
                <div className="text-right">
                  <a href="#" className="text-sm text-[#1E488F] hover:underline">
                    Forgot password?
                  </a>
                </div>
              )}
            </div>

            {/* OTP Field */}
            {showOtp && (
              <div className="space-y-2">
                <Label htmlFor="otp" className="text-sm text-gray-900">One-Time Password (OTP)</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={handleOtpChange}
                  maxLength={6}
                  className="h-12 border-gray-300 focus:border-[#001F3F] focus:ring-[#001F3F] rounded-md"
                  required
                />
                <p className="text-sm text-gray-600">
                  OTP has been sent to your registered email
                </p>
              </div>
            )}

            {/* Continue Button */}
            <Button 
              type="submit" 
              className="w-full h-12 bg-[#001F3F] hover:bg-[#001F3F]/90 text-white rounded-md mt-8"
            >
              {showOtp ? "Verify & Login" : "Continue"}
            </Button>

            {/* Back Button for OTP */}
            {showOtp && (
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md"
                onClick={() => setShowOtp(false)}
              >
                Back
              </Button>
            )}
          </form>

          {/* Sign Up Link */}
          {!showOtp && (
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={onSignup}
                  className="text-[#1E488F] hover:underline"
                >
                  Sign up
                </button>
              </p>
            </div>
          )}

          {/* Security Notice */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500">
              Secured with multi-factor authentication
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}