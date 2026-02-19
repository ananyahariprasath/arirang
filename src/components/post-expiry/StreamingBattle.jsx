import useBattles from "../../hooks/useBattles";

// Status chip colours
const STATUS_COLORS = {
  "Surging":       "bg-red-500/20 text-red-400 border-red-500/30",
  "On Track":      "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "Heating Up":    "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "Almost There":  "bg-violet-500/20 text-violet-400 border-violet-500/30",
};

// Progress bar gradient — same for all cards (matches original)
const PROGRESS_GRADIENT = "from-red-500 to-[var(--accent)]";

function LiveBattleCard({ battle }) {
  const statusClass = STATUS_COLORS[battle.status] ?? "bg-white/10 text-white border-white/10";

  return (
    <div className="bg-[var(--card-bg)]/40 backdrop-blur-xl border border-[var(--accent)]/40 rounded-2xl p-4 shadow-2xl overflow-hidden relative group">
      {/* Row 1: Indicator + Progress % */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          <span className="text-[10px] uppercase font-black tracking-widest text-red-500">Live</span>
        </div>
        <div className="text-xl font-black text-[var(--text-primary)] leading-none">{battle.progress}%</div>
      </div>

      {/* Row 2: Full-width Title */}
      <h2 className="text-base font-black text-[var(--accent)] tracking-tight leading-none whitespace-nowrap">
        {battle.title}
      </h2>

      {/* Row 3: Goal + Status Chip */}
      <div className="flex justify-between items-center mb-3">
        <p className="text-[10px] opacity-60 font uppercase tracking-tight">Goal: {battle.goal}</p>
        <span className={`inline-block text-[9px] font-black uppercase tracking-wider border rounded-full px-2 py-0.75 ${statusClass}`}>
          {battle.status}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 bg-[var(--accent)]/10 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${PROGRESS_GRADIENT} rounded-full shadow-[0_0_8px_rgba(106,13,173,0.4)] transition-all duration-1000`}
          style={{ width: `${battle.progress}%` }}
        />
      </div>
    </div>
  );
}

function StreamingBattle() {
  const { liveBattles } = useBattles();

  return (
    <div className="flex flex-col gap-3">
      {liveBattles.map((battle, index) => (
        <LiveBattleCard key={battle.id ?? `lb-${index}`} battle={battle} />
      ))}
    </div>
  );
}

export default StreamingBattle;
