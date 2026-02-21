import { useState } from "react";

function VerticalTabs({ onToggleSection }) {
  return (
    <div className="hidden lg:flex fixed right-0 top-1/2 -translate-y-1/2 z-[100] flex-col gap-4">
      {/* Recent Battles Tab */}
      <button
        onClick={() => onToggleSection('recent-battles')}
        className="w-12 h-40 bg-[var(--accent)] text-white font-black rounded-l-2xl shadow-[-5px_0_15px_rgba(0,0,0,0.3)]
                   flex items-center justify-center transition-all duration-300 hover:w-14 group overflow-hidden"
        style={{
          writingMode: "vertical-rl",
          textOrientation: "mixed",
        }}
      >
        <span className="tracking-[0.2em] uppercase text-xs">
          Recent Battles
        </span>
      </button>

      {/* Contact Tab */}
      <button
        onClick={() => onToggleSection('contact')}
        className="w-12 h-40 bg-[var(--card-bg)]/80 backdrop-blur-xl border-l border-y border-[var(--accent)]/40 
                   text-[var(--text-primary)] font-black rounded-l-2xl shadow-[-5px_0_15px_rgba(0,0,0,0.2)]
                   flex items-center justify-center transition-all duration-300 hover:w-14 group overflow-hidden"
        style={{
          writingMode: "vertical-rl",
          textOrientation: "mixed",
        }}
      >
        <span className="tracking-[0.2em] uppercase text-xs">
          Contact
        </span>
      </button>
    </div>
  );
}

export default VerticalTabs;
