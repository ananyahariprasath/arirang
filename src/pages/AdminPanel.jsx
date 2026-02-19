import { useState, useEffect } from "react";
import Header from "../components/layout/Header";
import useBattles from "../hooks/useBattles";
import useTimeline from "../hooks/useTimeline";
import useRegionalData from "../hooks/useRegionalData";
import useModStatus from "../hooks/useModStatus";
import { useToast } from "../context/ToastContext";
import { COUNTRY_PRESETS, COUNTRY_REGION_MAP, COUNTRIES, COUNTRY_TZ_MAP } from "../constants";

function AdminPanel() {
  const [activeTab, setActiveTab] = useState("tickets");
  const [tickets, setTickets] = useState([]);
  const { battles, liveBattles, addBattle, updateLiveBattles, deleteBattle, clearBattles, loading: battlesLoading } = useBattles();
  const { events, addEvent, deleteEvent, clearTimeline, resetToDefault, loading: timelineLoading } = useTimeline();
  const { regions, addRegion, deleteRegion, resetRegions, loading: regionsLoading } = useRegionalData();
  const { mods, toggleStatus, updateModDetails, resetMods, loading: modsLoading } = useModStatus();
  const toast = useToast();

  const isDataLoading = regionsLoading || modsLoading || battlesLoading || timelineLoading;
  
  // New Battle History Form State
  const [newBattle, setNewBattle] = useState({
    date: "",
    time: "",
    regions: "",
    target: ""
  });

  // Live Battles Editor State (one entry per live battle)
  const [liveEdits, setLiveEdits] = useState(liveBattles);

  // New Timeline Event State
  const [newEvent, setNewEvent] = useState({
    date: "March 20",
    time: "",
    platform: "YouTube",
    event: ""
  });

  // New Region Form State
  const [newRegion, setNewRegion] = useState({
    country: "",
    region: "",
    hashtag: "",
    tz: "",
    spotifyReset: "",
    appleReset: "",
    gFormUrl: "",
    playlists: { spotify: [], appleMusic: [] }
  });

  // Structured Playlist State (6 slots)
  const [spotifyPlaylists, setSpotifyPlaylists] = useState(Array(6).fill({ name: "", url: "" }));
  const [applePlaylists, setApplePlaylists] = useState(Array(6).fill({ name: "", url: "" }));

  const [countrySearch, setCountrySearch] = useState("");
  const [showCountryDrop, setShowCountryDrop] = useState(false);

  useEffect(() => {
    setLiveEdits(liveBattles);
  }, [JSON.stringify(liveBattles)]);

  useEffect(() => {
    // Load tickets from localStorage
    const savedTickets = JSON.parse(localStorage.getItem("supportTickets") || "[]");
    setTickets(savedTickets);
  }, []);

  const handleClearAllTickets = () => {
    if (confirm("Are you sure you want to clear all tickets? This cannot be undone.")) {
      localStorage.removeItem("supportTickets");
      setTickets([]);
    }
  };

  const handleDeleteTicket = (id) => {
    if (confirm("Delete this ticket?")) {
      const updatedTickets = tickets.filter(t => t.id !== id);
      setTickets(updatedTickets);
      localStorage.setItem("supportTickets", JSON.stringify(updatedTickets));
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
      target: newBattle.target
    };

    addBattle(battleObj);
    setNewBattle({ date: "", time: "", regions: "", target: "" });
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
    setNewEvent({ date: "March 20", time: "", platform: "YouTube", event: "" });
  };

  const handleAddRegion = (e) => {
    e.preventDefault();
    if (!newRegion.country || !newRegion.region || !newRegion.hashtag) {
      toast.show("Please fill necessary fields (Country, Region, Hashtags)", "error");
      return;
    }

    // Filter out empty playlist slots
    const sList = spotifyPlaylists.filter(p => p.name.trim() && p.url.trim());
    const aList = applePlaylists.filter(p => p.name.trim() && p.url.trim());

    const regionObj = {
      ...newRegion,
      playlists: {
        spotify: sList,
        appleMusic: aList
      }
    };

    addRegion(regionObj);
    toast.show("Regional Info Saved! 💜", "success");
    
    // Reset Form
    setNewRegion({ country: "", region: "", hashtag: "", tz: "", spotifyReset: "", appleReset: "", gFormUrl: "", playlists: { spotify: [], appleMusic: [] } });
    setSpotifyPlaylists(Array(6).fill({ name: "", url: "" }));
    setApplePlaylists(Array(6).fill({ name: "", url: "" }));
    setCountrySearch("");
    setShowCountryDrop(false);
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

  const updatePlaylist = (index, field, value) => {
    const updated = [...spotifyPlaylists];
    updated[index] = { ...updated[index], [field]: value };
    setSpotifyPlaylists(updated);
  };

  const updateApplePlaylist = (index, field, value) => {
    const updated = [...applePlaylists];
    updated[index] = { ...updated[index], [field]: value };
    setApplePlaylists(updated);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <Header />
      
      <main className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16 py-12">
        <div className="sticky top-[68px] z-40 bg-[var(--bg-primary)]/80 backdrop-blur-md pb-6 mb-12 border-b border-[var(--accent)]/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <h1 className="text-4xl font-black text-[var(--accent)] tracking-tight">Admin Dashboard</h1>
          
          <div className="flex bg-[var(--accent)]/10 p-1 rounded-2xl border border-[var(--accent)]/20 overflow-x-auto no-scrollbar">
            <button 
              onClick={() => setActiveTab("tickets")}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === "tickets" ? "bg-[var(--accent)] text-white shadow-lg" : "opacity-60 hover:opacity-100"}`}
            >
              Support Tickets
            </button>
            <button 
              onClick={() => setActiveTab("battles")}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === "battles" ? "bg-[var(--accent)] text-white shadow-lg" : "opacity-60 hover:opacity-100"}`}
            >
              Battle Manager
            </button>
            <button 
              onClick={() => setActiveTab("timeline")}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === "timeline" ? "bg-[var(--accent)] text-white shadow-lg" : "opacity-60 hover:opacity-100"}`}
            >
              Timeline Manager
            </button>
            <button 
              onClick={() => setActiveTab("regions")}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === "regions" ? "bg-[var(--accent)] text-white shadow-lg" : "opacity-60 hover:opacity-100"}`}
            >
              Region Manager
            </button>
            <button 
              onClick={() => setActiveTab("mods")}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === "mods" ? "bg-[var(--accent)] text-white shadow-lg" : "opacity-60 hover:opacity-100"}`}
            >
              Mod Manager
            </button>
            <button 
              onClick={() => setActiveTab("global")}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === "global" ? "bg-[var(--accent)] text-white shadow-lg" : "opacity-60 hover:opacity-100"}`}
            >
              Global Config
            </button>
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

            {tickets.length === 0 ? (
              <div className="text-center py-24 opacity-40 border-2 border-dashed border-[var(--accent)]/10 rounded-3xl">
                <p className="text-xl italic">No support tickets found.</p>
              </div>
            ) : (
              <div className="bg-[var(--card-bg)]/40 backdrop-blur-xl border border-[var(--accent)]/40 rounded-3xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-[var(--accent)]/10 border-b border-[var(--accent)]/20">
                      <tr>
                        <th className="p-5 font-bold text-xs uppercase tracking-widest opacity-60">Date</th>
                        <th className="p-5 font-bold text-xs uppercase tracking-widest opacity-60">User ID</th>
                        <th className="p-5 font-bold text-xs uppercase tracking-widest opacity-60">Platform</th>
                        <th className="p-5 font-bold text-xs uppercase tracking-widest opacity-60">Query</th>
                        <th className="p-5 font-bold text-xs uppercase tracking-widest opacity-60 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--accent)]/10">
                      {tickets.map((ticket) => (
                        <tr key={ticket.id} className="hover:bg-[var(--accent)]/5 transition-colors group">
                          <td className="p-5 text-sm opacity-60">{ticket.timestamp}</td>
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
                    className="text-xs font-bold text-red-500 opacity-60 hover:opacity-100"
                  >
                    Reset to Default
                  </button>
                </div>

                <div className="grid gap-4">
                  {battles.map((battle) => (
                    <div key={battle.id} className="bg-[var(--card-bg)]/40 p-6 rounded-3xl border border-[var(--accent)]/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-lg font-black text-[var(--accent)]">{battle.date}</span>
                          <span className="text-xs opacity-50 font-bold uppercase tracking-widest">{battle.time} KST</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {battle.regions.map(r => (
                            <span key={r} className="text-[9px] px-2 py-0.5 bg-[var(--accent)]/10 text-[var(--accent)] rounded font-black uppercase">{r}</span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="text-xs opacity-40 uppercase font-black tracking-tighter">Target</div>
                          <div className="text-xl font-black">{battle.target}</div>
                        </div>
                        <button 
                          onClick={() => deleteBattle(battle.id)}
                          className="p-3 rounded-xl bg-red-500/10 text-red-500 sm:opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Sidebar: Editors */}
              <div className="flex flex-col gap-8 h-fit lg:sticky lg:top-12">
                
                {/* 1. Live Battles Editor — one card per battle */}
                {liveEdits.map((lb, i) => (
                  <div key={lb.id} className="bg-[var(--card-bg)]/80 backdrop-blur-2xl p-6 rounded-3xl border border-[var(--accent)]/40 shadow-xl">
                    <h3 className="text-sm font-black mb-3 uppercase tracking-tight text-[var(--accent)] flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                      Live Battle {i + 1}
                    </h3>
                    <div className="space-y-2">
                      <div>
                        <label className="text-[9px] font-black uppercase opacity-40 ml-1">Title</label>
                        <input
                          type="text"
                          value={lb.title}
                          onChange={(e) => {
                            const updated = [...liveEdits];
                            updated[i] = { ...updated[i], title: e.target.value };
                            setLiveEdits(updated);
                          }}
                          className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-2.5 rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-all"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[9px] font-black uppercase opacity-40 ml-1">Goal</label>
                          <input
                            type="text"
                            value={lb.goal}
                            onChange={(e) => {
                              const updated = [...liveEdits];
                              updated[i] = { ...updated[i], goal: e.target.value };
                              setLiveEdits(updated);
                            }}
                            className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-2.5 rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-all"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-black uppercase opacity-40 ml-1">Progress %</label>
                          <input
                            type="number" min="0" max="100"
                            value={lb.progress}
                            onChange={(e) => {
                              const updated = [...liveEdits];
                              updated[i] = { ...updated[i], progress: parseInt(e.target.value) || 0 };
                              setLiveEdits(updated);
                            }}
                            className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-2.5 rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-all"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-black uppercase opacity-40 ml-1">Status</label>
                          <select
                            value={lb.status}
                            onChange={(e) => {
                              const updated = [...liveEdits];
                              updated[i] = { ...updated[i], status: e.target.value };
                              setLiveEdits(updated);
                            }}
                            className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-2.5 rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-all appearance-none"
                          >
                            {["Surging", "On Track", "Heating Up", "Almost There"].map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => { updateLiveBattles(liveEdits); toast.show("All live battles updated! 💜", "success"); }}
                  className="w-full bg-[var(--accent)] text-white font-black py-3 rounded-xl text-xs shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  UPDATE ALL LIVE BATTLES
                </button>

                {/* 2. Add Battle History Form */}
                <div className="bg-[var(--card-bg)]/80 backdrop-blur-2xl p-6 rounded-3xl border border-[var(--accent)]/40 shadow-xl">
                  <h3 className="text-lg font-black mb-4 uppercase tracking-tight text-[var(--accent)]">Record History</h3>
                  <form onSubmit={handleAddBattle} className="space-y-3">
                    <div>
                      <label className="text-[9px] font-black uppercase opacity-40 ml-1">Date</label>
                      <input 
                        type="date" 
                        value={newBattle.date}
                        onChange={(e) => setNewBattle({...newBattle, date: e.target.value})}
                        className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-3 rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-all"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] font-black uppercase opacity-40 ml-1">Time (KST)</label>
                        <input 
                          type="text" 
                          placeholder="22:00"
                          value={newBattle.time}
                          onChange={(e) => setNewBattle({...newBattle, time: e.target.value})}
                          className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-3 rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black uppercase opacity-40 ml-1">Target</label>
                        <input 
                          type="text" 
                          placeholder="10M"
                          value={newBattle.target}
                          onChange={(e) => setNewBattle({...newBattle, target: e.target.value})}
                          className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-3 rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase opacity-40 ml-1">Regions</label>
                      <input 
                        type="text" 
                        placeholder="India, Korea, USA"
                        value={newBattle.regions}
                        onChange={(e) => setNewBattle({...newBattle, regions: e.target.value})}
                        className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-3 rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-all"
                      />
                    </div>
                    <button 
                      type="submit"
                      className="w-full border-2 border-[var(--accent)] text-[var(--accent)] font-black py-3 rounded-xl text-xs hover:bg-[var(--accent)] hover:text-white transition-all mt-2"
                    >
                      ADD TO HISTORY
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
                    className="text-xs font-bold text-red-500 opacity-60 hover:opacity-100"
                  >
                    Reset to Default
                  </button>
                </div>

                <div className="space-y-4">
                  {events.map((ev) => (
                    <div key={ev.id} className="bg-[var(--card-bg)]/40 p-5 rounded-3xl border border-[var(--accent)]/20 flex justify-between items-center group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-[var(--accent)]/10 flex flex-col items-center justify-center">
                          <span className="text-[10px] font-black uppercase text-[var(--accent)] leading-none">{ev.date.split(" ")[0]}</span>
                          <span className="text-sm font-black text-[var(--accent)]">{ev.date.split(" ")[1]}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-bold">{ev.time} KST</span>
                            <span className="text-[9px] px-2 py-0.5 bg-[var(--accent)]/20 rounded font-black uppercase tracking-widest">{ev.platform}</span>
                          </div>
                          <p className="text-sm opacity-80 font-medium">{ev.event}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => deleteEvent(ev.id)}
                        className="p-2 text-red-500 sm:opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      </button>
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
                    <select 
                      value={newEvent.date}
                      onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                      className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-3 rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-all appearance-none"
                    >
                      {["March 20", "March 21", "March 22", "March 23", "March 24", "March 25", "March 26", "March 27"].map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-black uppercase opacity-40 ml-1">Time (KST)</label>
                      <input 
                        type="text" 
                        placeholder="13:00"
                        value={newEvent.time}
                        onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
                        className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-3 rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase opacity-40 ml-1">Platform</label>
                      <input 
                        type="text" 
                        placeholder="YouTube"
                        value={newEvent.platform}
                        onChange={(e) => setNewEvent({...newEvent, platform: e.target.value})}
                        className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-3 rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase opacity-40 ml-1">Event Description</label>
                    <textarea 
                      placeholder="Official MV Release..."
                      value={newEvent.event}
                      onChange={(e) => setNewEvent({...newEvent, event: e.target.value})}
                      className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-3 rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-all h-24 resize-none"
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
                    className="text-xs font-bold text-red-500 opacity-60 hover:opacity-100"
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
                            <span className="text-2xl font-black">{r.country}</span>
                            <span className="text-[10px] px-2 py-0.5 bg-[var(--accent)]/20 text-[var(--accent)] rounded font-black uppercase">{r.region}</span>
                          </div>
                          <p className="text-xs font-mono text-[var(--accent)] opacity-60">{r.hashtag}</p>
                        </div>
                        <button 
                          onClick={() => deleteRegion(r.country)}
                          className="p-2 text-red-500 sm:opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                        <div className="bg-black/10 p-3 rounded-xl">
                          <span className="text-[9px] uppercase font-black opacity-40 block mb-1">Timezone</span>
                          <span className="font-bold">{r.tz || "UTC"}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-black/10 p-3 rounded-xl">
                            <span className="text-[9px] uppercase font-black opacity-40 block mb-1">Spotify Reset</span>
                            <span className="font-bold">{r.spotifyReset}</span>
                          </div>
                          <div className="bg-black/10 p-3 rounded-xl">
                            <span className="text-[9px] uppercase font-black opacity-40 block mb-1">Apple Reset</span>
                            <span className="font-bold">{r.appleReset || "N/A"}</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                        <div>
                          <span className="text-[9px] uppercase font-black opacity-40 block mb-2">Spotify Playlists</span>
                          <div className="flex flex-wrap gap-1">
                            {r.playlists.spotify?.map((p, i) => (
                              <span key={i} className="text-[8px] px-2 py-1 bg-green-500/10 text-green-500 rounded-full font-bold">{p.name}</span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase font-black opacity-40 block mb-2">Apple Playlists</span>
                          <div className="flex flex-wrap gap-1">
                            {r.playlists.appleMusic?.map((p, i) => (
                              <span key={i} className="text-[8px] px-2 py-1 bg-red-500/10 text-red-500 rounded-full font-bold">{p.name}</span>
                            ))}
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
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <label className="text-[9px] font-black uppercase opacity-40 ml-1">Country</label>
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
                        className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-3 rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-all"
                      />
                      {showCountryDrop && (
                        <div className="absolute top-full left-0 w-full mt-1 bg-[var(--card-bg)]/90 backdrop-blur-xl border border-[var(--accent)]/20 rounded-xl max-h-40 overflow-y-auto z-[60] shadow-2xl">
                          {COUNTRIES.filter(c => c.toLowerCase().includes(countrySearch.toLowerCase())).map(c => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => handleCountrySelect(c)}
                              className="w-full text-left px-4 py-2 text-xs hover:bg-[var(--accent)] hover:text-black transition-all"
                            >
                              {c}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase opacity-40 ml-1">Region</label>
                      <input 
                        type="text" 
                        placeholder="South Asia"
                        value={newRegion.region}
                        onChange={(e) => handlePresetChange(e.target.value)}
                        className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-3 rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-all"
                        list="region-presets"
                      />
                      <datalist id="region-presets">
                        {Object.keys(COUNTRY_PRESETS).map(r => <option key={r} value={r} />)}
                      </datalist>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-black uppercase opacity-40 ml-1">Hashtags</label>
                      <input 
                        type="text" 
                        placeholder="#BTS_India #SouthAsia_Stream"
                        value={newRegion.hashtag}
                        onChange={(e) => setNewRegion({...newRegion, hashtag: e.target.value})}
                        className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-3 rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase opacity-40 ml-1">Timezone (IANA)</label>
                      <input 
                        type="text" 
                        placeholder="Asia/Kolkata"
                        value={newRegion.tz}
                        onChange={(e) => setNewRegion({...newRegion, tz: e.target.value})}
                        className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-3 rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-all"
                      />
                    </div>
                  </div>
                   <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-black uppercase opacity-40 ml-1">Spotify Reset</label>
                      <input 
                        type="text" 
                        placeholder="12:30 AM IST"
                        value={newRegion.spotifyReset}
                        onChange={(e) => setNewRegion({...newRegion, spotifyReset: e.target.value})}
                        className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-3 rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase opacity-40 ml-1">Apple Reset</label>
                      <input 
                        type="text" 
                        placeholder="1:30 AM IST"
                        value={newRegion.appleReset}
                        onChange={(e) => setNewRegion({...newRegion, appleReset: e.target.value})}
                        className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-3 rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] font-black uppercase opacity-40 ml-1">Google Form URL</label>
                    <input 
                      type="text" 
                      placeholder="https://forms.gle/..."
                      value={newRegion.gFormUrl}
                      onChange={(e) => setNewRegion({...newRegion, gFormUrl: e.target.value})}
                      className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-3 rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-all"
                    />
                  </div>
                  
                   <div className="grid grid-cols-1 gap-8 border-t border-white/5 pt-6">
                    <div>
                      <label className="text-[9px] font-black uppercase opacity-40 ml-1 block mb-3">Spotify Playlists (Max 6)</label>
                      <div className="space-y-2">
                        {spotifyPlaylists.map((p, i) => (
                          <div key={i} className="flex gap-2">
                            <input 
                              type="text" 
                              placeholder={`Name #${i+1}`}
                              value={p.name}
                              onChange={(e) => updatePlaylist(i, "name", e.target.value)}
                              className="flex-[2] bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-2 rounded-lg text-[10px] focus:outline-none focus:border-[var(--accent)] transition-all"
                            />
                            <input 
                              type="text" 
                              placeholder="URL"
                              value={p.url}
                              onChange={(e) => updatePlaylist(i, "url", e.target.value)}
                              className="flex-[3] bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-2 rounded-lg text-[10px] focus:outline-none focus:border-[var(--accent)] transition-all"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase opacity-40 ml-1 block mb-3">Apple Playlists (Max 6)</label>
                      <div className="space-y-2">
                        {applePlaylists.map((p, i) => (
                          <div key={i} className="flex gap-2">
                            <input 
                              type="text" 
                              placeholder={`Name #${i+1}`}
                              value={p.name}
                              onChange={(e) => updateApplePlaylist(i, "name", e.target.value)}
                              className="flex-[2] bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-2 rounded-lg text-[10px] focus:outline-none focus:border-[var(--accent)] transition-all"
                            />
                            <input 
                              type="text" 
                              placeholder="URL"
                              value={p.url}
                              onChange={(e) => updateApplePlaylist(i, "url", e.target.value)}
                              className="flex-[3] bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-2 rounded-lg text-[10px] focus:outline-none focus:border-[var(--accent)] transition-all"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-[var(--accent)] text-white font-black py-4 rounded-xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    SAVE REGIONAL INFO
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
        {activeTab === "global" && (
          <GlobalConfigSection 
            regions={regions} 
            mods={mods} 
            battles={battles}
            liveBattles={liveBattles}
            timeline={events}
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
  const [localLinks, setLocalLinks] = useState({ ...mod.links });
  const [hasChanges, setHasChanges] = useState(false);

  // Sync with prop changes (e.g., after a reset)
  useEffect(() => {
    setLocalName(mod.name);
    setLocalLinks({ ...mod.links });
    setHasChanges(false);
  }, [mod.name, mod.links]);

  const handleSave = () => {
    onUpdate(mod.id, localName, localLinks);
    setHasChanges(false);
    toast.show(`Changes saved for ${localName}! 💜`, "success");
  };

  return (
    <div className="bg-[var(--card-bg)]/40 p-6 rounded-3xl border border-[var(--accent)]/20 flex flex-col gap-4">
      <div className="flex justify-between items-start">
        <div>
          <input 
            type="text"
            value={localName}
            onChange={(e) => { setLocalName(e.target.value); setHasChanges(true); }}
            className="bg-transparent border-b border-[var(--accent)]/20 font-bold text-lg focus:outline-none focus:border-[var(--accent)] transition-all w-full"
          />
          <p className="text-[9px] uppercase font-black opacity-40 mt-1">Mod Identity</p>
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

      <div className="space-y-2 border-t border-white/5 pt-4">
        <p className="text-[9px] uppercase font-black opacity-40 mb-2">Social Links</p>
        {Object.keys(localLinks).map((platform) => (
          <div key={platform} className="flex items-center gap-2">
            <span className="w-16 text-[10px] font-bold opacity-60 uppercase">{platform}</span>
            <input 
              type="text"
              value={localLinks[platform]}
              onChange={(e) => {
                setLocalLinks({ ...localLinks, [platform]: e.target.value });
                setHasChanges(true);
              }}
              className="flex-1 bg-black/10 border border-white/5 p-1.5 rounded-lg text-[10px] focus:outline-none focus:border-[var(--accent)] transition-all"
            />
          </div>
        ))}
      </div>

      <button 
        onClick={handleSave}
        disabled={!hasChanges}
        className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase transition-all border-2
          ${hasChanges 
            ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white" 
            : "border-white/5 text-white/20 cursor-not-allowed opacity-50"}
        `}
      >
        {hasChanges ? "Save Changes 💜" : "All Changes Saved"}
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
          className="text-xs font-bold text-red-500 opacity-60 hover:opacity-100"
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

function GlobalConfigSection({ regions, mods, battles, liveBattles, timeline, toast }) {
  const config = JSON.stringify({ regions, mods, battles, liveBattles, timeline }, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(config);
    toast.show("JSON Config copied to clipboard! 📋💜", "success");
  };

  return (
    <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold">Global Configuration</h2>
          <p className="text-xs opacity-50 mt-1">Copy this JSON and host it as a GitHub Gist to push updates to all users.</p>
        </div>
        <button 
          onClick={handleCopy}
          className="bg-[var(--accent)] text-white font-black px-6 py-2 rounded-xl shadow-lg hover:scale-[1.05] transition-all flex items-center gap-2"
        >
          <span>📋</span> COPY JSON
        </button>
      </div>

      <div className="bg-black/40 p-6 rounded-3xl border border-[var(--accent)]/20 shadow-2xl">
        <pre className="text-[10px] md:text-sm font-mono overflow-x-auto max-h-[500px] overflow-y-auto whitespace-pre-wrap text-[var(--accent)]/80">
          {config}
        </pre>
      </div>
    </section>
  );
}

export default AdminPanel;
