import { useState } from "react";
import { useToast } from "../../context/ToastContext";

function DailyMissionsDrawer({
  isOpen,
  onClose,
  missions,
  missionsLoading,
  completedMissions,
  onCompleteMission,
  referralVerifiedCount,
  referralLink,
}) {
  if (!isOpen) return null;
  const toast = useToast();
  const [justCompletedId, setJustCompletedId] = useState(null);

  return (
    <div className="fixed inset-0 z-[140] text-[var(--text-primary)]">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="absolute right-0 top-0 h-full w-full sm:max-w-md bg-[var(--card-bg)] border-l border-[var(--accent)]/40 shadow-2xl">
        <div className="p-4 sm:p-6 h-full flex flex-col">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-[var(--accent)]" aria-hidden="true">
                  <path d="M9 2h6a2 2 0 0 1 2 2v2H7V4a2 2 0 0 1 2-2z" />
                  <path d="M7 6H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-2" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-black text-[var(--accent)]">Daily Missions</h2>
                <p className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)]">Complete all 5 to enter the draw</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              aria-label="Close missions"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {missionsLoading ? (
            <p className="text-sm font-semibold text-[var(--text-secondary)]">Loading missions...</p>
          ) : missions.length === 0 ? (
            <p className="text-sm font-semibold text-[var(--text-secondary)]">No missions published yet.</p>
          ) : (
            (() => {
              const visibleMissions = missions.filter((mission) => mission.active !== false);
              if (visibleMissions.length === 0) {
                return <p className="text-sm font-semibold text-[var(--text-secondary)]">No active missions right now.</p>;
              }
              const completedCount = visibleMissions.filter((mission) => completedMissions[mission.id]).length;
              return (
                <div className="space-y-3 overflow-y-auto no-scrollbar pr-1">
                  <div className="rounded-xl border border-[var(--accent)]/15 bg-[var(--bg-primary)]/30 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">
                    Progress: {completedCount}/{visibleMissions.length}
                  </div>
                  {visibleMissions.map((mission) => (
                    <div key={mission.id} className="rounded-xl border border-[var(--accent)]/15 bg-[var(--bg-primary)]/40 p-4">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-black text-[var(--accent)] truncate">{mission.title}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          aria-label="Mark complete"
                          disabled={Boolean(completedMissions[mission.id])}
                          onClick={() => {
                            if (mission.type === "referral") return;
                            onCompleteMission(mission.id);
                            setJustCompletedId(mission.id);
                            setTimeout(() => setJustCompletedId((prev) => (prev === mission.id ? null : prev)), 500);
                          }}
                          className={`shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-xl transition-all ${
                            completedMissions[mission.id]
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-not-allowed"
                              : "bg-[var(--accent)] text-black hover:brightness-110 border border-[var(--accent)]/40"
                          } ${justCompletedId === mission.id ? "scale-110 ring-2 ring-emerald-400/60" : ""}`}
                        >
                          <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.6" aria-hidden="true">
                            <path d="M4 10l4 4 8-8" />
                          </svg>
                        </button>
                      </div>
                      <p className="text-xs font-semibold text-[var(--text-primary)]/80">{mission.description}</p>
                      <p className="mt-2 text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-black">
                        Target: {mission.target} {mission.unit}
                      </p>
                      {mission.type === "referral" ? (
                        <p className="mt-1 text-[10px] font-bold text-[var(--text-secondary)]">
                          Auto-completes when 5 friends join. Current verified: {referralVerifiedCount || 0}
                        </p>
                      ) : null}
                      {mission.type === "referral" && referralLink ? (
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(referralLink);
                                toast.show("Referral link copied!", "success");
                              } catch {
                                toast.show("Copy failed. Please copy manually.", "error");
                              }
                            }}
                            className="px-3 py-2 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 text-[10px] font-black uppercase tracking-widest hover:bg-[var(--accent)] hover:text-black transition-all flex items-center gap-2"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5" aria-hidden="true">
                              <path d="M9 2h6a2 2 0 0 1 2 2v2H7V4a2 2 0 0 1 2-2z" />
                              <path d="M7 6H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-2" />
                            </svg>
                            Copy Referral
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              );
            })()
          )}
        </div>
      </div>
    </div>
  );
}

export default DailyMissionsDrawer;
