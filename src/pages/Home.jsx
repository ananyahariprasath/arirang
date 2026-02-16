import { useState } from "react";
import Header from "../components/layout/Header";
import useCountdown from "../hooks/useCountdown";
import CountryDropdown from "../components/ui/CountryDropdown";
import CountryModal from "../components/modals/CountryModal";
import Section1 from "../components/section-1/Section1";
import ContactSupport from "../components/section-2/ContactSupport";
import Timeline from "../components/post-expiry/Timeline";
import StreamingBattle from "../components/post-expiry/StreamingBattle";
import SupportDrawer from "../components/ui/SupportDrawer";


function Home() {
  const [selectedCountry, setSelectedCountry] = useState("Select your Country");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { isExpired } = useCountdown();

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCountry("Select your Country");
  };

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)] relative flex flex-col">
      <Header />

      <CountryDropdown
        selectedCountry={selectedCountry}
        onSelect={handleCountrySelect}
        disabled={!isExpired}
      />

      {/* Main Content Area */}
      <section className="flex-1 mt-4 px-6 md:px-12 lg:px-16 relative z-20 pb-12 lg:pb-0 overflow-y-auto lg:overflow-visible">
        <div className="max-w-full mx-auto">
          
          {/* Layout Container */}
          <div className={`grid gap-6 md:gap-8 ${isExpired ? "grid-cols-1 lg:grid-cols-[25%_1fr] items-stretch" : "grid-cols-1 lg:grid-cols-[1fr_400px] items-start"}`}>

            {/* Standard State: 2 Columns */}
            {!isExpired && (
              <>
                <div>
                  <Section1 />
                </div>
                {/* Right: Contact Support */}
                <div className="w-full max-w-sm mx-auto lg:ml-auto lg:mr-0">
                  <ContactSupport />
                </div>
              </>
            )}

            {/* Expired State: Symmetrical Dashboard */}
            {isExpired && (
              <>
                {/* Left: Streaming Battle (25%) - Defines the height */}
                <div className="w-full h-fit">
                  <StreamingBattle />
                </div>

                {/* Right: Timeline (Rest) - Follows the height */}
                <div className="w-full relative min-h-[400px]">
                  <div className="absolute inset-0">
                    <Timeline />
                  </div>
                </div>
              </>
            )}

          </div>
        </div>
      </section>

      {/* Slideable Support Drawer (Only in Expired state) */}
      {isExpired && <SupportDrawer />}

      {isModalOpen && (
        <CountryModal
          selectedCountry={selectedCountry}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}

export default Home;
