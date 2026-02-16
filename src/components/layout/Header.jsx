import { useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import HelpDeskModal from "../modals/HelpDeskModal";


function Header() {
  const { toggleTheme, theme } = useTheme();
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[var(--bg-primary)]/80 border-b border-[var(--accent)] transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-4 relative flex items-center justify-between">

          {/* Left Spacer / Logo Container */}
          <div className="flex-shrink-0">
            <img
              src="/logo.svg"
              alt="Logo"
              className="w-8 h-8 md:w-10 md:h-10 object-contain"
            />
          </div>

          {/* Center Project Name */}
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-sm sm:text-lg md:text-2xl font-bold tracking-widest text-center whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px] sm:max-w-xs md:max-w-md">
            ARIRARIRANG!!
          </div>

          {/* Right Section - Desktop */}
          <div className="hidden md:flex items-center gap-4">
            {/* Toggle Switch */}
            <button
              onClick={toggleTheme}
              className="relative w-14 h-7 flex items-center rounded-full bg-[var(--accent)] transition-colors duration-300 flex-shrink-0"
            >
              <span
                className={`absolute left-1 top-1 w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300 flex items-center justify-center text-xs
                ${theme === "dark" ? "translate-x-7" : ""}
              `}
              >
                {theme === "light" ? "☀️" : "🌙"}
              </span>
            </button>

            {/* Help Desk Button */}
            <button
              onClick={() => setIsHelpOpen(true)}
              className="px-5 py-2 text-sm rounded-2xl
               bg-[var(--card-bg)]/40 backdrop-blur-xl
               border border-[var(--accent)]/40
               hover:bg-[var(--accent)]/10
               transition-all duration-300 whitespace-nowrap"
            >
              Help Desk
            </button>
          </div>

          {/* Right Section - Mobile Hamburger */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-[var(--text-primary)] focus:outline-none"
            >
              {isMenuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-[var(--bg-primary)]/95 backdrop-blur-xl border-b border-[var(--accent)] shadow-lg animate-in fade-in slide-in-from-top-5 duration-200">
            <div className="px-4 py-4 space-y-4 flex flex-col items-center">
              
              {/* Mobile Toggle Switch */}
              <div className="flex items-center justify-between w-full max-w-xs px-4">
                <span className="text-sm font-medium">Theme</span>
                <button
                  onClick={toggleTheme}
                  className="relative w-12 h-6 flex items-center rounded-full bg-[var(--accent)] transition-colors duration-300 flex-shrink-0"
                >
                  <span
                    className={`absolute left-1 top-1 w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-300 flex items-center justify-center text-[10px]
                    ${theme === "dark" ? "translate-x-6" : ""}
                  `}
                  >
                    {theme === "light" ? "☀️" : "🌙"}
                  </span>
                </button>
              </div>

              {/* Mobile Help Desk Button */}
              <button
                onClick={() => {
                  setIsHelpOpen(true);
                  setIsMenuOpen(false);
                }}
                className="w-full max-w-xs px-5 py-3 text-sm rounded-xl
                 bg-[var(--card-bg)]/60 
                 border border-[var(--accent)]/40
                 hover:bg-[var(--accent)]/10
                 transition-all duration-300"
              >
                Help Desk
              </button>
            </div>
          </div>
        )}
      </header>

      <HelpDeskModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </>
  );
}

export default Header;
