import { useEffect, useMemo, useState } from "react";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { COUNTRIES, COUNTRY_REGION_MAP } from "../constants";

function AccountSettings({ onBack, onOpenAdmin }) {
  const { user, token, updateUser, logout } = useAuth();
  const toast = useToast();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [baselineEmail, setBaselineEmail] = useState("");
  const [country, setCountry] = useState("");
  const [region, setRegion] = useState("");
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [emailOtp, setEmailOtp] = useState("");
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [sendingEmailOtp, setSendingEmailOtp] = useState(false);
  const [emailOtpStatus, setEmailOtpStatus] = useState("idle");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteVerified, setDeleteVerified] = useState(false);
  const [verifyingDeletePassword, setVerifyingDeletePassword] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    setUsername(String(user?.username || ""));
    const nextEmail = String(user?.email || "");
    setEmail(nextEmail);
    setBaselineEmail(nextEmail);
    setCountry(String(user?.country || ""));
    setRegion(String(user?.region || ""));
  }, [user?.username, user?.email, user?.country, user?.region]);

  useEffect(() => {
    if (!token || !user?.id) return;
    let active = true;

    const loadProfile = async () => {
      setProfileLoading(true);
      try {
        const response = await fetch("/api/auth/profile", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const data = await response.json().catch(() => ({}));
        if (!active || !response.ok) return;
        const nextCountry = String(data?.user?.country || "");
        const nextRegion = String(data?.user?.region || "");
        const nextUsername = String(data?.user?.username || "");
        const nextEmail = String(data?.user?.email || "");
        setUsername(nextUsername);
        setEmail(nextEmail);
        setBaselineEmail(nextEmail);
        setEmailOtp("");
        setEmailOtpSent(false);
        setEmailOtpStatus("idle");
        setCountry(nextCountry);
        setRegion(nextRegion);
        updateUser({
          username: nextUsername || null,
          email: nextEmail || null,
          country: nextCountry || null,
          region: nextRegion || null,
          lastfmUsername: data?.user?.lastfmUsername || null,
        });
      } finally {
        if (active) setProfileLoading(false);
      }
    };

    void loadProfile();
    return () => {
      active = false;
    };
  }, [token, user?.id]);

  const inferredRegion = useMemo(() => COUNTRY_REGION_MAP[country] || "", [country]);
  const isEmailChanged = useMemo(
    () => String(email || "").trim().toLowerCase() !== String(baselineEmail || "").trim().toLowerCase(),
    [email, baselineEmail]
  );

  const handleSendEmailOtp = async () => {
    if (!token || !isEmailChanged) return;
    const nextEmail = String(email || "").trim();
    if (!nextEmail) {
      toast.show("Enter your new email first.", "error");
      return;
    }

    setSendingEmailOtp(true);
    try {
      const response = await fetch("/api/auth/profile-email-otp-send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newEmail: nextEmail }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Failed to send OTP");
      }
      setEmailOtpSent(true);
      setEmailOtpStatus("idle");
      toast.show("OTP sent to your new email.", "success");
    } catch (error) {
      toast.show(error.message || "Failed to send OTP", "error");
    } finally {
      setSendingEmailOtp(false);
    }
  };

  const handleVerifyEmailOtp = async (otpValue) => {
    if (!token || !isEmailChanged || !emailOtpSent) return;
    const otp = String(otpValue || "").trim();
    const nextEmail = String(email || "").trim();
    if (otp.length < 6 || !nextEmail) {
      setEmailOtpStatus("idle");
      return;
    }

    setEmailOtpStatus("checking");
    try {
      const response = await fetch("/api/auth/profile-email-otp-verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newEmail: nextEmail, otp }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setEmailOtpStatus("invalid");
        return;
      }
      setEmailOtpStatus(data?.valid ? "valid" : "invalid");
    } catch {
      setEmailOtpStatus("invalid");
    }
  };

  const handleSave = async () => {
    if (!token) return;
    const finalRegion = region || inferredRegion;
    if (!username.trim() || !email.trim() || !country || !finalRegion) {
      toast.show("Username, email, country and region are required.", "error");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim(),
          country,
          region: finalRegion,
          emailOtp: isEmailChanged ? emailOtp.trim() : "",
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Failed to update profile");
      }
      updateUser({
        username: data?.user?.username || username.trim(),
        email: data?.user?.email || email.trim(),
        country: data?.user?.country || country,
        region: data?.user?.region || finalRegion,
      });
      setBaselineEmail(data?.user?.email || email.trim());
      setEmailOtp("");
      setEmailOtpSent(false);
      setEmailOtpStatus("idle");
      toast.show("Profile updated.", "success");
    } catch (error) {
      toast.show(error.message || "Failed to update profile", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyDeletePassword = async () => {
    if (!token) return;
    const password = deletePassword.trim();
    if (!password) {
      toast.show("Enter your password to continue.", "error");
      return;
    }

    setVerifyingDeletePassword(true);
    try {
      const response = await fetch("/api/auth/verify-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Password verification failed");
      }
      if (!data.valid) {
        setDeleteVerified(false);
        toast.show("Password does not match.", "error");
        return;
      }
      setDeleteVerified(true);
      toast.show("Password verified. Delete is now enabled.", "success");
    } catch (error) {
      setDeleteVerified(false);
      toast.show(error.message || "Password verification failed", "error");
    } finally {
      setVerifyingDeletePassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!token || !deleteVerified || deletingAccount) return;
    const password = deletePassword.trim();
    if (!password) return;
    if (!confirm("Delete your account permanently? This action cannot be undone.")) return;

    setDeletingAccount(true);
    try {
      const response = await fetch("/api/auth/delete-account", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete account");
      }
      toast.show("Account deleted.", "success");
      logout();
    } catch (error) {
      toast.show(error.message || "Failed to delete account", "error");
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col">
      <Header
        onToggleSection={(section) => {
          if (section === "admin") onOpenAdmin?.();
        }}
      />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-8 py-8 pb-32 sm:pb-36">
        <div className="flex items-center justify-between gap-3 mb-6">
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--accent)] tracking-tight">Account Settings</h1>
          <button
            onClick={onBack}
            className="px-4 py-2 rounded-xl border border-[var(--accent)]/30 text-[var(--accent)] text-xs font-black uppercase tracking-widest hover:bg-[var(--accent)]/10 transition-all"
          >
            Back
          </button>
        </div>

        <div className="bg-[var(--card-bg)]/60 border border-[var(--accent)]/20 rounded-3xl p-5 sm:p-6 mb-5">
          <h2 className="text-lg font-black uppercase tracking-tight text-[var(--accent)]">Profile</h2>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Username</p>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-2.5 rounded-xl text-sm outline-none focus:border-[var(--accent)]"
              />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Email</p>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailOtp("");
                  setEmailOtpSent(false);
                  setEmailOtpStatus("idle");
                }}
                className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-2.5 rounded-xl text-sm outline-none focus:border-[var(--accent)]"
              />
              {isEmailChanged && (
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void handleSendEmailOtp()}
                      disabled={sendingEmailOtp || loading || profileLoading}
                      className="px-2.5 py-1 rounded-lg border border-[var(--accent)]/30 text-[var(--accent)] text-[10px] font-black uppercase tracking-wider disabled:opacity-50"
                    >
                      {sendingEmailOtp ? "Sending..." : "Send OTP"}
                    </button>
                    <span className="text-[10px] font-bold opacity-60">
                      {emailOtpSent ? "OTP sent. Check inbox." : "Verify new email before save."}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      value={emailOtp}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\s+/g, "");
                        setEmailOtp(value);
                        if (value.length < 6) {
                          setEmailOtpStatus("idle");
                          return;
                        }
                        void handleVerifyEmailOtp(value);
                      }}
                      onBlur={() => void handleVerifyEmailOtp(emailOtp)}
                      placeholder="Enter OTP"
                      className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-2 pr-8 rounded-lg text-xs outline-none focus:border-[var(--accent)]"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2">
                      {emailOtpStatus === "checking" && (
                        <span className="block w-3 h-3 border-2 border-[var(--accent)]/40 border-t-[var(--accent)] rounded-full animate-spin" />
                      )}
                      {emailOtpStatus === "valid" && (
                        <svg viewBox="0 0 20 20" className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2.8" aria-hidden="true">
                          <path d="M4 10l4 4 8-8" />
                        </svg>
                      )}
                      {emailOtpStatus === "invalid" && (
                        <svg viewBox="0 0 20 20" className="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" strokeWidth="2.8" aria-hidden="true">
                          <path d="M5 5l10 10M15 5L5 15" />
                        </svg>
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Country</p>
              <select
                value={country}
                onChange={(e) => {
                  const nextCountry = e.target.value;
                  setCountry(nextCountry);
                  const mappedRegion = COUNTRY_REGION_MAP[nextCountry] || "";
                  if (mappedRegion) setRegion(mappedRegion);
                }}
                className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-2.5 rounded-xl text-sm outline-none focus:border-[var(--accent)]"
              >
                <option value="">Select country</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Region</p>
              <input
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-2.5 rounded-xl text-sm outline-none focus:border-[var(--accent)]"
              />
              <p className="mt-1 text-[10px] font-bold opacity-60">
                Suggested: {inferredRegion || "N/A"}
              </p>
            </div>
          </div>
          <button
            onClick={() => void handleSave()}
            disabled={loading || profileLoading || (isEmailChanged && emailOtpStatus !== "valid")}
            className="mt-5 px-4 py-2.5 rounded-xl bg-[var(--accent)] text-white text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Profile"}
          </button>
        </div>

        <div className="bg-[var(--card-bg)]/60 border border-[var(--accent)]/20 rounded-3xl p-5 sm:p-6">
          <h2 className="text-lg font-black uppercase tracking-tight text-[var(--accent)]">Connections & Security</h2>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-[var(--accent)]/15 bg-[var(--bg-primary)]/50 p-3">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Last.fm</p>
              <p className="mt-1 text-sm font-bold">{user?.lastfmUsername || "Not connected"}</p>
            </div>
            <div className="rounded-xl border border-[var(--accent)]/15 bg-[var(--bg-primary)]/50 p-3">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Account</p>
              <button
                onClick={logout}
                className="mt-1 text-sm font-black text-red-400 hover:text-red-300 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 p-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-red-300">Delete Account</p>
            <p className="mt-1 text-[11px] font-semibold opacity-80">
              This removes your account and linked records permanently.
            </p>
            <div className="mt-2 flex flex-col sm:flex-row gap-2 sm:items-center">
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => {
                  setDeletePassword(e.target.value);
                  setDeleteVerified(false);
                }}
                placeholder="Enter password"
                className="flex-1 bg-[var(--bg-primary)] border border-[var(--accent)]/20 px-3 py-2 rounded-lg text-xs outline-none focus:border-[var(--accent)]"
              />
              <button
                type="button"
                onClick={() => void handleVerifyDeletePassword()}
                disabled={verifyingDeletePassword || deletingAccount}
                className="px-3 py-1.5 rounded-lg border border-[var(--accent)]/30 text-[var(--accent)] text-[10px] font-black uppercase tracking-wider disabled:opacity-50"
              >
                {verifyingDeletePassword ? "Verifying..." : "Verify"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setDeletePassword("");
                  setDeleteVerified(false);
                }}
                disabled={verifyingDeletePassword || deletingAccount}
                className="px-3 py-1.5 rounded-lg border border-[var(--accent)]/20 text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-wider disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleDeleteAccount()}
                disabled={!deleteVerified || verifyingDeletePassword || deletingAccount}
                className="px-3 py-1.5 rounded-lg border border-red-400/50 text-red-300 text-[10px] font-black uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {deletingAccount ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default AccountSettings;
