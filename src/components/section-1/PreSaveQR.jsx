import { PRESAVE_LINKS } from "../../constants";

function PreSaveQR() {
  const qrBaseUrl = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=";

  return (
    <div className="mt-4 w-full max-w-lg flex flex-col items-center">
      <h4 className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-center mb-3 text-[var(--accent)] opacity-80">
        Presave arirang on Spotify and Apple Music right now!
      </h4>
      
      <div className="grid grid-cols-2 gap-4 md:gap-8">
        {/* Spotify QR */}
        <div className="flex flex-col items-center group">
          <div className="bg-white/10 backdrop-blur-md p-1.5 rounded-xl border border-white/20 shadow-lg group-hover:scale-105 transition-transform duration-300">
            <img 
              src={`${qrBaseUrl}${encodeURIComponent(PRESAVE_LINKS.spotify)}`}
              alt="Spotify Pre-save QR"
              className="w-20 h-20 md:w-24 md:h-24 rounded-lg"
            />
          </div>
          <p className="mt-2 text-[8px] font-black uppercase tracking-tighter opacity-40 group-hover:opacity-100 transition-opacity">Spotify</p>
        </div>

        {/* Apple Music QR */}
        <div className="flex flex-col items-center group">
          <div className="bg-white/10 backdrop-blur-md p-1.5 rounded-xl border border-white/20 shadow-lg group-hover:scale-105 transition-transform duration-300">
            <img 
              src={`${qrBaseUrl}${encodeURIComponent(PRESAVE_LINKS.appleMusic)}`}
              alt="Apple Music Pre-save QR"
              className="w-20 h-20 md:w-24 md:h-24 rounded-lg"
            />
          </div>
          <p className="mt-2 text-[8px] font-black uppercase tracking-tighter opacity-40 group-hover:opacity-100 transition-opacity">Apple Music</p>
        </div>
      </div>
    </div>
  );
}

export default PreSaveQR;
