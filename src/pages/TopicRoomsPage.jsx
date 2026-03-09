import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import TopicRoomsModal from "../components/ui/TopicRoomsModal";

function TopicRoomsPage({ onBack, onOpenAdmin, onOpenSettings }) {
  const handleToggleSection = (section) => {
    if (section === "topic-rooms") return;
    if (section === "admin") {
      onOpenAdmin?.();
      return;
    }
    if (section === "settings") {
      onOpenSettings?.();
      return;
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <Header onToggleSection={handleToggleSection} />
      <main className="w-full h-[calc(100vh-120px)] sm:h-[calc(100vh-132px)] overflow-hidden">
        <TopicRoomsModal mode="page" onClose={onBack} />
      </main>
      <Footer />
    </div>
  );
}

export default TopicRoomsPage;
