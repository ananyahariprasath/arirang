import { useState, useEffect } from "react";
import Header from "../components/layout/Header";
import useCountdown from "../hooks/useCountdown";
import { useTheme } from "../context/ThemeContext";
import CountryDropdown from "../components/ui/CountryDropdown";
import CountryModal from "../components/modals/CountryModal";
// import Section1 from "../components/section-1/Section1";
// import ContactSupport from "../components/section-2/ContactSupport";
import Timeline from "../components/post-expiry/Timeline";
import StreamingBattle from "../components/post-expiry/StreamingBattle";
import SupportDrawer from "../components/ui/SupportDrawer";
import RecentResultsDrawer from "../components/ui/RecentResultsDrawer";
import VerticalTabs from "../components/ui/VerticalTabs";
import Gallery from "../components/post-expiry/Gallery";
import BattleWinnerModal from "../components/modals/BattleWinnerModal";
import useBattles from "../hooks/useBattles";
import YoutubeEmbed from "../components/section-1/YoutubeEmbed";
import LanguageDropdown from "../components/section-1/LanguageDropdown";
import PreSaveQR from "../components/section-1/PreSaveQR";
import CountdownTimer from "../components/section-1/CountdownTimer";


function Home({ onNavigateToProof }) {
  const [selectedCountry, setSelectedCountry] = useState("Select your Country");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRecentBattlesOpen, setIsRecentBattlesOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isWinnerModalOpen, setIsWinnerModalOpen] = useState(false);

  const [localNow, setLocalNow] = useState("");
  const [timeZone, setTimeZone] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLocalNow(
        now.toLocaleString([], {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
      setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    };

    updateTime();
    const localTimer = setInterval(updateTime, 1000);
    return () => clearInterval(localTimer);
  }, []);

  const { isExpired } = useCountdown();
  const { battles, loading } = useBattles();

  // Trigger Winner Modal on entry if there are previous results
  useEffect(() => {
    // Always show the modal on first entry, even if history is empty
    // The modal itself will handle the "Coming Soon" state
    setIsWinnerModalOpen(true);
  }, []);

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCountry("Select your Country");
  };

  const handleToggleSection = (section) => {
    if (section === 'recent-battles') {
      setIsRecentBattlesOpen(!isRecentBattlesOpen);
      setIsContactOpen(false);
    } else if (section === 'contact') {
      setIsContactOpen(!isContactOpen);
      setIsRecentBattlesOpen(false);
    }
  };

  return (
    <div className="min-h-screen lg:h-screen lg:pb-20 lg:overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)] relative flex flex-col">
      <Header onToggleSection={handleToggleSection} />

      {/* Main Content Area */}
      <section className="flex-1 mt-2 px-4 md:px-8 lg:px-12 relative z-20 pb-24 lg:pb-0 lg:min-h-0 lg:overflow-hidden">
        <div className="max-w-[1800px] mx-auto lg:h-full lg:min-h-0 lg:overflow-hidden">
          
          {/* 3-Column Layout Container */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr_1fr] gap-6 lg:h-full lg:min-h-0 items-stretch lg:pr-12 pb-6 lg:pb-0 lg:overflow-hidden">

            {/* Column 1: Pre-Countdown (or Gallery) */}
            <div className={`lg:h-full flex flex-col lg:overflow-hidden ${isExpired ? 'order-last lg:order-none' : ''}`}>
              {/* We moved CountryDropdown to the center top */}

              {!isExpired ? (
                <div className="flex-1 overflow-y-auto min-h-0 no-scrollbar flex flex-col gap-1 pb-6 pt-1">
                  {/* Countdown Box Moved Up */}
                  <div className={`rounded-xl p-1.5 border transition-all duration-300
                                ${useTheme().theme === "light"
                        ? "bg-[var(--aesthetic-purple)]/20 border-[var(--lavender)]"
                        : "bg-[#6A0DAD]/30 border-[#D8BFD8]/30 shadow-2xl"
                      }`}>
                    <h3 className="text-[10px] font-bold text-center uppercase mb-1">Your Time: {localNow} ({timeZone})</h3>
                    <div className="scale-100 origin-top mb-[-6px] px-2 py-1">
                      <CountdownTimer />
                    </div>
                    <h2 className="text-center font-black tracking-widest text-[#4B0082] dark:text-white">for D-DAY</h2>
                  </div>

                  <YoutubeEmbed />
                  <LanguageDropdown />
                  <PreSaveQR />
                </div>
              ) : (
                <div className="h-[60vh] md:h-[70vh] lg:flex-1 lg:h-auto min-h-0 overflow-hidden">
                  <Gallery />
                </div>
              )}
            </div>

            {/* Column 2: Streaming Map (Center) */}
            <div className="lg:h-full lg:min-h-0 flex flex-col gap-4 lg:overflow-hidden">
              <CountryDropdown
                selectedCountry={selectedCountry}
                onSelect={handleCountrySelect}
              />
              <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 no-scrollbar pb-6 rounded-3xl">
                <Timeline />
              </div>
            </div>

            {/* Column 3: Live Battle Cards (Right) */}
            <div className="flex flex-col gap-2 lg:h-full lg:min-h-0 lg:overflow-hidden">
              <div className="h-[32px] flex items-center justify-center shrink-0">
                <h2 className="text-lg font-black text-[var(--accent)] uppercase tracking-widest px-2">Live Battles</h2>
              </div>
              {/* Mobile: natural height stacked cards; Desktop: fills column */}
              <div className="flex flex-col gap-2 lg:flex-1 lg:min-h-0 lg:overflow-hidden">
                <StreamingBattle />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Far Right: Vertical Tabs */}
      <VerticalTabs onToggleSection={handleToggleSection} />

      {/* Overlay for Drawers */}
      {(isRecentBattlesOpen || isContactOpen) && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90] transition-opacity duration-300"
          onClick={() => {
            setIsRecentBattlesOpen(false);
            setIsContactOpen(false);
          }}
        />
      )}

      {/* Drawers (Updated to be controlled by Home state) */}
      <div className={`fixed top-0 left-0 h-full z-[100] transform transition-transform duration-300 ease-in-out
                      ${isRecentBattlesOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <RecentResultsDrawer onClose={() => setIsRecentBattlesOpen(false)} />
      </div>

      <div className={`fixed top-0 right-0 h-full z-[100] transform transition-transform duration-300 ease-in-out
                      ${isContactOpen ? "translate-x-0" : "translate-x-full"}`}>
        <SupportDrawer onClose={() => setIsContactOpen(false)} />
      </div>

      {isModalOpen && (
        <CountryModal
          selectedCountry={selectedCountry}
          onClose={handleCloseModal}
          onSubmitProof={(country) => {
            handleCloseModal();
            onNavigateToProof?.(country);
          }}
        />
      )}

      {isWinnerModalOpen && (
        <BattleWinnerModal 
          winners={battles ? battles.slice(0, 4) : []} 
          onClose={() => setIsWinnerModalOpen(false)} 
        />
      )}
    </div>
  );
}

export default Home;

