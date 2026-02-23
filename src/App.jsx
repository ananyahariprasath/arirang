import { useState, useEffect } from "react";
import Home from "./pages/Home";
import AdminPanel from "./pages/AdminPanel";
import SubmitProofPage from "./pages/SubmitProofPage";
import Footer from "./components/layout/Footer";
import AdminLoginModal from "./components/modals/AdminLoginModal";

import { ToastProvider } from "./context/ToastContext";
import ErrorBoundary from "./components/utils/ErrorBoundary";

function App() {
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [proofCountry, setProofCountry] = useState(null); // non-null = show SubmitProofPage

  const handleNavigateToProof = (country) => {
    setProofCountry(country);
  };

  const handleBackFromProof = () => {
    setProofCountry(null);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check for Ctrl + Shift + L
      if (e.ctrlKey && e.shiftKey && (e.key === 'L' || e.key === 'l')) {
        e.preventDefault();
        setShowLoginModal(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLoginSuccess = () => {
    setShowLoginModal(false);
    setIsAdminOpen(true);
  };

  const handleCloseAdmin = () => {
    setIsAdminOpen(false);
  };

  const content = (
    <>
      {proofCountry !== null ? (
        <SubmitProofPage
          country={proofCountry}
          onBack={handleBackFromProof}
        />
      ) : (
        <>
          <Home onNavigateToProof={handleNavigateToProof} />
          <Footer />
        </>
      )}

      {showLoginModal && (
        <AdminLoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}
    </>
  );

  return (
    <ErrorBoundary>
      <ToastProvider>
        {isAdminOpen ? (
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
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
