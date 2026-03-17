import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Header from "../components/layout/Header";
import useBattles from "../hooks/useBattles";
import useTimeline from "../hooks/useTimeline";
import useRegionalData from "../hooks/useRegionalData";
import useModStatus from "../hooks/useModStatus";
import useGalleryData from "../hooks/useGalleryData";
import useDailyUpdates from "../hooks/useDailyUpdates";
import useDailyMissions from "../hooks/useDailyMissions";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { COUNTRY_PRESETS, COUNTRY_REGION_MAP, COUNTRIES, COUNTRY_TZ_MAP, FOCUS_PLAYLISTS } from "../constants";

const allRegions = [...new Set(Object.values(COUNTRY_REGION_MAP))];
const TOPIC_ROOM_TEMPLATE_RULES = [
  "Be respectful. No harassment, hate speech, or personal attacks.",
  "Stay on topic. Off-topic promotion or spam will be removed.",
  "No private information (yours or others).",
  "Admins can edit, close, or delete rooms if needed.",
  "A maximum of 10 active rooms can exist at one time.",
];
const TOPIC_ROOM_TEMPLATE = {
  title: "Comeback Strategy Room",
  coverImage: "/assets/images/bts-un-photo-1.jpg",
  createdBy: "@demo_army",
  participants: 18,
  roomLimit: 50,
  activeRoomsUsed: 8,
  activeRoomsLimit: 10,
  expiresIn: "2h 15m",
  category: "Streaming",
};
const MISSION_TYPE_OPTIONS = [
  { value: "stream", label: "Streaming" },
  { value: "share", label: "Share / Social" },
  { value: "referral", label: "Referral" },
  { value: "engagement", label: "Engagement" },
  { value: "custom", label: "Custom" }
];
const MISSION_TYPE_DEFAULT_UNITS = {
  stream: "plays",
  share: "shares",
  referral: "verified signups",
  engagement: "actions",
  custom: "actions"
};

