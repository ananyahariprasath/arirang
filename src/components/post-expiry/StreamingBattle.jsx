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

function getStatusFromProgress(progress) {
  const pct = Math.max(0, Math.min(100, Math.round(Number(progress) || 0)));
  if (pct >= 100) return "Completed";
  if (pct >= 75) return "Almost There";
  if (pct >= 50) return "Heating Up";
  if (pct >= 25) return "On Track";
  if (pct > 0) return "Surging";
  return "Yet to Start";
}

function parseGoalValue(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const text = String(value || "").trim().toUpperCase().replace(/,/g, "");
  const match = text.match(/^(\d+(?:\.\d+)?)\s*([KMB])?$/);
  if (!match) return 0;

  const amount = Number(match[1]);
  const suffix = match[2] || "";
  const multiplier = suffix === "B" ? 1_000_000_000 : suffix === "M" ? 1_000_000 : suffix === "K" ? 1_000 : 1;
  return Math.round(amount * multiplier);
}

function parseRegionsFromTitle(title = "") {
  const parts = String(title).split(/\s+vs\s+/i).map((part) => part.trim());
  return [parts[0] || "", parts[1] || ""];
}

function toCount(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
}

function getComputedProgressFromTotals(battle, syncedTotals) {
  const [regionFromTitleA, regionFromTitleB] = parseRegionsFromTitle(battle?.title);
  const regionA = battle?.regionA || regionFromTitleA || "Region A";
  const regionB = battle?.regionB || regionFromTitleB || "Region B";

  const manualTotals = {
    [regionA]: {
      album: toCount(battle?.regionAAlbumManual),
      title: toCount(battle?.regionATitleManual),
    },
    [regionB]: {
      album: toCount(battle?.regionBAlbumManual),
      title: toCount(battle?.regionBTitleManual),
    },
  };

  const activeTotals = {
    [regionA]: {
      album: toCount(manualTotals[regionA]?.album) + toCount(syncedTotals?.[regionA]?.album),
      title: toCount(manualTotals[regionA]?.title) + toCount(syncedTotals?.[regionA]?.title),
    },
    [regionB]: {
      album: toCount(manualTotals[regionB]?.album) + toCount(syncedTotals?.[regionB]?.album),
      title: toCount(manualTotals[regionB]?.title) + toCount(syncedTotals?.[regionB]?.title),
    },
  };

  const albumScrobbles = toCount(activeTotals[regionA]?.album) + toCount(activeTotals[regionB]?.album);
  const titleScrobbles = toCount(activeTotals[regionA]?.title) + toCount(activeTotals[regionB]?.title);

  const albumGoalText = battle?.albumGoal ?? battle?.goal;
  const titleGoalText = battle?.titleTrackGoal ?? battle?.goal;
  const albumGoalValue = parseGoalValue(albumGoalText);
  const titleGoalValue = parseGoalValue(titleGoalText);

  const albumProgress = albumGoalValue > 0
    ? Math.min(100, Math.round((albumScrobbles / albumGoalValue) * 100))
    : getProgress(battle?.progress, 0);
  const titleProgress = titleGoalValue > 0
    ? Math.min(100, Math.round((titleScrobbles / titleGoalValue) * 100))
    : getProgress(battle?.titleTrackProgress, albumProgress);

  return {
    albumProgress,
    titleProgress,
    combinedProgress: Math.round((albumProgress + titleProgress) / 2),
  };
}

