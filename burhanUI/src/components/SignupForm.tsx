import { useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { BurhanNewLogo } from "./BurhanNewLogo";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";

interface SignupFormProps {
  onSignup: (user: { name: string; email: string; role: string }) => void;
  onBackToLogin: () => void;
}

const countries = [
  { code: "+966", name: "Saudi Arabia", flag: "🇸🇦" },
  { code: "+971", name: "United Arab Emirates", flag: "🇦🇪" },
  { code: "+965", name: "Kuwait", flag: "🇰🇼" },
  { code: "+974", name: "Qatar", flag: "🇶🇦" },
  { code: "+973", name: "Bahrain", flag: "🇧🇭" },
  { code: "+968", name: "Oman", flag: "🇴🇲" },
  { code: "+962", name: "Jordan", flag: "🇯🇴" },
  { code: "+20", name: "Egypt", flag: "🇪🇬" },
  { code: "+1", name: "United States", flag: "🇺🇸" },
  { code: "+44", name: "United Kingdom", flag: "🇬🇧" },
];

export function SignupForm({ onSignup, onBackToLogin }: SignupFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("+966");
  const [step, setStep] = useState<"form" | "verify">("form");
  const [verificationType, setVerificationType] = useState<"email" | "phone">("email");
  const [formData, setFormData] = useState({ firstName: "", lastName: "", email: "", password: "" });
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = new FormData(form);
    setFormData({
      firstName: (data.get("firstName") as string) || "",
      lastName: (data.get("lastName") as string) || "",
      email: (data.get("email") as string) || "",
      password: (data.get("password") as string) || "",
    });
    setStep("verify");
  };

  const handleVerify = async () => {
    setError("");
    try {
      const { signup } = await import("../services/api");
      const res = await signup(
        `${formData.firstName} ${formData.lastName}`,
        formData.email,
        formData.password
      );
      if (res.status === "success") {
        onSignup(res.user);
      } else {
        setError(res.message || "Signup failed");
        setStep("form");
      }
    } catch {
      setError("Could not connect to server");
      setStep("form");
    }
  };

  if (step === "verify") {
    return (
      <div className="min-h-screen grid lg:grid-cols-2">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-[#001F3F] via-[#1E488F] to-[#001F3F]">
          <div>
            <BurhanNewLogo size="lg" variant="light" />
          </div>
          <div className="space-y-6">
            <h1 className="text-4xl text-white">
              NCA-ECC Compliance Management Platform
            </h1>
            <p className="text-lg text-white/80">
              Verify your account to get started with comprehensive cybersecurity compliance management.
            </p>
          </div>
          <div className="text-sm text-white/60">
            © 2025 Burhan. All rights reserved.
          </div>
        </div>

        {/* Right Side - Verification Form */}
        <div className="flex items-center justify-center p-8 bg-[#F6F7ED]">
          <Card className="w-full max-w-md border-gray-200 shadow-lg">
            <CardContent className="pt-8 pb-8 px-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-[#74C365] rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </div>
                <h2 className="mb-2">Verify Your Account</h2>
                <p className="text-sm text-muted-foreground">
                  We've sent a verification code to your {verificationType === "email" ? "email address" : "phone number"}
                </p>
              </div>

              <form onSubmit={handleVerify} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="verificationCode">Verification Code</Label>
                  <Input
                    id="verificationCode"
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    className="text-center text-2xl tracking-widest"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setVerificationType(verificationType === "email" ? "phone" : "email")}
                    className="flex-1"
                  >
                    Use {verificationType === "email" ? "Phone" : "Email"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                  >
                    Resend Code
                  </Button>
                </div>

                <Button type="submit" className="w-full bg-[#001F3F] hover:bg-[#1E488F]">
                  Verify and Continue
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={onBackToLogin}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Back to Login
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-[#001F3F] via-[#1E488F] to-[#001F3F]">
        <div>
          <BurhanNewLogo size="lg" variant="light" />
        </div>
        <div className="space-y-6">
          <h1 className="text-4xl text-white">
            NCA-ECC Compliance Management Platform
          </h1>
          <p className="text-lg text-white/80">
            Streamline your cybersecurity compliance with AI-powered evidence management and reporting.
          </p>
        </div>
        <div className="text-sm text-white/60">
          © 2025 Burhan. All rights reserved.
        </div>
      </div>

      {/* Right Side - Signup Form */}
      <div className="flex items-center justify-center p-8 bg-[#F6F7ED]">
        <Card className="w-full max-w-md border-gray-200 shadow-lg">
          <CardContent className="pt-8 pb-8 px-8">
            <div className="mb-8">
              <h2 className="mb-2">Create Your Account</h2>
              <p className="text-sm text-muted-foreground">
                Get started with Burhan compliance management
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" placeholder="John" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" placeholder="Smith" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Select defaultValue="sa" required>
                  <SelectTrigger id="country">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sa">🇸🇦 Saudi Arabia</SelectItem>
                    <SelectItem value="ae">🇦🇪 United Arab Emirates</SelectItem>
                    <SelectItem value="kw">🇰🇼 Kuwait</SelectItem>
                    <SelectItem value="qa">🇶🇦 Qatar</SelectItem>
                    <SelectItem value="bh">🇧🇭 Bahrain</SelectItem>
                    <SelectItem value="om">🇴🇲 Oman</SelectItem>
                    <SelectItem value="jo">🇯🇴 Jordan</SelectItem>
                    <SelectItem value="eg">🇪🇬 Egypt</SelectItem>
                    <SelectItem value="us">🇺🇸 United States</SelectItem>
                    <SelectItem value="uk">🇬🇧 United Kingdom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="flex gap-2">
                  <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.flag} {country.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="512345678"
                    className="flex-1"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Re-enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full bg-[#001F3F] hover:bg-[#1E488F]">
                Create Account
              </Button>

              <div className="text-center">
                <span className="text-sm text-muted-foreground">
                  Already have an account?{" "}
                </span>
                <button
                  type="button"
                  onClick={onBackToLogin}
                  className="text-sm text-[#001F3F] hover:underline"
                >
                  Log in
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
