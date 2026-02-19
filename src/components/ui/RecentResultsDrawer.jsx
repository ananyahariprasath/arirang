import { useState } from "react";
import BattleHistoryModal from "../modals/BattleHistoryModal";
import useBattles from "../../hooks/useBattles";

function RecentResultsDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { battles } = useBattles();

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90] transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer Container — slides in from LEFT */}
      <div
        className={`fixed top-0 left-0 h-full z-[100] transform flex items-center will-change-transform
          transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
          ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Drawer Content */}
        <div className="w-[360px] sm:w-[440px] h-full bg-[var(--bg-primary)] border-r border-[var(--accent)]/20 shadow-[20px_0_50px_rgba(0,0,0,0.3)] overflow-y-auto p-8 flex flex-col pt-24 lg:pt-28">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-xl font-black text-[var(--accent)] tracking-tight">Recent Results</h2>
              <p className="text-xs opacity-50 mt-0.5">Latest completed battles</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
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
            {battles.slice(0, 6).map((battle, index) => (
              <div
                key={battle.id}
                className="flex items-center justify-between p-3 rounded-xl bg-[var(--accent)]/5 border border-[var(--accent)]/5 hover:border-[var(--accent)]/20 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center font-bold text-[var(--accent)] text-xs shrink-0">
                    #{index + 1}
                  </div>
                  <div>
                    <div className="text-xs font-bold">{battle.date}</div>
                    <div className="text-[9px] opacity-50 uppercase font-bold">{battle.regions.join(", ")}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-black text-[var(--accent)]">{battle.target}</div>
                  <div className="text-[8px] opacity-50 font-bold uppercase italic leading-none">Success</div>
                </div>
              </div>
            ))}
          </div>

          {/* See All button */}
          <div className="mt-6 pt-4 border-t border-[var(--accent)]/10">
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full py-2.5 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[var(--accent)] text-xs font-black uppercase tracking-widest hover:bg-[var(--accent)]/20 transition-all"
            >
              See All Battles
            </button>
          </div>
        </div>

        {/* Handle Tab — on the RIGHT edge of the drawer */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`absolute right-0 translate-x-full h-36 w-10
            bg-[var(--accent)] text-white font-bold rounded-r-2xl shadow-[10px_0_20px_rgba(0,0,0,0.2)]
            flex items-center justify-center transition-all duration-300
            hover:w-12 hover:bg-[var(--accent)] group
            ${!isOpen && "animate-rrd-tab-glow"}`}
          style={{
            writingMode: "vertical-rl",
            textOrientation: "mixed",
          }}
        >
          <span className="tracking-[0.2em] uppercase text-xs font-black">
            Results
          </span>
        </button>
      </div>

      {/* Full History Modal */}
      <BattleHistoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        battles={battles}
      />

      <style>{`
        @keyframes rrdTabGlow {
          0%, 100% { box-shadow: 5px 0 15px rgba(var(--accent-rgb, 106, 13, 173), 0.3); }
          50%       { box-shadow: 10px 0 25px rgba(var(--accent-rgb, 106, 13, 173), 0.5); }
        }
        .animate-rrd-tab-glow {
          animation: rrdTabGlow 2s infinite ease-in-out;
        }
      `}</style>
    </>
  );
}

export default RecentResultsDrawer;
