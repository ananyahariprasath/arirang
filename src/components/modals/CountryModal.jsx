import { useState } from "react";
import useRegionalData, { GLOBAL_DEFAULT } from "../../hooks/useRegionalData";
import { COUNTRY_PRESETS, COUNTRY_REGION_MAP, COUNTRY_TZ_MAP } from "../../constants";
import { formatResetTime } from "../../utils/time";

function CountryModal({ selectedCountry, onClose }) {
  const [activePlatform, setActivePlatform] = useState("spotify");
  const { regions } = useRegionalData();

  // 1. Try to find explicitly recorded data first (from dynamic source)
  const recordedData = regions.find(r => r.country === selectedCountry);

  // 2. Fallback to hardcoded constants for region, timezone, and reset times
  const mappedRegion = COUNTRY_REGION_MAP[selectedCountry] || "Global";
  const preset = COUNTRY_PRESETS[selectedCountry] || COUNTRY_PRESETS[mappedRegion] || COUNTRY_PRESETS["Global"] || {};
  const countryTz = COUNTRY_TZ_MAP[selectedCountry] || preset.tz || "UTC";

  const data = recordedData || {
    country: selectedCountry,
    region: mappedRegion,
    tz: countryTz,
    spotifyReset: preset.s || "12:00 AM",
    hashtag: "#BTS_" + selectedCountry.replace(/\s+/g, "_") + " #StreamingParty",
    playlists: GLOBAL_DEFAULT.playlists,
    gFormUrl: GLOBAL_DEFAULT.gFormUrl
  };

  const currentPlaylists = data.playlists[activePlatform === "spotify" ? "spotify" : "appleMusic"] || [];

  return (
    <div className="fixed inset-0 z-[100] flex justify-center items-start md:items-center bg-black/40 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200">
      
      {/* Container */}
      <div className="bg-[var(--card-bg)]
                      backdrop-blur-xl
                      border border-[var(--accent)]/30
                      text-[var(--text-primary)]
                      w-full max-w-2xl
                      rounded-3xl p-6 md:p-8 shadow-2xl relative
                      my-auto
                      animate-in zoom-in-95 duration-200">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center text-2xl opacity-40 hover:opacity-100 transition-all active:scale-95 duration-200 z-[110]"
          aria-label="Close modal"
        >
          ✕
        </button>

        {/* Header Section */}
        <div className="mb-8 pl-1">
          <p className="text-[var(--accent)] font-black uppercase tracking-[0.2em] text-[10px] mb-2 opacity-80">Region Information</p>
          <h2 className="text-3xl md:text-4xl font-black tracking-tighter flex items-center gap-3 flex-wrap">
            <span>{data.region}</span>
            <span className="text-[var(--accent)] mx-1">/</span>
            <span className="opacity-60">{selectedCountry}</span>
          </h2>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-[var(--bg-secondary)]/50 border border-[var(--accent)]/10 rounded-2xl p-4">
            <p className="text-[10px] uppercase font-bold text-[var(--text-primary)] opacity-60 mb-1">Hashtag</p>
            <p className="text-sm font-mono font-bold text-[var(--accent)] dark:text-[var(--lavender)] break-words leading-relaxed">{data.hashtag}</p>
          </div>
          <div className="bg-[var(--bg-secondary)]/50 border border-[var(--accent)]/10 rounded-2xl p-4">
            <p className="text-[10px] uppercase font-bold text-[var(--text-primary)] opacity-60 mb-1">Spotify Reset</p>
            <p className="text-sm font-black tracking-tight">{formatResetTime(data.spotifyReset, data.tz)}</p>
          </div>
          {/* Apple Music Reset is hidden as per user request */}
        </div>

        {/* Platform Selector */}
        <div className="flex items-center justify-between mb-4 px-1">
          <h3 className="font-black text-xs uppercase tracking-widest text-[var(--text-primary)] opacity-80">Focus Playlists</h3>
          <div className="flex bg-[var(--bg-secondary)] p-1 rounded-xl border border-white/5 shadow-inner">
            <button 
              onClick={() => setActivePlatform("spotify")}
              className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activePlatform === "spotify" ? "bg-[#1DB954] text-black shadow-lg" : "opacity-40 hover:opacity-100"}`}
            >
              Spotify
            </button>
            <button 
              onClick={() => setActivePlatform("apple")}
              className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activePlatform === "apple" ? "bg-[#FA2D48] text-white shadow-lg" : "opacity-40 hover:opacity-100"}`}
            >
              Apple Music
            </button>
          </div>
        </div>

        {/* Playlist Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
          {currentPlaylists.map((pl, idx) => (
            <a
              key={idx}
              href={pl.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`group bg-[var(--bg-secondary)]/40 border border-[var(--accent)]/10 hover:border-transparent 
                         rounded-xl p-3.5 flex items-center justify-between transition-all duration-300
                         ${activePlatform === "spotify" ? "hover:bg-[#1DB954]" : "hover:bg-[#FA2D48]"}`}
            >
              <span className={`text-[11px] font-bold transition-colors ${activePlatform === "spotify" ? "group-hover:text-black" : "group-hover:text-white"}`}>{pl.name}</span>
              <svg className={`opacity-30 group-hover:opacity-100 transition-all transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${activePlatform === "spotify" ? "group-hover:text-black" : "group-hover:text-white"}`} 
                   width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="7" y1="17" x2="17" y2="7"></line>
                <polyline points="7 7 17 7 17 17"></polyline>
              </svg>
            </a>
          ))}
        </div>

        {/* Footer Section */}
        <div className="flex flex-col sm:flex-row items-center gap-4 border-t border-[var(--accent)]/10 pt-6">
          <div className="flex-1">
            <p className="text-[10px] text-[var(--text-primary)] opacity-50 italic uppercase tracking-wider">
              * ARIRANG will be updated to the playlist after the album's release.
              <br />
              * Please use the playlists above to stream and support.
            </p>
          </div>
          <a
            href={data.gFormUrl || "https://google.com/forms/example"} 
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-fit px-8 py-4 rounded-2xl bg-[var(--accent)] text-black dark:text-black font-black uppercase text-xs tracking-[0.1em] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-[var(--accent)]/20 text-center"
          >
            Submit Proof 💜
          </a>
        </div>

      </div>
    </div>
  );
}

export default CountryModal;
