import { useState, useEffect } from "react";
import useBattles from "../../hooks/useBattles";

const STATUS_COLORS = {
  Surging: "bg-red-500/20 text-red-400 border-red-500/30",
  "On Track": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "Heating Up": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "Almost There": "bg-violet-500/20 text-violet-400 border-violet-500/30",
  "Yet to Start": "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

const PROGRESS_GRADIENT = "from-purple-500 to-[var(--accent)]";

function getProgress(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function BattleDetailsModal({ battle, onClose }) {
  if (!battle) return null;

  const albumProgress = getProgress(battle.progress, 0);
  const titleProgress = getProgress(battle.titleTrackProgress, albumProgress);
  const albumStatus = battle.status || "Yet to Start";
  const titleStatus = battle.titleTrackStatus || albumStatus;

  const albumStatusClass = STATUS_COLORS[albumStatus] ?? "bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/30";
  const titleStatusClass = STATUS_COLORS[titleStatus] ?? albumStatusClass;

  return (
    <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-xl rounded-3xl p-5 shadow-2xl border border-[var(--accent)]/30 dark:border-[var(--accent)]/40 bg-white dark:bg-[var(--card-bg)]/90"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start gap-3 mb-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest font-black text-red-500">Live Battle</p>
            <h3 className="text-lg font-black text-[var(--text-primary)] leading-tight mt-1">{battle.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-[var(--accent)]/30 text-[var(--text-primary)] hover:bg-[var(--accent)]/10 transition-all"
          >
            x
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center gap-2">
              <p className="text-xs font-black uppercase tracking-wide text-[var(--text-primary)]">Album Goal: {battle.goal}</p>
              <span className={`text-[10px] font-black uppercase tracking-wider border rounded-full px-2 py-0.5 ${albumStatusClass}`}>
                {albumStatus}
              </span>
            </div>
            <div className="w-full h-2 bg-[var(--accent)]/10 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${PROGRESS_GRADIENT} rounded-full transition-all duration-700`}
                style={{ width: `${albumProgress}%` }}
              />
            </div>
            <p className="text-[11px] font-bold text-[var(--text-secondary)]">Progress: {albumProgress}%</p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center gap-2">
              <p className="text-xs font-black uppercase tracking-wide text-[var(--text-primary)]">Title Goal: {battle.titleTrackGoal ?? battle.goal}</p>
              <span className={`text-[10px] font-black uppercase tracking-wider border rounded-full px-2 py-0.5 ${titleStatusClass}`}>
                {titleStatus}
              </span>
            </div>
            <div className="w-full h-2 bg-[var(--accent)]/10 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${PROGRESS_GRADIENT} rounded-full transition-all duration-700`}
                style={{ width: `${titleProgress}%` }}
              />
            </div>
            <p className="text-[11px] font-bold text-[var(--text-secondary)]">Progress: {titleProgress}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function LiveBattleCard({ battle, onView }) {
  const albumProgress = getProgress(battle.progress, 0);
  const titleProgress = getProgress(battle.titleTrackProgress, albumProgress);
  const albumStatus = battle.status || "Yet to Start";
  const statusClass = STATUS_COLORS[albumStatus] ?? "bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/30";

  return (
    <div className="bg-[var(--card-bg)]/40 backdrop-blur-xl border border-[var(--accent)]/40 rounded-2xl p-3 shadow-2xl overflow-hidden relative group flex flex-col gap-1.5">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
          <span className="text-[10px] uppercase font-black tracking-widest text-red-500">Live</span>
        </div>
        <div className="text-[12px] font-black text-[var(--text-primary)]">{Math.max(albumProgress, titleProgress)}%</div>
      </div>

      <div className="flex items-center justify-between gap-1">
        <h2 className="text-[12px] font-black text-[var(--text-primary)] tracking-tight leading-tight line-clamp-1">
          {battle.title}
        </h2>
        <span className={`inline-block border rounded-full px-2 py-0.5 whitespace-nowrap text-[8px] font-black uppercase tracking-wider ${statusClass}`}>
          {albumStatus}
        </span>
      </div>

      <button
        onClick={onView}
        className="mt-3.25 w-full rounded-xl border border-[var(--accent)]/30 text-[var(--accent)] text-[10px] font-black uppercase tracking-widest py-2 hover:bg-[var(--accent)]/10 transition-all"
      >
        View Battle Progress
      </button>
    </div>
  );
}

function StreamingBattle({ refreshToken = 0, onRefreshStateChange = null }) {
  const { liveBattles, loading } = useBattles({ refreshToken });
  const [selectedBattle, setSelectedBattle] = useState(null);

  useEffect(() => {
    if (onRefreshStateChange) {
      onRefreshStateChange(loading);
    }
  }, [loading, onRefreshStateChange]);

  return (
    <>
      <div className="flex flex-col gap-2.5">
        {liveBattles.map((battle, index) => (
          <div key={battle.id ?? `lb-${index}`}>
            <LiveBattleCard battle={battle} onView={() => setSelectedBattle(battle)} />
          </div>
        ))}
      </div>

      <p className="text-[8px] sm:text-[9px] text-center opacity-40 font-medium italic">
        * Battle results will be updated every hour
      </p>

      {selectedBattle && (
        <BattleDetailsModal battle={selectedBattle} onClose={() => setSelectedBattle(null)} />
      )}
    </>
  );
}

export default StreamingBattle;
