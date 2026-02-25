import useTimeline from "../../hooks/useTimeline";

function Timeline() {
  const { events } = useTimeline();

  // Helper to color markers based on platform
  const getPlatformStyle = (platform) => {
    const p = platform.toLowerCase();
    if (p.includes("youtube")) return "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]";
    if (p.includes("spotify")) return "bg-[#1DB954] shadow-[0_0_10px_rgba(29,185,84,0.5)]";
    if (p.includes("apple")) return "bg-[#FA2D48] shadow-[0_0_10px_rgba(250,45,72,0.5)]";
    if (p.includes("weverse")) return "bg-[#27D1D1] shadow-[0_0_10px_rgba(39,209,209,0.5)]";
    return "bg-[var(--accent)] shadow-[0_0_10px_rgba(var(--accent-rgb),0.5)]";
  };

  return (
    <div className="bg-[var(--card-bg)]/40 backdrop-blur-xl border border-[var(--accent)]/40 rounded-3xl p-4 md:p-6 shadow-2xl text-[var(--text-primary)] h-full flex flex-col overflow-hidden">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-[var(--accent)] tracking-tighter">DAILY TARGET TIMELINE</h2>
          <p className="text-[9px] uppercase tracking-widest font-black opacity-30">Streaming Timeline</p>
        </div>
        {/* <div className="hidden sm:flex gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
            <span className="text-[9px] font-bold opacity-60">YT</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#1DB954]"></div>
            <span className="text-[9px] font-bold opacity-60">SP</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#FA2D48]"></div>
            <span className="text-[9px] font-bold opacity-60">AM</span>
          </div>
        </div> */}
      </div>

      <div className="relative flex-1 overflow-y-auto no-scrollbar pr-2">
        {/* The Vertical Line */}
        <div className="absolute left-4 md:left-6 top-2 bottom-2 w-0.5 bg-gradient-to-b from-[var(--accent)]/50 via-[var(--accent)]/20 to-transparent"></div>

        <div className="space-y-6 relative">
          {events.length === 0 ? (
            <div className="pl-12 py-20 opacity-40 italic text-sm">
              No events scheduled yet.
            </div>
          ) : (
            events.map((ev, index) => (
              <div key={ev.id} className="relative pl-10 md:pl-16 animate-in fade-in slide-in-from-left-4 duration-500" style={{ animationDelay: `${index * 100}ms` }}>
                
                {/* Marker Dot */}
                <div className={`absolute left-[15.5px] md:left-[23.5px] -translate-x-1/2 w-2.5 h-2.5 rounded-full border-2 border-[var(--bg-primary)] z-10 ${getPlatformStyle(ev.platform)}`}></div>
                
                {/* Content Card */}
                <div className="group">
                  <div className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-2 mb-0.5">
                    <span className="text-base font-black text-[var(--accent)] leading-none">{ev.date}</span>
                    <span className="text-[10px] font-black opacity-50 uppercase tracking-tighter">{ev.time} KST</span>
                  </div>
                  
                  <div className="bg-[var(--accent)]/5 border border-[var(--accent)]/10 rounded-xl p-3 px-4 transition-all group-hover:bg-[var(--accent)]/10 group-hover:border-[var(--accent)]/30 group-hover:-translate-y-0.5">
                    <div className="flex justify-between items-start gap-4">
                      <p className="text-xs md:text-sm font-bold leading-tight opacity-90 whitespace-pre-line">{ev.event}</p>
                      <span className="text-[8px] px-1.5 py-0.5 bg-[var(--accent)]/10 text-[var(--accent)] rounded font-black uppercase tracking-widest whitespace-nowrap">
                        {ev.platform}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}

export default Timeline;
