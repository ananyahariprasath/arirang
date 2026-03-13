import React, { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const show = useCallback((message, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-remove after 3.5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-6 left-4 sm:left-6 z-[9999] flex flex-col gap-3 pointer-events-none w-[90%] max-w-md">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              pointer-events-auto
              px-6 py-4 rounded-2xl
              backdrop-blur-2xl border
              shadow-[0_20px_40px_rgba(0,0,0,0.3)]
              flex items-center justify-between gap-4
              animate-in fade-in slide-in-from-top-4 duration-300
              ${toast.type === "success" 
                ? "bg-green-500/20 border-green-400/70 text-green-100" 
                : toast.type === "error" 
                ? "bg-red-500/20 border-red-400/70 text-red-100" 
                : "bg-[#1E0F2E] border-[var(--accent)]/50 text-[#F5EFFF]"}
            `}
          >
            <div className="flex items-center gap-3">
              {toast.type === "success" && (
                <div className="w-5 h-5 rounded-full bg-green-500/40 text-green-100 flex items-center justify-center text-[10px]">✓</div>
              )}
              {toast.type === "error" && (
                <div className="w-5 h-5 rounded-full bg-red-500/40 text-red-100 flex items-center justify-center text-[10px]">✕</div>
              )}
              <p className="text-sm font-bold tracking-tight text-[inherit]">{toast.message}</p>
            </div>
            <button 
              onClick={() => remove(toast.id)}
              className="opacity-50 hover:opacity-100 transition-opacity text-lg text-[inherit]"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a ToastProvider");
  return context;
};
