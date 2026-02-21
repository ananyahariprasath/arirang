import { PRESAVE_LINKS } from "../../constants";

function PreSaveQR() {
  const qrBaseUrl = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=";

  return (
    <div className="mt-1 w-full flex flex-row flex-nowrap items-center justify-center gap-3 sm:gap-4 bg-[var(--accent)]/5 rounded-xl p-1.5 sm:p-2 border border-[var(--accent)]/10">
      {/* Left side: QR codes side-by-side */}
      <div className="flex flex-row gap-1.5 shrink-0">
        {/* Spotify QR */}
        <div className="group relative">
          <div className="bg-white/10 backdrop-blur-md p-1 rounded-lg border border-white/20 shadow-sm group-hover:scale-110 transition-transform duration-300">
            <img 
              src={`${qrBaseUrl}${encodeURIComponent(PRESAVE_LINKS.spotify)}`}
              alt="Spotify"
              className="w-8 h-8 md:w-10 md:h-10 rounded-sm"
            />
          </div>
        </div>

        {/* Apple Music QR */}
        <div className="group relative">
          <div className="bg-white/10 backdrop-blur-md p-1 rounded-lg border border-white/20 shadow-sm group-hover:scale-110 transition-transform duration-300">
            <img 
              src={`${qrBaseUrl}${encodeURIComponent(PRESAVE_LINKS.appleMusic)}`}
              alt="Apple Music"
              className="w-8 h-8 md:w-10 md:h-10 rounded-sm"
            />
          </div>
        </div>
      </div>
      
      {/* Right side: 3-line text */}
      <div className="flex flex-col justify-center gap-0.5 items-start">
        <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.15em] text-[var(--accent)] leading-none">Presave</p>
        <p className="text-[12px] md:text-sm font-black uppercase tracking-[0.2em] text-[var(--text-primary)] leading-none">Arirang</p>
        <p className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest opacity-50 leading-none">now</p>
      </div>
    </div>
  );
}

export default PreSaveQR;
