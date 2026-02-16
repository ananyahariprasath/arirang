import { useTheme } from "../../context/ThemeContext";

import YoutubeEmbed from "./YoutubeEmbed";
import ReleaseInfo from "./ReleaseInfo";
import CountdownTimer from "./CountdownTimer";
import PreSaveQR from "./PreSaveQR";
import LanguageDropdown from "./LanguageDropdown";


function Section1() {
  const { theme } = useTheme();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-start">
      <div>
        {/* 🎬 YouTube Video */}
        <YoutubeEmbed />
        <LanguageDropdown />
      </div>

      {/* ⏳ Countdown Section */}
      <div className="flex flex-col items-center justify-center">

        {/* Release Info (Outside the box) */}
        <div className="scale-90 origin-bottom transform-gpu">
          <ReleaseInfo />
        </div>

        {/* Title (Outside the box) */}
        <h3 className="mt-2 mb-4 text-xl md:text-2xl font-bold text-center uppercase tracking-wide">
          Days left till release
        </h3>

        <div
          className={`w-full max-w-md
                      rounded-3xl
                      p-4 md:p-6 shadow-2xl transition-all duration-300
                      ${theme === "light"
              ? "bg-[var(--aesthetic-purple)]/20 backdrop-blur-lg border border-[var(--lavender)] text-[var(--ivory)]"
              : "bg-[#6A0DAD]/30 backdrop-blur-xl border border-[#D8BFD8]/30 shadow-[0_8px_32px_0_rgba(106,13,173,0.37)] text-white"
            }`}
        >
          <CountdownTimer />
        </div>

        {/* 📱 Pre-save QR Codes */}
        <PreSaveQR />

        {/* Live Updates Disclaimer */}
        <p className="mt-2 text-[10px] italic opacity-50 text-center px-4">
          * Keep checking the website for live updates and information
        </p>
      </div>
    </div>
  );
}

export default Section1;
