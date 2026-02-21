import { useTheme } from "../../context/ThemeContext";
import useModStatus from "../../hooks/useModStatus";

function HelpDeskModal({ isOpen, onClose }) {
  const { theme } = useTheme();
  const { mods } = useModStatus();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      {/* Modal Card */}
      <div
        className={`w-[95%] md:w-[90%] lg:w-[75%] max-h-[85vh] overflow-y-auto
                    rounded-3xl p-6 shadow-2xl relative transition-all duration-300
                    ${
                      theme === "light"
                        ? "bg-[var(--ivory)] border border-[var(--lavender)] text-[var(--text-primary)]"
                        : "bg-[var(--card-bg)]/40 backdrop-blur-xl border border-[var(--accent)]/40 text-[var(--text-primary)]"
                    }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-xl hover:opacity-70 transition"
        >
          ✕
        </button>

        <h2 className="text-2xl font-bold mb-6 text-center">Help Desk</h2>

        {/* Mods Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mods.map((mod, index) => (
            <div
              key={index}
              className="rounded-2xl p-4 border border-[var(--accent)]/40 bg-[var(--card-bg)]/30 backdrop-blur-lg"
            >
              {/* Name + Status */}
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-base">{mod.name}</h3>

                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${mod.status === 'online' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-gray-500'}`}></span>
                  <span
                    className={`px-2 py-0.5 text-[10px] uppercase tracking-wide rounded-full font-medium
                      ${
                        mod.status === "online"
                          ? "bg-green-500/20 text-green-500 border border-green-500/40"
                          : "bg-gray-500/20 text-gray-400 border border-gray-500/40"
                      }`}
                  >
                    {mod.status === "online" ? "Online" : "Offline"}
                  </span>
                </div>
              </div>

              {/* Platforms */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                {(mod.accounts || []).slice(0, 2).map((acc, i) => (
                  <a
                    key={i}
                    href={acc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`block text-center py-1.5 rounded-lg border border-[var(--accent)]/40 hover:bg-[var(--accent)]/10 transition ${i === 2 ? 'col-span-2' : ''}`}
                  >
                    {acc.platform || 'Link'}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default HelpDeskModal;
