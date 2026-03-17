import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";

const USERNAME_REGEX = /^[A-Za-z0-9_]+$/;
const STRONG_PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

function AuthModal({ isOpen, onClose }) {
  const [mode, setMode] = useState("login"); // login, signup, forgot, verify-otp, reset
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, mode]);

  if (!isOpen) return null;

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
        onClose();
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
    setError("");
    const normalizedUsername = String(username || "").trim();
    if (!USERNAME_REGEX.test(normalizedUsername)) {
      setError("Username can contain only letters, numbers, and underscore (_) with no spaces.");
      return;
    }
    if (!STRONG_PASSWORD_REGEX.test(String(password || ""))) {
      setError("Password must be at least 8 characters and include 1 uppercase letter, 1 number, and 1 symbol.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, username: normalizedUsername }),
      });
      const data = await res.json();
      if (res.ok) {
        login(data.token, data.user);
        onClose();
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
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input ref={inputRef} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required className="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)]/50 border border-[var(--accent)]/30 focus:border-[var(--accent)] outline-none transition-colors text-[var(--text-primary)] placeholder:text-[var(--text-primary)]/50" />
            </div>
            <div>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required className="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)]/50 border border-[var(--accent)]/30 focus:border-[var(--accent)] outline-none transition-colors text-[var(--text-primary)] placeholder:text-[var(--text-primary)]/50" />
            </div>
            <div className="flex justify-end">
              <button type="button" onClick={() => { setMode("forgot"); setError(""); }} className="text-[var(--accent)] text-sm hover:underline">Forgot Password?</button>
            </div>
            {error && <p className="text-red-400 text-sm mt-2 ml-1">{error}</p>}
            <button type="submit" disabled={loading} className="w-full px-4 py-3 rounded-xl bg-[var(--accent)] text-white hover:bg-[var(--accent)]/80 transition-colors font-semibold shadow-lg shadow-[var(--accent)]/20">
              {loading ? "Just a moment..." : "Login"}
            </button>
            <div className="text-center mt-4">
              <span className="text-[var(--text-secondary)] text-sm">Don't have an account? </span>
              <button type="button" onClick={() => { setMode("signup"); setError(""); }} className="text-[var(--accent)] text-sm hover:underline font-semibold">Sign Up</button>
            </div>
          </form>
        );
      case "signup":
        return (
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <input ref={inputRef} type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" required className="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)]/50 border border-[var(--accent)]/30 focus:border-[var(--accent)] outline-none transition-colors text-[var(--text-primary)] placeholder:text-[var(--text-primary)]/50" />
            </div>
            <div>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required className="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)]/50 border border-[var(--accent)]/30 focus:border-[var(--accent)] outline-none transition-colors text-[var(--text-primary)] placeholder:text-[var(--text-primary)]/50" />
            </div>
            <div>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required className="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)]/50 border border-[var(--accent)]/30 focus:border-[var(--accent)] outline-none transition-colors text-[var(--text-primary)] placeholder:text-[var(--text-primary)]/50" />
            </div>
            <p className="text-[10px] text-[var(--text-secondary)]/80 -mt-2">
              Min 8 chars, at least 1 uppercase, 1 number, and 1 symbol.
            </p>
            {error && <p className="text-red-400 text-sm mt-2 ml-1">{error}</p>}
            <button type="submit" disabled={loading} className="w-full px-4 py-3 rounded-xl bg-[var(--accent)] text-white hover:bg-[var(--accent)]/80 transition-colors font-semibold shadow-lg shadow-[var(--accent)]/20">
              {loading ? "Signing you up..." : "Sign Up"}
            </button>
            <div className="text-center mt-4">
              <span className="text-[var(--text-secondary)] text-sm">Already have an account? </span>
              <button type="button" onClick={() => { setMode("login"); setError(""); }} className="text-[var(--accent)] text-sm hover:underline font-semibold">Login</button>
            </div>
          </form>
        );
      case "forgot":
        return (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <p className="text-sm text-[var(--text-secondary)] mb-4">Enter your email and we'll send you an OTP to reset your password.</p>
            <div>
              <input ref={inputRef} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required className="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)]/50 border border-[var(--accent)]/30 focus:border-[var(--accent)] outline-none transition-colors text-[var(--text-primary)] placeholder:text-[var(--text-primary)]/50" />
            </div>
            {error && <p className="text-red-400 text-sm mt-2 ml-1">{error}</p>}
            <button type="submit" disabled={loading} className="w-full px-2 py-2 rounded-xl bg-[var(--accent)] text-white hover:bg-[var(--accent)]/80 transition-colors font-semibold shadow-lg shadow-[var(--accent)]/20">
              {loading ? "Sending..." : "Send OTP"}
            </button>
            <div className="text-center mt-4">
              <button type="button" onClick={() => { setMode("login"); setError(""); }} className="text-[var(--accent)] text-sm hover:underline font-semibold">Back to Login</button>
            </div>
          </form>
        );
      case "verify-otp":
        return (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <p className="text-sm text-[var(--text-secondary)] mb-4">Enter the 6-digit OTP sent to {email}.</p>
            <div>
              <input ref={inputRef} type="text" value={otp} onChange={e => setOtp(e.target.value)} placeholder="000000" maxLength={6} required className="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)]/50 border border-[var(--accent)]/30 focus:border-[var(--accent)] outline-none transition-colors text-[var(--text-primary)] placeholder:text-[var(--text-primary)]/50 text-center tracking-widest text-lg" />
            </div>
            {error && <p className="text-red-400 text-sm mt-2 ml-1">{error}</p>}
            <button type="submit" disabled={loading} className="w-full px-4 py-3 rounded-xl bg-[var(--accent)] text-white hover:bg-[var(--accent)]/80 transition-colors font-semibold shadow-lg shadow-[var(--accent)]/20">
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
            <div className="text-center mt-4">
              <button type="button" onClick={() => { setMode("forgot"); setError(""); }} className="text-[var(--text-secondary)] text-sm hover:underline">Resend OTP</button>
            </div>
          </form>
        );
      case "reset":
        return (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <p className="text-sm text-[var(--text-secondary)] mb-4">Enter your new password.</p>
            <div>
              <input ref={inputRef} type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New Password" required className="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)]/50 border border-[var(--accent)]/30 focus:border-[var(--accent)] outline-none transition-colors text-[var(--text-primary)] placeholder:text-[var(--text-primary)]/50" />
            </div>
            {error && <p className="text-red-400 text-sm mt-2 ml-1">{error}</p>}
            <button type="submit" disabled={loading} className="w-full px-4 py-3 rounded-xl bg-[var(--accent)] text-white hover:bg-[var(--accent)]/80 transition-colors font-semibold shadow-lg shadow-[var(--accent)]/20">
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm text-[var(--text-primary)]">
      <div className="bg-[var(--card-bg)] border border-[var(--accent)]/50 p-4 sm:p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md animate-in fade-in zoom-in duration-300 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
           </svg>
        </button>

        <h2 className="text-xl sm:text-2xl font-bold mb-6 text-center text-[var(--accent)]">
          {mode === "login" && "Welcome Back"}
          {mode === "signup" && "Create Account"}
          {mode === "forgot" && "Reset Password"}
          {mode === "verify-otp" && "Verify Email"}
          {mode === "reset" && "New Password"}
        </h2>
        
        {renderForm()}
      </div>
    </div>
  );
}

export default AuthModal;
