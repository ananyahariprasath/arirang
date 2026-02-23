import { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import { COUNTRY_REGION_MAP } from "../constants";

const STREAMING_PLATFORMS = [
  "Spotify",
  "Apple Music",
];

function SubmitProofPage({ country, onBack }) {
  const { toggleTheme, theme } = useTheme();
  const toast = useToast();
  const region = COUNTRY_REGION_MAP[country] || "Global";
  const [form, setForm] = useState({
    username: "",
    platform: "",
    screenshotUrl: "",
    albumStreamCount: "",
    titleTrackStreamCount: "",
    notes: "",
  });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const validate = (fields = form) => {
    const e = {};
    if (!fields.username.trim()) e.username = "Username is required.";
    if (!fields.platform) e.platform = "Please select a platform.";
    if (!fields.albumStreamCount || Number(fields.albumStreamCount) < 1)
      e.albumStreamCount = "Enter a valid stream count (min 1).";
    if (!fields.titleTrackStreamCount || Number(fields.titleTrackStreamCount) < 1)
      e.titleTrackStreamCount = "Enter a valid stream count (min 1).";
    if (!fields.screenshotUrl.trim()) {
      e.screenshotUrl = "Last.fm profile link is required.";
    } else {
      try { new URL(fields.screenshotUrl); }
      catch { e.screenshotUrl = "Enter a valid URL."; }
    }
    return e;
  };

  const handleChange = (e) => {
    const updated = { ...form, [e.target.name]: e.target.value };
    setForm(updated);
    // Clear error for this field on change
    if (errors[e.target.name]) {
      setErrors((prev) => { const next = { ...prev }; delete next[e.target.name]; return next; });
    }
  };

  const handleBlur = (e) => {
    const fieldErrors = validate();
    if (fieldErrors[e.target.name]) {
      setErrors((prev) => ({ ...prev, [e.target.name]: fieldErrors[e.target.name] }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    const fieldErrors = validate();
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/proof-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          country,
          region,
          ...form,
          albumStreamCount: Number(form.albumStreamCount),
          titleTrackStreamCount: Number(form.titleTrackStreamCount),
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Failed to submit proof");
      }

      setSubmitted(true);
    } catch {
      const message = "Failed to submit data. If issue persits after sometime please contact one of the moderators";
      setSubmitError(message);
      toast.show(message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col">
      {/* Top Bar */}
      <div className="sticky top-0 z-50 bg-[var(--bg-primary)]/80 backdrop-blur-xl border-b border-[var(--accent)]/10 px-4 md:px-8 py-4 flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-black uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity active:scale-95"
          aria-label="Go back"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back
        </button>
        <div className="flex-1" />
        <span className="text-[var(--accent)] font-black text-xs uppercase tracking-[0.2em]">
          Submit Proof 💜
        </span>
        <button
              onClick={toggleTheme}
              className="relative w-14 h-7 flex items-center rounded-full bg-[var(--accent)] transition-colors duration-300 flex-shrink-0"
            >
              <span
                className={`absolute left-1 top-1 w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300 flex items-center justify-center text-xs
                ${theme === "dark" ? "translate-x-7" : ""}
              `}
              >
                {theme === "light" ? "☀️" : "🌙"}
              </span>
            </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-6">
        <div className="w-full max-w-lg">

          {/* Header */}
          <div className="mb-6 text-center">
            {/* <p className="text-[var(--accent)] font-black uppercase tracking-[0.25em] text-[10px] mb-3 opacity-80">
              Streaming Proof
            </p> */}
            <h1
              className="text-3xl md:text-5xl font-black tracking-tighter mb-1 bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(to right, var(--aesthetic-purple), var(--lavender))",
              }}
            >
              Submit Your Streaming Proof
            </h1>
            {/* {country && (
              <p className="text-xs font-bold uppercase tracking-widest opacity-40 mt-2">
                {country}
              </p>
            )} */}
          </div>

          {!submitted ? (
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-4"
              noValidate
            >
              {/* Country & Region — auto-filled, read-only */}
              <div className="flex gap-3">
                <div className="flex-1 flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-black tracking-widest opacity-60">Country</label>
                  <div className="w-full bg-[var(--bg-secondary)]/50 border border-[var(--accent)]/10 rounded-2xl px-5 py-4 text-sm font-bold opacity-70 flex items-center gap-2">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="opacity-60 shrink-0"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/><circle cx="12" cy="10" r="3"/></svg>
                    {country || "—"}
                  </div>
                </div>
                <div className="flex-1 flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-black tracking-widest opacity-60">Region</label>
                  <div className="w-full bg-[var(--bg-secondary)]/50 border border-[var(--accent)]/10 rounded-2xl px-5 py-4 text-sm font-bold opacity-70 flex items-center gap-2">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="opacity-60 shrink-0"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                    {region}
                  </div>
                </div>
              </div>

              {/* Username */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="username" className="text-[10px] uppercase font-black tracking-widest opacity-60">
                  Your Username / Handle
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="e.g. @army_streamer"
                  value={form.username}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full bg-[var(--bg-secondary)]/50 border rounded-2xl px-5 py-4 text-sm font-semibold placeholder:opacity-30 outline-none transition-all ${
                    errors.username ? "border-red-500/60 focus:border-red-500" : "border-[var(--accent)]/20 focus:border-[var(--accent)]"
                  }`}
                />
                {errors.username && <p className="text-red-400 text-[10px] font-bold pl-1">{errors.username}</p>}
              </div>

              {/* Streaming Platform */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="platform" className="text-[10px] uppercase font-black tracking-widest opacity-60">
                  Streaming Platform
                </label>
                <select
                  id="platform"
                  name="platform"
                  value={form.platform}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full bg-[var(--bg-secondary)]/50 border rounded-2xl px-5 py-4 text-sm font-semibold outline-none transition-all appearance-none cursor-pointer ${
                    errors.platform ? "border-red-500/60" : "border-[var(--accent)]/20 focus:border-[var(--accent)]"
                  }`}
                >
                  <option value="" disabled>Select a platform…</option>
                  {STREAMING_PLATFORMS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                {errors.platform && <p className="text-red-400 text-[10px] font-bold pl-1">{errors.platform}</p>}
              </div>

              {/* Stream Count */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="albumStreamCount" className="text-[10px] uppercase font-black tracking-widest opacity-60">
                  Arirang Album Stream Count (today)
                </label>
                <input
                  id="albumStreamCount"
                  name="albumStreamCount"
                  type="number"
                  min="1"
                  placeholder="e.g. 150"
                  value={form.albumStreamCount}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full bg-[var(--bg-secondary)]/50 border rounded-2xl px-5 py-4 text-sm font-semibold placeholder:opacity-30 outline-none transition-all ${
                    errors.albumStreamCount ? "border-red-500/60 focus:border-red-500" : "border-[var(--accent)]/20 focus:border-[var(--accent)]"
                  }`}
                />
                {errors.albumStreamCount && <p className="text-red-400 text-[10px] font-bold pl-1">{errors.albumStreamCount}</p>}
              </div>

              {/* Title Track Stream Count */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="titleTrackStreamCount" className="text-[10px] uppercase font-black tracking-widest opacity-60">
                  Title Track Stream Count (today)
                </label>
                <input
                  id="titleTrackStreamCount"
                  name="titleTrackStreamCount"
                  type="number"
                  min="1"
                  placeholder="e.g. 150"
                  value={form.titleTrackStreamCount}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full bg-[var(--bg-secondary)]/50 border rounded-2xl px-5 py-4 text-sm font-semibold placeholder:opacity-30 outline-none transition-all ${
                    errors.titleTrackStreamCount ? "border-red-500/60 focus:border-red-500" : "border-[var(--accent)]/20 focus:border-[var(--accent)]"
                  }`}
                />
                {errors.titleTrackStreamCount && <p className="text-red-400 text-[10px] font-bold pl-1">{errors.titleTrackStreamCount}</p>}
              </div>

              {/* Last.fm Profile Link */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="screenshotUrl" className="text-[10px] uppercase font-black tracking-widest opacity-60">
                  Last.fm Profile Link <span className="opacity-50 normal-case font-medium">(Imgur, Google Drive, etc.)</span>
                </label>
                <input
                  id="screenshotUrl"
                  name="screenshotUrl"
                  type="url"
                  placeholder="https://www.last.fm/user/..."
                  value={form.screenshotUrl}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full bg-[var(--bg-secondary)]/50 border rounded-2xl px-5 py-4 text-sm font-semibold placeholder:opacity-30 outline-none transition-all ${
                    errors.screenshotUrl ? "border-red-500/60 focus:border-red-500" : "border-[var(--accent)]/20 focus:border-[var(--accent)]"
                  }`}
                />
                {errors.screenshotUrl && <p className="text-red-400 text-[10px] font-bold pl-1">{errors.screenshotUrl}</p>}
              </div>

              {/* Notes */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="notes" className="text-[10px] uppercase font-black tracking-widest opacity-60">
                  Notes <span className="opacity-50 normal-case font-medium">(optional)</span>
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={2}
                  placeholder="Any extra details or context…"
                  value={form.notes}
                  onChange={handleChange}
                  className="w-full bg-[var(--bg-secondary)]/50 border border-[var(--accent)]/20 focus:border-[var(--accent)] rounded-2xl px-5 py-4 text-sm font-semibold placeholder:opacity-30 outline-none transition-all resize-none"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="mt-0 w-full py-4 rounded-2xl bg-[var(--accent)] text-black font-black uppercase text-xs tracking-[0.15em] shadow-xl shadow-[var(--accent)]/20 hover:scale-[1.02] active:scale-[0.97] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                    </svg>
                    Submitting…
                  </span>
                ) : (
                  "Submit Proof 💜"
                )}
              </button>

              <p className="text-center text-[10px] opacity-30 font-medium tracking-wider">
                Your submission will be reviewed by the mod team.
              </p>
              {submitError && (
                <p className="text-center text-[11px] text-red-400 font-bold tracking-wide">
                  {submitError}
                </p>
              )}
            </form>
          ) : (
            /* Success State */
            <div className="text-center flex flex-col items-center gap-6 py-8 animate-in fade-in zoom-in-95 duration-300">
              <div className="w-20 h-20 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/30 flex items-center justify-center text-4xl">
                💜
              </div>
              <div>
                <h2 className="text-3xl font-black tracking-tighter mb-2">Thank you!</h2>
                <p className="text-sm opacity-50 font-medium leading-relaxed">
                  Your streaming proof has been submitted.<br />
                  The mod team will review it shortly.
                </p>
              </div>
              <button
                onClick={onBack}
                className="px-8 py-4 rounded-2xl bg-[var(--accent)] text-black font-black uppercase text-xs tracking-[0.15em] shadow-xl shadow-[var(--accent)]/20 hover:scale-105 active:scale-95 transition-all"
              >
                Back to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SubmitProofPage;

