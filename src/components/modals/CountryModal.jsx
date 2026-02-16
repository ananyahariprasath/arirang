import { useState } from "react";
import useRegionalData, { GLOBAL_DEFAULT } from "../../hooks/useRegionalData";

function CountryModal({ selectedCountry, onClose }) {
  const [activePlatform, setActivePlatform] = useState("spotify");
  const { regions } = useRegionalData();

  // Get data for selected country or fallback to default
  const data = regions.find(r => r.country === selectedCountry) || GLOBAL_DEFAULT;
  const currentPlaylists = data.playlists[activePlatform] || [];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      
      {/* Container */}
      <div className="bg-[var(--card-bg)]/40
                      backdrop-blur-2xl
                      border border-[var(--accent)]/40
                      text-[var(--text-primary)]
                      w-full max-w-2xl
                      rounded-3xl p-6 md:p-8 shadow-2xl relative
                      animate-in zoom-in-95 duration-300">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-2xl opacity-50 hover:opacity-100 transition-opacity hover:rotate-90 duration-300"
        >
          ✕
        </button>

        {/* Header Section */}
        <div className="mb-8 pl-1">
          <p className="text-[var(--accent)] font-black uppercase tracking-[0.2em] text-[10px] mb-1">Region Information</p>
          <h2 className="text-3xl md:text-4xl font-black tracking-tighter">
            {data.region} <span className="text-[var(--accent)]">/</span> <span className="opacity-40">{selectedCountry}</span>
          </h2>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <p className="text-[10px] uppercase font-bold opacity-40 mb-1">Hashtag</p>
            <p className="text-sm font-mono text-[var(--accent)] break-words">{data.hashtag}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <p className="text-[10px] uppercase font-bold opacity-40 mb-1">Spotify Reset</p>
            <p className="text-sm font-bold tracking-tight">{data.spotifyReset}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <p className="text-[10px] uppercase font-bold opacity-40 mb-1">Apple Music Reset</p>
            <p className="text-sm font-bold tracking-tight">{data.appleReset}</p>
          </div>
        </div>

        {/* Platform Selector */}
        <div className="flex items-center justify-between mb-4 px-1">
          <h3 className="font-black text-xs uppercase tracking-widest opacity-60">Focus Playlists</h3>
          <div className="flex bg-black/20 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => setActivePlatform("spotify")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activePlatform === "spotify" 
                ? "bg-[#1DB954] text-black shadow-lg shadow-[#1DB954]/20" 
                : "opacity-40 hover:opacity-100"
              }`}
            >
              Spotify
            </button>
            <button
              onClick={() => setActivePlatform("appleMusic")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activePlatform === "appleMusic" 
                ? "bg-[#FA2D48] text-white shadow-lg shadow-[#FA2D48]/20" 
                : "opacity-40 hover:opacity-100"
              }`}
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
              className="group bg-white/5 hover:bg-[var(--accent)] border border-white/10 hover:border-transparent 
                         rounded-xl p-3.5 flex items-center justify-between transition-all duration-300"
            >
              <span className="text-xs font-bold group-hover:text-black transition-colors">{pl.name}</span>
              <svg className="opacity-30 group-hover:opacity-100 group-hover:text-black transition-all transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" 
                   width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="7" y1="17" x2="17" y2="7"></line>
                <polyline points="7 7 17 7 17 17"></polyline>
              </svg>
            </a>
          ))}
        </div>

        {/* Footer Section */}
        <div className="flex flex-col sm:flex-row items-center gap-4 border-t border-white/10 pt-6">
          <div className="flex-1">
            <p className="text-[10px] opacity-40 italic">
              * Please use the playlists above to stream and support.
            </p>
          </div>
          <a
            href={data.gFormUrl || "https://google.com/forms/example"} 
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-fit px-8 py-3.5 rounded-2xl bg-[var(--accent)] text-black font-black uppercase text-xs tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-[var(--accent)]/20 text-center"
          >
            Submit Proof 💜
          </a>
        </div>

      </div>
    </div>
  );
}

export default CountryModal;
