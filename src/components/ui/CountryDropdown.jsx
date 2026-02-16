import { useState } from "react";
import { COUNTRIES } from "../../constants";

function CountryDropdown({ selectedCountry, onSelect, disabled = false }) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCountries = COUNTRIES.filter((country) =>
    country.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`w-full flex justify-center mt-6 relative transition-all duration-500 ${disabled ? "opacity-40 grayscale-[0.5]" : "opacity-100"}`}>
      <div className="w-[95%] md:w-[70%] lg:w-[50%] relative">

        {/* Dropdown Button */}
        <button
          onClick={() => {
            if (disabled) return;
            setOpen(!open);
            setSearchTerm(""); // Reset search when opening/closing
          }}
          disabled={disabled}
          className={`w-full
           bg-[var(--card-bg)]/30
           backdrop-blur-2xl
           border border-[var(--accent)]/50
           text-[var(--text-primary)]
           rounded-2xl px-6 py-4
           shadow-[0_8px_32px_0_rgba(200,162,255,0.2),0_0_0_1px_rgba(200,162,255,0.1)_inset]
           flex justify-between items-center
           transition-all duration-300
           ${disabled ? "cursor-not-allowed" : "hover:border-[var(--accent)]/80 hover:shadow-[0_12px_48px_0_rgba(200,162,255,0.35),0_0_0_1px_rgba(200,162,255,0.2)_inset] hover:bg-[var(--card-bg)]/40"}`}

        >
          <span className="font-bold tracking-tight">
            {disabled ? "Streaming Dashboard Locked" : selectedCountry}
          </span>
          <span className={`transition-transform duration-300 ${open ? "rotate-180" : ""} ${disabled ? "opacity-20" : ""}`}>
            {disabled ? "🔒" : "▾"}
          </span>
        </button>

        {/* Dropdown List */}
        {open && (
           <div className="absolute w-full mt-2
           bg-[var(--card-bg)]
           backdrop-blur-3xl
           border border-[var(--accent)]/50
           rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.4)]
           overflow-hidden z-50">

            {/* Search Input */}
            <div className="p-3 border-b border-[var(--accent)]/10 bg-[var(--bg-secondary)]/30">
              <input
                type="text"
                placeholder="Search country..."
                autoFocus
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/30 rounded-xl px-4 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-primary)]/40 focus:outline-none focus:border-[var(--accent)] transition-all"
              />
            </div>

            <div className="max-h-60 overflow-y-auto custom-scrollbar">
              {filteredCountries.length > 0 ? (
                filteredCountries.map((country) => (
                  <button
                    key={country}
                    onClick={() => {
                      onSelect(country);
                      setOpen(false);
                      setSearchTerm("");
                    }}
                    className="w-full text-left px-6 py-3.5
                               hover:bg-[var(--accent)] hover:text-white dark:hover:text-black
                               transition-all font-semibold text-[var(--text-primary)]"
                  >
                    {country}
                  </button>
                ))
              ) : (
                <div className="px-6 py-4 text-xs italic opacity-50 text-center">
                  No countries found
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

export default CountryDropdown;
