import { useState } from "react";

function LanguageDropdown() {
  const [selectedLanguage, setSelectedLanguage] = useState("Select your preferred Language");
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const languages = [
    { name: "English", url: "https://youtube.com/watch?v=english_vid" },
    { name: "Korean", url: "https://youtube.com/watch?v=korean_vid" },
    { name: "Japanese", url: "https://youtube.com/watch?v=japanese_vid" },
    { name: "Spanish", url: "https://youtube.com/watch?v=spanish_vid" },
    { name: "French", url: "https://youtube.com/watch?v=french_vid" },
    { name: "German", url: "https://youtube.com/watch?v=german_vid" },
    { name: "Portuguese", url: "https://youtube.com/watch?v=portuguese_vid" },
    { name: "Italian", url: "https://youtube.com/watch?v=italian_vid" },
    { name: "Russian", url: "https://youtube.com/watch?v=russian_vid" },
    { name: "Chinese", url: "https://youtube.com/watch?v=chinese_vid" },
    { name: "Arabic", url: "https://youtube.com/watch?v=arabic_vid" },
    { name: "Hindi", url: "https://youtube.com/watch?v=hindi_vid" },
    { name: "Turkish", url: "https://youtube.com/watch?v=turkish_vid" },
    { name: "Vietnamese", url: "https://youtube.com/watch?v=vietnamese_vid" }
  ];

  const filteredLanguages = languages.filter(lang =>
    lang.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative w-full group">
      
      {/* Intro Sentence */}
      <p className="text-[10px] md:text-xs font-bold opacity-80 mb-1 text-center animate-in fade-in slide-in-from-bottom-2">
        Connect with us at the comfort of your own language <span className="text-[var(--accent)]">💜</span>
      </p>

      {/* Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          setSearchTerm("");
        }}
        className="w-full
                   bg-[var(--card-bg)]/40
                   backdrop-blur-xl
                   border border-[var(--accent)]/40
                   rounded-xl
                   px-4 py-2
                   flex justify-between items-center
                   transition-all duration-300
                   hover:border-[var(--accent)]
                   shadow-[0_4px_20px_rgba(0,0,0,0.1)]
                   text-left"
      >
        <div className="flex flex-col leading-tight">
          {selectedLanguage !== "Select your preferred Language" && (
            <span className="text-[9px] uppercase font-black opacity-30 tracking-widest mb-0.5">Selected</span>
          )}
          <span className={`font-bold tracking-tight ${selectedLanguage === "Select your preferred Language" ? "text-sm opacity-50" : "text-base"}`}>
            {selectedLanguage}
          </span>
        </div>
        <div className={`transition-transform duration-300 ${isOpen ? "rotate-0" : "rotate-180"}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent)] opacity-70">
            <polyline points="18 15 12 9 6 15"></polyline>
          </svg>
        </div>
      </button>

      {/* Dropdown List - Opens Upwards */}
      {isOpen && (
        <div className="absolute bottom-full mb-2 w-full
                        bg-[var(--card-bg)]/80
                        backdrop-blur-3xl
                        border border-[var(--accent)]/40
                        rounded-2xl
                        shadow-2xl
                        z-40 overflow-hidden
                        animate-in fade-in slide-in-from-bottom-2 duration-200">

          {/* Search Input */}
          <div className="p-2 border-b border-[var(--accent)]/20 bg-black/20">
            <input
              type="text"
              placeholder="Search language..."
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[var(--bg-primary)]/50 border border-[var(--accent)]/30 rounded-xl px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-all"
            />
          </div>

          <div className="max-h-52 overflow-y-auto custom-scrollbar">
            {filteredLanguages.length > 0 ? (
              filteredLanguages.map((lang) => (
                <button
                  key={lang.name}
                  onClick={() => {
                    setIsOpen(false);
                    setSearchTerm("");
                    window.open(lang.url, "_blank");
                    // Reset to placeholder after click
                    setSelectedLanguage("Select your preferred Language");
                  }}
                  className="w-full text-left px-5 py-2.5
                             hover:bg-[var(--accent)] hover:text-black
                             transition-all group border-b border-[var(--accent)]/5 last:border-0"
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="font-semibold text-sm">{lang.name}</span>
                    <svg className="opacity-0 group-hover:opacity-100 transition-opacity" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                  </div>
                </button>
              ))
            ) : (
              <div className="px-5 py-4 text-[10px] italic opacity-50 text-center">
                No languages found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default LanguageDropdown;
