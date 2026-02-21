import useBattles from "../../hooks/useBattles";

// Status chip colours
const STATUS_COLORS = {
  "Surging":       "bg-red-500/20 text-red-400 border-red-500/30",
  "On Track":      "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "Heating Up":    "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "Almost There":  "bg-violet-500/20 text-violet-400 border-violet-500/30",
  "Yet to Start":  "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

// Progress bar gradient — same for all cards (matches original)
//change this to red if purple doesn't work
const PROGRESS_GRADIENT = "from-purple-500 to-[var(--accent)]";

function LiveBattleCard({ battle }) {
  const statusClass = STATUS_COLORS[battle.status] ?? "bg-white/10 text-white border-white/10";

  return (
    <div className="bg-[var(--card-bg)]/40 backdrop-blur-xl border border-[var(--accent)]/40 rounded-2xl p-4 shadow-2xl overflow-hidden relative group flex flex-col justify-between h-full">
      {/* Row 1: Indicator + Progress % */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2 shrink-0">
            {/*change this to red if purple doesn't work*/}
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          <span className="text-[10px] uppercase font-black tracking-widest text-red-500">Live</span>
        </div>
        <div className="text-xl font-black text-[var(--text-primary)] leading-none">{battle.progress}%</div>
      </div>

      {/* Row 2: Full-width Title */}
      <h2 className="text-md font-black text-[var(--accent)] tracking-tight leading-snug line-clamp-2 pb-1 flex-1 flex items-center">
        {battle.title}
      </h2>

      {/* Row 3: Goal + Status Chip */}
      <div className="flex justify-between items-center mb-2.5">
        <p className="text-[10px] opacity-60 font-bold uppercase tracking-tight">Global Goal: {battle.goal}</p>
        <span className={`inline-block text-[9px] font-black uppercase tracking-wider border rounded-full px-2 py-0.5 ${statusClass}`}>
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
    <div className="flex flex-col gap-2.5 lg:h-full">
      {liveBattles.map((battle, index) => (
        <div key={battle.id ?? `lb-${index}`} className="lg:flex-1 lg:min-h-0">
          <LiveBattleCard battle={battle} />
        </div>
      ))}
    </div>
  );
}

export default StreamingBattle;
