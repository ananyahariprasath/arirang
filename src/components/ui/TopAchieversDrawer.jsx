import { useEffect, useState } from "react";
import { useTheme } from "../../context/ThemeContext";

function TopAchieversDrawer({ onClose, isOpen }) {
  const { theme } = useTheme();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    let active = true;
    const loadLeaderboard = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/auth/public-top-scrobblers?limit=10");
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.error || "Failed to load leaderboard");
        }
        if (!active) return;
        setRows(Array.isArray(data.top) ? data.top : []);
      } catch (err) {
        if (!active) return;
        setError(err.message || "Failed to load leaderboard");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadLeaderboard();
    return () => {
      active = false;
    };
  }, [isOpen]);

  return (
    <div
      className={`w-[100vw] max-w-[400px] sm:w-[620px] lg:w-[720px] h-full border-l border-[var(--accent)]/20 shadow-[-20px_0_50px_rgba(0,0,0,0.3)] overflow-y-auto p-6 sm:p-8 flex flex-col pt-24 lg:pt-28 ${
        theme === "light" ? "bg-[#faf8ff]" : "bg-[var(--bg-primary)]"
      }`}
    >
      <div className="flex justify-between items-center mb-6 sm:mb-8">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-[var(--accent)] tracking-tight">Top 10 Achievers</h2>
          <p className="text-[10px] sm:text-xs opacity-50 mt-0.5">Today&apos;s Last.fm leaderboard</p>
        </div>
        <button
          onClick={onClose}
          className="p-3 rounded-xl hover:bg-[var(--accent)]/10 transition-colors border border-transparent hover:border-[var(--accent)]/20"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="flex-1 space-y-2">
        {loading && (
          <p className="text-xs font-bold text-[var(--text-secondary)]">Loading leaderboard...</p>
        )}

        {!loading && error && (
          <p className="text-xs font-bold text-red-400">{error}</p>
        )}

        {!loading && !error && rows.length === 0 && (
          <div className={`flex-1 flex flex-col items-center justify-center min-h-[300px] text-center animate-in fade-in zoom-in duration-500 ${theme === "light" ? "opacity-50" : "opacity-30"}`}>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 border ${theme === "light" ? "bg-indigo-500/10 border-indigo-500/20" : "bg-[var(--accent)]/5 border-[var(--accent)]/10"}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent)]">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-primary)]">No leaderboard data yet</p>
            <p className="text-[8px] font-bold uppercase tracking-widest mt-1 opacity-50">Top 10 will appear here once sync runs</p>
          </div>
        )}

        {!loading && !error && rows.length > 0 && (
          <div className={`rounded-2xl border overflow-hidden ${theme === "light" ? "border-indigo-300/40 bg-white/80" : "border-[var(--accent)]/10"}`}>
            <table className="w-full text-left table-fixed">
              <thead>
                <tr className={`text-[10px] uppercase tracking-widest text-[var(--text-secondary)] ${theme === "light" ? "bg-indigo-500/10" : "bg-[var(--accent)]/5"}`}>
                  <th className="py-2 px-3 w-12">#</th>
                  <th className="py-2 pr-3 w-[42%]">User</th>
                  <th className="py-2 pr-3 w-[36%]">Region</th>
                  <th className="py-2 pr-3 w-[22%]">Total</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${theme === "light" ? "divide-indigo-200/60" : "divide-[var(--accent)]/10"}`}>
                {rows.map((row) => (
                  <tr
                    key={`${row.rank}-${row.lastfmUsername || "unknown"}`}
                    className={`text-xs sm:text-sm ${theme === "light" ? "hover:bg-indigo-500/5" : "hover:bg-[var(--accent)]/5"}`}
                  >
                    <td className="py-2 px-3 font-black text-[var(--accent)]">{row.rank}</td>
                    <td className="py-2 pr-3 font-bold truncate" title={row.lastfmUsername || "-"}>{row.lastfmUsername || "-"}</td>
                    <td className="py-2 pr-3 truncate" title={row.region || "-"}>{row.region || "-"}</td>
                    <td className="py-2 pr-3 font-black text-[var(--accent)]">
                      {Number(row.totalStreams || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default TopAchieversDrawer;
