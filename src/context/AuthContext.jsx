import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    // Check local storage for token on mount
    const storedToken = localStorage.getItem("auth_token");
    const storedUser = localStorage.getItem("auth_user");
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        // Clear if invalid
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = (newToken, userData) => {
    setToken(newToken);
    setUser(userData);
    localStorage.setItem("auth_token", newToken);
    localStorage.setItem("auth_user", JSON.stringify(userData));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
  };

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  const updateUser = (userData) => {
    setUser((prev) => {
      const next = typeof userData === "function"
        ? userData(prev)
        : { ...(prev || {}), ...(userData || {}) };
      localStorage.setItem("auth_user", JSON.stringify(next));
      return next;
    });
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, isAuthenticated: !!token, isLoading, isAuthModalOpen, openAuthModal, closeAuthModal }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
