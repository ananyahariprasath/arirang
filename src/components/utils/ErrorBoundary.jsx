import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-6 text-center">
          <div className="bg-[var(--card-bg)]/40 backdrop-blur-3xl border border-[var(--accent)]/50 p-12 rounded-3xl shadow-2xl max-w-lg w-full">
            {/* Digital Ghost Crash Icon */}
            <div className="flex justify-center mb-6">
              <svg 
                width="80" 
                height="80" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                className="text-[var(--accent)] animate-bounce"
                style={{ animationDuration: '3s' }}
              >
                <path d="M12 2C7.58172 2 4 5.58172 4 10V22L8 20L12 22L16 20L20 22V10C20 5.58172 16.4183 2 12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 10H9.01" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M15 10H15.01" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 15L12 14L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-60"/>
              </svg>
            </div>
            <h1 className="text-3xl font-black mb-4 text-[var(--accent)] uppercase tracking-tight">Something went wrong</h1>
            <p className="text-[var(--text-primary)] opacity-70 mb-8 font-medium">
              The Website encountered an unexpected error. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-[var(--accent)] text-white font-black rounded-xl shadow-lg hover:scale-[1.05] active:scale-[0.95] transition-all uppercase text-sm tracking-widest"
            >
              Refresh App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