function BattleDetailsModal({ battle, onClose }) {
  const safeBattle = battle || {};
  const [regionFromTitleA, regionFromTitleB] = parseRegionsFromTitle(safeBattle.title);
  const regionA = safeBattle.regionA || regionFromTitleA || "Region A";
  const regionB = safeBattle.regionB || regionFromTitleB || "Region B";

  const [syncedTotals, setSyncedTotals] = useState(null);

  const hasSyncTargets = Boolean(
    safeBattle.id && safeBattle.artist && safeBattle.albumName && safeBattle.trackName && regionA && regionB
  );

  useEffect(() => {
    let cancelled = false;
    let intervalId;

    const syncLastFm = async () => {
      if (!hasSyncTargets) {
        if (!cancelled) {
          setSyncedTotals(null);
        }
        return;
      }

      try {
        const response = await fetch("/api/lastfm/battle-aggregate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            battleId: safeBattle.id,
            artist: safeBattle.artist,
            albumName: safeBattle.albumName,
            trackName: safeBattle.trackName,
            regionA,
            regionB,
          }),
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.error || "Failed to sync Last.fm battle stats");
        }

        if (cancelled) return;

        const nextTotals = {
          [regionA]: {
            album: toCount(data?.totals?.[regionA]?.album),
            title: toCount(data?.totals?.[regionA]?.title),
          },
          [regionB]: {
            album: toCount(data?.totals?.[regionB]?.album),
            title: toCount(data?.totals?.[regionB]?.title),
          },
        };

        setSyncedTotals(nextTotals);
      } catch {
        if (!cancelled) {
          setSyncedTotals(null);
        }
      }
    };

    syncLastFm();
    intervalId = setInterval(syncLastFm, 30_000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [
    safeBattle.artist,
    safeBattle.albumName,
    safeBattle.trackName,
    safeBattle.id,
    hasSyncTargets,
    regionA,
    regionB,
  ]);

  const manualTotals = {
    [regionA]: {
      album: toCount(safeBattle.regionAAlbumManual),
      title: toCount(safeBattle.regionATitleManual),
    },
    [regionB]: {
      album: toCount(safeBattle.regionBAlbumManual),
      title: toCount(safeBattle.regionBTitleManual),
    },
  };

  const activeTotals = {
    [regionA]: {
      album: toCount(manualTotals[regionA]?.album) + toCount(syncedTotals?.[regionA]?.album),
      title: toCount(manualTotals[regionA]?.title) + toCount(syncedTotals?.[regionA]?.title),
    },
    [regionB]: {
      album: toCount(manualTotals[regionB]?.album) + toCount(syncedTotals?.[regionB]?.album),
      title: toCount(manualTotals[regionB]?.title) + toCount(syncedTotals?.[regionB]?.title),
    },
  };
  const albumScrobbles = toCount(activeTotals[regionA]?.album) + toCount(activeTotals[regionB]?.album);
  const titleScrobbles = toCount(activeTotals[regionA]?.title) + toCount(activeTotals[regionB]?.title);

  const albumGoalText = safeBattle.albumGoal ?? safeBattle.goal;
  const titleGoalText = safeBattle.titleTrackGoal ?? safeBattle.goal;
  const albumGoalValue = parseGoalValue(albumGoalText);
  const titleGoalValue = parseGoalValue(titleGoalText);

  const albumProgress = albumGoalValue > 0
    ? Math.min(100, Math.round((albumScrobbles / albumGoalValue) * 100))
    : getProgress(safeBattle.progress, 0);
  const titleProgress = titleGoalValue > 0
    ? Math.min(100, Math.round((titleScrobbles / titleGoalValue) * 100))
    : getProgress(safeBattle.titleTrackProgress, albumProgress);

  const albumStatus = getStatusFromProgress(albumProgress);
  const titleStatus = getStatusFromProgress(titleProgress);

  if (!battle) return null;

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
            <h3 className="text-lg font-black text-[var(--text-primary)] leading-tight mt-1">{safeBattle.title}</h3>
            {(safeBattle.artist || safeBattle.albumName || safeBattle.trackName) && (
              <p className="text-[10px] font-bold opacity-60 mt-1">
                {safeBattle.artist || "Artist"} | Album: {safeBattle.albumName || "-"} | Track: {safeBattle.trackName || "-"}
              </p>
            )}
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
              <p className="text-xs font-black uppercase tracking-wide text-[var(--text-primary)]">Album Goal: {albumGoalText}</p>
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="rounded-lg border border-[var(--accent)]/20 bg-[var(--accent)]/5 px-2 py-1.5">
                <p className="text-[8px] uppercase font-black opacity-60">{regionA}</p>
                <p className="text-[11px] font-black text-[var(--accent)]">{toCount(activeTotals[regionA]?.album).toLocaleString()}</p>
              </div>
              <div className="rounded-lg border border-[var(--accent)]/20 bg-[var(--accent)]/5 px-2 py-1.5">
                <p className="text-[8px] uppercase font-black opacity-60">{regionB}</p>
                <p className="text-[11px] font-black text-[var(--accent)]">{toCount(activeTotals[regionB]?.album).toLocaleString()}</p>
              </div>
              <div className="rounded-lg border border-[var(--accent)]/20 bg-[var(--accent)]/5 px-2 py-1.5">
                <p className="text-[8px] uppercase font-black opacity-60">Total</p>
                <p className="text-[11px] font-black text-[var(--accent)]">{albumScrobbles.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center gap-2">
              <p className="text-xs font-black uppercase tracking-wide text-[var(--text-primary)]">Title Goal: {titleGoalText}</p>
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="rounded-lg border border-[var(--accent)]/20 bg-[var(--accent)]/5 px-2 py-1.5">
                <p className="text-[8px] uppercase font-black opacity-60">{regionA}</p>
                <p className="text-[11px] font-black text-[var(--accent)]">{toCount(activeTotals[regionA]?.title).toLocaleString()}</p>
              </div>
              <div className="rounded-lg border border-[var(--accent)]/20 bg-[var(--accent)]/5 px-2 py-1.5">
                <p className="text-[8px] uppercase font-black opacity-60">{regionB}</p>
                <p className="text-[11px] font-black text-[var(--accent)]">{toCount(activeTotals[regionB]?.title).toLocaleString()}</p>
              </div>
              <div className="rounded-lg border border-[var(--accent)]/20 bg-[var(--accent)]/5 px-2 py-1.5">
                <p className="text-[8px] uppercase font-black opacity-60">Total</p>
                <p className="text-[11px] font-black text-[var(--accent)]">{titleScrobbles.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LiveBattleCard({ battle, onView, combinedProgress }) {
  const albumProgress = getProgress(battle.progress, 0);
  const titleProgress = getProgress(battle.titleTrackProgress, albumProgress);
  const displayProgress = Number.isFinite(combinedProgress)
    ? combinedProgress
    : Math.round((albumProgress + titleProgress) / 2);
  const albumStatus = getStatusFromProgress(displayProgress);
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
        <div className="text-[12px] font-black text-[var(--text-primary)]">{displayProgress}%</div>
      </div>

      <div className="flex items-center justify-between gap-1">
        <h2 className="text-[12px] font-black text-[var(--text-primary)] tracking-tight leading-tight line-clamp-2 sm:line-clamp-1">
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
  const [syncedTotalsByBattleId, setSyncedTotalsByBattleId] = useState({});

  useEffect(() => {
    if (onRefreshStateChange) {
      onRefreshStateChange(loading);
    }
  }, [loading, onRefreshStateChange]);

  useEffect(() => {
    let cancelled = false;
    let intervalId;

    const syncAllBattleAggregates = async () => {
      const eligibleBattles = liveBattles.filter((battle) => {
        const [regionFromTitleA, regionFromTitleB] = parseRegionsFromTitle(battle?.title);
        const regionA = battle?.regionA || regionFromTitleA;
        const regionB = battle?.regionB || regionFromTitleB;
        return Boolean(
          battle?.id &&
          battle?.artist &&
          battle?.albumName &&
          battle?.trackName &&
          regionA &&
          regionB
        );
      });

      if (eligibleBattles.length === 0) {
        if (!cancelled) setSyncedTotalsByBattleId({});
        return;
      }

      const settled = await Promise.all(
        eligibleBattles.map(async (battle) => {
          const [regionFromTitleA, regionFromTitleB] = parseRegionsFromTitle(battle?.title);
          const regionA = battle?.regionA || regionFromTitleA;
          const regionB = battle?.regionB || regionFromTitleB;
          try {
            const response = await fetch("/api/lastfm/battle-aggregate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                battleId: battle.id,
                artist: battle.artist,
                albumName: battle.albumName,
                trackName: battle.trackName,
                regionA,
                regionB,
              }),
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) return null;

            return [
              String(battle.id),
              {
                [regionA]: {
                  album: toCount(data?.totals?.[regionA]?.album),
                  title: toCount(data?.totals?.[regionA]?.title),
                },
                [regionB]: {
                  album: toCount(data?.totals?.[regionB]?.album),
                  title: toCount(data?.totals?.[regionB]?.title),
                },
              },
            ];
          } catch {
            return null;
          }
        })
      );

      if (cancelled) return;
      const next = {};
      for (const entry of settled) {
        if (!entry) continue;
        next[entry[0]] = entry[1];
      }
      setSyncedTotalsByBattleId(next);
    };

    syncAllBattleAggregates();
    intervalId = setInterval(syncAllBattleAggregates, 30_000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [liveBattles]);

  return (
    <>
      <div className="flex flex-col gap-2.5">
        {liveBattles.map((battle, index) => (
          <div key={battle.id ?? `lb-${index}`}>
            <LiveBattleCard
              battle={battle}
              combinedProgress={getComputedProgressFromTotals(
                battle,
                syncedTotalsByBattleId[String(battle.id)]
              ).combinedProgress}
              onView={() => setSelectedBattle(battle)}
            />
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
