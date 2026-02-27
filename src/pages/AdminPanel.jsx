import { useState, useMemo, useEffect } from "react";
import Header from "../components/layout/Header";
import useBattles from "../hooks/useBattles";
import useTimeline from "../hooks/useTimeline";
import useRegionalData from "../hooks/useRegionalData";
import useModStatus from "../hooks/useModStatus";
import useGalleryData from "../hooks/useGalleryData";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { COUNTRY_PRESETS, COUNTRY_REGION_MAP, COUNTRIES, COUNTRY_TZ_MAP, FOCUS_PLAYLISTS } from "../constants";

const allRegions = [...new Set(Object.values(COUNTRY_REGION_MAP))];

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
  const [userSummary, setUserSummary] = useState({ signups: 0, lastfmConnected: 0, lastfmNotConnected: 0 });
  const [userSummaryLoading, setUserSummaryLoading] = useState(true);
  const [userSummaryError, setUserSummaryError] = useState("");
  const { battles, liveBattles, addBattle, updateBattle, updateLiveBattles, deleteBattle, clearBattles, resetLiveBattles, loading: battlesLoading } = useBattles();
  const { events, addEvent, updateEvent, deleteEvent, clearTimeline, resetToDefault, loading: timelineLoading } = useTimeline();
  const { regions, addRegion, deleteRegion, resetRegions, loading: regionsLoading } = useRegionalData();
  const { mods, toggleStatus, updateModDetails, resetMods, loading: modsLoading } = useModStatus();
  const { galleryImages, loading: galleryLoading, resetGallery, addGalleryImage, deleteGalleryImage, updateGalleryImage } = useGalleryData();
  const toast = useToast();
  const { token } = useAuth();

  const isDataLoading = regionsLoading || modsLoading || battlesLoading || timelineLoading || galleryLoading;
  
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

  const [countrySearch, setCountrySearch] = useState("");
  const [showCountryDrop, setShowCountryDrop] = useState(false);

  const [newGalleryImage, setNewGalleryImage] = useState({ src: "", type: "square" });
  const [editingGallerySrc, setEditingGallerySrc] = useState(null);
  const [editingGalleryType, setEditingGalleryType] = useState("");
  const [editingBattleId, setEditingBattleId] = useState(null);
  const [editingBattle, setEditingBattle] = useState(null);
  const [editingEventId, setEditingEventId] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);

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
    if (activeTab !== "tickets") return;

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
          setUserSummary(data.counts || { signups: 0, lastfmConnected: 0, lastfmNotConnected: 0 });
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
    if (!newRegion.country || !newRegion.region || !newRegion.goal) {
      toast.show("Please fill necessary fields (Country, Region, Goal)", "error");
      return;
    }

    addRegion(newRegion);
    
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
    toast.show(`${newRegion.country} Regional Info Saved! 💜`, "success");
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
    const region = COUNTRY_REGION_MAP[country] || "";
    // Priority: Specific country preset -> General region preset (mapped) -> Current state
    const preset = COUNTRY_PRESETS[country] || (region ? COUNTRY_PRESETS[region] : null);
    const countryTz = COUNTRY_TZ_MAP[country];
    
    setNewRegion({
      ...newRegion,
      country,
      region: region,
      tz: countryTz || (preset ? preset.tz : newRegion.tz),
      spotifyReset: preset ? preset.s : newRegion.spotifyReset,
      appleReset: preset ? preset.a : newRegion.appleReset
    });
    setCountrySearch(country);
    setShowCountryDrop(false);
  };

  const formatBattleTimeLabel = (value) => {
    const timeText = String(value || "").trim();
    if (!timeText) return "N/A";
    return /[A-Za-z]/.test(timeText) ? timeText : `${timeText} KST`;
  };



  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <Header />
      
      <main className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16 py-12">
        <div className="sticky top-[68px] z-40 bg-[var(--bg-primary)]/80 backdrop-blur-md pb-6 mb-12 border-b border-[var(--accent)]/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <h1 className="text-4xl font-black text-[var(--accent)] tracking-tight">Admin Dashboard</h1>
          
          <div className="relative">
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
                {activeTab.replace("timeline", "Timeline").replace("regions", "Regions").replace("mods", "Mods").replace("global", "Global Config").replace("battles", "Battles").replace("tickets", "Support Tickets")}
              </span>
            </button>

            {isMenuOpen && (
              <>
                {/* Backdrop to close menu when clicking outside */}
                <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
                
                <div className="absolute top-full right-0 md:left-0 md:right-auto mt-3 w-56 bg-[var(--bg-primary)]/90 backdrop-blur-3xl border border-[var(--accent)]/40 p-2 rounded-2xl shadow-2xl z-50 flex flex-col gap-1 animate-in slide-in-from-top-2 fade-in duration-200">
                  <MenuButton tab="tickets" label="Support Tickets" current={activeTab} set={setActiveTab} close={() => setIsMenuOpen(false)} />
                  <MenuButton tab="battles" label="Battle Manager" current={activeTab} set={setActiveTab} close={() => setIsMenuOpen(false)} />
                  <MenuButton tab="timeline" label="Timeline Manager" current={activeTab} set={setActiveTab} close={() => setIsMenuOpen(false)} />
                  <MenuButton tab="regions" label="Region Manager" current={activeTab} set={setActiveTab} close={() => setIsMenuOpen(false)} />
                  <MenuButton tab="mods" label="Mod Manager" current={activeTab} set={setActiveTab} close={() => setIsMenuOpen(false)} />
                  <MenuButton tab="gallery" label="Gallery Manager" current={activeTab} set={setActiveTab} close={() => setIsMenuOpen(false)} />
                  <MenuButton tab="global" label="Global Config" current={activeTab} set={setActiveTab} close={() => setIsMenuOpen(false)} />
                </div>
              </>
            )}
          </div>
        </div>

        {activeTab === "tickets" && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">Active Support Tickets ({tickets.length})</h2>
              {tickets.length > 0 && (
                <button 
                  onClick={handleClearAllTickets}
                  className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 px-4 py-2 rounded-xl transition-all font-bold text-xs"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <div className="bg-[var(--card-bg)]/50 border border-[var(--accent)]/20 rounded-2xl p-4">
                <p className="text-[10px] uppercase tracking-widest font-black text-[var(--text-secondary)]">Total Signups</p>
                <p className="text-2xl font-black text-[var(--accent)] mt-1">{userSummary.signups.toLocaleString()}</p>
              </div>
              <div className="bg-[var(--card-bg)]/50 border border-[var(--accent)]/20 rounded-2xl p-4">
                <p className="text-[10px] uppercase tracking-widest font-black text-[var(--text-secondary)]">Online (Last.fm Connected)</p>
                <p className="text-2xl font-black text-emerald-400 mt-1">{userSummary.lastfmConnected.toLocaleString()}</p>
              </div>
              <div className="bg-[var(--card-bg)]/50 border border-[var(--accent)]/20 rounded-2xl p-4">
                <p className="text-[10px] uppercase tracking-widest font-black text-[var(--text-secondary)]">Offline (No Last.fm)</p>
                <p className="text-2xl font-black text-rose-400 mt-1">{userSummary.lastfmNotConnected.toLocaleString()}</p>
              </div>
            </div>

            {userSummaryLoading && (
              <div className="mb-4 text-xs font-bold text-[var(--text-secondary)]">Loading participant counts...</div>
            )}
            {userSummaryError && (
              <div className="mb-4 text-xs font-bold text-red-400">{userSummaryError}</div>
            )}

            {ticketsLoading && (
              <div className="mb-6 text-sm font-bold text-[var(--text-secondary)]">Loading support tickets...</div>
            )}
            {ticketsError && (
              <div className="mb-6 text-sm font-bold text-red-400">{ticketsError}</div>
            )}

            {tickets.length === 0 ? (
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
                        <th className="p-6 font-black text-[10px] uppercase tracking-[0.2em] text-[var(--text-secondary)]">User ID</th>
                        <th className="p-6 font-black text-[10px] uppercase tracking-[0.2em] text-[var(--text-secondary)]">Platform</th>
                        <th className="p-6 font-black text-[10px] uppercase tracking-[0.2em] text-[var(--text-secondary)]">Query</th>
                        <th className="p-6 font-black text-[10px] uppercase tracking-[0.2em] text-[var(--text-secondary)] text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--accent)]/10">
                      {tickets.map((ticket) => (
                        <tr key={ticket.id} className="hover:bg-[var(--accent)]/5 transition-colors group">
                          <td className="p-5 text-sm text-[var(--text-secondary)]">{ticket.timestamp}</td>
                          <td className="p-5 font-bold">{ticket.userId}</td>
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
                     <button 
                      type="submit"
                      className="w-full bg-[var(--accent)] text-black dark:text-black font-black py-3 rounded-xl text-xs hover:scale-[1.02] active:scale-[0.98] transition-all mt-2 shadow-lg shadow-[var(--accent)]/20 uppercase tracking-widest"
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
                          setNewRegion({...newRegion, country: e.target.value});
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
                    <div>
                      <label className="text-[9px] font-black uppercase text-[var(--text-secondary)] ml-1">Google Form URL</label>
                      <input 
                        type="text" 
                        placeholder="https://forms.gle/..."
                        value={newRegion.gFormUrl}
                        onChange={(e) => setNewRegion({...newRegion, gFormUrl: e.target.value})}
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
                  </div>
                  
                  {/* Playlist management restored and expanded to 20 slots */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-[9px] font-black uppercase text-[var(--text-secondary)] ml-1">Focus Playlists (20 Slots)</label>
                      <div className="flex bg-[var(--bg-primary)] p-1 rounded-xl border border-[var(--accent)]/20 shadow-inner">
                        <button 
                          type="button"
                          onClick={() => setPlaylistPlatform("spotify")}
                          className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${playlistPlatform === 'spotify' ? 'bg-[#1DB954] text-black shadow-lg shadow-[#1DB954]/20' : 'opacity-40 hover:opacity-100 hover:text-[#1DB954]'}`}
                        >
                          Spotify
                        </button>
                        <button 
                          type="button"
                          onClick={() => setPlaylistPlatform("appleMusic")}
                          className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${playlistPlatform === 'appleMusic' ? 'bg-[#FA2D48] text-white shadow-lg shadow-[#FA2D48]/20' : 'opacity-40 hover:opacity-100 hover:text-[#FA2D48]'}`}
                        >
                          Apple
                        </button>
                      </div>
                    </div>

                    <div className="bg-[var(--bg-primary)]/50 p-4 rounded-2xl border border-[var(--accent)]/10 max-h-[300px] overflow-y-auto custom-scrollbar shadow-inner">
                      <div className="grid grid-cols-1 gap-3">
                        {(newRegion.playlists[playlistPlatform] || []).map((pl, idx) => (
                          <div key={idx} className="bg-[var(--card-bg)]/40 p-3.5 rounded-xl space-y-2.5 border border-[var(--accent)]/5 shadow-sm hover:border-[var(--accent)]/20 transition-all group/slot">
                            <div className="flex justify-between items-center">
                              <span className="text-[8px] font-black uppercase opacity-30 tracking-widest group-hover/slot:opacity-60 transition-opacity">#{idx + 1} Focus Slot</span>
                              <div className={`w-1 h-1 rounded-full ${playlistPlatform === 'spotify' ? 'bg-[#1DB954]' : 'bg-[#FA2D48]'} opacity-20`}></div>
                            </div>
                            <input 
                              type="text"
                              placeholder="Playlist Name"
                              value={pl.name}
                              onChange={(e) => updatePlaylistField(playlistPlatform, idx, "name", e.target.value)}
                              className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/10 p-2.5 rounded-lg text-[11px] font-bold focus:outline-none focus:border-[var(--accent)] transition-all placeholder:opacity-20"
                            />
                            <input 
                              type="text"
                              placeholder="Streaming URL (https://...)"
                              value={pl.url}
                              onChange={(e) => updatePlaylistField(playlistPlatform, idx, "url", e.target.value)}
                              className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/10 p-2.5 rounded-lg text-[10px] font-mono focus:outline-none focus:border-[var(--accent)] transition-all placeholder:opacity-20 opacity-60 focus:opacity-100"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-[var(--accent)] text-black dark:text-black font-black py-4 rounded-xl shadow-lg shadow-[var(--accent)]/20 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest text-xs"
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
            toast={toast}
          />
        )}
      </main>
    </div>
  );
}

// Sub-component for individual mod cards to handle local editing state
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

function GlobalConfigSection({ regions, mods, battles, liveBattles, timeline, galleryImages, toast }) {
  const config = JSON.stringify({ regions, mods, battles, liveBattles, timeline, galleryImages }, null, 2);

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
