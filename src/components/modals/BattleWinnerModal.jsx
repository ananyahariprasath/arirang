import React, { useEffect, useMemo, useState } from "react";

const CONFETTI_COLORS = ["#C8A2FF", "#7B4AE2", "#22C55E", "#F43F5E", "#F59E0B", "#06B6D4", "#00FFFF"];

function createConfettiPieces(count = 36) {
  return Array.from({ length: count }).map((_, idx) => ({
    id: `confetti_${idx}`,
    left: Math.random() * 100,
    delay: Math.random() * 0.6,
    duration: 2.8 + Math.random() * 1.9,
    drift: (Math.random() - 0.5) * 120,
    size: 5 + Math.random() * 5,
    rotation: Math.random() * 360,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
  }));
}

export default function BattleWinnerModal({ winners, onClose }) {
  const hasHistory = winners && winners.length > 0;
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const confettiCount = useMemo(() => {
    if (prefersReducedMotion) return 0;
    const isMobile = typeof window !== "undefined" && window.matchMedia?.("(max-width: 768px)").matches;
    const lowPowerDevice =
      typeof navigator !== "undefined" &&
      Number.isFinite(navigator.hardwareConcurrency) &&
      navigator.hardwareConcurrency <= 4;

    if (lowPowerDevice) return isMobile ? 12 : 18;
    return isMobile ? 20 : 36;
  }, [prefersReducedMotion]);

  const [showConfetti, setShowConfetti] = useState(confettiCount > 0);
  const confettiPieces = useMemo(() => createConfettiPieces(confettiCount), [confettiCount]);
  
  // Limit to 4 to ensure the grid stays balanced
  const displayWinners = hasHistory ? winners.slice(0, 4) : [];

  useEffect(() => {
    if (!showConfetti) return undefined;
    const timer = setTimeout(() => setShowConfetti(false), 5600);
    return () => clearTimeout(timer);
  }, [showConfetti]);

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center px-4 animate-fadeIn overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-md transition-opacity duration-300"
      />

      {/* Confetti burst */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-[151]">
          {confettiPieces.map((piece) => (
            <span
              key={piece.id}
              className="absolute top-[-8vh] confetti-piece"
              style={{
                left: `${piece.left}%`,
                width: `${piece.size}px`,
                height: `${piece.size * 0.48}px`,
                backgroundColor: piece.color,
                transform: `rotate(${piece.rotation}deg)`,
                animationDelay: `${piece.delay}s`,
                animationDuration: `${piece.duration}s`,
                "--confetti-drift": `${piece.drift}px`,
              }}
            />
          ))}
        </div>
      )}

      {/* Modal content */}
      <div
        className="relative bg-[var(--bg-primary)] border border-[var(--accent)]/30 dark:border-[var(--accent)]/50 rounded-[2.5rem] p-4 sm:p-6 md:p-12 max-w-sm sm:max-w-xl md:max-w-xl w-full shadow-[0_40px_100px_rgba(0,0,0,0.2)] dark:shadow-[0_0_120px_rgba(106,13,173,0.3)] overflow-hidden animate-scaleIn flex flex-col max-h-[85vh] sm:max-h-[90vh]"
      >
        {/* Decorative background flare */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-48 bg-[var(--accent)]/10 dark:bg-[var(--accent)]/20 blur-[80px] pointer-events-none" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-[var(--text-secondary)]/40 hover:text-[var(--text-secondary)] transition-colors z-10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>

        <div className="relative flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="text-center mb-10 shrink-0">
            <div className="flex justify-center mb-5">
              <span className="bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 dark:border-emerald-500/30 text-[10px] font-black uppercase tracking-[0.2em] px-6 py-2 rounded-full flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="animate-pulse"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path></svg>
                {hasHistory ? "Battle Cycle Complete" : "Engagement Incoming"}
              </span>
            </div>
            <h2 className="text-3xl font-black text-[var(--text-primary)] tracking-tighter uppercase mb-2">
              {hasHistory ? "Battle Champions" : "Prepare for Impact"}
            </h2>
            <p className="text-[var(--text-secondary)]/50 text-[11px] font-bold uppercase tracking-widest">
              {hasHistory ? "Yesterday's Battle Results" : "Upcoming Challenge"}
            </p>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto pr-1 -mr-2 custom-scrollbar min-h-0">
            {hasHistory ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5 mb-2">
                {displayWinners.map((winner, idx) => (
                  <div 
                    key={winner.id} 
                    className="bg-[var(--card-bg)] border border-[var(--accent)]/10 dark:border-white/10 rounded-[1rem] sm:rounded-[1.5rem] p-3 sm:p-5 flex flex-col hover:border-[var(--accent)]/40 transition-all group relative overflow-hidden h-full"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="text-[8px] text-[var(--text-secondary)]/40 font-bold uppercase tracking-widest opacity-60">
                        #{idx + 1}
                      </div>
                      <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border border-emerald-500/15">
                        WIN
                      </div>
                    </div>
                    <h3 className="text-sm font-black text-[var(--accent)] leading-tight uppercase tracking-tighter group-hover:text-[var(--text-primary)] transition-colors mb-1 truncate">
                      {winner.winner || "TBD"}
                    </h3>
                    <p className="text-[9px] text-[var(--text-secondary)]/40 font-bold uppercase tracking-wider mb-4">
                       {winner.regions?.join(" vs ") || "Challenge"}
                    </p>
                    <div className="mt-auto flex items-center justify-between border-t border-[var(--accent)]/5 dark:border-white/5 pt-3">
                      <span className="text-xs font-black text-[var(--text-primary)]/70">{winner.progress}%</span>
                      <span className="text-[9px] text-[var(--text-secondary)]/30 font-bold uppercase">{winner.target}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-[var(--card-bg)] border border-[var(--accent)]/10 dark:border-white/10 rounded-[1.5rem] sm:rounded-[2rem] p-6 sm:p-12 text-center flex flex-col items-center">
                <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-[var(--accent)]/5 dark:bg-[var(--accent)]/10 flex items-center justify-center mb-4 sm:mb-6 border border-[var(--accent)]/10 dark:border-[var(--accent)]/20 animate-pulse">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" sm:width="32" sm:height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent)]">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                </div>
                <h3 className="text-lg sm:text-2xl font-black text-[var(--text-primary)] mb-2 uppercase tracking-tighter">Battle begins on</h3>
                <p className="text-sm sm:text-lg font-black text-[var(--text-primary)] opacity-80 uppercase tracking-wider">20 March 2026 13:00 KST</p>
              </div>
            )}
          </div>

          <p className="mt-4 text-[9px] text-center font-bold text-[var(--accent)]/40 dark:text-[var(--accent)]/30 uppercase tracking-[0.1em] shrink-0 italic">
            * Battle results are announced every 24 hours
          </p>

          <button
            onClick={onClose}
            className="mt-4 w-full bg-[var(--accent)] py-3 sm:py-5 rounded-[1rem] sm:rounded-[1.5rem] text-[var(--bg-primary)] dark:text-white font-black uppercase tracking-[0.2em] hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_15px_30px_rgba(var(--accent-rgb),0.3)] text-xs sm:text-sm shrink-0"
          >
            {hasHistory ? "I'm Ready for Today's Battle!" : "I'm Ready"}
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
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            opacity: 0.4;
          }
          .confetti-piece {
            border-radius: 2px;
            opacity: 0.95;
            will-change: transform, opacity;
            animation-name: confettiFall;
            animation-timing-function: cubic-bezier(.2,.8,.2,1);
            animation-fill-mode: both;
          }
          @keyframes confettiFall {
            0% {
              transform: translate3d(0, -10vh, 0) rotate(0deg);
              opacity: 0;
            }
            12% {
              opacity: 1;
            }
            100% {
              transform: translate3d(var(--confetti-drift, 0px), 110vh, 0) rotate(540deg);
              opacity: 0;
            }
          }
        ` }} />
      </div>
    </div>
  );
}
