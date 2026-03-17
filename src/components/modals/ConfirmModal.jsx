import { useTheme } from "../../context/ThemeContext";

function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", cancelText = "Cancel" }) {
  const { theme } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div
        className={`w-[90%] max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative transition-all duration-300 transform animate-in zoom-in-95 duration-300
                    ${
                      theme === "light"
                        ? "bg-[var(--ivory)] border-2 border-[var(--lavender)] text-[var(--text-primary)]"
                        : "bg-[var(--card-bg)]/80 backdrop-blur-2xl border-2 border-[var(--accent)]/30 text-[var(--text-primary)]"
                    }`}
      >
        <h2 className="text-2xl font-black mb-4 text-center uppercase tracking-tighter">
          {title}
        </h2>
        
        <p className="text-center text-sm mb-8 opacity-80 leading-relaxed font-medium">
          {message}
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="w-full py-4 rounded-2xl bg-[var(--accent)] text-white font-black uppercase tracking-widest text-sm hover:opacity-90 transition-all shadow-lg shadow-[var(--accent)]/20 active:scale-95"
          >
            {confirmText}
          </button>
          
          <button
            onClick={onClose}
            className="w-full py-4 rounded-2xl bg-transparent border border-[var(--accent)]/30 text-[var(--text-primary)] font-bold uppercase tracking-widest text-xs hover:bg-[var(--accent)]/5 transition-all active:scale-95"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
