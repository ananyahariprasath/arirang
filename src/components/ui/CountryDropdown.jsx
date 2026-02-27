import { useState } from "react";
import { COUNTRIES } from "../../constants";

function CountryDropdown({ selectedCountry, onSelect, disabled = false }) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const hasValidSelection = COUNTRIES.includes(selectedCountry);

  const filteredCountries = COUNTRIES
    .filter((country) =>
      country.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => a.localeCompare(b));

  return (
    <div className="w-full relative transition-all duration-500">
      <div className="w-full relative">
        {/* Header Row */}
        <div
          className={`w-full
           bg-[var(--card-bg)]/30
           backdrop-blur-2xl
           border border-[var(--accent)]/50
           text-[var(--text-primary)]
           rounded-xl px-4 py-3
           shadow-[0_4px_20px_0_rgba(200,162,255,0.1)]
           flex justify-between items-center
           transition-all duration-300
           hover:border-[var(--accent)] hover:bg-[var(--card-bg)]/40`}
        >
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              if (hasValidSelection) {
                onSelect(selectedCountry);
                return;
              }
              setOpen(!open);
              setSearchTerm("");
            }}
            className="flex-1 text-left font-bold tracking-tight text-xs md:text-sm uppercase"
          >
            {selectedCountry}
          </button>

          <button
            type="button"
            aria-label="Toggle country list"
            disabled={disabled}
            onClick={() => {
              setOpen(!open);
              setSearchTerm("");
            }}
            className={`ml-3 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
          >
            v
          </button>
        </div>

        {/* Dropdown List */}
        {open && (
          <div
            className="absolute w-full mt-2
           bg-[var(--card-bg)]
           backdrop-blur-3xl
           border border-[var(--accent)]/50
           rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.4)]
           overflow-hidden z-50"
          >
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

            <div className="max-h-60 overflow-y-auto no-scrollbar">
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
