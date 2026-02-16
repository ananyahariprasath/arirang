import { useState } from "react";
import ContactSupport from "../section-2/ContactSupport";

function SupportDrawer() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90] transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer Container */}
      <div 
        className={`fixed top-0 right-0 h-full z-[100] transform flex items-center will-change-transform
          transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
          ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Handle Tab */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`absolute left-0 -translate-x-full h-36 w-10 
            bg-[var(--accent)] text-white font-bold rounded-l-2xl shadow-[-10px_0_20px_rgba(0,0,0,0.2)]
            flex items-center justify-center transition-all duration-300
            hover:w-12 hover:bg-[var(--accent)] group
            ${!isOpen && "animate-tab-glow"}
          `}
          style={{ 
            writingMode: 'vertical-rl', 
            textOrientation: 'mixed'
          }}
        >
          <span className="transform rotate-180 tracking-[0.2em] uppercase text-xs font-black">
            Support
          </span>
        </button>

        {/* Drawer Content */}
        <div className="w-[400px] sm:w-[480px] h-full bg-[var(--bg-primary)] border-l border-[var(--accent)]/20 shadow-[-20px_0_50px_rgba(0,0,0,0.3)] overflow-y-auto p-8 flex flex-col pt-24 lg:pt-28">
          <div className="flex justify-between items-center mb-10">
            <div>
              {/* <h2 className="text-3xl font-black text-[var(--accent)] tracking-tight">Support</h2> */}
              <p className="text-sm opacity-50">How can we help you today?</p>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-3 rounded-xl hover:bg-[var(--accent)]/10 transition-colors border border-transparent hover:border-[var(--accent)]/20"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          
          <div className="flex-1">
            <ContactSupport isInsideDrawer={true} />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes tabGlow {
          0%, 100% { box-shadow: -5px 0 15px rgba(var(--accent-rgb, 106, 13, 173), 0.3); }
          50% { box-shadow: -10px 0 25px rgba(var(--accent-rgb, 106, 13, 173), 0.5); }
        }
        .animate-tab-glow {
          animation: tabGlow 2s infinite ease-in-out;
        }
      `}</style>
    </>
  );
}

export default SupportDrawer;
