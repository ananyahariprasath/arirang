import { useState } from "react";
import ContactSupport from "../section-2/ContactSupport";

function SupportDrawer({ onClose }) {
  return (
    <div className="w-[100vw] max-w-[400px] sm:w-[480px] h-full bg-[var(--bg-primary)] border-l border-[var(--accent)]/20 shadow-[-20px_0_50px_rgba(0,0,0,0.3)] overflow-y-auto p-6 sm:p-8 flex flex-col pt-24 lg:pt-28">
      <div className="flex justify-between items-center mb-10">
        <div>
          <p className="text-sm opacity-50">How can we help you today?</p>
        </div>
        <button 
          onClick={onClose}
          className="p-3 rounded-xl hover:bg-[var(--accent)]/10 transition-colors border border-transparent hover:border-[var(--accent)]/20"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      
      <div className="flex-1">
        <ContactSupport isInsideDrawer={true} />
      </div>
    </div>
  );
}

export default SupportDrawer;
