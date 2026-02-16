import { useTheme } from "../../context/ThemeContext";

function Footer() {
  const { theme } = useTheme();
  return (
    <footer className="fixed bottom-0 w-full z-40">

      {/* Animated Line */}
      <div className="relative h-[2px] w-full overflow-hidden bg-[var(--accent)]/20">

        <div className="absolute top-0 left-0 h-full w-40
                        bg-gradient-to-r 
                        from-transparent 
                        via-[var(--lavender)] 
                        to-transparent
                        animate-footer-line">
        </div>

      </div>

      {/* Footer Content */}
      <div 
        className={`backdrop-blur-xl border-t border-[var(--accent)]/40 py-4 text-center text-sm
                    ${theme === "light" 
                      ? "bg-white/80 text-gray-900" 
                      : "bg-[var(--card-bg)]/80 text-white"
                    }`}
      >

        <p className="opacity-70 uppercase tracking-[0.2em] font-bold">
          © 2026 ARIRARIRANG. All rights reserved.
        </p>

        <p className="mt-1 text-xs opacity-50">
          Designed with 💜 for the BTS ARMY by ARMY. This is a fan project and is not a part of HYBE or BTS.
        </p>

      </div>

    </footer>
  );
}

export default Footer;
