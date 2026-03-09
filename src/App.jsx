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

function MainApp() {
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTopicRoomsOpen, setIsTopicRoomsOpen] = useState(false);
  const [proofCountry, setProofCountry] = useState(null); // non-null = show SubmitProofPage
  
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

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <>
      {isAdminOpen && hasAdminRole ? (
        <>
          <AdminPanel />
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
