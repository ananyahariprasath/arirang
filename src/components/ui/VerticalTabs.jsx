function IconRecent({ className = "w-4 h-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" className={className} aria-hidden="true">
      <path d="M12 8v5l3 3" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

function IconSupport({ className = "w-4 h-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" className={className} aria-hidden="true">
      <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" />
      <path d="M4.5 7l7.5 6 7.5-6" />
    </svg>
  );
}

function IconTop({ className = "w-4 h-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" className={className} aria-hidden="true">
      <path d="M8 21h8" />
      <path d="M12 17v4" />
      <path d="M7 4h10v4a5 5 0 0 1-10 0z" />
    </svg>
  );
}

function IconButton({ onClick, label, children, className = "" }) {
  return (
    <button
      onClick={onClick}
      className={`group relative w-10 h-10 lg:w-11 lg:h-11 rounded-xl flex items-center justify-center transition-all duration-300 border ${className}`}
      aria-label={label}
      title={label}
    >
      {children}
      <span className="pointer-events-none absolute right-full mr-2 px-2 py-1 rounded-lg bg-[var(--card-bg)] border border-[var(--accent)]/20 text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
        {label}
      </span>
    </button>
  );
}

function VerticalTabs({ onToggleSection }) {
  return (
    <div className="hidden sm:flex fixed right-1.5 md:right-2 lg:right-3 top-1/2 -translate-y-1/2 z-[120] flex-col gap-1.5 md:gap-2 lg:gap-2.5">
      <IconButton
        onClick={() => onToggleSection("top-achievers")}
        label="Top 10"
        className="bg-[var(--card-bg)]/80 backdrop-blur-xl border-[var(--accent)]/30 hover:bg-[var(--accent)]/10"
      >
        <IconTop className="w-5 h-5" />
      </IconButton>

      <IconButton
        onClick={() => onToggleSection("recent-battles")}
        label="Recent Battles"
        className="bg-[var(--card-bg)]/80 backdrop-blur-xl border-[var(--accent)]/30 hover:bg-[var(--accent)]/10"
      >
        <IconRecent className="w-5 h-5" />
      </IconButton>

      <IconButton
        onClick={() => onToggleSection("contact")}
        label="Support"
        className="bg-[var(--accent)] text-white border-[var(--accent)] hover:brightness-110"
      >
        <IconSupport className="w-5 h-5" />
      </IconButton>
    </div>
  );
}

export default VerticalTabs;
