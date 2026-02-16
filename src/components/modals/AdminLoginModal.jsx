import { useState, useEffect, useRef } from "react";
import { useTheme } from "../../context/ThemeContext";


function AdminLoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === "BTSARMY") {
      onLoginSuccess();
      setPassword("");
      setError("");
    } else {
      setError("Incorrect password");
      setPassword("");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm text-[var(--text-primary)]">
      <div className="bg-[var(--card-bg)] border border-[var(--accent)]/50 p-8 rounded-2xl shadow-2xl w-full max-w-sm animate-in fade-in zoom-in duration-300">
        <h2 className="text-2xl font-bold mb-6 text-center text-[var(--accent)]">Admin Access</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              ref={inputRef}
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              placeholder="Enter Password"
              className="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)]/50 border border-[var(--accent)]/30 focus:border-[var(--accent)] outline-none transition-colors text-[var(--text-primary)] placeholder:text-[var(--text-primary)]/50"
            />
            {error && <p className="text-red-400 text-sm mt-2 ml-1">{error}</p>}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-xl border border-[var(--accent)]/30 hover:bg-[var(--accent)]/10 transition-colors text-[var(--text-primary)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 rounded-xl bg-[var(--accent)] text-white hover:bg-[var(--accent)]/80 transition-colors font-semibold shadow-lg shadow-[var(--accent)]/20"
            >
              Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminLoginModal;
