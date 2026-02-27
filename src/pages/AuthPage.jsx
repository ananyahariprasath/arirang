import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import HelpDeskModal from "../components/modals/HelpDeskModal";
import AuthLogo from "../components/branding/AuthLogo";
import { COUNTRIES, COUNTRY_REGION_MAP } from "../constants";

function AuthPage() {
  const [mode, setMode] = useState("login"); // login, signup, forgot, verify-otp, reset
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [signupCountry, setSignupCountry] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const { login } = useAuth();
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [mode]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        login(data.token, data.user);
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err) {
      setError("An error occurred during login.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!email || !password || !username || !signupCountry) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const region = COUNTRY_REGION_MAP[signupCountry] || "Global";
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, username, country: signupCountry, region })
      });
      const data = await res.json();
      if (res.ok) {
        login(data.token, data.user);
      } else {
        setError(data.error || "Signup failed");
      }
    } catch (err) {
      setError("An error occurred during signup.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setMode("verify-otp");
      } else {
        setError(data.error || "Failed to send OTP");
      }
    } catch (err) {
      setError("An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (res.ok) {
        setResetToken(data.resetToken);
        setMode("reset");
      } else {
        setError(data.error || "Invalid OTP");
      }
    } catch (err) {
      setError("An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, resetToken, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setMode("login");
        setPassword("");
        setError("Password reset successfully. Please login.");
      } else {
        setError(data.error || "Failed to reset password");
      }
    } catch (err) {
      setError("An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const renderForm = () => {
    switch (mode) {
      case "login":
        return (
          <form onSubmit={handleLogin} className="space-y-6 w-full max-w-sm">
            <div>
              <input ref={inputRef} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-primary)]/50 border border-[var(--accent)]/30 focus:border-[var(--accent)] outline-none transition-colors text-[var(--text-primary)] placeholder:text-[var(--text-primary)]/50 text-lg shadow-inner" />
            </div>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                placeholder="Password" 
                required 
                className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-primary)]/50 border border-[var(--accent)]/30 focus:border-[var(--accent)] outline-none transition-colors text-[var(--text-primary)] placeholder:text-[var(--text-primary)]/50 text-lg shadow-inner pr-14" 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors p-2"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "👁️" : "🫣"}
              </button>
            </div>
            <div className="flex justify-end">
              <button type="button" onClick={() => { setMode("forgot"); setError(""); }} className="text-[var(--accent)] text-sm hover:underline">Forgot Password?</button>
            </div>
            {error && <p className="text-red-400 text-sm mt-2 ml-1">{error}</p>}
            <button type="submit" disabled={loading} className="w-full px-5 py-4 rounded-2xl bg-[var(--accent)] text-white hover:bg-[var(--accent)]/80 transition-all font-bold tracking-wider text-lg shadow-lg shadow-[var(--accent)]/20 hover:-translate-y-1">
              {loading ? "Logging in..." : "Login"}
            </button>
            <div className="text-center mt-6">
              <span className="text-[var(--text-secondary)]">Don't have an account? </span>
              <button type="button" onClick={() => { setMode("signup"); setError(""); }} className="text-[var(--accent)] font-bold hover:underline">Sign Up</button>
            </div>
          </form>
        );
      case "signup":
        return (
          <form onSubmit={handleSignup} className="space-y-6 w-full max-w-sm">
            <div>
              <input ref={inputRef} type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" required className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-primary)]/50 border border-[var(--accent)]/30 focus:border-[var(--accent)] outline-none transition-colors text-[var(--text-primary)] placeholder:text-[var(--text-primary)]/50 text-lg shadow-inner" />
            </div>
            <div>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-primary)]/50 border border-[var(--accent)]/30 focus:border-[var(--accent)] outline-none transition-colors text-[var(--text-primary)] placeholder:text-[var(--text-primary)]/50 text-lg shadow-inner" />
            </div>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                placeholder="Password" 
                required 
                className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-primary)]/50 border border-[var(--accent)]/30 focus:border-[var(--accent)] outline-none transition-colors text-[var(--text-primary)] placeholder:text-[var(--text-primary)]/50 text-lg shadow-inner pr-14" 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors p-2"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "👁️" : "🫣"}
              </button>
            </div>
            <div>
              <select 
                value={signupCountry} 
                onChange={e => setSignupCountry(e.target.value)} 
                required 
                className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-primary)]/50 border border-[var(--accent)]/30 focus:border-[var(--accent)] outline-none transition-colors text-[var(--text-primary)] placeholder:text-[var(--text-primary)]/50 text-lg shadow-inner appearance-none cursor-pointer"
              >
                <option value="" disabled className="bg-[var(--bg-secondary)]">Select Country</option>
                {COUNTRIES.sort().map(c => (
                  <option key={c} value={c} className="bg-[var(--bg-secondary)]">{c}</option>
                ))}
              </select>
            </div>
            {error && <p className="text-red-400 text-sm mt-2 ml-1">{error}</p>}
            <button type="submit" disabled={loading} className="w-full px-5 py-4 rounded-2xl bg-[var(--accent)] text-white hover:bg-[var(--accent)]/80 transition-all font-bold tracking-wider text-lg shadow-lg shadow-[var(--accent)]/20 hover:-translate-y-1">
              {loading ? "Signing up..." : "Sign Up"}
            </button>
            <div className="text-center mt-6">
              <span className="text-[var(--text-secondary)]">Already have an account? </span>
              <button type="button" onClick={() => { setMode("login"); setError(""); }} className="text-[var(--accent)] font-bold hover:underline">Login</button>
            </div>
          </form>
        );
      case "forgot":
        return (
          <form onSubmit={handleForgotPassword} className="space-y-6 w-full max-w-sm">
            <p className="text-[var(--text-secondary)] mb-6 text-center">Enter your email and we'll send you an OTP to reset your password.</p>
            <div>
              <input ref={inputRef} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-primary)]/50 border border-[var(--accent)]/30 focus:border-[var(--accent)] outline-none transition-colors text-[var(--text-primary)] placeholder:text-[var(--text-primary)]/50 text-lg shadow-inner" />
            </div>
            {error && <p className="text-red-400 text-sm mt-2 ml-1">{error}</p>}
            <button type="submit" disabled={loading} className="w-full px-2 py-2 rounded-2xl bg-[var(--accent)] text-white hover:bg-[var(--accent)]/80 transition-all font-bold tracking-wider text-lg shadow-lg shadow-[var(--accent)]/20 hover:-translate-y-1">
              {loading ? "Sending..." : "Send OTP"}
            </button>
            <div className="flex flex-col gap-3 mt-2">
              <button type="button" onClick={() => { setMode("login"); setError(""); }} className="w-full py-3 rounded-xl border border-[var(--accent)]/30 text-[var(--accent)] font-bold hover:bg-[var(--accent)]/10 transition-all">Back to Login</button>
            </div>
          </form>
        );
      case "verify-otp":
        return (
          <form onSubmit={handleVerifyOtp} className="space-y-6 w-full max-w-sm">
            <p className="text-[var(--text-secondary)] mb-6 text-center">Enter the 6-digit OTP sent to {email}.</p>
            <div>
              <input ref={inputRef} type="text" value={otp} onChange={e => setOtp(e.target.value)} placeholder="000000" maxLength={6} required className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-primary)]/50 border border-[var(--accent)]/30 focus:border-[var(--accent)] outline-none transition-colors text-[var(--text-primary)] placeholder:text-[var(--text-primary)]/50 text-center tracking-widest text-3xl shadow-inner font-mono" />
            </div>
            {error && <p className="text-red-400 text-sm mt-2 ml-1">{error}</p>}
            <button type="submit" disabled={loading} className="w-full px-5 py-4 rounded-2xl bg-[var(--accent)] text-white hover:bg-[var(--accent)]/80 transition-all font-bold tracking-wider text-lg shadow-lg shadow-[var(--accent)]/20 hover:-translate-y-1">
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
            <div className="flex flex-col gap-3 mt-2">
              <button type="button" onClick={() => { setMode("forgot"); setError(""); }} className="w-full py-3 rounded-xl border border-[var(--accent)]/30 text-[var(--text-secondary)] font-bold hover:bg-[var(--accent)]/10 transition-all">Resend OTP</button>
              <button type="button" onClick={() => { setMode("login"); setError(""); }} className="w-full py-3 rounded-xl border border-[var(--accent)]/30 text-[var(--accent)] font-bold hover:bg-[var(--accent)]/10 transition-all">Back to Login</button>
            </div>
          </form>
        );
      case "reset":
        return (
          <form onSubmit={handleResetPassword} className="space-y-6 w-full max-w-sm">
            <p className="text-[var(--text-secondary)] mb-6 text-center">Enter your new password.</p>
            <div className="relative">
              <input 
                ref={inputRef} 
                type={showPassword ? "text" : "password"} 
                value={newPassword} 
                onChange={e => setNewPassword(e.target.value)} 
                placeholder="New Password" 
                required 
                className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-primary)]/50 border border-[var(--accent)]/30 focus:border-[var(--accent)] outline-none transition-colors text-[var(--text-primary)] placeholder:text-[var(--text-primary)]/50 text-lg shadow-inner pr-14" 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors p-2"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "👁️" : "🫣"}
              </button>
            </div>
            {error && <p className="text-red-400 text-sm mt-2 ml-1">{error}</p>}
            <button type="submit" disabled={loading} className="w-full px-5 py-4 rounded-2xl bg-[var(--accent)] text-white hover:bg-[var(--accent)]/80 transition-all font-bold tracking-wider text-lg shadow-lg shadow-[var(--accent)]/20 hover:-translate-y-1">
              {loading ? "Resetting..." : "Reset Password"}
            </button>
            <div className="flex flex-col gap-3 mt-2">
              <button type="button" onClick={() => { setMode("login"); setError(""); }} className="w-full py-3 rounded-xl border border-[var(--accent)]/30 text-[var(--accent)] font-bold hover:bg-[var(--accent)]/10 transition-all">Back to Login</button>
            </div>
          </form>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-[var(--accent)]/10 blur-[120px]" />
        <div className="absolute top-[60%] -right-[10%] w-[50%] h-[50%] rounded-full bg-[var(--accent)]/10 blur-[120px]" />
      </div>

      <div className="z-10 w-full max-w-sm flex flex-col items-center">
        {/* Logo / Branding */}
        <div className="mb-8 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
          <AuthLogo />
          <h1 className="text-3xl font-black tracking-widest uppercase text-[var(--accent)] text-center">
            ARIRANG
          </h1>
          <p className="text-[var(--text-secondary)] mt-2 tracking-wide uppercase text-sm">
            Spotify Takeover
          </p>
        </div>

        {/* Dynamic Form Area */}
        <div className="w-full animate-in fade-in zoom-in duration-500 delay-150 fill-mode-both flex justify-center">
          {renderForm()}
        </div>

        {/* Help Desk Link - specifically for Auth Page */}
        <div className="mt-8 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-300 fill-mode-both">
          <button
            onClick={() => setIsHelpOpen(true)}
            className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors text-sm font-bold uppercase tracking-widest px-4 py-2 rounded-xl bg-[var(--accent)]/5 border border-[var(--accent)]/10"
          >
            <span>💬</span> Need Help?
          </button>
        </div>
      </div>

      <HelpDeskModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
}

export default AuthPage;
