import { useState, useEffect, useMemo, useRef } from "react";
import Header from "../components/layout/Header";
import useCountdown from "../hooks/useCountdown";
import { useTheme } from "../context/ThemeContext";
import CountryDropdown from "../components/ui/CountryDropdown";
import CountryModal from "../components/modals/CountryModal";
// import Section1 from "../components/section-1/Section1";
// import ContactSupport from "../components/section-2/ContactSupport";
import Timeline from "../components/post-expiry/Timeline";
import StreamingBattle from "../components/post-expiry/StreamingBattle";
import SupportDrawer from "../components/ui/SupportDrawer";
import RecentResultsDrawer from "../components/ui/RecentResultsDrawer";
import TopAchieversDrawer from "../components/ui/TopAchieversDrawer";
import VerticalTabs from "../components/ui/VerticalTabs";
import Gallery from "../components/post-expiry/Gallery";
import BattleWinnerModal from "../components/modals/BattleWinnerModal";
import DailyUpdateModal from "../components/modals/DailyUpdateModal";
import OnboardingModal from "../components/modals/OnboardingModal";
import ShareMilestoneModal from "../components/modals/ShareMilestoneModal";
import useBattles from "../hooks/useBattles";
import YoutubeEmbed from "../components/section-1/YoutubeEmbed";
import LanguageDropdown from "../components/section-1/LanguageDropdown";
import PreSaveQR from "../components/section-1/PreSaveQR";
import CountdownTimer from "../components/section-1/CountdownTimer";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { COUNTRIES } from "../constants";
import useDailyUpdates from "../hooks/useDailyUpdates";

const COUNTRY_PLACEHOLDER = "Select your Country";

const COUNTRY_ALIASES = {
  "united states": "USA",
  "united states of america": "USA",
  us: "USA",
  "u.s.": "USA",
  "u.s.a.": "USA",
};

function resolveCountryFromUser(user) {
  const raw = String(user?.country || "").trim();
  if (!raw) return null;

  const exact = COUNTRIES.find((c) => c === raw);
  if (exact) return exact;

  const normalized = raw.toLowerCase();
  const alias = COUNTRY_ALIASES[normalized];
  if (alias && COUNTRIES.includes(alias)) return alias;

  const caseInsensitive = COUNTRIES.find((c) => c.toLowerCase() === normalized);
  return caseInsensitive || null;
}

