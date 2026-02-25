import { useTheme } from "../../context/ThemeContext";
import useModStatus from "../../hooks/useModStatus";

function HelpDeskModal({ isOpen, onClose }) {
  const { theme } = useTheme();
  const { mods } = useModStatus();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm">
      {/* Modal Card */}
      <div
        className={`w-full max-w-sm sm:max-w-xl md:max-w-xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto
                    rounded-[2.5rem] p-4 sm:p-6 md:p-8 shadow-2xl relative transition-all duration-300
                    ${
                      theme === "light"
                        ? "bg-[var(--ivory)] border border-[var(--lavender)] text-[var(--text-primary)]"
                        : "bg-[var(--card-bg)]/40 backdrop-blur-xl border border-[var(--accent)]/40 text-[var(--text-primary)]"
                    }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 text-xl hover:opacity-70 transition"
        >
          ×
        </button>

        <h2 className="text-xl sm:text-2xl font-bold mb-5 sm:mb-6 text-center uppercase tracking-wide">Help Desk</h2>

        {/* Mods Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {mods.map((mod, index) => (
            <div
              key={index}
              className="rounded-xl p-3 sm:p-4 border border-[var(--accent)]/40 bg-[var(--card-bg)]/30 backdrop-blur-lg"
            >
              {/* Name + Status */}
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-sm sm:text-base uppercase">{mod.name}</h3>

                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${mod.status === "online" ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-gray-500"}`}></span>
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
              <div className="grid grid-cols-1 gap-2 text-xs">
                {(mod.accounts || []).slice(0, 2).map((acc, i) => (
                  <a
                    key={i}
                    href={acc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-center py-1.5 rounded-md border border-[var(--accent)]/40 hover:bg-[var(--accent)]/10 transition"
                  >
                    {acc.platform || "Link"}
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
