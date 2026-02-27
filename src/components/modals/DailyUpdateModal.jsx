export default function DailyUpdateModal({ update, updates, onClose }) {
  const items = Array.isArray(updates) && updates.length > 0 ? updates : (update ? [update] : []);
  if (items.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[149] flex items-center justify-center px-2 sm:px-4 py-3 sm:py-4 animate-fadeIn overflow-hidden">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-md transition-opacity duration-300"
      />

      <div className="relative bg-[var(--bg-primary)] border border-[var(--accent)]/30 dark:border-[var(--accent)]/50 rounded-[1.25rem] sm:rounded-[2rem] md:rounded-[2.5rem] p-3 sm:p-5 md:p-8 lg:p-10 max-w-sm sm:max-w-xl md:max-w-2xl w-full shadow-[0_40px_100px_rgba(0,0,0,0.2)] dark:shadow-[0_0_120px_rgba(106,13,173,0.3)] overflow-hidden animate-scaleIn flex flex-col max-h-[92vh] sm:max-h-[90vh]">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-48 bg-[var(--accent)]/10 dark:bg-[var(--accent)]/20 blur-[80px] pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-5 sm:right-5 text-[var(--text-secondary)]/40 hover:text-[var(--text-secondary)] transition-colors z-10"
          aria-label="Close update"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>

        <div className="relative flex-1 flex flex-col overflow-hidden">
          <div className="text-center mb-4 sm:mb-6 shrink-0 px-8 sm:px-10">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-[var(--text-primary)] tracking-tighter uppercase mb-2">
              Daily Update
            </h2>
            <p className="text-[var(--text-secondary)]/50 text-[11px] font-bold uppercase tracking-widest">
              Admin Notice
            </p>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 sm:pr-2 -mr-1 sm:-mr-2 custom-scrollbar min-h-0">
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="bg-[var(--card-bg)] border border-[var(--accent)]/10 dark:border-white/10 rounded-[1rem] sm:rounded-[1.5rem] p-4 sm:p-6">
                  {item.title ? (
                    <h3 className="text-lg sm:text-xl font-black text-[var(--accent)] tracking-tight mb-3">
                      {item.title}
                    </h3>
                  ) : null}

                  {item.imageUrl ? (
                    <div className="mb-4">
                      <img
                        src={item.imageUrl}
                        alt={item.title || "Daily update image"}
                        className="w-full max-h-56 sm:max-h-72 object-contain rounded-xl border border-[var(--accent)]/15 bg-black/10"
                      />
                      {item.quote ? (
                        <p className="mt-2 text-xs sm:text-sm italic font-bold text-[var(--accent)]/90 text-center break-words">
                          {item.quote}
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  <p className="text-sm sm:text-base font-semibold leading-relaxed whitespace-pre-line break-words text-[var(--text-primary)]/90">
                    {item.message}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={onClose}
            className="mt-3 sm:mt-4 w-full bg-[var(--accent)] py-3 sm:py-4 rounded-[0.9rem] sm:rounded-[1.25rem] text-[var(--bg-primary)] dark:text-white font-black uppercase tracking-[0.16em] sm:tracking-[0.2em] hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_15px_30px_rgba(var(--accent-rgb),0.3)] text-[11px] sm:text-sm shrink-0"
          >
            Continue
          </button>
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes scaleIn {
            from { opacity: 0; transform: scale(0.95) translateY(20px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
          }
          .animate-fadeIn {
            animation: fadeIn 0.3s ease-out;
          }
          .animate-scaleIn {
            animation: scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          }
          .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: var(--accent);
            opacity: 0.2;
            border-radius: 10px;
          }
        ` }} />
      </div>
    </div>
  );
}
