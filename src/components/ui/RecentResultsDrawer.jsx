import useBattles from "../../hooks/useBattles";

function RecentResultsDrawer({ onClose }) {
  const { battles } = useBattles();

  return (
    <>
      {/* Drawer Content */}
      <div className="w-[100vw] max-w-[360px] sm:w-[440px] h-full bg-[var(--bg-primary)] border-l border-[var(--accent)]/20 shadow-[-20px_0_50px_rgba(0,0,0,0.3)] overflow-y-auto p-6 sm:p-8 flex flex-col pt-24 lg:pt-28">
        <div className="flex justify-between items-center mb-6 sm:mb-8">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-[var(--accent)] tracking-tight">Recent Results</h2>
            <p className="text-[10px] sm:text-xs opacity-50 mt-0.5">Latest completed battles</p>
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

        {/* Battle list */}
        <div className="flex-1 space-y-2">
          {battles.length > 0 ? (
            battles.map((battle, index) => (
              <div
                key={battle.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-xl bg-[var(--accent)]/5 border border-[var(--accent)]/5 hover:border-[var(--accent)]/20 transition-all gap-2 sm:gap-0"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center font-bold text-[var(--accent)] text-xs shrink-0">
                    #{index + 1}
                  </div>
                  <div>
                    <div className="text-xs font-bold">{battle.date}</div>
                    <div className="text-[9px] opacity-50 uppercase font-bold">{battle.regions.join(", ")}</div>
                    {battle.winner ? (
                      <div className="mt-1 flex items-center gap-1">
                        <span className="text-[7px] font-black uppercase text-emerald-400 tracking-widest bg-emerald-500/10 px-1.5 py-0.5 rounded">Winner: {battle.winner}</span>
                      </div>
                    ) : battle.reachedTarget && (
                      <div className="mt-1 flex items-center gap-1">
                        <span className="text-[7px] font-black uppercase text-white/40 tracking-widest bg-white/5 px-1.5 py-0.5 rounded italic">Pending Winner</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 ml-11 sm:ml-0">
                  <div className="text-right">
                    <div className="text-[10px] font-black text-[var(--accent)] leading-none">{battle.progress}%</div>
                    <div className={`text-[7px] font-black uppercase tracking-widest mt-0.5 ${battle.reachedTarget ? 'text-emerald-400' : 'text-red-500'}`}>
                      {battle.reachedTarget ? 'Success' : 'Missed'}
                    </div>
                  </div>
                  <div className="w-px h-6 bg-[var(--accent)]/10"></div>
                  <div className="text-right">
                    <div className="text-[10px] font-black text-[var(--text-secondary)] leading-none">{battle.target}</div>
                    <div className="text-[7px] opacity-40 font-bold uppercase tracking-tighter mt-0.5">Target</div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[300px] opacity-30 text-center animate-in fade-in zoom-in duration-500">
              <div className="w-16 h-16 rounded-full bg-[var(--accent)]/5 flex items-center justify-center mb-4 border border-[var(--accent)]/10">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent)]">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-primary)]">Battles begin on March 20, 2026 13:00 KST</p>
              <p className="text-[8px] font-bold uppercase tracking-widest mt-1 opacity-50">Records will appear here once logged</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default RecentResultsDrawer;
