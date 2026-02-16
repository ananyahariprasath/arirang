import { useState } from "react";
import BattleHistoryModal from "../modals/BattleHistoryModal";
import useBattles from "../../hooks/useBattles";

function StreamingBattle() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { battles, liveBattle } = useBattles();

  return (
    <div className="flex flex-col gap-4">
      
      {/* 1. Live Battle Card (Compacted) */}
      <div className="bg-[var(--card-bg)]/40 backdrop-blur-xl border border-[var(--accent)]/40 rounded-2xl p-4 shadow-2xl overflow-hidden relative group">
        <div className="flex justify-between items-start mb-2">
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span className="text-[9px] uppercase font-black tracking-widest text-red-500">Live Status</span>
            </div>
            <h2 className="text-xl font-black text-[var(--accent)] tracking-tight leading-none mb-1">{liveBattle.title}</h2>
            <p className="text-[10px] opacity-60">Goal: {liveBattle.goal}</p>
          </div>
          <div className="text-right">
            <span className="text-[9px] font-bold opacity-40 uppercase tracking-tighter">Progress</span>
            <div className="text-lg font-black text-[var(--text-primary)] leading-none">{liveBattle.progress}%</div>
          </div>
        </div>

        {/* Mini Progress Bar */}
        <div className="w-full h-1 bg-[var(--accent)]/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-red-500 to-[var(--accent)] rounded-full shadow-[0_0_10px_rgba(106,13,173,0.5)] transition-all duration-1000"
            style={{ width: `${liveBattle.progress}%` }}
          ></div>
        </div>
      </div>

      {/* 2. Battle Results Card (Compacted) */}
      <div className="bg-[var(--card-bg)]/40 backdrop-blur-xl border border-[var(--accent)]/20 rounded-2xl p-4 shadow-xl text-[var(--text-primary)]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold uppercase tracking-wider opacity-80">Recent Results</h3>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="text-[9px] font-black uppercase tracking-widest text-[var(--accent)] hover:underline decoration-2 underline-offset-4 transition-all"
          >
            See All
          </button>
        </div>

        <div className="space-y-2">
          {battles.slice(0, 4).map((battle, index) => (
            <div key={battle.id} className="flex items-center justify-between p-2 rounded-xl bg-[var(--accent)]/5 border border-[var(--accent)]/5 hover:border-[var(--accent)]/20 transition-all group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center font-bold text-[var(--accent)] text-xs">
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
      </div>

      {/* History Modal */}
      <BattleHistoryModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        battles={battles}
      />
    </div>
  );
}

export default StreamingBattle;

