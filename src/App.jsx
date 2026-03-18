import { useState, useEffect } from "react";
import Home from "./pages/Home";
import AdminPanel from "./pages/AdminPanel";
import TopicRoomsPage from "./pages/TopicRoomsPage";
import Footer from "./components/layout/Footer";
import AuthPage from "./pages/AuthPage";
import AccountSettings from "./pages/AccountSettings";

import { ToastProvider } from "./context/ToastContext";
import ErrorBoundary from "./components/utils/ErrorBoundary";
import { AuthProvider, useAuth } from "./context/AuthContext";

const DEFAULT_MAINTENANCE_MESSAGE = "Website is under maintenance";

function MaintenanceScreen({ message, canOpenAdmin, onOpenAdmin }) {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex items-center justify-center px-6">
      <div className="w-full max-w-xl text-center rounded-3xl border border-[var(--accent)]/25 bg-[var(--card-bg)]/70 backdrop-blur-xl p-8">
        <p className="text-[11px] uppercase tracking-[0.25em] font-black text-[var(--accent)]">Maintenance</p>
        <h1 className="mt-3 text-3xl sm:text-4xl font-black tracking-tight">{message || DEFAULT_MAINTENANCE_MESSAGE}</h1>
        <p className="mt-3 text-sm font-semibold text-[var(--text-secondary)]">Please check back soon.</p>
        {canOpenAdmin ? (
          <button
            onClick={onOpenAdmin}
            className="mt-6 px-5 py-3 rounded-xl bg-[var(--accent)] text-black dark:text-black text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all"
          >
            Open Admin Panel
          </button>
        ) : null}
      </div>
    </div>
  );
}

function MainApp() {
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTopicRoomsOpen, setIsTopicRoomsOpen] = useState(false);
  const [proofCountry, setProofCountry] = useState(null); // non-null = show SubmitProofPage
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState(DEFAULT_MAINTENANCE_MESSAGE);
  const [maintenanceLoading, setMaintenanceLoading] = useState(true);
  
  const { user, isAuthenticated, isLoading } = useAuth();

  const handleNavigateToProof = (country) => {
    setProofCountry(country);
  };

  const handleBackFromProof = () => {
    setProofCountry(null);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Admin shortcut removed since login is required natively
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleCloseAdmin = () => {
    setIsAdminOpen(false);
  };

  const hasAdminRole = user?.role === "admin";
  const canBypassMaintenance = isAuthenticated && hasAdminRole && isAdminOpen;

  useEffect(() => {
    let active = true;
    let inFlight = false;
    const loadMaintenanceMode = async () => {
      if (typeof document !== "undefined" && document.hidden) return;
      if (inFlight) return;
      inFlight = true;
      try {
        const response = await fetch("/api/app-config?key=maintenanceMode", { cache: "no-store" });
        const data = await response.json().catch(() => ({}));
        if (!active || !response.ok) return;
        const entry = Array.isArray(data?.value) && data.value.length > 0 ? data.value[0] : {};
        const enabled = Boolean(entry?.enabled);
        const message = String(entry?.message || DEFAULT_MAINTENANCE_MESSAGE).trim() || DEFAULT_MAINTENANCE_MESSAGE;
        setMaintenanceEnabled(enabled);
        setMaintenanceMessage(message);
      } catch {
        // Keep the last known maintenance state on failure.
      } finally {
        if (active) setMaintenanceLoading(false);
        inFlight = false;
      }
    };
    loadMaintenanceMode();
    const intervalId = setInterval(loadMaintenanceMode, 30000);
    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, []);

  const handleMaintenanceModeChange = ({ enabled, message }) => {
    setMaintenanceEnabled(Boolean(enabled));
    setMaintenanceMessage(String(message || DEFAULT_MAINTENANCE_MESSAGE).trim() || DEFAULT_MAINTENANCE_MESSAGE);
  };

  const content = (
    <>
      {proofCountry !== null ? (
        <SubmitProofPage
          country={proofCountry}
          onBack={handleBackFromProof}
        />
      ) : isTopicRoomsOpen ? (
        <TopicRoomsPage
          onBack={() => setIsTopicRoomsOpen(false)}
          onOpenAdmin={() => setIsAdminOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      ) : isSettingsOpen ? (
        <AccountSettings
          onBack={() => setIsSettingsOpen(false)}
          onOpenAdmin={() => setIsAdminOpen(true)}
        />
      ) : (
        <>
          <Home 
            onNavigateToProof={handleNavigateToProof} 
            onOpenAdmin={() => setIsAdminOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenTopicRooms={() => setIsTopicRoomsOpen(true)}
          />
          <Footer />
        </>
      )}
    </>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[var(--accent)]/30 border-t-[var(--accent)] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (maintenanceLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[var(--accent)]/30 border-t-[var(--accent)] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (maintenanceEnabled && !canBypassMaintenance) {
    return (
      <MaintenanceScreen
        message={maintenanceMessage}
        canOpenAdmin={isAuthenticated && hasAdminRole}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <>
      {isAdminOpen && hasAdminRole ? (
        <>
          <AdminPanel onMaintenanceModeChange={handleMaintenanceModeChange} />
          <button 
            onClick={handleCloseAdmin}
            className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg opacity-50 hover:opacity-100 transition-opacity z-50 text-xs"
          >
            Exit Admin
          </button>
        </>
      ) : content}
    </>
  );
}
function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <MainApp />
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