function Home({ onNavigateToProof, onOpenAdmin, onOpenSettings }) {
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_PLACEHOLDER);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRecentBattlesOpen, setIsRecentBattlesOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isTopAchieversOpen, setIsTopAchieversOpen] = useState(false);
  const [isWinnerModalOpen, setIsWinnerModalOpen] = useState(false);
  const [isDailyUpdateModalOpen, setIsDailyUpdateModalOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [isOnboardingPreviewMode, setIsOnboardingPreviewMode] = useState(false);
  const [queueWinnerAfterUpdate, setQueueWinnerAfterUpdate] = useState(false);
  const [isPageReadyForPopups, setIsPageReadyForPopups] = useState(false);
  const lastPopupKeyRef = useRef("");
  const lastBattleNotificationIdRef = useRef("");
  const onboardingActionLockRef = useRef(false);
  const { theme } = useTheme();
  const [resetCountdown, setResetCountdown] = useState("00:00:00");

  const [localNow, setLocalNow] = useState("");
  const [timeZone, setTimeZone] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLocalNow(
        now.toLocaleString([], {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
      setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    };

    updateTime();
    const localTimer = setInterval(updateTime, 1000);
    return () => clearInterval(localTimer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const markReady = () => {
      if (cancelled) return;
      // Give layout one extra paint cycle after full load to avoid popup flicker/glitch.
      setTimeout(() => {
        if (!cancelled) setIsPageReadyForPopups(true);
      }, 120);
    };

    if (document.readyState === "complete") {
      markReady();
    } else {
      window.addEventListener("load", markReady, { once: true });
    }

    return () => {
      cancelled = true;
      window.removeEventListener("load", markReady);
    };
  }, []);

  useEffect(() => {
    const updateResetCountdown = () => {
      const now = new Date();
      const nextUtcMidnight = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + 1,
        0,
        0,
        0
      ));
      const diffMs = Math.max(0, nextUtcMidnight.getTime() - now.getTime());

      const totalSeconds = Math.floor(diffMs / 1000);
      const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
      const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
      const seconds = String(totalSeconds % 60).padStart(2, "0");
      setResetCountdown(`${hours}:${minutes}:${seconds}`);
    };

    updateResetCountdown();
    const timer = setInterval(updateResetCountdown, 1000);
    return () => clearInterval(timer);
  }, []);

  const { isExpired } = useCountdown();
  const { battles, loading } = useBattles();
  const { updates, latestUpdate, loading: dailyUpdatesLoading } = useDailyUpdates();
  const { user, token, updateUser } = useAuth();
  const toast = useToast();

  useEffect(() => {
    let active = true;

    const checkBattleNotifications = async () => {
      if (isOnboardingOpen) return;
      try {
        const response = await fetch("/api/auth/battle-notifications", { cache: "no-store" });
        const data = await response.json().catch(() => ({}));
        if (!active || !response.ok) return;

        const notification = data?.active;
        if (!notification?.id) return;
        if (lastBattleNotificationIdRef.current === notification.id) return;

        lastBattleNotificationIdRef.current = notification.id;
        toast.show(notification.message || "Battle update available", notification.level === "success" ? "success" : "info");
      } catch {
        // Intentionally silent to avoid noisy UX when network is unstable.
      }
    };

    checkBattleNotifications();
    const intervalId = setInterval(checkBattleNotifications, 45 * 1000);
    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, [toast, isOnboardingOpen]);

  const preferredWinnerBattles = useMemo(() => {
    const all = Array.isArray(battles) ? battles : [];
    const manualFirst = all.filter((b) => String(b?.source || "manual") !== "auto:lastfm");
    return manualFirst.length > 0 ? manualFirst : all;
  }, [battles]);
  const hasWinnerRecords = preferredWinnerBattles.length > 0;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const previewOnboarding = params.get("previewOnboarding") === "1";
    const previewMilestone = params.get("previewMilestone") === "1";

    if (previewOnboarding) {
      setIsOnboardingPreviewMode(true);
      setIsOnboardingOpen(true);
    }
    if (previewMilestone) {
      setIsMilestoneModalOpen(true);
    }
  }, []);

  useEffect(() => {
    if (isOnboardingPreviewMode) {
      setIsOnboardingOpen(true);
      return;
    }

    if (!user?.id || !token) {
      setIsOnboardingOpen(false);
      return;
    }

    let active = true;
    const loadOnboardingStatus = async () => {
      try {
        const response = await fetch("/api/auth/profile-preferences", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !active) return;

        const onboardingComplete = Boolean(data?.preferences?.onboardingComplete);
        const snoozeUntilRaw = data?.preferences?.onboardingSnoozeUntil;
        const snoozeUntilMs = snoozeUntilRaw ? new Date(snoozeUntilRaw).getTime() : 0;
        const shouldShow = !onboardingComplete && (Number.isNaN(snoozeUntilMs) || Date.now() >= snoozeUntilMs);
        setIsOnboardingOpen(shouldShow);

        updateUser({
          onboardingComplete,
          onboardingSnoozeUntil: snoozeUntilRaw || null,
        });
      } catch {
        // Silent fallback: if request fails, do not block the app.
      }
    };

    void loadOnboardingStatus();
    return () => {
      active = false;
    };
  }, [user?.id, token, isOnboardingPreviewMode]);

  useEffect(() => {
    if (isOnboardingOpen) onboardingActionLockRef.current = false;
  }, [isOnboardingOpen]);

  useEffect(() => {
    if (!user) {
      setSelectedCountry(COUNTRY_PLACEHOLDER);
      return;
    }

    const defaultCountry = resolveCountryFromUser(user);
    if (defaultCountry) {
      setSelectedCountry((prev) => (
        prev === COUNTRY_PLACEHOLDER ? defaultCountry : prev
      ));
    } else {
      setSelectedCountry(COUNTRY_PLACEHOLDER);
    }
  }, [user?.id, user?.country]);

  // Handle Last.fm Callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    if (!token) return;
    if (!user?.id) return;

    const callbackKey = `lastfm_callback_handled_${token}`;
    const alreadyHandled = sessionStorage.getItem(callbackKey) === "1";
    if (alreadyHandled) {
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (user.lastfmUsername) {
      sessionStorage.setItem(callbackKey, "1");
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    sessionStorage.setItem(callbackKey, "1");

    const linkLastFm = async () => {
      try {
        const res = await fetch("/api/auth/lastfm-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, userId: user.id })
        });

        const data = await res.json();
        if (res.ok) {
          updateUser({ lastfmUsername: data.lastfmUsername });
          toast.show(`Successfully linked Last.fm account: ${data.lastfmUsername}`, "success");
        } else {
          toast.show(data.error || "Failed to link Last.fm", "error");
        }
      } catch (err) {
        console.error("Last.fm linking error:", err);
        toast.show("An error occurred while linking Last.fm", "error");
      } finally {
        // Clean up URL after callback handling.
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };

    linkLastFm();
  }, [user?.id, user?.lastfmUsername, updateUser, toast]);

  // Show daily update first (if present and unseen), then preserve winner modal behavior.
  useEffect(() => {
    if (isOnboardingOpen) return;
    if (!isPageReadyForPopups || dailyUpdatesLoading) return;
    const hasGlobalUpdate = Boolean(latestUpdate?.message);
    const popupScopeKey = [
      latestUpdate?.id || "",
      latestUpdate?.updatedAt || "",
      String(isExpired),
      String(hasWinnerRecords),
    ].join("|");
    if (lastPopupKeyRef.current === popupScopeKey) return;
    lastPopupKeyRef.current = popupScopeKey;

    if (hasGlobalUpdate) {
      setQueueWinnerAfterUpdate(Boolean(isExpired && hasWinnerRecords));
      setIsDailyUpdateModalOpen(true);
      return;
    }

    if (isExpired && hasWinnerRecords) {
      setIsWinnerModalOpen(true);
    }
  }, [
    isExpired,
    hasWinnerRecords,
    dailyUpdatesLoading,
    latestUpdate?.id,
    latestUpdate?.updatedAt,
    latestUpdate?.message,
    isPageReadyForPopups,
    isOnboardingOpen,
  ]);

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleToggleSection = (section) => {
    if (section === 'recent-battles') {
      setIsRecentBattlesOpen(!isRecentBattlesOpen);
      setIsContactOpen(false);
      setIsTopAchieversOpen(false);
    } else if (section === 'contact') {
      setIsContactOpen(!isContactOpen);
      setIsRecentBattlesOpen(false);
      setIsTopAchieversOpen(false);
    } else if (section === 'top-achievers') {
      setIsTopAchieversOpen(!isTopAchieversOpen);
      setIsRecentBattlesOpen(false);
      setIsContactOpen(false);
    } else if (section === "share-milestone") {
      setIsMilestoneModalOpen(true);
    } else if (section === 'admin') {
      onOpenAdmin?.();
    } else if (section === "settings") {
      onOpenSettings?.();
    }
  };

  return (
    <div className="min-h-screen lg:h-screen lg:pb-20 lg:overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)] relative flex flex-col">
      <Header onToggleSection={handleToggleSection} />

      {/* Main Content Area */}
      <section className="flex-1 mt-2 px-4 md:px-8 lg:px-12 relative z-20 pb-24 lg:pb-0 lg:min-h-0 lg:overflow-hidden">
        <div className="max-w-[1800px] mx-auto lg:h-full lg:min-h-0 lg:overflow-hidden">
          
          {/* 3-Column Layout Container */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr_1fr] gap-6 lg:h-full lg:min-h-0 items-stretch lg:pr-12 pb-6 lg:pb-0 lg:overflow-hidden">

            {/* Column 1: Pre-Countdown (or Gallery) */}
            <div className={`lg:h-full flex flex-col lg:overflow-hidden ${isExpired ? 'order-last lg:order-none' : ''}`}>
              {/* We moved CountryDropdown to the center top */}

              {!isExpired ? (
                <div className="flex-1 overflow-y-auto min-h-0 no-scrollbar flex flex-col gap-1 pb-6 pt-1">
                  {/* Countdown Box Moved Up */}
                  <div className={`rounded-xl p-1.5 border transition-all duration-300
                                ${theme === "light"
                        ? "bg-[var(--aesthetic-purple)]/20 border-[var(--lavender)]"
                        : "bg-[#6A0DAD]/30 border-[#D8BFD8]/30 shadow-2xl"
                      }`}>
                    <h3 className="text-[10px] font-bold text-center uppercase mb-1">Your Time: {localNow} ({timeZone})</h3>
                    <div className="scale-100 origin-top mb-[-6px] px-2 py-1">
                      <CountdownTimer />
                    </div>
                    <h2 className="text-center font-black tracking-widest text-[#4B0082] dark:text-white">for D-DAY</h2>
                  </div>

                  <YoutubeEmbed />
                  <LanguageDropdown />
                  <PreSaveQR />
                </div>
              ) : (
                <div className="h-[60vh] md:h-[70vh] lg:flex-1 lg:h-auto min-h-0 overflow-hidden">
                  <Gallery />
                </div>
              )}
            </div>

            {/* Column 2: Streaming Map (Center) */}
            <div id="onboarding-center-section" className="lg:h-full lg:min-h-0 flex flex-col gap-4 lg:overflow-hidden">
              <CountryDropdown
                selectedCountry={selectedCountry}
                onSelect={handleCountrySelect}
              />
              <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 no-scrollbar pb-6 rounded-3xl">
                <Timeline />
              </div>
            </div>

            {/* Column 3: Live Battle Cards (Right) */}
            <div id="onboarding-live-battles" className="flex flex-col gap-2 lg:h-full lg:min-h-0 lg:overflow-hidden">
              <div className="min-h-[32px] shrink-0 px-1 grid grid-cols-1 xl:grid-cols-[auto_1fr] items-end gap-1 xl:gap-2">
                <h2 className="text-lg font-black text-[var(--accent)] uppercase tracking-[0.12em] sm:tracking-widest leading-none whitespace-nowrap">Live Battles</h2>
                <p className="min-w-0 text-[10px] sm:text-[11px] font-black uppercase tracking-wide text-[var(--text-secondary)] leading-tight text-left xl:text-right whitespace-normal break-words">
                  {isExpired ? (
                    <>
                      <span>Time left for reset:</span>
                      <span className="ml-1 text-[10px] sm:text-[12px] font-extrabold tracking-wider text-[var(--accent)] tabular-nums">
                        {resetCountdown}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="block">Battle begins on:</span>
                      <span className="block text-[12px] sm:text-[14px] font-extrabold tracking-wider text-[var(--accent)]">
                        March 20, 2026 13:00 KST
                      </span>
                    </>
                  )}
                </p>
              </div>
              {/* Mobile: natural height stacked cards; Desktop: fills column */}
              <div className="flex flex-col gap-2 max-h-[58vh] overflow-y-auto no-scrollbar pr-1 lg:max-h-none lg:flex-1 lg:min-h-0 lg:overflow-y-auto">
                <StreamingBattle />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Far Right: Vertical Tabs */}
      <div id="onboarding-quick-actions">
        <VerticalTabs onToggleSection={handleToggleSection} />
      </div>

      {/* Overlay for Drawers */}
      {(isRecentBattlesOpen || isContactOpen || isTopAchieversOpen) && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90] transition-opacity duration-300"
          onClick={() => {
            setIsRecentBattlesOpen(false);
            setIsContactOpen(false);
            setIsTopAchieversOpen(false);
          }}
        />
      )}

      {/* Drawers (Updated to be controlled by Home state) */}
      <div className={`fixed top-0 right-0 h-full z-[100] transform transition-all duration-300 ease-in-out
                      ${isRecentBattlesOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 pointer-events-none"}`}>
        <div id="onboarding-recent-drawer" className="h-full">
          <RecentResultsDrawer onClose={() => setIsRecentBattlesOpen(false)} />
        </div>
      </div>

      <div className={`fixed top-0 right-0 h-full z-[100] transform transition-all duration-300 ease-in-out
                      ${isContactOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 pointer-events-none"}`}>
        <div id="onboarding-support-drawer" className="h-full">
          <SupportDrawer onClose={() => setIsContactOpen(false)} />
        </div>
      </div>

      <div className={`fixed top-0 right-0 h-full z-[100] transform transition-all duration-300 ease-in-out
                      ${isTopAchieversOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 pointer-events-none"}`}>
        <div id="onboarding-top10-drawer" className="h-full">
          <TopAchieversDrawer
            isOpen={isTopAchieversOpen}
            onClose={() => setIsTopAchieversOpen(false)}
          />
        </div>
      </div>

      {isModalOpen && (
        <CountryModal
          selectedCountry={selectedCountry}
          onClose={handleCloseModal}
          onSubmitProof={(country) => {
            handleCloseModal();
            onNavigateToProof?.(country);
          }}
        />
      )}

      {isWinnerModalOpen && (
        <BattleWinnerModal 
          winners={preferredWinnerBattles.slice(0, 4)} 
          onClose={() => setIsWinnerModalOpen(false)} 
        />
      )}

      {isDailyUpdateModalOpen && (
        <DailyUpdateModal
          update={latestUpdate}
          updates={updates}
          onClose={() => {
            setIsDailyUpdateModalOpen(false);
            if (queueWinnerAfterUpdate) {
              setIsWinnerModalOpen(true);
              setQueueWinnerAfterUpdate(false);
            }
          }}
        />
      )}

      {isOnboardingOpen && (
        <OnboardingModal
          isOpen={isOnboardingOpen}
          user={user}
          onStepChange={(tourStep) => {
            if (tourStep === 4) {
              setIsRecentBattlesOpen(true);
              setIsTopAchieversOpen(false);
              setIsContactOpen(false);
              return;
            }
            if (tourStep === 5) {
              setIsRecentBattlesOpen(false);
              setIsTopAchieversOpen(true);
              setIsContactOpen(false);
              return;
            }
            if (tourStep === 6) {
              setIsRecentBattlesOpen(false);
              setIsTopAchieversOpen(false);
              setIsContactOpen(true);
              return;
            }
            setIsRecentBattlesOpen(false);
            setIsTopAchieversOpen(false);
            setIsContactOpen(false);
          }}
          onComplete={() => {
            if (!token) return;
            if (onboardingActionLockRef.current) return;
            onboardingActionLockRef.current = true;
            (async () => {
              try {
                const response = await fetch("/api/auth/profile-preferences", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    onboardingComplete: true,
                    onboardingSnoozeUntil: null,
                  }),
                });
                if (response.ok) {
                  updateUser({
                    onboardingComplete: true,
                    onboardingSnoozeUntil: null,
                  });
                }
              } catch {
                // No-op on transient network error.
              } finally {
                setIsOnboardingOpen(false);
                setIsRecentBattlesOpen(false);
                setIsTopAchieversOpen(false);
                setIsContactOpen(false);
                toast.show("Onboarding completed. You are all set.", "success");
              }
            })();
          }}
          onRemindLater={() => {
            if (!token) return;
            if (onboardingActionLockRef.current) return;
            onboardingActionLockRef.current = true;
            const next = new Date(Date.now() + (24 * 60 * 60 * 1000));
            (async () => {
              try {
                const response = await fetch("/api/auth/profile-preferences", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    onboardingComplete: false,
                    onboardingSnoozeUntil: next.toISOString(),
                  }),
                });
                if (response.ok) {
                  updateUser({
                    onboardingComplete: false,
                    onboardingSnoozeUntil: next.toISOString(),
                  });
                }
              } catch {
                // No-op on transient network error.
              } finally {
                setIsOnboardingOpen(false);
                setIsRecentBattlesOpen(false);
                setIsTopAchieversOpen(false);
                setIsContactOpen(false);
              }
            })();
          }}
        />
      )}

      {isMilestoneModalOpen && (
        <ShareMilestoneModal
          isOpen={isMilestoneModalOpen}
          onClose={() => setIsMilestoneModalOpen(false)}
          user={user}
          selectedCountry={selectedCountry}
          isExpired={isExpired}
        />
      )}
    </div>
  );
}

export default Home;