function AdminViewPanel() {
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(true);
  const [submissionsError, setSubmissionsError] = useState("");
  const [clearDateRange, setClearDateRange] = useState({ startDate: "", endDate: "" });
  const [clearingDateRange, setClearingDateRange] = useState(false);
  const toast = useToast();
  const [filters, setFilters] = useState({
    country: "",
    region: "",
    date: "",
    minAlbumStreams: "",
    maxAlbumStreams: "",
    minTitleStreams: "",
    maxTitleStreams: "",
  });

  useEffect(() => {
    let active = true;

    const loadSubmissions = async () => {
      setLoadingSubmissions(true);
      setSubmissionsError("");
      try {
        const response = await fetch("/api/proof-submissions");
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch proof submissions");
        }
        if (active) setSubmissions(Array.isArray(data.submissions) ? data.submissions : []);
      } catch (error) {
        if (active) setSubmissionsError(error.message || "Failed to fetch proof submissions");
      } finally {
        if (active) setLoadingSubmissions(false);
      }
    };

    loadSubmissions();
    const intervalId = setInterval(loadSubmissions, 30000);
    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, []);

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  const handleDateRangeChange = (e) => {
    setClearDateRange((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleClearDateRange = async () => {
    const { startDate, endDate } = clearDateRange;
    if (!startDate || !endDate) {
      toast.show("Select both start and end date", "error");
      return;
    }

    const start = new Date(`${startDate}T00:00:00.000Z`);
    const end = new Date(`${endDate}T23:59:59.999Z`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      toast.show("Invalid date range", "error");
      return;
    }
    if (start > end) {
      toast.show("Start date cannot be after end date", "error");
      return;
    }

    if (!confirm(`Clear proof submissions between ${startDate} and ${endDate}? This cannot be undone.`)) {
      return;
    }

    setClearingDateRange(true);
    try {
      const params = new URLSearchParams({ startDate, endDate });
      const response = await fetch(`/api/proof-submissions?${params.toString()}`, { method: "DELETE" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Failed to clear submissions");
      }

      setSubmissions((prev) =>
        prev.filter((entry) => {
          const time = new Date(entry.submissionTime).getTime();
          if (Number.isNaN(time)) return true;
          return time < start.getTime() || time > end.getTime();
        })
      );

      toast.show(`Removed ${data.deletedCount || 0} submission(s)`, "success");
    } catch (error) {
      toast.show(error.message || "Failed to clear submissions", "error");
    } finally {
      setClearingDateRange(false);
    }
  };

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((s) => {
      const { country, region, date, minAlbumStreams, maxAlbumStreams, minTitleStreams, maxTitleStreams } = filters;
      const submissionDate = s?.submissionTime
        ? new Date(s.submissionTime).toLocaleDateString("en-CA")
        : "";
      if (country && s.country !== country) return false;
      if (region && s.region !== region) return false;
      if (date && submissionDate !== date) return false;
      if (minAlbumStreams && s.albumStreamCount < parseInt(minAlbumStreams)) return false;
      if (maxAlbumStreams && s.albumStreamCount > parseInt(maxAlbumStreams)) return false;
      if (minTitleStreams && s.titleTrackStreamCount < parseInt(minTitleStreams)) return false;
      if (maxTitleStreams && s.titleTrackStreamCount > parseInt(maxTitleStreams)) return false;
      return true;
    }).sort((a, b) => new Date(b.submissionTime) - new Date(a.submissionTime));
  }, [submissions, filters]);

  // Calculate totals for filtered submissions
  const streamTotals = useMemo(() => {
    return filteredSubmissions.reduce((acc, s) => ({
      albumStreams: acc.albumStreams + (s.albumStreamCount || 0),
      titleStreams: acc.titleStreams + (s.titleTrackStreamCount || 0)
    }), { albumStreams: 0, titleStreams: 0 });
  }, [filteredSubmissions]);

  return (
    <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <h2 className="text-2xl font-bold">Proof Submissions ({filteredSubmissions.length})</h2>
        <div className="flex flex-wrap gap-4 text-sm font-bold">
          <span className="bg-[var(--accent)]/10 text-[var(--accent)] px-4 py-2 rounded-xl">
            Total Album Streams: <span className="text-[var(--accent)]">{streamTotals.albumStreams.toLocaleString()}</span>
          </span>
          <span className="bg-[var(--accent)]/10 text-[var(--accent)] px-4 py-2 rounded-xl">
            Total Title Streams: <span className="text-[var(--accent)]">{streamTotals.titleStreams.toLocaleString()}</span>
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[var(--card-bg)]/60 backdrop-blur-xl p-6 rounded-3xl border border-[var(--accent)]/20 mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Country Filter */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase font-black tracking-widest opacity-60">Country</label>
          <select name="country" value={filters.country} onChange={handleFilterChange} className="w-full bg-[var(--bg-secondary)]/50 border rounded-2xl px-4 py-3 text-sm font-semibold outline-none border-[var(--accent)]/20 focus:border-[var(--accent)]">
            <option value="">All Countries</option>
            {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        {/* Region Filter */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase font-black tracking-widest opacity-60">Region</label>
          <select name="region" value={filters.region} onChange={handleFilterChange} className="w-full bg-[var(--bg-secondary)]/50 border rounded-2xl px-4 py-3 text-sm font-semibold outline-none border-[var(--accent)]/20 focus:border-[var(--accent)]">
            <option value="">All Regions</option>
            {allRegions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        {/* Date Filter */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase font-black tracking-widest opacity-60">Date</label>
          <input type="date" name="date" value={filters.date} onChange={handleFilterChange} className="w-full bg-[var(--bg-secondary)]/50 border rounded-2xl px-4 py-3 text-sm font-semibold outline-none border-[var(--accent)]/20 focus:border-[var(--accent)]" />
        </div>
        {/* Album Stream Filter */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase font-black tracking-widest opacity-60">Album Streams</label>
          <div className="flex items-center gap-2">
            <input type="number" name="minAlbumStreams" placeholder="Min" value={filters.minAlbumStreams} onChange={handleFilterChange} className="w-full bg-[var(--bg-secondary)]/50 border rounded-2xl px-4 py-3 text-sm font-semibold outline-none border-[var(--accent)]/20 focus:border-[var(--accent)]" />
            <input type="number" name="maxAlbumStreams" placeholder="Max" value={filters.maxAlbumStreams} onChange={handleFilterChange} className="w-full bg-[var(--bg-secondary)]/50 border rounded-2xl px-4 py-3 text-sm font-semibold outline-none border-[var(--accent)]/20 focus:border-[var(--accent)]" />
          </div>
        </div>
        {/* Title Track Stream Filter */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase font-black tracking-widest opacity-60">Title Track Streams</label>
          <div className="flex items-center gap-2">
            <input type="number" name="minTitleStreams" placeholder="Min" value={filters.minTitleStreams} onChange={handleFilterChange} className="w-full bg-[var(--bg-secondary)]/50 border rounded-2xl px-4 py-3 text-sm font-semibold outline-none border-[var(--accent)]/20 focus:border-[var(--accent)]" />
            <input type="number" name="maxTitleStreams" placeholder="Max" value={filters.maxTitleStreams} onChange={handleFilterChange} className="w-full bg-[var(--bg-secondary)]/50 border rounded-2xl px-4 py-3 text-sm font-semibold outline-none border-[var(--accent)]/20 focus:border-[var(--accent)]" />
          </div>
        </div>
      </div>

      <div className="bg-[var(--card-bg)]/60 backdrop-blur-xl p-5 rounded-3xl border border-red-400/30 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-end gap-4">
          <div className="flex-1">
            <label className="text-[10px] uppercase font-black tracking-widest opacity-60 block mb-1.5">Clear From</label>
            <input
              type="date"
              name="startDate"
              value={clearDateRange.startDate}
              onChange={handleDateRangeChange}
              className="w-full bg-[var(--bg-secondary)]/50 border rounded-2xl px-4 py-3 text-sm font-semibold outline-none border-[var(--accent)]/20 focus:border-[var(--accent)]"
            />
          </div>
          <div className="flex-1">
            <label className="text-[10px] uppercase font-black tracking-widest opacity-60 block mb-1.5">Clear To</label>
            <input
              type="date"
              name="endDate"
              value={clearDateRange.endDate}
              onChange={handleDateRangeChange}
              className="w-full bg-[var(--bg-secondary)]/50 border rounded-2xl px-4 py-3 text-sm font-semibold outline-none border-[var(--accent)]/20 focus:border-[var(--accent)]"
            />
          </div>
          <button
            onClick={handleClearDateRange}
            disabled={clearingDateRange}
            className="h-[46px] px-5 rounded-2xl bg-red-500 text-white text-xs font-black uppercase tracking-widest hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
          >
            {clearingDateRange ? "Clearing..." : "Clear Data in Range"}
          </button>
        </div>
      </div>

      {/* Submissions Table */}
      {loadingSubmissions && (
        <div className="mb-6 text-sm font-bold text-[var(--text-secondary)]">Loading submissions...</div>
      )}
      {submissionsError && (
        <div className="mb-6 text-sm font-bold text-red-400">{submissionsError}</div>
      )}
      <div className="bg-[var(--card-bg)]/40 backdrop-blur-xl border border-[var(--accent)]/40 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[1200px]">
            <thead className="bg-[var(--accent)]/5 border-b border-[var(--accent)]/20">
              <tr>
                <th className="p-4 font-black text-[10px] uppercase tracking-widest text-[var(--text-secondary)]">Date</th>
                <th className="p-4 font-black text-[10px] uppercase tracking-widest text-[var(--text-secondary)]">Time</th>
                <th className="p-4 font-black text-[10px] uppercase tracking-widest text-[var(--text-secondary)]">Username</th>
                <th className="p-4 font-black text-[10px] uppercase tracking-widest text-[var(--text-secondary)]">Platform</th>
                <th className="p-4 font-black text-[10px] uppercase tracking-widest text-[var(--text-secondary)]">Country</th>
                <th className="p-4 font-black text-[10px] uppercase tracking-widest text-[var(--text-secondary)]">Region</th>
                <th className="p-4 font-black text-[10px] uppercase tracking-widest text-[var(--text-secondary)]">Album Streams</th>
                <th className="p-4 font-black text-[10px] uppercase tracking-widest text-[var(--text-secondary)]">Title Streams</th>
                <th className="p-4 font-black text-[10px] uppercase tracking-widest text-[var(--text-secondary)]">Screenshot</th>
                <th className="p-4 font-black text-[10px] uppercase tracking-widest text-[var(--text-secondary)]">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--accent)]/10">
              {filteredSubmissions.map((s) => (
                <tr key={s.id} className="hover:bg-[var(--accent)]/5 transition-colors">
                  <td className="p-4 text-xs">{new Date(s.submissionTime).toLocaleDateString()}</td>
                  <td className="p-4 text-xs">{new Date(s.submissionTime).toLocaleTimeString()}</td>
                  <td className="p-4 text-sm font-bold">{s.username}</td>
                  <td className="p-4 text-sm">{s.platform}</td>
                  <td className="p-4 text-sm">{s.country}</td>
                  <td className="p-4 text-sm">{s.region}</td>
                  <td className="p-4 text-sm font-bold text-[var(--accent)]">{s.albumStreamCount}</td>
                  <td className="p-4 text-sm font-bold text-[var(--accent)]">{s.titleTrackStreamCount}</td>
                  <td className="p-4 text-sm">
                    <a href={s.screenshotUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Link</a>
                  </td>
                  <td className="p-4 text-sm max-w-xs truncate">{s.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function AdminPanel() {
  const [activeTab, setActiveTab] = useState("tickets");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [ticketsError, setTicketsError] = useState("");
  const [userSummary, setUserSummary] = useState({
    signups: 0,
    scrobblerConnected: 0,
    scrobblerNotConnected: 0,
    connectedUsernames: [],
    notConnectedUsernames: [],
    manualScrobblers: [],
    lastfmUsers: [],
    statsfmUsers: [],
    musicatUsers: [],
  });
  const [userSummaryLoading, setUserSummaryLoading] = useState(true);
  const [userSummaryError, setUserSummaryError] = useState("");
  const [syncNowLoading, setSyncNowLoading] = useState(false);
  const [lastSyncStatus, setLastSyncStatus] = useState("");
  const [topScrobblers, setTopScrobblers] = useState([]);
  const [topScrobblersLoading, setTopScrobblersLoading] = useState(false);
  const [topScrobblersError, setTopScrobblersError] = useState("");
  const [deleteScrobblerLoadingId, setDeleteScrobblerLoadingId] = useState("");
  const [healthLoading, setHealthLoading] = useState(true);
  const [healthError, setHealthError] = useState("");
  const [healthChecks, setHealthChecks] = useState(null);
  const [healthGeneratedAt, setHealthGeneratedAt] = useState("");
  const [topicRoomDraft, setTopicRoomDraft] = useState("");
  const [topicRoomMessages, setTopicRoomMessages] = useState([]);
  const [topicRoomImageData, setTopicRoomImageData] = useState("");
  const [topicRoomImageName, setTopicRoomImageName] = useState("");
  const [topicRoomCloseConfirmUntil, setTopicRoomCloseConfirmUntil] = useState(0);
  const [reportingAuthorId, setReportingAuthorId] = useState("");
  const [topicRoomPreviewImage, setTopicRoomPreviewImage] = useState(null);
  const [customNotifDraft, setCustomNotifDraft] = useState({
    message: "",
    level: "info",
    durationHours: 0,
    durationMinutes: 30,
    durationSeconds: 0,
    scheduleAt: "",
  });
  const [customNotifSending, setCustomNotifSending] = useState(false);
  const [activeBattleNotification, setActiveBattleNotification] = useState(null);
  const [activeBattleNotificationSource, setActiveBattleNotificationSource] = useState("");
  const [activeBattleNotificationLoading, setActiveBattleNotificationLoading] = useState(false);
  const [cancelCustomNotifLoading, setCancelCustomNotifLoading] = useState(false);
  const [scheduledBattleNotifications, setScheduledBattleNotifications] = useState([]);
  const [luckyDrawEntries, setLuckyDrawEntries] = useState([]);
  const [luckyDrawLoading, setLuckyDrawLoading] = useState(true);
  const [luckyDrawError, setLuckyDrawError] = useState("");
  const [luckyDrawFilter, setLuckyDrawFilter] = useState("");
  const [luckyDrawSort, setLuckyDrawSort] = useState("username_asc");
  const { battles, liveBattles, addBattle, updateBattle, updateLiveBattles, deleteBattle, clearBattles, resetLiveBattles, loading: battlesLoading } = useBattles();
  const { events, addEvent, updateEvent, deleteEvent, clearTimeline, resetToDefault, loading: timelineLoading } = useTimeline();
  const { regions, addRegion, deleteRegion, resetRegions, loading: regionsLoading } = useRegionalData();
  const { mods, toggleStatus, updateModDetails, resetMods, loading: modsLoading } = useModStatus();
  const { galleryImages, loading: galleryLoading, resetGallery, addGalleryImage, deleteGalleryImage, updateGalleryImage } = useGalleryData();
  const { updates, latestUpdate, addUpdate, updateUpdate, deleteUpdate, clearUpdates, loading: updatesLoading } = useDailyUpdates();
  const { missions, addMission, updateMission, deleteMission, clearMissions, resetMissions, loading: missionsLoading } = useDailyMissions();
  const toast = useToast();
  const { token, user } = useAuth();
  const lastBattleNotificationIdRef = useRef("");

  const isDataLoading = regionsLoading || modsLoading || battlesLoading || timelineLoading || galleryLoading || updatesLoading || missionsLoading;
  
  // New Battle History Form State
  const [newBattle, setNewBattle] = useState({
    date: "",
    time: "",
    regions: "",
    target: "",
    progress: 100,
    reachedTarget: true,
    winner: ""
  });

  // Live Battles Editor State (one entry per live battle)
  const [liveEdits, setLiveEdits] = useState(liveBattles);

  // New Timeline Event State
  const [newEvent, setNewEvent] = useState({
    date: "",
    time: "",
    platform: "Spotify",
    event: ""
  });

  // New Region Form State
  const [newRegion, setNewRegion] = useState({
    country: "",
    region: "",
    goal: "",
    tz: "",
    spotifyReset: "",
    appleReset: "",
    playlists: FOCUS_PLAYLISTS,
    gFormUrl: ""
  });

  const [playlistPlatform, setPlaylistPlatform] = useState("spotify");
  const [selectedCountries, setSelectedCountries] = useState([]);

  const [countrySearch, setCountrySearch] = useState("");
  const [showCountryDrop, setShowCountryDrop] = useState(false);

  const [newGalleryImage, setNewGalleryImage] = useState({ src: "", type: "square" });
  const [editingGallerySrc, setEditingGallerySrc] = useState(null);
  const [editingGalleryType, setEditingGalleryType] = useState("");
  const [topicRoomStatus, setTopicRoomStatus] = useState("active");
  const [topicRoomClosedMeta, setTopicRoomClosedMeta] = useState(null);
  const [editingBattleId, setEditingBattleId] = useState(null);
  const [editingBattle, setEditingBattle] = useState(null);
  const [editingEventId, setEditingEventId] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [dailyUpdateDraft, setDailyUpdateDraft] = useState({ title: "", message: "", imageUrl: "", quote: "", uploadedImageData: "", uploadedImageName: "" });
  const [previewUpdateId, setPreviewUpdateId] = useState(null);
  const [editingUpdateId, setEditingUpdateId] = useState(null);
  const [missionDraft, setMissionDraft] = useState({
    title: "",
    description: "",
    type: "stream",
    target: 1,
    unit: "plays",
    autoCheck: true,
    active: true
  });
  const [editingMissionId, setEditingMissionId] = useState(null);
  const [editingMission, setEditingMission] = useState(null);

  const filteredLuckyDrawEntries = useMemo(() => {
    const term = String(luckyDrawFilter || "").trim().toLowerCase();
    const base = term
      ? luckyDrawEntries.filter((entry) => {
          return [
            entry.username,
            entry.email,
            entry.platform,
            entry.handle,
            entry.dateKey,
          ].some((field) => String(field || "").toLowerCase().includes(term));
        })
      : luckyDrawEntries;
    const sorted = [...base].sort((a, b) => {
      const nameA = String(a.username || "").toLowerCase();
      const nameB = String(b.username || "").toLowerCase();
      return nameA.localeCompare(nameB, undefined, { sensitivity: "base" });
    });
    if (luckyDrawSort === "username_desc") {
      return sorted.reverse();
    }
    return sorted;
  }, [luckyDrawEntries, luckyDrawFilter, luckyDrawSort]);

  const battleValidation = useMemo(() => {
    const hints = [];
    const blocking = [];

    if (!newBattle.date) blocking.push("Pick a battle date.");
    if (!String(newBattle.time || "").trim()) blocking.push("Add battle time in KST.");
    if (!String(newBattle.target || "").trim()) blocking.push("Set a target (example: 10M).");
    if (!String(newBattle.regions || "").trim()) {
      blocking.push("Add at least one region.");
    } else {
      const regionCount = newBattle.regions
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean).length;
      if (regionCount === 0) blocking.push("Add valid region names (comma separated).");
    }

    const progressValue = Number(newBattle.progress);
    if (!Number.isFinite(progressValue) || progressValue < 0 || progressValue > 100) {
      blocking.push("Progress must be between 0 and 100.");
    }

    if (newBattle.reachedTarget && Number.isFinite(progressValue) && progressValue < 100) {
      hints.push("Reached target is ON, but progress is below 100%.");
    }
    if (!newBattle.reachedTarget && Number.isFinite(progressValue) && progressValue >= 100) {
      hints.push("Missed target is ON, but progress is 100% or above.");
    }

    return { blocking, hints, isValid: blocking.length === 0 };
  }, [newBattle]);

  const regionValidation = useMemo(() => {
    const hints = [];
    const blocking = [];
    const region = String(newRegion.region || "").trim();
    const goal = String(newRegion.goal || "").trim();
    const tz = String(newRegion.tz || "").trim();
    const gFormUrl = String(newRegion.gFormUrl || "").trim();

    if (selectedCountries.length === 0) {
      blocking.push("Select at least one country.");
    }
    if (!region) blocking.push("Region is required.");
    if (!goal) blocking.push("Streaming goal is required.");

    if (tz && !tz.includes("/")) {
      hints.push("Timezone usually follows IANA format like Asia/Kolkata.");
    }

    if (gFormUrl) {
      try {
        const parsed = new URL(gFormUrl);
        if (!["http:", "https:"].includes(parsed.protocol)) {
          blocking.push("Google Form URL must start with http or https.");
        }
      } catch {
        blocking.push("Google Form URL is not valid.");
      }
    }

    return { blocking, hints, isValid: blocking.length === 0 };
  }, [newRegion, selectedCountries]);

  const overallHealthStatus = useMemo(() => {
    const entries = Object.values(healthChecks || {});
    if (!entries.length) return "warn";
    if (entries.some((entry) => entry?.status === "error")) return "error";
    if (entries.some((entry) => entry?.status === "warn")) return "warn";
    return "ok";
  }, [healthChecks]);

  useEffect(() => {
    let active = true;

    const checkBattleNotifications = async () => {
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
  }, [toast]);

  useEffect(() => {
    setLiveEdits(liveBattles);
  }, [JSON.stringify(liveBattles)]);

  useEffect(() => {
    let active = true;

    const loadTickets = async () => {
      setTicketsLoading(true);
      setTicketsError("");
      try {
        const response = await fetch("/api/support-tickets");
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.error || "Failed to load support tickets");
        }
        if (active) setTickets(Array.isArray(data.tickets) ? data.tickets : []);
      } catch (error) {
        if (active) setTicketsError(error.message || "Failed to load support tickets");
      } finally {
        if (active) setTicketsLoading(false);
      }
    };

    loadTickets();
    const intervalId = setInterval(loadTickets, 20000);
    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (!["tickets", "users"].includes(activeTab)) return;

    let active = true;

    const loadUserSummary = async () => {
      setUserSummaryLoading(true);
      setUserSummaryError("");
      try {
        const response = await fetch("/api/auth/users-summary", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.error || "Failed to load user summary");
        }

        if (active) {
          setUserSummary({
            signups: Number(data?.counts?.signups || 0),
            scrobblerConnected: Number(data?.counts?.scrobblerConnected || 0),
            scrobblerNotConnected: Number(data?.counts?.scrobblerNotConnected || 0),
            connectedUsernames: Array.isArray(data?.usernames?.scrobblerConnected) ? data.usernames.scrobblerConnected : [],
            notConnectedUsernames: Array.isArray(data?.usernames?.scrobblerNotConnected) ? data.usernames.scrobblerNotConnected : [],
            manualScrobblers: Array.isArray(data?.manualScrobblers) ? data.manualScrobblers : [],
            lastfmUsers: Array.isArray(data?.lastfmUsers) ? data.lastfmUsers : [],
            statsfmUsers: Array.isArray(data?.statsfmUsers) ? data.statsfmUsers : [],
            musicatUsers: Array.isArray(data?.musicatUsers) ? data.musicatUsers : [],
          });
        }
      } catch (error) {
        if (active) setUserSummaryError(error.message || "Failed to load user summary");
      } finally {
        if (active) setUserSummaryLoading(false);
      }
    };

    loadUserSummary();
    const intervalId = setInterval(loadUserSummary, 60000);
    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, [activeTab, token]);

  useEffect(() => {
    if (activeTab !== "lucky-draw") return;
    if (!token) return;
    let active = true;

    const loadLuckyDrawEntries = async () => {
      setLuckyDrawLoading(true);
      setLuckyDrawError("");
      try {
        const response = await fetch("/api/lucky-draw?admin=1", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.error || "Failed to load lucky draw entries");
        }
        if (active) {
          setLuckyDrawEntries(Array.isArray(data?.entries) ? data.entries : []);
        }
      } catch (error) {
        if (active) setLuckyDrawError(error.message || "Failed to load lucky draw entries");
      } finally {
        if (active) setLuckyDrawLoading(false);
      }
    };

    loadLuckyDrawEntries();
    const intervalId = setInterval(loadLuckyDrawEntries, 30000);
    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, [activeTab, token]);

  const handleClearAllTickets = async () => {
    if (confirm("Are you sure you want to clear all tickets? This cannot be undone.")) {
      try {
        const response = await fetch("/api/support-tickets?clearAll=1", { method: "DELETE" });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.error || "Failed to clear tickets");
        }
        setTickets([]);
        toast.show("All support tickets cleared", "success");
      } catch (error) {
        toast.show(error.message || "Failed to clear tickets", "error");
      }
    }
  };

  const handleDeleteTicket = async (id) => {
    if (confirm("Delete this ticket?")) {
      try {
        const response = await fetch(`/api/support-tickets?id=${encodeURIComponent(id)}`, { method: "DELETE" });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.error || "Failed to delete ticket");
        }
        setTickets((prev) => prev.filter((ticket) => ticket.id !== id));
        toast.show("Ticket deleted", "success");
      } catch (error) {
        toast.show(error.message || "Failed to delete ticket", "error");
      }
    }
  };

  const handleAddBattle = (e) => {
    e.preventDefault();
    if (!newBattle.date || !newBattle.time || !newBattle.regions || !newBattle.target) {
      toast.show("Please fill all fields", "error");
      return;
    }

    const battleObj = {
      id: Date.now(),
      date: newBattle.date,
      time: newBattle.time,
      regions: newBattle.regions.split(",").map(r => r.trim()),
      target: newBattle.target,
      progress: newBattle.progress,
      reachedTarget: newBattle.reachedTarget
    };

    addBattle(battleObj);
    setNewBattle({ date: "", time: "", regions: "", target: "", progress: 100, reachedTarget: true, winner: "" });
  };

  const handleAddTimelineEvent = (e) => {
    e.preventDefault();
    if (!newEvent.time || !newEvent.event) {
      toast.show("Please fill necessary fields (Time and Event)", "error");
      return;
    }

    const eventObj = {
      id: Date.now(),
      ...newEvent
    };

    addEvent(eventObj);
    setNewEvent({ date: "", time: "", platform: "Spotify", event: "" });
  };

  const handleAddRegion = (e) => {
    e.preventDefault();
    if (selectedCountries.length === 0 || !newRegion.region || !newRegion.goal) {
      toast.show("Please fill necessary fields (Country, Region, Goal)", "error");
      return;
    }

    selectedCountries.forEach((country) => {
      const region = COUNTRY_REGION_MAP[country] || newRegion.region;
      const tz = COUNTRY_TZ_MAP[country] || newRegion.tz;
      addRegion({
        ...newRegion,
        country,
        region,
        tz,
      });
    });
    
    // Reset Form
    setNewRegion({ 
      country: "", 
      region: "", 
      goal: "", 
      tz: "", 
      spotifyReset: "", 
      appleReset: "", 
      playlists: FOCUS_PLAYLISTS, 
      gFormUrl: "" 
    });
    setCountrySearch("");
    setShowCountryDrop(false);
    setSelectedCountries([]);
    toast.show(`Regional info saved for ${selectedCountries.length} countr${selectedCountries.length === 1 ? "y" : "ies"}! 💜`, "success");
  };

  const handleAddGalleryImage = (e) => {
    e.preventDefault();
    if (!newGalleryImage.src || !newGalleryImage.type) {
      toast.show("Please enter an image URL and select orientation", "error");
      return;
    }
    
    // Check if URL already exists
    if (galleryImages.some(img => img.src === newGalleryImage.src)) {
      toast.show("This image is already in the gallery pool!", "error");
      return;
    }

    addGalleryImage(newGalleryImage);
    setNewGalleryImage({ src: "", type: "square" });
    toast.show("Image added to gallery pool! 💜", "success");
  };

  const applyMissionTypeDefaults = useCallback((type, prev) => {
    const fallbackUnit = MISSION_TYPE_DEFAULT_UNITS[type] || "actions";
    const prevUnit = prev.unit?.trim();
    const prevDefault = MISSION_TYPE_DEFAULT_UNITS[prev.type] || "actions";
    const nextUnit = !prevUnit || prevUnit === prevDefault ? fallbackUnit : prevUnit;
    return { ...prev, type, unit: nextUnit };
  }, []);

  const handleAddMission = (e) => {
    e.preventDefault();
    if (!missionDraft.title.trim() || !missionDraft.description.trim()) {
      toast.show("Please provide a mission title and description.", "error");
      return;
    }
    if (!missionDraft.target || Number(missionDraft.target) <= 0) {
      toast.show("Please set a valid target value.", "error");
      return;
    }

    addMission({
      ...missionDraft,
      target: Number(missionDraft.target)
    });
    setMissionDraft({
      title: "",
      description: "",
      type: "stream",
      target: 1,
      unit: MISSION_TYPE_DEFAULT_UNITS.stream,
      autoCheck: true,
      active: true
    });
    toast.show("Daily mission added.", "success");
  };

  const handleDownloadLuckyDrawCsv = () => {
    if (!luckyDrawEntries.length) {
      toast.show("No lucky draw entries to export.", "info");
      return;
    }
    const headers = ["dateKey", "username", "email", "platform", "handle"];
    const escapeCsv = (value) => {
      const raw = String(value ?? "");
      if (raw.includes(",") || raw.includes("\"") || raw.includes("\n")) {
        return `"${raw.replace(/\"/g, "\"\"")}"`;
      }
      return raw;
    };
    const rows = filteredLuckyDrawEntries.map((entry) => ([
      escapeCsv(entry.dateKey || ""),
      escapeCsv(entry.username || ""),
      escapeCsv(entry.email || ""),
      escapeCsv(entry.platform || ""),
      escapeCsv(entry.handle || ""),
    ].join(",")));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `lucky_draw_entries_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteLuckyDrawEntry = async (entryId) => {
    if (!token) return;
    if (!confirm("Delete this lucky draw entry?")) return;
    try {
      const response = await fetch(`/api/lucky-draw?id=${encodeURIComponent(entryId)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete entry");
      }
      setLuckyDrawEntries((prev) => prev.filter((entry) => String(entry.id) !== String(entryId)));
      toast.show("Entry deleted.", "success");
    } catch (error) {
      toast.show(error.message || "Failed to delete entry", "error");
    }
  };

  const updatePlaylistField = (platform, index, field, value) => {
    const updatedPlaylists = { ...newRegion.playlists };
    updatedPlaylists[platform][index] = { ...updatedPlaylists[platform][index], [field]: value };
    setNewRegion({ ...newRegion, playlists: updatedPlaylists });
  };

  const handlePresetChange = (val) => {
    const preset = COUNTRY_PRESETS[val];
    if (preset) {
      setNewRegion({
        ...newRegion,
        region: COUNTRY_REGION_MAP[val] || val, // If we selected a country from presets, try to get its region
        tz: preset.tz,
        spotifyReset: preset.s,
        appleReset: preset.a || ""
      });
    } else {
      setNewRegion({...newRegion, region: val});
    }
  };

  const handleCountrySelect = (country) => {
    if (!country || selectedCountries.includes(country)) {
      setCountrySearch("");
      setShowCountryDrop(false);
      return;
    }
    const region = COUNTRY_REGION_MAP[country] || "";
    // Priority: Specific country preset -> General region preset (mapped) -> Current state
    const preset = COUNTRY_PRESETS[country] || (region ? COUNTRY_PRESETS[region] : null);
    const countryTz = COUNTRY_TZ_MAP[country];
    const nextCountries = [...selectedCountries, country];
    const nextRegions = Array.from(
      new Set(nextCountries.map((c) => COUNTRY_REGION_MAP[c] || "").filter(Boolean))
    );
    const autoRegion = nextRegions.length === 1 ? nextRegions[0] : "Multiple Regions";
    
    setNewRegion({
      ...newRegion,
      country,
      region: autoRegion || newRegion.region || region,
      tz: newRegion.tz || countryTz || (preset ? preset.tz : newRegion.tz),
      spotifyReset: newRegion.spotifyReset || (preset ? preset.s : newRegion.spotifyReset),
      appleReset: newRegion.appleReset || (preset ? preset.a : newRegion.appleReset)
    });
    setSelectedCountries((prev) => [...prev, country]);
    setCountrySearch("");
    setShowCountryDrop(false);
  };

  const handleSyncNow = async () => {
    if (!token || syncNowLoading) return;

    setSyncNowLoading(true);
    setLastSyncStatus("");
    try {
      const response = await fetch("/api/auth/lastfm-sync-now", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Failed to run Last.fm sync");
      }

      const processed = Number(data?.sync?.results?.reduce?.((acc, r) => acc + (Number(r?.processedUsers) || 0), 0) || 0);
      setLastSyncStatus(`Synced successfully${processed ? ` (${processed} users processed)` : ""}.`);
      toast.show("Last.fm sync completed.", "success");
      if (activeTab === "battles") {
        setTopScrobblersLoading(true);
        const leaderboardResponse = await fetch("/api/auth/top-scrobblers?limit=10", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const leaderboardData = await leaderboardResponse.json().catch(() => ({}));
        if (leaderboardResponse.ok) {
          setTopScrobblers(Array.isArray(leaderboardData.top) ? leaderboardData.top : []);
          setTopScrobblersError("");
        } else {
          setTopScrobblersError(leaderboardData.error || "Failed to refresh leaderboard");
        }
        setTopScrobblersLoading(false);
      }
    } catch (error) {
      setLastSyncStatus(error.message || "Sync failed.");
      toast.show(error.message || "Sync failed.", "error");
    } finally {
      setSyncNowLoading(false);
    }
  };

  const handleSendTopicRoomMessage = () => {
    if (topicRoomStatus === "closed") return;
    const text = String(topicRoomDraft || "").trim();
    if (!text && !topicRoomImageData) return;
    setTopicRoomMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        author: String(user?.username || "you"),
        text,
        image: topicRoomImageData || "",
        imageName: topicRoomImageName || "",
        createdAt: new Date().toLocaleTimeString(),
      },
    ]);
    setTopicRoomDraft("");
    setTopicRoomImageData("");
    setTopicRoomImageName("");
  };

  const normalizeIdentity = useCallback((value) => String(value || "").trim().replace(/^@+/, "").toLowerCase(), []);
  const currentIdentity = normalizeIdentity(user?.username || user?.email || "");
  const creatorIdentity = normalizeIdentity(TOPIC_ROOM_TEMPLATE.createdBy);
  const canCloseTopicRoom = String(user?.role || "").toLowerCase() === "admin" || (currentIdentity && currentIdentity === creatorIdentity);

  const handleCloseTopicRoom = () => {
    if (!canCloseTopicRoom) {
      toast.show("Only the room creator or an admin can close this room.", "error");
      return;
    }
    if (topicRoomStatus === "closed") return;
    const now = Date.now();
    if (topicRoomCloseConfirmUntil < now) {
      setTopicRoomCloseConfirmUntil(now + 4500);
      toast.show("Tap 'Close Room' again within 4 seconds to confirm.", "info");
      return;
    }
    const closedBy = String(user?.username || user?.email || "admin").trim() || "admin";
    setTopicRoomStatus("closed");
    setTopicRoomClosedMeta({
      by: closedBy,
      at: new Date().toLocaleString(),
    });
    setTopicRoomCloseConfirmUntil(0);
    toast.show("Room closed", "success");
  };

  const handleSelectTopicRoomImage = (e) => {
    const file = e?.target?.files?.[0];
    if (!file) return;
    if (!String(file.type || "").startsWith("image/")) {
      toast.show("Please select an image file.", "error");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.show("Image must be 2MB or smaller.", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setTopicRoomImageData(String(reader.result || ""));
      setTopicRoomImageName(file.name || "image");
      toast.show("Image attached.", "success");
    };
    reader.onerror = () => {
      toast.show("Failed to read image file.", "error");
    };
    reader.readAsDataURL(file);
  };

  const handleReportTopicRoomUser = async (message) => {
    const author = String(message?.author || "").trim();
    if (!author) return;
    const authorId = String(message?.id || author);
    setReportingAuthorId(authorId);
    try {
      const reporter = String(user?.username || user?.email || "anonymous").trim();
      const payload = {
        socialMedia: "topic-room-report",
        userId: reporter,
        query: `Urgent report: user "${author}" was reported from "${TOPIC_ROOM_TEMPLATE.title}". Message: "${String(message?.text || "").trim() || "[image-only post]"}".`,
      };
      const response = await fetch("/api/support-tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Failed to notify admins");
      }
      toast.show("Report sent. Admins have been notified.", "success");
    } catch (error) {
      toast.show(error.message || "Failed to report user", "error");
    } finally {
      setReportingAuthorId("");
    }
  };

  const connectedUsernames = useMemo(
    () => (Array.isArray(userSummary.connectedUsernames) ? userSummary.connectedUsernames : []),
    [userSummary.connectedUsernames]
  );
  const notConnectedUsernames = useMemo(
    () => (Array.isArray(userSummary.notConnectedUsernames) ? userSummary.notConnectedUsernames : []),
    [userSummary.notConnectedUsernames]
  );
  const normalizeUserId = useCallback((value) => String(value || "").trim().replace(/^@+/, "").toLowerCase(), []);
  const knownLastfmUsers = useMemo(
    () => new Set([...connectedUsernames, ...notConnectedUsernames].map(normalizeUserId).filter(Boolean)),
    [connectedUsernames, notConnectedUsernames, normalizeUserId]
  );
  const filteredTickets = useMemo(
    () =>
      tickets.filter((ticket) => {
        const ticketUser = normalizeUserId(ticket?.userId);
        return !ticketUser || !knownLastfmUsers.has(ticketUser);
      }),
    [tickets, knownLastfmUsers, normalizeUserId]
  );

  const handleDeleteTopScrobbler = async (row) => {
    const userId = String(row?.userId || "").trim();
    if (!userId || !token) return;
    if (!confirm(`Delete ${row?.lastfmUsername || "this user"} from today's leaderboard?`)) return;

    setDeleteScrobblerLoadingId(userId);
    try {
      const response = await fetch("/api/auth/top-scrobblers", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete leaderboard row");
      }
      setTopScrobblers((prev) => prev.filter((item) => String(item.userId) !== userId));
      toast.show("Leaderboard row deleted.", "success");
    } catch (error) {
      toast.show(error.message || "Failed to delete leaderboard row", "error");
    } finally {
      setDeleteScrobblerLoadingId("");
    }
  };

  const handleSendCustomNotification = async (e) => {
    e.preventDefault();
    if (!token || customNotifSending) return;

    const message = String(customNotifDraft.message || "").trim();
    const durationHours = Number.parseInt(String(customNotifDraft.durationHours || "0"), 10);
    const durationMinutes = Number.parseInt(String(customNotifDraft.durationMinutes || "0"), 10);
    const durationSeconds = Number.parseInt(String(customNotifDraft.durationSeconds || "0"), 10);
    const level = String(customNotifDraft.level || "info").toLowerCase();
    const h = Number.isFinite(durationHours) ? Math.max(0, Math.min(24, durationHours)) : 0;
    const m = Number.isFinite(durationMinutes) ? Math.max(0, Math.min(59, durationMinutes)) : 0;
    const s = Number.isFinite(durationSeconds) ? Math.max(0, Math.min(59, durationSeconds)) : 0;
    const totalDurationSeconds = (h * 3600) + (m * 60) + s;
    const scheduleAt = String(customNotifDraft.scheduleAt || "").trim();

    if (!message) {
      toast.show("Please enter a notification message", "error");
      return;
    }
    if (totalDurationSeconds <= 0) {
      toast.show("Please set a duration using hours, minutes, or seconds", "error");
      return;
    }

    setCustomNotifSending(true);
    try {
      const response = await fetch("/api/auth/battle-notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message,
          level,
          durationHours: h,
          durationMinutes: m,
          durationSeconds: s,
          scheduleAt: scheduleAt || undefined,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Failed to send notification");
      }

      toast.show(data?.mode === "scheduled" ? "Notification scheduled." : "Custom notification sent.", "success");
      setCustomNotifDraft((prev) => ({ ...prev, message: "", scheduleAt: "" }));
      await loadActiveBattleNotification(true);
    } catch (error) {
      toast.show(error.message || "Failed to send notification", "error");
    } finally {
      setCustomNotifSending(false);
    }
  };

  const loadActiveBattleNotification = async (silent = false) => {
    if (!token) return;
    if (!silent) setActiveBattleNotificationLoading(true);
    try {
      const response = await fetch("/api/auth/battle-notifications?adminView=1", {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Failed to load active notification");
      }
      setActiveBattleNotification(data?.active || null);
      setActiveBattleNotificationSource(String(data?.source || ""));
      setScheduledBattleNotifications(Array.isArray(data?.scheduled) ? data.scheduled : []);
    } catch (error) {
      if (!silent) toast.show(error.message || "Failed to load active notification", "error");
    } finally {
      if (!silent) setActiveBattleNotificationLoading(false);
    }
  };

  const handleCancelCustomNotification = async () => {
    if (!token || cancelCustomNotifLoading) return;
    if (!activeBattleNotification?.id || !String(activeBattleNotification.id).startsWith("custom:")) {
      toast.show("No active custom notification to cancel.", "info");
      return;
    }

    setCancelCustomNotifLoading(true);
    try {
      const response = await fetch("/api/auth/battle-notifications", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: activeBattleNotification.id }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Failed to cancel notification");
      }

      toast.show("Custom notification cancelled.", "success");
      await loadActiveBattleNotification(true);
    } catch (error) {
      toast.show(error.message || "Failed to cancel notification", "error");
    } finally {
      setCancelCustomNotifLoading(false);
    }
  };

  const handleCancelQueuedNotification = async (id) => {
    if (!token || cancelCustomNotifLoading) return;
    const cleanId = String(id || "").trim();
    if (!cleanId.startsWith("custom:")) return;

    setCancelCustomNotifLoading(true);
    try {
      const response = await fetch("/api/auth/battle-notifications", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: cleanId }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Failed to cancel notification");
      }

      toast.show("Scheduled notification cancelled.", "success");
      await loadActiveBattleNotification(true);
    } catch (error) {
      toast.show(error.message || "Failed to cancel notification", "error");
    } finally {
      setCancelCustomNotifLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab !== "battles") return;

    let active = true;
    const loadTopScrobblers = async () => {
      setTopScrobblersLoading(true);
      setTopScrobblersError("");
      try {
        const response = await fetch("/api/auth/top-scrobblers?limit=10", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.error || "Failed to load leaderboard");
        }
        if (active) {
          setTopScrobblers(Array.isArray(data.top) ? data.top : []);
        }
      } catch (error) {
        if (active) setTopScrobblersError(error.message || "Failed to load leaderboard");
      } finally {
        if (active) setTopScrobblersLoading(false);
      }
    };

    loadTopScrobblers();
    const intervalId = setInterval(loadTopScrobblers, 60000);
    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, [activeTab, token]);

  useEffect(() => {
    let active = true;

    const loadHealth = async () => {
      if (!token) return;
      if (active) {
        setHealthLoading(true);
        setHealthError("");
      }
      try {
        const response = await fetch("/api/auth/health", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.error || "Failed to load health status");
        }
        if (!active) return;
        setHealthChecks(data.checks || null);
        setHealthGeneratedAt(data.generatedAt || "");
      } catch (error) {
        if (!active) return;
        setHealthError(error.message || "Failed to load health status");
      } finally {
        if (active) setHealthLoading(false);
      }
    };

    void loadHealth();
    const intervalId = setInterval(loadHealth, 60000);
    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, [token]);

  useEffect(() => {
    if (activeTab !== "battles") return;

    let active = true;
    const load = async (silent = false) => {
      if (!active) return;
      await loadActiveBattleNotification(silent);
    };

    void load(false);
    const intervalId = setInterval(() => {
      void load(true);
    }, 20000);

    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, [activeTab, token]);

  const formatBattleTimeLabel = (value) => {
    const timeText = String(value || "").trim();
    if (!timeText) return "N/A";
    return /[A-Za-z]/.test(timeText) ? timeText : `${timeText} KST`;
  };



  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <Header />
      
      <main className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16 py-12">
        <div className="sticky top-[68px] z-[80] bg-[var(--bg-primary)]/80 backdrop-blur-md pb-6 mb-12 border-b border-[var(--accent)]/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-black text-[var(--accent)] tracking-tight">Admin Dashboard</h1>
            {lastSyncStatus ? (
              <p className="mt-2 text-[10px] uppercase tracking-widest font-black text-[var(--text-secondary)]">
                {lastSyncStatus}
              </p>
            ) : null}
          </div>
          
          <div className="relative flex items-center gap-3">
            <button
              onClick={handleSyncNow}
              disabled={syncNowLoading}
              className="px-4 py-3 rounded-xl border border-[var(--accent)]/30 text-[var(--accent)] text-xs font-black uppercase tracking-widest hover:bg-[var(--accent)]/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {syncNowLoading ? "Syncing..." : "Sync Now"}
            </button>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-3 bg-[var(--accent)] text-black rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-[var(--accent)]/30 hover:scale-[1.05] active:scale-95 transition-all"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
              <span className="text-xs uppercase tracking-widest hidden md:inline">
                {activeTab
                  .replace("timeline", "Timeline")
                  .replace("regions", "Regions")
                  .replace("mods", "Mods")
                  .replace("lucky-draw", "Lucky Draw")
                  .replace("missions", "Daily Missions")
                  .replace("updates", "Daily Updates")
                  .replace("global", "Global Config")
                  .replace("battles", "Battles")
                  .replace("users", "User Panel")
                  .replace("tickets", "Support Tickets")}
              </span>
            </button>

            {isMenuOpen && (
              <>
                {/* Backdrop to close menu when clicking outside */}
                <div className="fixed inset-0 z-[70]" onClick={() => setIsMenuOpen(false)} />
                
                <div className="fixed left-4 right-4 top-[120px] w-auto bg-[var(--card-bg)] border border-[var(--accent)]/40 p-2 rounded-2xl shadow-2xl z-[90] flex flex-col gap-1 animate-in slide-in-from-top-2 fade-in duration-200 md:absolute md:left-0 md:right-auto md:top-full md:mt-3 md:w-56">
                  <MenuButton tab="users" label="User Panel" current={activeTab} set={setActiveTab} close={() => setIsMenuOpen(false)} />
                  <MenuButton tab="tickets" label="Support Tickets" current={activeTab} set={setActiveTab} close={() => setIsMenuOpen(false)} />
                  <MenuButton tab="battles" label="Battle Manager" current={activeTab} set={setActiveTab} close={() => setIsMenuOpen(false)} />
                  <MenuButton tab="timeline" label="Timeline Manager" current={activeTab} set={setActiveTab} close={() => setIsMenuOpen(false)} />
                  <MenuButton tab="regions" label="Region Manager" current={activeTab} set={setActiveTab} close={() => setIsMenuOpen(false)} />
                  <MenuButton tab="mods" label="Mod Manager" current={activeTab} set={setActiveTab} close={() => setIsMenuOpen(false)} />
                  <MenuButton tab="lucky-draw" label="Lucky Draw" current={activeTab} set={setActiveTab} close={() => setIsMenuOpen(false)} />
                  <MenuButton tab="missions" label="Daily Missions" current={activeTab} set={setActiveTab} close={() => setIsMenuOpen(false)} />
                  <MenuButton tab="updates" label="Daily Updates" current={activeTab} set={setActiveTab} close={() => setIsMenuOpen(false)} />
                  <MenuButton tab="gallery" label="Gallery Manager" current={activeTab} set={setActiveTab} close={() => setIsMenuOpen(false)} />
                  <MenuButton tab="global" label="Global Config" current={activeTab} set={setActiveTab} close={() => setIsMenuOpen(false)} />
                </div>
              </>
            )}
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-[var(--accent)]/20 bg-[var(--card-bg)]/50 p-4 backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[10px] uppercase tracking-widest font-black text-[var(--text-secondary)]">Backend Health</p>
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                  overallHealthStatus === "ok"
                    ? "text-emerald-400 border-emerald-400/40 bg-emerald-500/10"
                    : overallHealthStatus === "error"
                    ? "text-red-400 border-red-400/40 bg-red-500/10"
                    : "text-amber-300 border-amber-300/40 bg-amber-500/10"
                }`}
              >
                {healthLoading ? "Checking..." : overallHealthStatus}
              </span>
              {healthGeneratedAt ? (
                <span className="text-[10px] font-bold text-[var(--text-secondary)]">
                  {new Date(healthGeneratedAt).toLocaleTimeString()}
                </span>
              ) : null}
            </div>
          </div>
          {healthError ? (
            <p className="mt-2 text-xs font-bold text-red-400">{healthError}</p>
          ) : (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {["auth", "db", "sync", "aggregate"].map((key) => {
                const check = healthChecks?.[key];
                const status = String(check?.status || "warn");
                return (
                  <div key={key} className="rounded-xl border border-[var(--accent)]/15 bg-[var(--bg-primary)]/40 px-3 py-2">
                    <p className="text-[9px] uppercase tracking-widest font-black text-[var(--text-secondary)]">{key}</p>
                    <p
                      className={`mt-1 text-[10px] font-black uppercase ${
                        status === "ok" ? "text-emerald-400" : status === "error" ? "text-red-400" : "text-amber-300"
                      }`}
                    >
                      {status}
                    </p>
                    <p className="mt-1 text-[10px] font-semibold opacity-80">{check?.detail || "No data"}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {activeTab === "users" && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8">
              <h2 className="text-2xl font-bold">User Panel</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <div className="bg-[var(--card-bg)]/50 border border-[var(--accent)]/20 rounded-2xl p-4">
                <p className="text-[10px] uppercase tracking-widest font-black text-[var(--text-secondary)]">Total Signups</p>
                <p className="text-2xl font-black text-[var(--accent)] mt-1">{userSummary.signups.toLocaleString()}</p>
              </div>
              <div className="bg-[var(--card-bg)]/50 border border-[var(--accent)]/20 rounded-2xl p-4">
                <p className="text-[10px] uppercase tracking-widest font-black text-[var(--text-secondary)]">Online (Scrobbler Connected)</p>
                <p className="text-2xl font-black text-emerald-400 mt-1">{userSummary.scrobblerConnected.toLocaleString()}</p>
              </div>
              <div className="bg-[var(--card-bg)]/50 border border-[var(--accent)]/20 rounded-2xl p-4">
                <p className="text-[10px] uppercase tracking-widest font-black text-[var(--text-secondary)]">Offline (No Scrobbler)</p>
                <p className="text-2xl font-black text-rose-400 mt-1">{userSummary.scrobblerNotConnected.toLocaleString()}</p>
              </div>
            </div>

            {userSummaryLoading && (
              <div className="mb-4 text-xs font-bold text-[var(--text-secondary)]">Loading participant counts...</div>
            )}
            {userSummaryError && (
              <div className="mb-4 text-xs font-bold text-red-400">{userSummaryError}</div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              <div className="bg-[var(--card-bg)]/50 border border-emerald-400/20 rounded-2xl p-4">
                <p className="text-[10px] uppercase tracking-widest font-black text-emerald-300">Scrobbler Connected Usernames</p>
                <div className="mt-3 max-h-48 overflow-y-auto no-scrollbar pr-1 space-y-1">
                  {connectedUsernames.length === 0 ? (
                    <p className="text-xs font-semibold text-[var(--text-secondary)]">No connected users found.</p>
                  ) : (
                    connectedUsernames.map((name, idx) => (
                      <p key={`connected-${name}-${idx}`} className="text-sm font-semibold text-[var(--text-primary)] break-all">
                        {name}
                      </p>
                    ))
                  )}
                </div>
              </div>
              <div className="bg-[var(--card-bg)]/50 border border-rose-400/20 rounded-2xl p-4">
                <p className="text-[10px] uppercase tracking-widest font-black text-rose-300">No Scrobbler Usernames</p>
                <div className="mt-3 max-h-48 overflow-y-auto no-scrollbar pr-1 space-y-1">
                  {notConnectedUsernames.length === 0 ? (
                    <p className="text-xs font-semibold text-[var(--text-secondary)]">No offline users found.</p>
                  ) : (
                    notConnectedUsernames.map((name, idx) => (
                      <p key={`offline-${name}-${idx}`} className="text-sm font-semibold text-[var(--text-primary)] break-all">
                        {name}
                      </p>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
              <div className="bg-[var(--card-bg)]/50 border border-[var(--accent)]/20 rounded-2xl p-4">
                <p className="text-[10px] uppercase tracking-widest font-black text-[var(--text-secondary)]">Last.fm Users</p>
                <div className="mt-3 max-h-56 overflow-y-auto no-scrollbar pr-1 space-y-2">
                  {userSummary.lastfmUsers?.length ? (
                    userSummary.lastfmUsers.map((row, idx) => (
                      <div key={`${row.username}-lastfm-${idx}`} className="rounded-xl border border-[var(--accent)]/15 bg-[var(--bg-primary)]/40 p-3">
                        <p className="text-sm font-bold text-[var(--text-primary)]">{row.username}</p>
                        <p className="text-xs text-[var(--text-secondary)] break-all">{row.lastfmUsername}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs font-semibold text-[var(--text-secondary)]">No Last.fm users yet.</p>
                  )}
                </div>
              </div>
              <div className="bg-[var(--card-bg)]/50 border border-[var(--accent)]/20 rounded-2xl p-4">
                <p className="text-[10px] uppercase tracking-widest font-black text-[var(--text-secondary)]">stats.fm Users</p>
                <div className="mt-3 max-h-56 overflow-y-auto no-scrollbar pr-1 space-y-2">
                  {userSummary.statsfmUsers?.length ? (
                    userSummary.statsfmUsers.map((row, idx) => (
                      <div key={`${row.username}-statsfm-${idx}`} className="rounded-xl border border-[var(--accent)]/15 bg-[var(--bg-primary)]/40 p-3">
                        <p className="text-sm font-bold text-[var(--text-primary)]">{row.username}</p>
                        <a
                          href={row.scrobblerLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[var(--accent)] break-all hover:underline"
                        >
                          {row.scrobblerLink}
                        </a>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs font-semibold text-[var(--text-secondary)]">No stats.fm users yet.</p>
                  )}
                </div>
              </div>
              <div className="bg-[var(--card-bg)]/50 border border-[var(--accent)]/20 rounded-2xl p-4">
                <p className="text-[10px] uppercase tracking-widest font-black text-[var(--text-secondary)]">Musicat Users</p>
                <div className="mt-3 max-h-56 overflow-y-auto no-scrollbar pr-1 space-y-2">
                  {userSummary.musicatUsers?.length ? (
                    userSummary.musicatUsers.map((row, idx) => (
                      <div key={`${row.username}-musicat-${idx}`} className="rounded-xl border border-[var(--accent)]/15 bg-[var(--bg-primary)]/40 p-3">
                        <p className="text-sm font-bold text-[var(--text-primary)]">{row.username}</p>
                        <a
                          href={row.scrobblerLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[var(--accent)] break-all hover:underline"
                        >
                          {row.scrobblerLink}
                        </a>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs font-semibold text-[var(--text-secondary)]">No Musicat users yet.</p>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === "tickets" && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">Active Support Tickets ({filteredTickets.length})</h2>
              {filteredTickets.length > 0 && (
                <button 
                  onClick={handleClearAllTickets}
                  className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 px-4 py-2 rounded-xl transition-all font-bold text-xs"
                >
                  Clear All
                </button>
              )}
            </div>

            {ticketsLoading && (
              <div className="mb-6 text-sm font-bold text-[var(--text-secondary)]">Loading support tickets...</div>
            )}
            {ticketsError && (
              <div className="mb-6 text-sm font-bold text-red-400">{ticketsError}</div>
            )}

            {filteredTickets.length === 0 ? (
              <div className="text-center py-24 opacity-40 border-2 border-dashed border-[var(--accent)]/10 rounded-3xl">
                <p className="text-xl italic">No support tickets found.</p>
              </div>
            ) : (
              <div className="bg-[var(--card-bg)]/40 backdrop-blur-xl border border-[var(--accent)]/40 rounded-3xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[700px]">
                    <thead className="bg-[var(--accent)]/5 border-b border-[var(--accent)]/20">
                      <tr>
                        <th className="p-6 font-black text-[10px] uppercase tracking-[0.2em] text-[var(--text-secondary)]">Date</th>
                        <th className="p-6 font-black text-[10px] uppercase tracking-[0.2em] text-[var(--text-secondary)]">Platform</th>
                        <th className="p-6 font-black text-[10px] uppercase tracking-[0.2em] text-[var(--text-secondary)]">Query</th>
                        <th className="p-6 font-black text-[10px] uppercase tracking-[0.2em] text-[var(--text-secondary)] text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--accent)]/10">
                      {filteredTickets.map((ticket) => (
                        <tr key={ticket.id} className="hover:bg-[var(--accent)]/5 transition-colors group">
                          <td className="p-5 text-sm text-[var(--text-secondary)]">{ticket.timestamp}</td>
                          <td className="p-5">
                            <span className="bg-[var(--accent)]/10 text-[var(--accent)] px-3 py-1 rounded-full text-[10px] font-black uppercase">
                              {ticket.socialMedia}
                            </span>
                          </td>
                          <td className="p-5 text-sm max-w-md">{ticket.query}</td>
                          <td className="p-5 text-right">
                            <button 
                              onClick={() => handleDeleteTicket(ticket.id)}
                              className="text-red-500 opacity-40 hover:opacity-100 transition-opacity font-bold text-xs"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}

        {activeTab === "battles" && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-[var(--card-bg)]/60 backdrop-blur-xl border border-[var(--accent)]/30 rounded-3xl p-4 sm:p-5 mb-5">
              <h3 className="text-base sm:text-lg font-black text-[var(--accent)] uppercase tracking-tight mb-3">Send Battle Notification</h3>
              <form onSubmit={handleSendCustomNotification} className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto_auto] gap-3 items-stretch">
                <input
                  type="text"
                  value={customNotifDraft.message}
                  onChange={(e) => setCustomNotifDraft((prev) => ({ ...prev, message: e.target.value }))}
                  placeholder="Write custom message for all users..."
                  maxLength={240}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 rounded-xl px-3 py-2.5 text-sm font-semibold outline-none focus:border-[var(--accent)]"
                />
                <select
                  value={customNotifDraft.level}
                  onChange={(e) => setCustomNotifDraft((prev) => ({ ...prev, level: e.target.value }))}
                  className="bg-[var(--bg-primary)] border border-[var(--accent)]/20 rounded-xl px-3 py-2.5 text-xs font-black uppercase tracking-wider outline-none focus:border-[var(--accent)]"
                >
                  <option value="info">Info</option>
                  <option value="success">Success</option>
                  <option value="error">Error</option>
                </select>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    max="24"
                    value={customNotifDraft.durationHours}
                    onChange={(e) => setCustomNotifDraft((prev) => ({ ...prev, durationHours: e.target.value }))}
                    className="w-16 bg-[var(--bg-primary)] border border-[var(--accent)]/20 rounded-xl px-2 py-2.5 text-xs font-black outline-none focus:border-[var(--accent)]"
                    title="Hours"
                  />
                  <span className="text-[10px] font-black opacity-60">h</span>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={customNotifDraft.durationMinutes}
                    onChange={(e) => setCustomNotifDraft((prev) => ({ ...prev, durationMinutes: e.target.value }))}
                    className="w-16 bg-[var(--bg-primary)] border border-[var(--accent)]/20 rounded-xl px-2 py-2.5 text-xs font-black outline-none focus:border-[var(--accent)]"
                    title="Minutes"
                  />
                  <span className="text-[10px] font-black opacity-60">m</span>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={customNotifDraft.durationSeconds}
                    onChange={(e) => setCustomNotifDraft((prev) => ({ ...prev, durationSeconds: e.target.value }))}
                    className="w-16 bg-[var(--bg-primary)] border border-[var(--accent)]/20 rounded-xl px-2 py-2.5 text-xs font-black outline-none focus:border-[var(--accent)]"
                    title="Seconds"
                  />
                  <span className="text-[10px] font-black opacity-60">s</span>
                </div>
                <input
                  type="datetime-local"
                  value={customNotifDraft.scheduleAt}
                  onChange={(e) => setCustomNotifDraft((prev) => ({ ...prev, scheduleAt: e.target.value }))}
                  className="bg-[var(--bg-primary)] border border-[var(--accent)]/20 rounded-xl px-3 py-2.5 text-xs font-black outline-none focus:border-[var(--accent)]"
                  title="Schedule time (optional)"
                />
                <button
                  type="submit"
                  disabled={customNotifSending}
                  className="px-4 py-2.5 rounded-xl border border-[var(--accent)]/40 bg-[var(--accent)]/10 text-[var(--accent)] text-[10px] font-black uppercase tracking-widest hover:bg-[var(--accent)]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {customNotifSending ? "Sending..." : "Send"}
                </button>
              </form>
              <p className="mt-2 text-[10px] uppercase tracking-widest font-black text-[var(--text-secondary)]">
                Visible to all users. Set duration using hours/minutes/seconds. Optional schedule time sends later.
              </p>
              <div className="mt-3 border border-[var(--accent)]/20 rounded-2xl p-3 bg-[var(--bg-primary)]/40">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <p className="text-[10px] uppercase tracking-widest font-black text-[var(--text-secondary)]">Active Notification Preview</p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void loadActiveBattleNotification(false)}
                      className="px-3 py-1.5 rounded-lg border border-[var(--accent)]/30 text-[var(--accent)] text-[9px] font-black uppercase tracking-widest hover:bg-[var(--accent)]/10 transition-all"
                    >
                      Refresh
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelCustomNotification}
                      disabled={cancelCustomNotifLoading || !activeBattleNotification?.id || !String(activeBattleNotification.id).startsWith("custom:")}
                      className="px-3 py-1.5 rounded-lg border border-red-500/40 text-red-400 text-[9px] font-black uppercase tracking-widest hover:bg-red-500/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {cancelCustomNotifLoading ? "Cancelling..." : "Cancel Now"}
                    </button>
                  </div>
                </div>
                {activeBattleNotificationLoading ? (
                  <p className="mt-2 text-xs font-bold text-[var(--text-secondary)]">Loading active notification...</p>
                ) : activeBattleNotification ? (
                  <div className="mt-2">
                    <p className="text-xs font-black">
                      [{String(activeBattleNotificationSource || "automatic").toUpperCase()}] {activeBattleNotification.message}
                    </p>
                    <p className="text-[10px] mt-1 font-bold uppercase tracking-widest text-[var(--text-secondary)]">
                      Level: {String(activeBattleNotification.level || "info")} {activeBattleNotification.endsAt ? `| Ends: ${new Date(activeBattleNotification.endsAt).toLocaleString()}` : ""}
                    </p>
                  </div>
                ) : (
                  <p className="mt-2 text-xs font-bold text-[var(--text-secondary)]">No active notification.</p>
                )}
              </div>
              <div className="mt-3 border border-[var(--accent)]/20 rounded-2xl p-3 bg-[var(--bg-primary)]/40">
                <p className="text-[10px] uppercase tracking-widest font-black text-[var(--text-secondary)]">Scheduled Notifications</p>
                {scheduledBattleNotifications.length === 0 ? (
                  <p className="mt-2 text-xs font-bold text-[var(--text-secondary)]">No scheduled notifications.</p>
                ) : (
                  <div className="mt-2 space-y-2">
                    {scheduledBattleNotifications.map((item) => (
                      <div key={item.id} className="rounded-xl border border-[var(--accent)]/15 bg-[var(--card-bg)]/40 p-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-xs font-black">{item.message}</p>
                            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">
                              Level: {String(item.level || "info")} | Starts: {item.startsAt ? new Date(item.startsAt).toLocaleString() : "N/A"}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => void handleCancelQueuedNotification(item.id)}
                            disabled={cancelCustomNotifLoading}
                            className="px-2.5 py-1 rounded-lg border border-red-500/40 text-red-400 text-[9px] font-black uppercase tracking-widest hover:bg-red-500/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-[var(--card-bg)]/60 backdrop-blur-xl border border-[var(--accent)]/30 rounded-3xl p-4 sm:p-5 mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                <h3 className="text-base sm:text-lg font-black text-[var(--accent)] uppercase tracking-tight">Top 10 Scrobblers (Today)</h3>
                <button
                  onClick={async () => {
                    setTopScrobblersLoading(true);
                    setTopScrobblersError("");
                    try {
                      const response = await fetch("/api/auth/top-scrobblers?limit=10", {
                        headers: token ? { Authorization: `Bearer ${token}` } : {},
                      });
                      const data = await response.json().catch(() => ({}));
                      if (!response.ok) throw new Error(data.error || "Failed to load leaderboard");
                      setTopScrobblers(Array.isArray(data.top) ? data.top : []);
                    } catch (error) {
                      setTopScrobblersError(error.message || "Failed to load leaderboard");
                    } finally {
                      setTopScrobblersLoading(false);
                    }
                  }}
                  className="w-full sm:w-auto px-3 py-2 rounded-lg border border-[var(--accent)]/30 text-[var(--accent)] text-[10px] font-black uppercase tracking-widest hover:bg-[var(--accent)]/10 transition-all"
                >
                  Refresh
                </button>
              </div>

              {topScrobblersLoading && <p className="text-xs font-bold text-[var(--text-secondary)]">Loading leaderboard...</p>}
              {topScrobblersError && <p className="text-xs font-bold text-red-400">{topScrobblersError}</p>}

              {!topScrobblersLoading && !topScrobblersError && (
                topScrobblers.length === 0 ? (
                  <p className="text-xs font-bold text-[var(--text-secondary)]">No scrobbles synced yet for today.</p>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-[var(--accent)]/10">
                    <table className="w-full text-left min-w-[620px]">
                      <thead>
                        <tr className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] bg-[var(--accent)]/5">
                          <th className="py-2 px-3">#</th>
                          <th className="py-2 pr-3">Last.fm User</th>
                          <th className="py-2 pr-3">Region</th>
                          <th className="py-2 pr-3">Album Streams</th>
                          <th className="py-2 pr-3">Title Streams</th>
                          <th className="py-2 pr-3">Total</th>
                          <th className="py-2 pr-3">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--accent)]/10">
                        {topScrobblers.map((row) => (
                          <tr key={`${row.userId}-${row.rank}`} className="text-xs sm:text-sm">
                            <td className="py-2 px-3 font-black text-[var(--accent)]">{row.rank}</td>
                            <td className="py-2 pr-3 font-bold">{row.lastfmUsername || "-"}</td>
                            <td className="py-2 pr-3">{row.region || "-"}</td>
                            <td className="py-2 pr-3 font-bold">{Number(row.albumStreams || 0).toLocaleString()}</td>
                            <td className="py-2 pr-3 font-bold">{Number(row.titleStreams || 0).toLocaleString()}</td>
                            <td className="py-2 pr-3 font-black text-[var(--accent)]">{Number(row.totalStreams || 0).toLocaleString()}</td>
                            <td className="py-2 pr-3">
                              <button
                                onClick={() => void handleDeleteTopScrobbler(row)}
                                disabled={deleteScrobblerLoadingId === String(row.userId)}
                                className="px-2.5 py-1 rounded-lg border border-red-500/40 text-red-400 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                {deleteScrobblerLoadingId === String(row.userId) ? "Deleting..." : "Delete"}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
              
              {/* List of Battles */}
              <div>
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-bold">Battle Records ({battles.length})</h2>
                  <button 
                    onClick={() => { if(confirm("Clear history?")) clearBattles() }}
                    className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors uppercase tracking-widest"
                  >
                    Reset to Default
                  </button>
                </div>

                <div className="grid gap-4">
                  {battles.length === 0 ? (
                    <div className="text-center py-24 opacity-40 border-2 border-dashed border-[var(--accent)]/10 rounded-3xl">
                      <p className="text-xl italic">No battle records found.</p>
                    </div>
                  ) : battles.map((battle) => (
                    <div key={battle.id} className="bg-[var(--card-bg)]/40 rounded-3xl border border-[var(--accent)]/20 overflow-hidden group">
                      {editingBattleId === battle.id ? (
                        /* --- EDIT MODE --- */
                        <div className="p-5 space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[9px] font-black uppercase text-[var(--text-secondary)] ml-1">Date</label>
                              <input type="date" value={editingBattle.date} onChange={e => setEditingBattle({...editingBattle, date: e.target.value})} className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-2.5 rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-all text-[var(--text-primary)]" />
                            </div>
                            <div>
                              <label className="text-[9px] font-black uppercase text-[var(--text-secondary)] ml-1">Time (KST)</label>
                              <input type="text" value={editingBattle.time} onChange={e => setEditingBattle({...editingBattle, time: e.target.value})} className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-2.5 rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-all text-[var(--text-primary)]" />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[9px] font-black uppercase text-[var(--text-secondary)] ml-1">Regions (comma-separated)</label>
                              <input type="text" value={editingBattle.regions.join(", ")} onChange={e => setEditingBattle({...editingBattle, regions: e.target.value.split(",").map(r => r.trim())})} className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-2.5 rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-all text-[var(--text-primary)]" />
                            </div>
                            <div>
                              <label className="text-[9px] font-black uppercase text-[var(--text-secondary)] ml-1">Target</label>
                              <input type="text" value={editingBattle.target} onChange={e => setEditingBattle({...editingBattle, target: e.target.value})} className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-2.5 rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-all text-[var(--text-primary)]" />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[9px] font-black uppercase text-[var(--text-secondary)] ml-1">Progress %</label>
                              <input type="number" min="0" max="100" value={editingBattle.progress} onChange={e => setEditingBattle({...editingBattle, progress: parseInt(e.target.value) || 0})} className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-2.5 rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-all text-[var(--text-primary)]" />
                            </div>
                            <div className="flex flex-col">
                              <label className="text-[9px] font-black uppercase text-[var(--text-secondary)] ml-1">Reached Target?</label>
                              <div className="flex-1 flex items-center pt-1">
                                <button 
                                  onClick={() => setEditingBattle({...editingBattle, reachedTarget: !editingBattle.reachedTarget})}
                                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 border ${
                                    editingBattle.reachedTarget 
                                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" 
                                      : "bg-red-500/20 text-red-500 border-red-500/30"
                                  }`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${editingBattle.reachedTarget ? 'bg-emerald-400' : 'bg-red-500'}`}></span>
                                  {editingBattle.reachedTarget ? "Reached" : "Missed"}
                                </button>
                              </div>
                            </div>
                          </div>
                          <div>
                            <label className="text-[9px] font-black uppercase text-[var(--text-secondary)] ml-1">Winner (Region/Team Name)</label>
                            <input type="text" value={editingBattle.winner || ""} onChange={e => setEditingBattle({...editingBattle, winner: e.target.value})} placeholder="e.g. SOUTH ASIA" className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-2.5 rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-all text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/30" />
                          </div>
                          <div className="flex gap-2 pt-1">
                            <button onClick={() => { updateBattle(battle.id, editingBattle); setEditingBattleId(null); toast.show("Battle record updated! 💜", "success"); }} className="flex-1 bg-[var(--accent)] text-black font-black py-2 rounded-xl text-xs hover:scale-[1.02] active:scale-95 transition-all">Save Changes</button>
                            <button onClick={() => setEditingBattleId(null)} className="px-4 py-2 rounded-xl text-xs font-bold border border-[var(--accent)]/20 hover:bg-[var(--accent)]/10 transition-all">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        /* --- VIEW MODE --- */
                        <div className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <span className="text-lg font-black text-[var(--accent)]">{battle.date}</span>
                              <span className="text-xs text-[var(--text-secondary)] font-bold uppercase tracking-widest">{formatBattleTimeLabel(battle.time)}</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {battle.regions.map(r => (
                                <span key={r} className="text-[9px] px-2 py-0.5 bg-[var(--accent)]/10 text-[var(--accent)] rounded font-black uppercase">{r}</span>
                              ))}
                            </div>
                            {battle.winner && (
                              <div className="mt-2 flex items-center gap-1.5">
                                <span className="text-[8px] font-black uppercase text-emerald-400 tracking-widest">Winner:</span>
                                <span className="text-[10px] font-black text-white">{battle.winner}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="text-[10px] text-[var(--accent)] uppercase font-black tracking-tighter leading-none">{battle.progress}%</div>
                                <div className={`text-[8px] font-black uppercase tracking-widest mt-0.5 ${battle.reachedTarget ? 'text-emerald-400' : 'text-red-500'}`}>
                                  {battle.reachedTarget ? 'Reached' : 'Missed'}
                                </div>
                              </div>
                              <div className="w-px h-8 bg-[var(--accent)]/10"></div>
                              <div className="text-right">
                                <div className="text-xs text-[var(--text-secondary)] uppercase font-black tracking-tighter">Target</div>
                                <div className="text-xl font-black">{battle.target}</div>
                              </div>
                            </div>
                            <button onClick={() => { setEditingBattleId(battle.id); setEditingBattle({...battle}); }} className="p-3 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] sm:opacity-0 group-hover:opacity-100 transition-all hover:bg-[var(--accent)]/20" title="Edit">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                            <button onClick={() => deleteBattle(battle.id)} className="p-3 rounded-xl bg-red-500/10 text-red-500 sm:opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white" title="Delete">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Sidebar: Editors */}
              <div className="flex flex-col gap-8 h-fit lg:sticky lg:top-12">
                
                {/* 1. Live Battles Editor — one card per battle */}
                <div className="flex justify-between items-center mb-1">
                  <h2 className="text-xl font-black uppercase tracking-tighter text-[var(--accent)]">Live Battles Editor</h2>
                  <button 
                    onClick={() => { if(confirm("Reset all 4 live battles to default (0% progress)?")) resetLiveBattles() }}
                    className="text-[10px] font-black text-red-500 hover:text-red-600 transition-colors uppercase tracking-[0.2em]"
                  >
                    Reset to Default
                  </button>
                </div>
                {liveEdits.map((lb, i) => (
                  <div key={lb.id} className="bg-[var(--card-bg)]/80 backdrop-blur-2xl p-6 rounded-3xl border border-[var(--accent)]/40 shadow-xl">
                    <h3 className="text-sm font-black mb-3 uppercase tracking-tight text-[var(--accent)] flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                      Live Battle {i + 1}
                    </h3>
                    <div className="space-y-2">
                      <div>
                        <label className="text-[9px] font-black uppercase text-[var(--text-secondary)] ml-1">Title</label>
                        <input
                          type="text"
                          value={lb.title}
                          onChange={(e) => {
                            const updated = [...liveEdits];
                            updated[i] = { ...updated[i], title: e.target.value };
                            setLiveEdits(updated);
                          }}
                          className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-2.5 rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-all text-[var(--text-primary)]"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9px] font-black uppercase text-[var(--text-secondary)] ml-1">Region A (Left)</label>
                          <input
                            type="text"
                            value={lb.regionA || ""}
                            onChange={(e) => {
                              const updated = [...liveEdits];
                              updated[i] = { ...updated[i], regionA: e.target.value };
                              setLiveEdits(updated);
                            }}
                            className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-2.5 rounded-xl text-sm transition-all"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-black uppercase text-[var(--text-secondary)] ml-1">Region B (Right)</label>
                          <input
                            type="text"
                            value={lb.regionB || ""}
                            onChange={(e) => {
                              const updated = [...liveEdits];
                              updated[i] = { ...updated[i], regionB: e.target.value };
                              setLiveEdits(updated);
                            }}
                            className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-2.5 rounded-xl text-sm transition-all"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="text-[9px] font-black uppercase text-[var(--text-secondary)] ml-1">Artist</label>
                          <input
                            type="text"
                            value={lb.artist || ""}
                            onChange={(e) => {
                              const updated = [...liveEdits];
                              updated[i] = { ...updated[i], artist: e.target.value };
                              setLiveEdits(updated);
                            }}
                            className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-2.5 rounded-xl text-sm transition-all"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-black uppercase text-[var(--text-secondary)] ml-1">Album Target</label>
                          <input
                            type="text"
                            value={lb.albumName || ""}
                            onChange={(e) => {
                              const updated = [...liveEdits];
                              updated[i] = { ...updated[i], albumName: e.target.value };
                              setLiveEdits(updated);
                            }}
                            className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-2.5 rounded-xl text-sm transition-all"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-black uppercase text-[var(--text-secondary)] ml-1">Title Track Target</label>
                          <input
                            type="text"
                            value={lb.trackName || ""}
                            onChange={(e) => {
                              const updated = [...liveEdits];
                              updated[i] = { ...updated[i], trackName: e.target.value };
                              setLiveEdits(updated);
                            }}
                            className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-2.5 rounded-xl text-sm transition-all"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="text-[9px] font-black uppercase text-[var(--text-secondary)] ml-1">Album Goal</label>
                          <input
                            type="text"
                            value={lb.albumGoal ?? lb.goal ?? ""}
                            onChange={(e) => {
                              const updated = [...liveEdits];
                              updated[i] = { ...updated[i], goal: e.target.value, albumGoal: e.target.value };
                              setLiveEdits(updated);
                            }}
                            className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-2.5 rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-all text-[var(--text-primary)]"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-black uppercase text-[var(--text-secondary)] ml-1">Progress %</label>
                          <input
                            type="number" min="0" max="100"
                            value={lb.progress}
                            onChange={(e) => {
                              const updated = [...liveEdits];
                              updated[i] = { ...updated[i], progress: parseInt(e.target.value) || 0 };
                              setLiveEdits(updated);
                            }}
                            className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-2.5 rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-all text-[var(--text-primary)]"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-black uppercase text-[var(--text-secondary)] ml-1">Status</label>
                          <select
                            value={lb.status}
                            onChange={(e) => {
                              const updated = [...liveEdits];
                              updated[i] = { ...updated[i], status: e.target.value };
                              setLiveEdits(updated);
                            }}
                            className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-2.5 rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-all appearance-none text-[var(--text-primary)]"
                          >
                            {["Yet to Start", "Surging", "On Track", "Heating Up", "Almost There", "Completed"].map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="text-[9px] font-black uppercase text-[var(--text-secondary)] ml-1">Title Goal</label>
                          <input
                            type="text"
                            value={lb.titleTrackGoal ?? lb.goal ?? ""}
                            onChange={(e) => {
                              const updated = [...liveEdits];
                              updated[i] = { ...updated[i], titleTrackGoal: e.target.value };
                              setLiveEdits(updated);
                            }}
                            className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-2.5 rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-all text-[var(--text-primary)]"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-black uppercase text-[var(--text-secondary)] ml-1">Title Progress %</label>
                          <input
                            type="number" min="0" max="100"
                            value={lb.titleTrackProgress ?? lb.progress ?? 0}
                            onChange={(e) => {
                              const updated = [...liveEdits];
                              updated[i] = { ...updated[i], titleTrackProgress: parseInt(e.target.value) || 0 };
                              setLiveEdits(updated);
                            }}
                            className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-2.5 rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-all text-[var(--text-primary)]"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-black uppercase text-[var(--text-secondary)] ml-1">Title Status</label>
                          <select
                            value={lb.titleTrackStatus ?? lb.status ?? "Yet to Start"}
                            onChange={(e) => {
                              const updated = [...liveEdits];
                              updated[i] = { ...updated[i], titleTrackStatus: e.target.value };
                              setLiveEdits(updated);
                            }}
                            className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-2.5 rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-all appearance-none text-[var(--text-primary)]"
                          >
                            {["Yet to Start", "Surging", "On Track", "Heating Up", "Almost There", "Completed"].map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9px] font-black uppercase text-[var(--text-secondary)] ml-1">Region A Album (Manual)</label>
                          <input
                            type="number"
                            min="0"
                            value={lb.regionAAlbumManual ?? 0}
                            onChange={(e) => {
                              const updated = [...liveEdits];
                              updated[i] = { ...updated[i], regionAAlbumManual: parseInt(e.target.value, 10) || 0 };
                              setLiveEdits(updated);
                            }}
                            className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-2.5 rounded-xl text-sm transition-all"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-black uppercase text-[var(--text-secondary)] ml-1">Region B Album (Manual)</label>
                          <input
                            type="number"
                            min="0"
                            value={lb.regionBAlbumManual ?? 0}
                            onChange={(e) => {
                              const updated = [...liveEdits];
                              updated[i] = { ...updated[i], regionBAlbumManual: parseInt(e.target.value, 10) || 0 };
                              setLiveEdits(updated);
                            }}
                            className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-2.5 rounded-xl text-sm transition-all"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9px] font-black uppercase text-[var(--text-secondary)] ml-1">Region A Title (Manual)</label>
                          <input
                            type="number"
                            min="0"
                            value={lb.regionATitleManual ?? 0}
                            onChange={(e) => {
                              const updated = [...liveEdits];
                              updated[i] = { ...updated[i], regionATitleManual: parseInt(e.target.value, 10) || 0 };
                              setLiveEdits(updated);
                            }}
                            className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-2.5 rounded-xl text-sm transition-all"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-black uppercase text-[var(--text-secondary)] ml-1">Region B Title (Manual)</label>
                          <input
                            type="number"
                            min="0"
                            value={lb.regionBTitleManual ?? 0}
                            onChange={(e) => {
                              const updated = [...liveEdits];
                              updated[i] = { ...updated[i], regionBTitleManual: parseInt(e.target.value, 10) || 0 };
                              setLiveEdits(updated);
                            }}
                            className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-2.5 rounded-xl text-sm transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  onClick={async () => {
                    updateLiveBattles(liveEdits);
                    try {
                      const response = await fetch("/api/live-battles-config", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ liveBattles: liveEdits }),
                      });
                      const data = await response.json().catch(() => ({}));
                      if (!response.ok) {
                        throw new Error(data.error || "Failed to publish live battle config");
                      }
                      toast.show("All live battles updated and published!", "success");
                    } catch (error) {
                      toast.show(error.message || "Local update saved, but publish failed", "error");
                    }
                  }}
                  className="w-full bg-[var(--accent)] text-white font-black py-3 rounded-xl text-xs shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  UPDATE ALL LIVE BATTLES
                </button>

                {/* 2. Add Battle History Form */}
                <div className="bg-[var(--card-bg)]/80 backdrop-blur-2xl p-6 rounded-3xl border border-[var(--accent)]/40 shadow-xl">
                  <h3 className="text-lg font-black mb-4 uppercase tracking-tight text-[var(--accent)]">Record History</h3>
                  <form onSubmit={handleAddBattle} className="space-y-3">
                    <div>
                      <label className="text-[9px] font-black uppercase text-[var(--text-secondary)] ml-1">Date</label>
                      <input 
                        type="date" 
                        value={newBattle.date}
                        onChange={(e) => setNewBattle({...newBattle, date: e.target.value})}
                        className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-3 rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-all text-[var(--text-primary)]"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] font-black uppercase text-[var(--text-secondary)] ml-1">Time (KST)</label>
                        <input 
                          type="text" 
                          placeholder="22:00"
                          value={newBattle.time}
                          onChange={(e) => setNewBattle({...newBattle, time: e.target.value})}
                          className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-3 rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-all text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/30"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black uppercase text-[var(--text-secondary)] ml-1">Target</label>
                        <input 
                          type="text" 
                          placeholder="10M"
                          value={newBattle.target}
                          onChange={(e) => setNewBattle({...newBattle, target: e.target.value})}
                          className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-3 rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-all text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/30"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] font-black uppercase text-[var(--text-secondary)] ml-1">Final Progress %</label>
                        <input 
                          type="number" min="0" max="100"
                          value={newBattle.progress}
                          onChange={(e) => setNewBattle({...newBattle, progress: parseInt(e.target.value) || 0})}
                          className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-3 rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-all text-[var(--text-primary)]"
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-[9px] font-black uppercase text-[var(--text-secondary)] ml-1">Target Status</label>
                        <div className="flex-1 flex gap-2 pt-1">
                          <button 
                            type="button"
                            onClick={() => setNewBattle({...newBattle, reachedTarget: true})}
                            className={`flex-1 rounded-xl text-[9px] font-black uppercase transition-all border ${newBattle.reachedTarget ? 'bg-emerald-500 text-black border-emerald-500' : 'bg-transparent text-emerald-500 border-emerald-500/20'}`}
                          >
                            Reached
                          </button>
                          <button 
                            type="button"
                            onClick={() => setNewBattle({...newBattle, reachedTarget: false})}
                            className={`flex-1 rounded-xl text-[9px] font-black uppercase transition-all border ${!newBattle.reachedTarget ? 'bg-red-500 text-white border-red-500' : 'bg-transparent text-red-500 border-red-500/20'}`}
                          >
                            Missed
                          </button>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase text-[var(--text-secondary)] ml-1">Regions</label>
                      <input 
                        type="text" 
                        placeholder="India, Korea, USA"
                        value={newBattle.regions}
                        onChange={(e) => setNewBattle({...newBattle, regions: e.target.value})}
                        className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-3 rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-all text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/30"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase text-[var(--text-secondary)] ml-1">Winner</label>
                      <input 
                        type="text" 
                        placeholder="e.g. SOUTH ASIA"
                        value={newBattle.winner}
                        onChange={(e) => setNewBattle({...newBattle, winner: e.target.value})}
                        className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-3 rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-all text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/30"
                      />
                    </div>
                    {battleValidation.blocking.length > 0 && (
                      <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2">
                        {battleValidation.blocking.map((msg) => (
                          <p key={msg} className="text-[10px] font-black text-red-300 uppercase tracking-wide">{msg}</p>
                        ))}
                      </div>
                    )}
                    {battleValidation.hints.length > 0 && (
                      <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2">
                        {battleValidation.hints.map((msg) => (
                          <p key={msg} className="text-[10px] font-black text-amber-200 uppercase tracking-wide">{msg}</p>
                        ))}
                      </div>
                    )}
                     <button 
                      type="submit"
                      disabled={!battleValidation.isValid}
                      className="w-full bg-[var(--accent)] text-black dark:text-black font-black py-3 rounded-xl text-xs hover:scale-[1.02] active:scale-[0.98] transition-all mt-2 shadow-lg shadow-[var(--accent)]/20 uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:active:scale-100"
                    >
                      Add to History 💜
                    </button>
                  </form>
                </div>

              </div>

            </div>
          </section>
        )}

        {activeTab === "timeline" && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
              
              {/* List of Timeline Events */}
              <div>
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-bold">Streaming Timeline ({events.length})</h2>
                  <button 
                    onClick={() => { if(confirm("Reset timeline?")) resetToDefault() }}
                    className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors uppercase tracking-widest"
                  >
                    Reset to Default
                  </button>
                </div>

                <div className="space-y-4">
                  {events.map((ev) => (
                    <div key={ev.id} className="bg-[var(--card-bg)]/40 rounded-3xl border border-[var(--accent)]/20 overflow-hidden group">
                      {editingEventId === ev.id ? (
                        /* --- EDIT MODE --- */
                        <div className="p-5 space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[9px] font-black uppercase text-[var(--text-secondary)] ml-1">Date</label>
                              <input type="text" value={editingEvent.date} onChange={e => setEditingEvent({...editingEvent, date: e.target.value})} placeholder="March 20" className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-2.5 rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-all text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/30" />
                            </div>
                            <div>
                              <label className="text-[9px] font-black uppercase text-[var(--text-secondary)] ml-1">Time (KST)</label>
                              <input type="text" value={editingEvent.time} onChange={e => setEditingEvent({...editingEvent, time: e.target.value})} className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-2.5 rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-all text-[var(--text-primary)]" />
                            </div>
                          </div>
                          <div>
                            <label className="text-[9px] font-black uppercase text-[var(--text-secondary)] ml-1">Platform</label>
                            <input type="text" value={editingEvent.platform} onChange={e => setEditingEvent({...editingEvent, platform: e.target.value})} className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-2.5 rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-all text-[var(--text-primary)]" />
                          </div>
                          <div>
                            <label className="text-[9px] font-black uppercase text-[var(--text-secondary)] ml-1">Event Description</label>
                            <textarea value={editingEvent.event} onChange={e => setEditingEvent({...editingEvent, event: e.target.value})} className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-2.5 rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-all h-20 resize-none text-[var(--text-primary)]" />
                          </div>
                          <div className="flex gap-2 pt-1">
                            <button onClick={() => { updateEvent(ev.id, editingEvent); setEditingEventId(null); toast.show("Timeline event updated! 💜", "success"); }} className="flex-1 bg-[var(--accent)] text-black font-black py-2 rounded-xl text-xs hover:scale-[1.02] active:scale-95 transition-all">Save Changes</button>
                            <button onClick={() => setEditingEventId(null)} className="px-4 py-2 rounded-xl text-xs font-bold border border-[var(--accent)]/20 hover:bg-[var(--accent)]/10 transition-all">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        /* --- VIEW MODE --- */
                        <div className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-[var(--accent)]/10 flex flex-col items-center justify-center shrink-0">
                              <span className="text-[10px] font-black uppercase text-[var(--accent)] leading-none">{ev.date.split(" ")[0]}</span>
                              <span className="text-sm font-black text-[var(--accent)]">{ev.date.split(" ")[1]}</span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-bold">{ev.time} KST</span>
                                <span className="text-[9px] px-2 py-0.5 bg-[var(--accent)]/20 rounded font-black uppercase tracking-widest">{ev.platform}</span>
                              </div>
                              <p className="text-sm opacity-80 font-medium whitespace-pre-line">{ev.event}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 sm:ml-4">
                            <button onClick={() => { setEditingEventId(ev.id); setEditingEvent({...ev}); }} className="p-2 text-[var(--accent)] sm:opacity-0 group-hover:opacity-100 transition-all hover:scale-110" title="Edit">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                            <button onClick={() => deleteEvent(ev.id)} className="p-2 text-red-500 sm:opacity-0 group-hover:opacity-100 transition-all hover:scale-110" title="Delete">
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Add Timeline Event Form */}
              <div className="bg-[var(--card-bg)]/80 backdrop-blur-2xl p-6 rounded-3xl border border-[var(--accent)]/40 shadow-xl h-fit lg:sticky lg:top-12">
                <h3 className="text-lg font-black mb-6 uppercase tracking-tight text-[var(--accent)]">Record Timeline Event</h3>
                <form onSubmit={handleAddTimelineEvent} className="space-y-4">
                  <div>
                    <label className="text-[9px] font-black uppercase opacity-40 ml-1">Event Date</label>
                    <input
                      type="date"
                      value={newEvent.date}
                      onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                      className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-3 rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-black uppercase text-[var(--text-secondary)] ml-1">Time (KST)</label>
                      <input 
                        type="text" 
                        placeholder="13:00"
                        value={newEvent.time}
                        onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
                        className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-3 rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-all text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/30"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase text-[var(--text-secondary)] ml-1">Platform</label>
                      <input 
                        type="text" 
                        placeholder="YouTube"
                        value={newEvent.platform}
                        onChange={(e) => setNewEvent({...newEvent, platform: e.target.value})}
                        className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-3 rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-all text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/30"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase text-[var(--text-secondary)] ml-1">Event Description</label>
                    <textarea 
                      placeholder="Official MV Release..."
                      value={newEvent.event}
                      onChange={(e) => setNewEvent({...newEvent, event: e.target.value})}
                      className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-3 rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-all h-24 resize-none text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/30"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full bg-[var(--accent)] text-white font-black py-4 rounded-xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    ADD TO TIMELINE
                  </button>
                </form>
              </div>

            </div>
          </section>
        )}

        {activeTab === "regions" && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
              
              {/* Region List */}
              <div>
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-bold">Regional Streaming Info ({regions.length})</h2>
                  <button 
                    onClick={() => { if(confirm("Reset regional data?")) resetRegions() }}
                    className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors uppercase tracking-widest"
                  >
                    Reset to Default
                  </button>
                </div>

                <div className="space-y-4">
                  {regions.map((r) => (
                    <div key={r.country} className="bg-[var(--card-bg)]/40 p-6 rounded-3xl border border-[var(--accent)]/20 group">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-3xl font-black tracking-tighter text-[var(--accent)]">{r.country}</span>
                            <span className="text-[9px] px-3 py-1 bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 rounded-lg font-black uppercase tracking-widest">{r.region}</span>
                          </div>
                          <p className="text-xs font-bold text-[var(--text-primary)] opacity-50 uppercase tracking-wide">{r.goal}</p>
                        </div>
                        <button 
                          onClick={() => deleteRegion(r.country)}
                          className="p-2 text-red-500 sm:opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-6">
                        <div className="bg-[var(--bg-primary)]/40 p-4 rounded-2xl border border-[var(--accent)]/5">
                          <span className="text-[9px] uppercase font-black text-[var(--text-secondary)] block mb-1 tracking-widest">Timezone</span>
                          <span className="font-bold text-[var(--text-primary)]">{r.tz || "UTC"}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-[var(--bg-primary)]/40 p-4 rounded-2xl border border-[var(--accent)]/5">
                            <span className="text-[9px] uppercase font-black text-[var(--text-secondary)] block mb-1 tracking-widest">Spotify</span>
                            <span className="font-bold text-[var(--text-primary)]">{r.spotifyReset}</span>
                          </div>
                          <div className="bg-[var(--bg-primary)]/40 p-4 rounded-2xl border border-[var(--accent)]/5">
                            <span className="text-[9px] uppercase font-black text-[var(--text-secondary)] block mb-1 tracking-widest">Apple</span>
                            <span className="font-bold text-[var(--text-primary)]">{r.appleReset || "N/A"}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <span className="text-[9px] uppercase font-black text-[var(--text-secondary)] block mb-2">Regional Focus Playlists</span>
                        <div className="flex flex-wrap gap-2">
                          <div className="flex items-center gap-1.5 bg-[#1DB954]/5 text-[#1DB954] px-3 py-1.5 rounded-xl border border-[#1DB954]/20 backdrop-blur-sm">
                            <span className="text-[10px] font-black">{r.playlists?.spotify?.length || 0}</span>
                            <span className="text-[8px] font-black uppercase tracking-tighter opacity-80">Spotify</span>
                          </div>
                          <div className="flex items-center gap-1.5 bg-[#FA2D48]/5 text-[#FA2D48] px-3 py-1.5 rounded-xl border border-[#FA2D48]/20 backdrop-blur-sm">
                            <span className="text-[10px] font-black">{r.playlists?.appleMusic?.length || 0}</span>
                            <span className="text-[8px] font-black uppercase tracking-tighter opacity-80">Apple</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add Region Form */}
              <div className="bg-[var(--card-bg)]/80 backdrop-blur-2xl p-6 rounded-3xl border border-[var(--accent)]/40 shadow-xl h-fit lg:sticky lg:top-12">
                <h3 className="text-lg font-black mb-6 uppercase tracking-tight text-[var(--accent)]">Record Regional Info</h3>
                <form onSubmit={handleAddRegion} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="relative">
                      <label className="text-[9px] font-black uppercase text-[var(--text-secondary)] ml-1">Country</label>
                      <input 
                        type="text" 
                        placeholder="Search country..."
                        value={countrySearch}
                        onFocus={() => setShowCountryDrop(true)}
                        onChange={(e) => {
                          setCountrySearch(e.target.value);
                          setShowCountryDrop(true);
                        }}
                        className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-3 rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-all text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/30"
                      />
                      {showCountryDrop && (
                        <div className="absolute top-full left-0 w-full mt-1 bg-[var(--card-bg)]/90 backdrop-blur-xl border border-[var(--accent)]/40 rounded-xl max-h-40 overflow-y-auto z-[60] shadow-2xl">
                          {COUNTRIES.filter(c => c.toLowerCase().includes(countrySearch.toLowerCase())).map(c => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => handleCountrySelect(c)}
                              className="w-full text-left px-4 py-2 text-xs hover:bg-[var(--accent)] hover:text-black transition-all text-[var(--text-primary)]"
                            >
                              {c}
                            </button>
                          ))}
                        </div>
                      )}
                      {selectedCountries.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {selectedCountries.map((c) => (
                            <span key={c} className="inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-[var(--accent)]">
                              {c}
                              <button
                                type="button"
                                onClick={() => setSelectedCountries((prev) => prev.filter((x) => x !== c))}
                                className="text-[12px] leading-none opacity-60 hover:opacity-100"
                                aria-label={`Remove ${c}`}
                                title={`Remove ${c}`}
                              >
                                ×
                              </button>
                            </span>
                          ))}
                          <button
                            type="button"
                            onClick={() => setSelectedCountries([])}
                            className="text-[10px] font-black uppercase tracking-widest text-red-300 hover:text-red-200"
                          >
                            Clear all
                          </button>
                        </div>
                      ) : null}
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase text-[var(--text-secondary)] ml-1">Region</label>
                      <input 
                        type="text" 
                        placeholder="South Asia"
                        value={newRegion.region}
                        onChange={(e) => handlePresetChange(e.target.value)}
                        className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-3 rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-all text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/30"
                        list="region-presets"
                      />
                      <datalist id="region-presets">
                        {Object.keys(COUNTRY_PRESETS).map(r => <option key={r} value={r} />)}
                      </datalist>
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] font-black uppercase text-[var(--text-secondary)] ml-1">Streaming Goals</label>
                    <input 
                      type="text" 
                      placeholder="Reach #1 on Top 50 India..."
                      value={newRegion.goal}
                      onChange={(e) => setNewRegion({...newRegion, goal: e.target.value})}
                      className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-3 rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-all text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/30"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-black uppercase text-[var(--text-secondary)] ml-1">Timezone (IANA)</label>
                      <input 
                        type="text" 
                        placeholder="Asia/Kolkata"
                        value={newRegion.tz}
                        onChange={(e) => setNewRegion({...newRegion, tz: e.target.value})}
                        className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-3 rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-all text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/30"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-black uppercase text-[var(--text-secondary)] ml-1">Spotify Reset</label>
                      <input 
                        type="text" 
                        placeholder="12:30 AM IST"
                        value={newRegion.spotifyReset}
                        onChange={(e) => setNewRegion({...newRegion, spotifyReset: e.target.value})}
                        className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-3 rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-all text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/30"
                      />
                    </div>
                    {/*
                    <div>
                      <label className="text-[9px] font-black uppercase text-[var(--text-secondary)] ml-1">Apple Reset</label>
                      <input 
                        type="text" 
                        placeholder="1:30 AM IST"
                        value={newRegion.appleReset}
                        onChange={(e) => setNewRegion({...newRegion, appleReset: e.target.value})}
                        className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-3 rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-all text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/30"
                      />
                    </div>
                    */}
                  </div>
                  
                  {/* Playlist management restored and expanded to 20 slots */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-[9px] font-black uppercase text-[var(--text-secondary)] ml-1">Focus Playlists (20 Slots)</label>
                      <div className="flex bg-[var(--bg-primary)] px-3 py-1.5 rounded-xl border border-[var(--accent)]/20 shadow-inner">
                        <span className="text-[9px] font-black uppercase tracking-widest text-[#1DB954]">Spotify</span>
                      </div>
                    </div>

                    <div className="bg-[var(--bg-primary)]/50 p-4 rounded-2xl border border-[var(--accent)]/10 max-h-[300px] overflow-y-auto custom-scrollbar shadow-inner">
                      <div className="grid grid-cols-1 gap-3">
                        {(newRegion.playlists.spotify || []).map((pl, idx) => (
                          <div key={idx} className="bg-[var(--card-bg)]/40 p-3.5 rounded-xl space-y-2.5 border border-[var(--accent)]/5 shadow-sm hover:border-[var(--accent)]/20 transition-all group/slot">
                            <div className="flex justify-between items-center">
                              <span className="text-[8px] font-black uppercase opacity-30 tracking-widest group-hover/slot:opacity-60 transition-opacity">#{idx + 1} Focus Slot</span>
                              <div className="w-1 h-1 rounded-full bg-[#1DB954] opacity-20"></div>
                            </div>
                            <input 
                              type="text"
                              placeholder="Playlist Name"
                              value={pl.name}
                              onChange={(e) => updatePlaylistField("spotify", idx, "name", e.target.value)}
                              className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/10 p-2.5 rounded-lg text-[11px] font-bold focus:outline-none focus:border-[var(--accent)] transition-all placeholder:opacity-20"
                            />
                            <input 
                              type="text"
                              placeholder="Streaming URL (https://...)"
                              value={pl.url}
                              onChange={(e) => updatePlaylistField("spotify", idx, "url", e.target.value)}
                              className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/10 p-2.5 rounded-lg text-[10px] font-mono focus:outline-none focus:border-[var(--accent)] transition-all placeholder:opacity-20 opacity-60 focus:opacity-100"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {regionValidation.blocking.length > 0 && (
                    <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2">
                      {regionValidation.blocking.map((msg) => (
                        <p key={msg} className="text-[10px] font-black text-red-300 uppercase tracking-wide">{msg}</p>
                      ))}
                    </div>
                  )}
                  {regionValidation.hints.length > 0 && (
                    <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2">
                      {regionValidation.hints.map((msg) => (
                        <p key={msg} className="text-[10px] font-black text-amber-200 uppercase tracking-wide">{msg}</p>
                      ))}
                    </div>
                  )}

                  <button 
                    type="submit"
                    disabled={!regionValidation.isValid}
                    className="w-full bg-[var(--accent)] text-black dark:text-black font-black py-4 rounded-xl shadow-lg shadow-[var(--accent)]/20 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest text-xs disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:active:scale-100"
                  >
                    Save Regional Info 💜
                  </button>
                </form>
              </div>
            </div>
          </section>
        )}
        {activeTab === "mods" && (
          <ModManagerSection 
            mods={mods} 
            toggleStatus={toggleStatus} 
            updateModDetails={updateModDetails} 
            resetMods={resetMods} 
            toast={toast}
          />
        )}
        {activeTab === "lucky-draw" && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <h2 className="text-2xl font-bold">Lucky Draw Entries ({filteredLuckyDrawEntries.length})</h2>
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <input
                  value={luckyDrawFilter}
                  onChange={(e) => setLuckyDrawFilter(e.target.value)}
                  placeholder="Filter by name, email, handle..."
                  className="w-full sm:w-64 bg-[var(--bg-primary)]/60 border border-[var(--accent)]/20 px-3 py-2 rounded-xl text-xs font-semibold outline-none focus:border-[var(--accent)]"
                />
                <button
                  onClick={handleDownloadLuckyDrawCsv}
                  className="px-3 py-2 rounded-xl border border-[var(--accent)]/30 text-[var(--accent)] text-[10px] font-black uppercase tracking-widest hover:bg-[var(--accent)]/10 transition-all"
                >
                  Download CSV
                </button>
              </div>
            </div>

            {luckyDrawLoading && (
              <div className="mb-4 text-sm font-bold text-[var(--text-secondary)]">Loading entries...</div>
            )}
            {luckyDrawError && (
              <div className="mb-4 text-sm font-bold text-red-400">{luckyDrawError}</div>
            )}

            <div className="bg-[var(--card-bg)]/40 backdrop-blur-xl border border-[var(--accent)]/40 rounded-3xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[900px]">
                  <thead className="bg-[var(--accent)]/5 border-b border-[var(--accent)]/20">
                    <tr>
                      <th className="p-4 font-black text-[10px] uppercase tracking-widest text-[var(--text-secondary)]">Date</th>
                      <th className="p-4 font-black text-[10px] uppercase tracking-widest text-[var(--text-secondary)]">
                        <button
                          onClick={() => setLuckyDrawSort((prev) => (prev === "username_asc" ? "username_desc" : "username_asc"))}
                          className="inline-flex items-center gap-1 hover:text-[var(--accent)] transition-colors"
                          title="Sort by username"
                        >
                          Username
                          <span className="text-[9px]">
                            {luckyDrawSort === "username_desc" ? "↓" : "↑"}
                          </span>
                        </button>
                      </th>
                      <th className="p-4 font-black text-[10px] uppercase tracking-widest text-[var(--text-secondary)]">Email</th>
                      <th className="p-4 font-black text-[10px] uppercase tracking-widest text-[var(--text-secondary)]">Platform</th>
                      <th className="p-4 font-black text-[10px] uppercase tracking-widest text-[var(--text-secondary)]">Handle</th>
                      <th className="p-4 font-black text-[10px] uppercase tracking-widest text-[var(--text-secondary)]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--accent)]/10">
                    {filteredLuckyDrawEntries.map((entry) => (
                      <tr key={entry.id || `${entry.userId}-${entry.dateKey}`} className="hover:bg-[var(--accent)]/5 transition-colors">
                        <td className="p-4 text-xs">{entry.dateKey || "-"}</td>
                        <td className="p-4 text-sm font-bold">{entry.username || "-"}</td>
                        <td className="p-4 text-sm">{entry.email || "-"}</td>
                        <td className="p-4 text-sm uppercase">{entry.platform || "-"}</td>
                        <td className="p-4 text-sm">{entry.handle || "-"}</td>
                        <td className="p-4 text-sm">
                          <button
                            onClick={() => handleDeleteLuckyDrawEntry(entry.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredLuckyDrawEntries.length === 0 && !luckyDrawLoading && (
                      <tr>
                        <td colSpan={6} className="p-6 text-sm text-[var(--text-secondary)] text-center">
                          No entries yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
        {activeTab === "missions" && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8">
              <div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4">
                  <h2 className="text-2xl font-bold">Daily Missions ({missions.length})</h2>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => { if (confirm("Reset daily missions to defaults?")) resetMissions(); }}
                      className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors uppercase tracking-widest"
                    >
                      Reset to Default
                    </button>
                    <button
                      onClick={() => { if (confirm("Clear all daily missions?")) clearMissions(); }}
                      className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors uppercase tracking-widest"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
                <p className="text-[11px] font-semibold text-[var(--text-secondary)] mb-6">
                  Auto-verified missions are expected to be checked by the backend (streams, referrals, and engagement).
                </p>

                {missionsLoading && (
                  <div className="mb-4 text-sm font-bold text-[var(--text-secondary)]">Loading missions...</div>
                )}

                {missions.length === 0 && !missionsLoading ? (
                  <div className="rounded-2xl border border-[var(--accent)]/15 bg-[var(--card-bg)]/40 p-6 text-sm font-semibold text-[var(--text-secondary)]">
                    No missions yet. Add one on the right.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {missions.map((mission) => {
                      const isEditing = editingMissionId === mission.id;
                      return (
                        <div key={mission.id} className="bg-[var(--card-bg)]/40 rounded-3xl border border-[var(--accent)]/20 overflow-hidden group">
                          {isEditing && editingMission ? (
                            <div className="p-5 space-y-3">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="text-[9px] font-black uppercase text-[var(--text-secondary)] ml-1">Title</label>
                                  <input
                                    type="text"
                                    value={editingMission.title}
                                    onChange={(e) => setEditingMission({ ...editingMission, title: e.target.value })}
                                    className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-2.5 rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-all text-[var(--text-primary)]"
                                  />
                                </div>
                                <div>
                                  <label className="text-[9px] font-black uppercase text-[var(--text-secondary)] ml-1">Type</label>
                                  <select
                                    value={editingMission.type}
                                    onChange={(e) => setEditingMission((prev) => applyMissionTypeDefaults(e.target.value, prev))}
                                    className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-2.5 rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-all text-[var(--text-primary)]"
                                  >
                                    {MISSION_TYPE_OPTIONS.map((option) => (
                                      <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                              <div>
                                <label className="text-[9px] font-black uppercase text-[var(--text-secondary)] ml-1">Description</label>
                                <textarea
                                  rows={3}
                                  value={editingMission.description}
                                  onChange={(e) => setEditingMission({ ...editingMission, description: e.target.value })}
                                  className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-2.5 rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-all text-[var(--text-primary)] resize-none"
                                />
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                  <label className="text-[9px] font-black uppercase text-[var(--text-secondary)] ml-1">Target</label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={editingMission.target}
                                    onChange={(e) => setEditingMission({ ...editingMission, target: Number(e.target.value) })}
                                    className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-2.5 rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-all text-[var(--text-primary)]"
                                  />
                                </div>
                                <div>
                                  <label className="text-[9px] font-black uppercase text-[var(--text-secondary)] ml-1">Unit</label>
                                  <input
                                    type="text"
                                    value={editingMission.unit}
                                    onChange={(e) => setEditingMission({ ...editingMission, unit: e.target.value })}
                                    className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-2.5 rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-all text-[var(--text-primary)]"
                                  />
                                </div>
                                <div className="flex items-center gap-3 pt-5">
                                  <label className="text-[10px] font-black uppercase text-[var(--text-secondary)]">Active</label>
                                  <input
                                    type="checkbox"
                                    checked={Boolean(editingMission.active)}
                                    onChange={(e) => setEditingMission({ ...editingMission, active: e.target.checked })}
                                    className="w-4 h-4 accent-[var(--accent)]"
                                  />
                                  <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] ml-2">Auto</label>
                                  <input
                                    type="checkbox"
                                    checked={Boolean(editingMission.autoCheck)}
                                    onChange={(e) => setEditingMission({ ...editingMission, autoCheck: e.target.checked })}
                                    className="w-4 h-4 accent-[var(--accent)]"
                                  />
                                </div>
                              </div>
                              <div className="flex gap-2 pt-1">
                                <button
                                  onClick={() => {
                                    updateMission(mission.id, editingMission);
                                    setEditingMissionId(null);
                                    setEditingMission(null);
                                    toast.show("Mission updated.", "success");
                                  }}
                                  className="flex-1 bg-[var(--accent)] text-black font-black py-2 rounded-xl text-xs hover:scale-[1.02] active:scale-95 transition-all"
                                >
                                  Save Changes
                                </button>
                                <button
                                  onClick={() => { setEditingMissionId(null); setEditingMission(null); }}
                                  className="px-4 py-2 rounded-xl text-xs font-bold border border-[var(--accent)]/20 hover:bg-[var(--accent)]/10 transition-all"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                  <p className="text-sm font-black text-[var(--accent)] truncate">{mission.title}</p>
                                  <span className="text-[9px] px-2 py-0.5 bg-[var(--accent)]/20 rounded font-black uppercase tracking-widest">
                                    {mission.type}
                                  </span>
                                  {mission.autoCheck && (
                                    <span className="text-[9px] px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded font-black uppercase tracking-widest">
                                      auto
                                    </span>
                                  )}
                                  {!mission.active && (
                                    <span className="text-[9px] px-2 py-0.5 bg-red-500/20 text-red-400 rounded font-black uppercase tracking-widest">
                                      paused
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] font-semibold text-[var(--text-primary)]/80 line-clamp-2 break-words">
                                  {mission.description}
                                </p>
                                <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">
                                  Target: {mission.target} {mission.unit}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0 sm:ml-4">
                                <button
                                  onClick={() => { setEditingMissionId(mission.id); setEditingMission({ ...mission }); }}
                                  className="p-2 text-[var(--accent)] sm:opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                                  title="Edit"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                </button>
                                <button
                                  onClick={() => { if (confirm("Delete this mission?")) deleteMission(mission.id); }}
                                  className="p-2 text-red-500 sm:opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                                  title="Delete"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="bg-[var(--card-bg)]/80 backdrop-blur-2xl p-6 rounded-3xl border border-[var(--accent)]/40 shadow-xl h-fit lg:sticky lg:top-12">
                <h3 className="text-lg font-black mb-6 uppercase tracking-tight text-[var(--accent)]">Add Daily Mission</h3>
                <form onSubmit={handleAddMission} className="space-y-4">
                  <div>
                    <label className="text-[9px] font-black uppercase text-[var(--text-secondary)] ml-1">Title</label>
                    <input
                      type="text"
                      value={missionDraft.title}
                      onChange={(e) => setMissionDraft((prev) => ({ ...prev, title: e.target.value }))}
                      className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-3 rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase text-[var(--text-secondary)] ml-1">Description</label>
                    <textarea
                      rows={4}
                      value={missionDraft.description}
                      onChange={(e) => setMissionDraft((prev) => ({ ...prev, description: e.target.value }))}
                      className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-3 rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-all resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-black uppercase text-[var(--text-secondary)] ml-1">Type</label>
                      <select
                        value={missionDraft.type}
                        onChange={(e) => setMissionDraft((prev) => applyMissionTypeDefaults(e.target.value, prev))}
                        className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-3 rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-all"
                      >
                        {MISSION_TYPE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase text-[var(--text-secondary)] ml-1">Target</label>
                      <input
                        type="number"
                        min="1"
                        value={missionDraft.target}
                        onChange={(e) => setMissionDraft((prev) => ({ ...prev, target: Number(e.target.value) }))}
                        className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-3 rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase text-[var(--text-secondary)] ml-1">Unit</label>
                    <input
                      type="text"
                      value={missionDraft.unit}
                      onChange={(e) => setMissionDraft((prev) => ({ ...prev, unit: e.target.value }))}
                      className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-3 rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-all"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={missionDraft.active}
                        onChange={(e) => setMissionDraft((prev) => ({ ...prev, active: e.target.checked }))}
                        className="w-4 h-4 accent-[var(--accent)]"
                      />
                      Active
                    </label>
                    <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={missionDraft.autoCheck}
                        onChange={(e) => setMissionDraft((prev) => ({ ...prev, autoCheck: e.target.checked }))}
                        className="w-4 h-4 accent-[var(--accent)]"
                      />
                      Auto-verified
                    </label>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-[var(--accent)] text-black dark:text-black font-black py-3 rounded-xl text-xs hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest shadow-lg shadow-[var(--accent)]/20"
                  >
                    Add Mission
                  </button>
                </form>
              </div>
            </div>
          </section>
        )}
        {activeTab === "updates" && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-bold">Daily Updates</h2>
              {latestUpdate && (
                <span className="text-[10px] uppercase tracking-widest font-black text-[var(--text-secondary)] break-words">
                  Last updated: {new Date(latestUpdate.updatedAt).toLocaleString()}
                </span>
              )}
            </div>

            <div className="bg-[var(--card-bg)]/80 backdrop-blur-2xl p-3 sm:p-6 rounded-2xl sm:rounded-3xl border border-[var(--accent)]/40 shadow-xl">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-[9px] font-black uppercase text-[var(--text-secondary)] ml-1">Update Title (Optional)</label>
                  <input
                    type="text"
                    value={dailyUpdateDraft.title}
                    onChange={(e) => setDailyUpdateDraft((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="Daily update headline"
                    className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-3 rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-all text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/30"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-black uppercase text-[var(--text-secondary)] ml-1">Update Message</label>
                  <textarea
                    rows={8}
                    value={dailyUpdateDraft.message}
                    onChange={(e) => setDailyUpdateDraft((prev) => ({ ...prev, message: e.target.value }))}
                    placeholder="Share daily goals, reminders, and important updates..."
                    className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-3 rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-all text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/30 resize-y"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-black uppercase text-[var(--text-secondary)] ml-1">Image URL (Optional)</label>
                  <input
                    type="text"
                    value={dailyUpdateDraft.imageUrl}
                    onChange={(e) => setDailyUpdateDraft((prev) => ({ ...prev, imageUrl: e.target.value }))}
                    placeholder="https://.../update-image.png"
                    className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-3 rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-all text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/30"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-black uppercase text-[var(--text-secondary)] ml-1">Upload Image (Optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 2 * 1024 * 1024) {
                        toast.show("Image must be 2MB or smaller.", "error");
                        e.target.value = "";
                        return;
                      }
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setDailyUpdateDraft((prev) => ({
                          ...prev,
                          uploadedImageData: String(reader.result || ""),
                          uploadedImageName: file.name || "",
                        }));
                      };
                      reader.readAsDataURL(file);
                    }}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-3 rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-all text-[var(--text-primary)] file:mr-2 sm:file:mr-3 file:px-2.5 sm:file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-[var(--accent)]/20 file:text-[var(--accent)] file:font-bold"
                  />
                  <p className="mt-1 text-[10px] text-[var(--text-secondary)]/70 font-bold uppercase tracking-wide">
                    URL or uploaded image will be used. Upload takes priority. Max 2MB.
                  </p>
                </div>

                {(dailyUpdateDraft.uploadedImageData || dailyUpdateDraft.imageUrl) ? (
                  <div className="bg-[var(--bg-primary)]/40 border border-[var(--accent)]/10 rounded-xl p-3">
                    <p className="text-[9px] font-black uppercase text-[var(--text-secondary)] mb-2">
                      Image Preview {dailyUpdateDraft.uploadedImageName ? `(${dailyUpdateDraft.uploadedImageName})` : ""}
                    </p>
                    <img
                      src={dailyUpdateDraft.uploadedImageData || dailyUpdateDraft.imageUrl}
                      alt="Daily update preview"
                      className="w-full max-h-44 sm:max-h-52 object-contain rounded-lg border border-[var(--accent)]/10 bg-black/10"
                    />
                    <button
                      type="button"
                      onClick={() => setDailyUpdateDraft((prev) => ({ ...prev, uploadedImageData: "", uploadedImageName: "" }))}
                      className="mt-2 w-full sm:w-auto px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
                    >
                      Remove Uploaded Image
                    </button>
                  </div>
                ) : null}

                <div>
                  <label className="text-[9px] font-black uppercase text-[var(--text-secondary)] ml-1">Motivation Quote (Optional)</label>
                  <input
                    type="text"
                    value={dailyUpdateDraft.quote}
                    onChange={(e) => setDailyUpdateDraft((prev) => ({ ...prev, quote: e.target.value }))}
                    placeholder="Keep streaming, ARMY!"
                    className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-3 rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-all text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/30"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => {
                        if (!dailyUpdateDraft.message.trim()) {
                          toast.show("Please enter an update message before publishing.", "error");
                          return;
                        }
                        const finalImage = dailyUpdateDraft.uploadedImageData || dailyUpdateDraft.imageUrl;
                        if (editingUpdateId) {
                          updateUpdate(editingUpdateId, { ...dailyUpdateDraft, imageUrl: finalImage });
                          setEditingUpdateId(null);
                          toast.show("Daily update saved.", "success");
                        } else {
                          addUpdate({ ...dailyUpdateDraft, imageUrl: finalImage });
                          toast.show("Daily update added.", "success");
                        }
                        setDailyUpdateDraft({ title: "", message: "", imageUrl: "", quote: "", uploadedImageData: "", uploadedImageName: "" });
                      }}
                      className="w-full sm:w-auto bg-[var(--accent)] text-black dark:text-black font-black px-4 sm:px-8 py-3 rounded-xl shadow-lg shadow-[var(--accent)]/20 hover:scale-[1.05] active:scale-95 transition-all text-[11px] sm:text-xs tracking-widest uppercase"
                    >
                      {editingUpdateId ? "Save Update" : "Add Update"}
                    </button>

                    {editingUpdateId && (
                      <button
                        onClick={() => {
                          setEditingUpdateId(null);
                          setDailyUpdateDraft({ title: "", message: "", imageUrl: "", quote: "", uploadedImageData: "", uploadedImageName: "" });
                        }}
                        className="w-full sm:w-auto bg-[var(--bg-primary)]/60 text-[var(--text-primary)] border border-[var(--accent)]/20 font-black px-4 sm:px-8 py-3 rounded-xl hover:bg-[var(--accent)]/10 transition-all text-[11px] sm:text-xs tracking-widest uppercase"
                      >
                        Cancel Edit
                      </button>
                    )}

                  <button
                    onClick={() => {
                      if (!confirm("Clear the current daily update?")) return;
                      clearUpdates();
                      setDailyUpdateDraft({ title: "", message: "", imageUrl: "", quote: "", uploadedImageData: "", uploadedImageName: "" });
                      toast.show("Daily update cleared.", "info");
                    }}
                    className="w-full sm:w-auto bg-red-500/10 text-red-500 border border-red-500/20 font-black px-4 sm:px-8 py-3 rounded-xl hover:bg-red-500 hover:text-white transition-all text-[11px] sm:text-xs tracking-widest uppercase"
                  >
                    Clear Update
                  </button>
                </div>

                {updates.length > 0 ? (
                  <div className="mt-2 border-t border-[var(--accent)]/10 pt-4">
                    <p className="text-[9px] font-black uppercase text-[var(--text-secondary)] ml-1 mb-2">
                      Published Updates ({updates.length})
                    </p>
                    <div className="max-h-56 overflow-y-auto no-scrollbar space-y-2 pr-0.5 sm:pr-1">
                      {updates.map((item) => (
                        <div key={item.id} className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 bg-[var(--bg-primary)]/40 border border-[var(--accent)]/10 rounded-xl p-3">
                          <div className="min-w-0">
                            <p className="text-xs font-black text-[var(--accent)] truncate">
                              {item.title || "Untitled Update"}
                            </p>
                            <p className="text-[11px] font-semibold text-[var(--text-primary)]/80 line-clamp-2 break-words">
                              {item.message}
                            </p>
                          </div>
                            <div className="shrink-0 flex items-center gap-2 self-end sm:self-auto">
                              <button
                                onClick={() => {
                                  setEditingUpdateId(item.id);
                                  setDailyUpdateDraft({
                                    title: item.title || "",
                                    message: item.message || "",
                                    imageUrl: item.imageUrl || "",
                                    quote: item.quote || "",
                                    uploadedImageData: "",
                                    uploadedImageName: "",
                                  });
                                  toast.show("Editing update. Make changes above and save.", "info");
                                }}
                                className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-[var(--bg-primary)]/60 text-[var(--text-primary)] border border-[var(--accent)]/20 text-[10px] font-black uppercase tracking-widest hover:bg-[var(--accent)]/10 transition-all"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => setPreviewUpdateId((prev) => (prev === item.id ? null : item.id))}
                                className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 text-[10px] font-black uppercase tracking-widest hover:bg-[var(--accent)] hover:text-black transition-all"
                              >
                                {previewUpdateId === item.id ? "Hide" : "Preview"}
                              </button>
                              <button
                                onClick={() => {
                                  if (!confirm("Delete this update?")) return;
                                  deleteUpdate(item.id);
                                  if (previewUpdateId === item.id) setPreviewUpdateId(null);
                                  if (editingUpdateId === item.id) {
                                    setEditingUpdateId(null);
                                    setDailyUpdateDraft({ title: "", message: "", imageUrl: "", quote: "", uploadedImageData: "", uploadedImageName: "" });
                                  }
                                  toast.show("Update deleted.", "info");
                                }}
                                className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
                              >
                                Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {updates.map((item) => (
                      previewUpdateId === item.id ? (
                        <div key={`preview-${item.id}`} className="mt-3 bg-[var(--card-bg)] border border-[var(--accent)]/20 rounded-2xl p-3 sm:p-5">
                          <p className="text-[10px] uppercase tracking-widest font-black text-[var(--text-secondary)] mb-2">Preview</p>
                          {item.title ? (
                            <h4 className="text-base sm:text-lg font-black text-[var(--accent)] tracking-tight mb-2 break-words">{item.title}</h4>
                          ) : null}
                          {item.imageUrl ? (
                            <div className="mb-3">
                              <img
                                src={item.imageUrl}
                                alt={item.title || "Update preview image"}
                                className="w-full max-h-44 sm:max-h-56 object-contain rounded-xl border border-[var(--accent)]/15 bg-black/10"
                              />
                              {item.quote ? (
                                <p className="mt-2 text-xs sm:text-sm italic font-bold text-[var(--accent)]/90 text-center break-words">
                                  {item.quote}
                                </p>
                              ) : null}
                            </div>
                          ) : null}
                          <p className="text-sm font-semibold leading-relaxed whitespace-pre-line break-words text-[var(--text-primary)]/90">
                            {item.message}
                          </p>
                        </div>
                      ) : null
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        )}
        {activeTab === "gallery" && (
          <GalleryManagerSection 
            galleryImages={galleryImages} 
            deleteGalleryImage={deleteGalleryImage}
            newGalleryImage={newGalleryImage}
            setNewGalleryImage={setNewGalleryImage}
            handleAddGalleryImage={handleAddGalleryImage}
            resetGallery={resetGallery}
            updateGalleryImage={updateGalleryImage}
            editingGallerySrc={editingGallerySrc}
            setEditingGallerySrc={setEditingGallerySrc}
            editingGalleryType={editingGalleryType}
            setEditingGalleryType={setEditingGalleryType}
          />
        )}
        {activeTab === "global" && (
          <GlobalConfigSection 
            regions={regions} 
            mods={mods} 
            battles={battles}
            liveBattles={liveBattles}
            timeline={events}
            galleryImages={galleryImages}
            missions={missions}
            toast={toast}
          />
        )}
      </main>
    </div>
  );
}

function ModCard({ mod, onToggle, onUpdate, toast }) {
  const [localName, setLocalName] = useState(mod.name);
  const [localAccounts, setLocalAccounts] = useState([...(mod.accounts || [])]);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Ensure we always have two slots, even if data is thin
  useEffect(() => {
    let base = [...(mod.accounts || [])];
    while(base.length < 2) base.push({ platform: "", url: "" });
    setLocalAccounts(base.slice(0, 2));
    setLocalName(mod.name);
    setHasChanges(false);
  }, [mod.name, mod.accounts]);

  const handleAccountChange = (index, field, value) => {
    const updated = [...localAccounts];
    updated[index] = { ...updated[index], [field]: value };
    setLocalAccounts(updated);
    setHasChanges(true);
  };

  const handleSave = () => {
    onUpdate(mod.id, localName, localAccounts);
    setHasChanges(false);
    toast.show(`Changes saved for ${localName}! 💜`, "success");
  };

  return (
    <div className="bg-[var(--card-bg)]/60 backdrop-blur-xl p-4 sm:p-8 rounded-[2rem] border border-[var(--accent)]/10 shadow-xl transition-all hover:border-[var(--accent)]/30 group/card">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-[10px] font-black uppercase text-[var(--text-secondary)] ml-1 mb-1 tracking-widest">MODERATOR</h3>
          <input 
            type="text"
            placeholder="Mod Name"
            value={localName}
            onChange={(e) => { setLocalName(e.target.value); setHasChanges(true); }}
            className="bg-transparent border-b border-transparent focus:border-[var(--accent)] text-2xl font-black focus:outline-none transition-all w-full text-[var(--text-primary)] tracking-tighter"
          />
        </div>
        <button 
          onClick={() => {
            onToggle(mod.id);
            toast.show(`${mod.name} is now ${mod.status === 'online' ? 'Offline' : 'Online'}`, "info");
          }}
          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase transition-all flex items-center gap-1.5 ${
            mod.status === "online" 
              ? "bg-green-500/20 text-green-500 border border-green-500/40" 
              : "bg-red-500/20 text-red-500 border border-red-500/40"
          }`}
        >
          <span className={`w-1 h-1 rounded-full ${mod.status === 'online' ? 'bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`}></span>
          {mod.status}
        </button>
      </div>

      <div className="space-y-4 border-t border-[var(--accent)]/10 pt-6 my-6">
        <p className="text-[9px] uppercase font-black text-[var(--text-secondary)] tracking-widest ml-1">Help Desk Accounts</p>
        <div className="grid grid-cols-1 gap-3">
          {localAccounts.map((acc, i) => (
            <div key={i} className="bg-[var(--bg-primary)]/40 p-4 rounded-2xl border border-[var(--accent)]/5 space-y-3 group/acc hover:border-[var(--accent)]/20 transition-all">
              <div className="flex items-center gap-3">
                <span className="text-[8px] font-black uppercase w-12 tracking-tighter text-[var(--text-secondary)]">SLOT {i+1}</span>
                <input 
                   type="text"
                   placeholder="Platform (X, TG...)"
                   value={acc.platform}
                   onChange={(e) => handleAccountChange(i, "platform", e.target.value)}
                   className="flex-1 bg-[var(--bg-primary)]/40 border border-[var(--accent)]/10 p-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-[var(--accent)] transition-all placeholder:opacity-20 text-[var(--text-primary)]"
                 />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[8px] font-black uppercase w-12 tracking-tighter text-[var(--text-secondary)]">URL</span>
                <input 
                  type="text"
                  placeholder="https://..."
                  value={acc.url}
                  onChange={(e) => handleAccountChange(i, "url", e.target.value)}
                  className="flex-1 bg-[var(--bg-primary)]/40 border border-[var(--accent)]/10 p-2.5 rounded-xl text-[10px] font-mono focus:outline-none focus:border-[var(--accent)] transition-all placeholder:opacity-20 text-[var(--text-primary)] opacity-80 focus:opacity-100"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <button 
        onClick={handleSave}
        disabled={!hasChanges}
        className={`w-full py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all
          ${hasChanges 
            ? "bg-[var(--accent)] text-black dark:text-black shadow-lg shadow-[var(--accent)]/20 hover:scale-[1.02] active:scale-[0.98]" 
            : "bg-[var(--bg-primary)]/40 text-[var(--accent)]/20 cursor-not-allowed"}
        `}
      >
        {hasChanges ? "Sync Changes 💜" : "Already Synced"}
      </button>
    </div>
  );
}

function ModManagerSection({ mods, toggleStatus, updateModDetails, resetMods, toast }) {
  const handleFullUpdate = (id, name, links) => {
    updateModDetails(id, name, links);
  };

  return (
    <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold">Help Desk Mod Manager</h2>
        <button 
          onClick={() => { if(confirm("Reset all mods to default?")) resetMods() }}
          className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors uppercase tracking-widest"
        >
          Reset to Default
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mods.map((mod) => (
          <ModCard 
            key={mod.id} 
            mod={mod} 
            onToggle={toggleStatus} 
            onUpdate={handleFullUpdate}
            toast={toast}
          />
        ))}
      </div>
    </section>
  );
}

function GlobalConfigSection({ regions, mods, battles, liveBattles, timeline, galleryImages, missions, toast }) {
  const config = JSON.stringify({ regions, mods, battles, liveBattles, timeline, galleryImages, dailyMissions: missions }, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(config);
    toast.show("JSON Config copied to clipboard! 📋💜", "success");
  };

  return (
    <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 px-1">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black tracking-tighter uppercase text-[var(--accent)]">Global Config</h2>
          <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mt-1">Export your curated configuration to host on GitHub Gist.</p>
        </div>
        <button 
          onClick={handleCopy}
          className="w-full md:w-auto bg-[var(--accent)] text-black dark:text-black font-black px-8 py-3 rounded-2xl shadow-xl shadow-[var(--accent)]/20 hover:scale-[1.05] active:scale-95 transition-all flex items-center justify-center gap-3 text-xs tracking-widest"
        >
          <span>📋</span> COPY JSON
        </button>
      </div>

      <div className="bg-[var(--bg-primary)]/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-[var(--accent)]/10 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
          <span className="text-9xl font-black italic">JSON</span>
        </div>
        <pre className="text-[10px] md:text-xs font-mono overflow-x-auto max-h-[600px] overflow-y-auto whitespace-pre-wrap text-[var(--accent)]/70 scrollbar-hide">
          {config}
        </pre>
      </div>
    </section>
  );
}

function GalleryManagerSection({ 
  galleryImages, deleteGalleryImage, newGalleryImage, setNewGalleryImage, handleAddGalleryImage, resetGallery, 
  updateGalleryImage, editingGallerySrc, setEditingGallerySrc, editingGalleryType, setEditingGalleryType 
}) {
  return (
    <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold">Gallery Manager</h2>
        <button 
          onClick={() => { if(confirm("Reset gallery to default 69 image pool?")) resetGallery() }}
          className="text-xs font-bold text-red-500 opacity-60 hover:opacity-100 uppercase tracking-widest"
        >
          Reset to Default
        </button>
      </div>

      <div className="bg-[var(--card-bg)]/80 backdrop-blur-2xl p-4 sm:p-6 rounded-3xl border border-[var(--accent)]/40 shadow-xl mb-12">
        <h3 className="text-lg font-black mb-4 uppercase tracking-tight text-[var(--accent)]">Add New Image</h3>
        <form onSubmit={handleAddGalleryImage} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="text-[9px] font-black uppercase text-[var(--text-secondary)] ml-1">Image Source URL</label>
            <input 
              type="text" 
              placeholder="e.g. /assets/images/my_photo.jpg or https://..."
              value={newGalleryImage.src}
              onChange={(e) => setNewGalleryImage({...newGalleryImage, src: e.target.value})}
              className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-3 rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-all text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/30"
            />
          </div>
          <div className="w-full md:w-48">
            <label className="text-[9px] font-black uppercase text-[var(--text-secondary)] ml-1">Orientation Type</label>
            <select 
              value={newGalleryImage.type}
              onChange={(e) => setNewGalleryImage({...newGalleryImage, type: e.target.value})}
              className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-3 rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-all appearance-none cursor-pointer text-[var(--text-primary)]"
            >
              <option value="square">Square (1:1)</option>
              <option value="portrait">Portrait (Tall)</option>
              <option value="landscape">Landscape (Wide)</option>
            </select>
          </div>
          <div className="flex items-end">
            <button 
              type="submit"
              className="w-full md:w-auto bg-[var(--accent)] text-black dark:text-black font-black px-8 py-3 rounded-xl shadow-lg shadow-[var(--accent)]/20 hover:scale-[1.05] active:scale-95 transition-all text-xs tracking-widest uppercase h-[46px]"
            >
              Add To Pool 💜
            </button>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {galleryImages.map((img, idx) => (
          <div key={idx} className="group relative bg-[var(--bg-primary)] rounded-2xl border border-[var(--accent)]/20 overflow-hidden shadow-lg hover:border-[var(--accent)]/60 transition-all flex flex-col aspect-square">
            {editingGallerySrc === img.src ? (
              /* --- EDIT MODE --- */
              <div className="absolute inset-0 z-30 bg-[var(--bg-primary)]/95 backdrop-blur-md p-4 flex flex-col justify-center items-center gap-4 animate-in fade-in duration-200">
                <div className="w-full">
                  <label className="text-[9px] font-black uppercase text-[var(--text-secondary)] ml-1 mb-1 block">Orientation</label>
                  <select 
                    value={editingGalleryType}
                    onChange={(e) => setEditingGalleryType(e.target.value)}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 text-[var(--text-primary)] p-2.5 rounded-xl text-xs focus:outline-none focus:border-[var(--accent)] transition-all appearance-none cursor-pointer [&>option]:bg-[var(--bg-primary)] [&>option]:text-[var(--text-primary)]"
                  >
                    <option value="square">Square (1:1)</option>
                    <option value="portrait">Portrait (Tall)</option>
                    <option value="landscape">Landscape (Wide)</option>
                  </select>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full">
                  <button 
                    onClick={() => {
                      updateGalleryImage(img.src, { type: editingGalleryType });
                      setEditingGallerySrc(null);
                    }}
                    className="flex-1 bg-[var(--accent)] text-black font-black py-2 rounded-xl text-[10px] uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    Save
                  </button>
                  <button 
                    onClick={() => setEditingGallerySrc(null)}
                    className="flex-1 bg-[var(--accent)]/10 text-[var(--text-primary)] font-black py-2 rounded-xl text-[10px] uppercase tracking-widest hover:bg-[var(--accent)]/20 transition-all border border-[var(--accent)]/20"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* --- VIEW MODE --- */
              <>
                <div className="absolute top-2 left-2 z-10 flex gap-1">
                  <span className={`px-2 py-1 rounded bg-black/60 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest shadow-xl border border-white/10 ${
                    img.type === "portrait" ? "text-blue-300" : img.type === "landscape" ? "text-green-300" : "text-yellow-300"
                  }`}>
                    {img.type}
                  </span>
                </div>
                
                <div className="absolute top-2 right-2 z-10 flex gap-1 sm:opacity-0 group-hover:opacity-100 transition-all">
                  <button 
                    onClick={() => {
                      setEditingGallerySrc(img.src);
                      setEditingGalleryType(img.type);
                    }}
                    className="w-7 h-7 bg-[var(--accent)]/80 hover:bg-[var(--accent)] text-black rounded-full flex items-center justify-center shadow-xl scale-75 hover:scale-110 active:scale-90"
                    title="Edit Orientation"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  <button 
                    onClick={() => { if(confirm("Are you sure you want to remove this image from the gallery?")) deleteGalleryImage(img.src) }}
                    className="w-7 h-7 bg-red-500/80 hover:bg-red-500 text-white rounded-full flex items-center justify-center shadow-xl scale-75 hover:scale-110 active:scale-90"
                    title="Remove Image"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              </>
            )}

            <img 
              src={img.src} 
              alt="Gallery thumbnail" 
              className={`w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500 pointer-events-none`}
              loading="lazy"
            />
            
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8 pb-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
              <p className="text-[8px] text-white overflow-hidden text-ellipsis whitespace-nowrap opacity-70" title={img.src}>
                {img.src.split("/").pop()}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      {galleryImages.length === 0 && (
        <div className="text-center py-24 opacity-40 border-2 border-dashed border-[var(--accent)]/10 rounded-3xl">
          <p className="text-xl italic">No images in gallery pool.</p>
        </div>
      )}
    </section>
  );
}

// Helper component for the dropdown menu
function MenuButton({ tab, label, current, set, close }) {
  const isActive = current === tab;
  return (
    <button
      onClick={() => { set(tab); close(); }}
      className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
        isActive 
          ? "bg-[var(--accent)] text-black" 
          : "text-[var(--text-primary)] hover:bg-[var(--accent)]/10"
      }`}
    >
      {label}
    </button>
  );
}

export default AdminPanel;
