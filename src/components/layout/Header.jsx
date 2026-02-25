import { useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import HelpDeskModal from "../modals/HelpDeskModal";
import ConfirmModal from "../modals/ConfirmModal";


function IconCamera({ className = "w-4 h-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path d="M4 7h4l2-2h4l2 2h4v12H4z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function IconMusic({ className = "w-4 h-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path d="M9 18V6l10-2v12" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="16" cy="16" r="3" />
    </svg>
  );
}

function IconDisconnect({ className = "w-4 h-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path d="M10 14L21 3" />
      <path d="M21 8V3h-5" />
      <path d="M14 10V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2v-4" />
    </svg>
  );
}

function IconMoon({ className = "w-4 h-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}

function IconSun({ className = "w-4 h-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function IconTools({ className = "w-4 h-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.3 2.3-2.4-2.4z" />
    </svg>
  );
}

function IconLogout({ className = "w-4 h-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}


function Header({ onToggleSection }) {
  const { toggleTheme, theme } = useTheme();
  const { user, token, logout, updateUser, openAuthModal } = useAuth();
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isProfilePicModalOpen, setIsProfilePicModalOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isConfirmDisconnectOpen, setIsConfirmDisconnectOpen] = useState(false);


  // Generate initials for avatar fallback
  const getInitials = (name) => {
    if (!name) return "U";
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <>
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[var(--bg-primary)]/80 border-b border-[var(--accent)] transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 md:py-2.5 relative flex items-center justify-between">

          {/* Left: Logo */}
          <div className="flex-shrink-0">
            <img
              src="/logo.svg"
              alt="Logo"
              className="w-10 h-10 md:w-12 md:h-12 object-contain"
            />
          </div>

          {/* Center: Website Name */}
          <div className="flex-1 min-w-0 xl:absolute xl:left-1/2 xl:-translate-x-1/2 xl:w-max text-center pointer-events-none px-2 xl:px-6">
            <h1 className="block text-[11px] sm:text-base lg:text-2xl xl:text-3xl font-black tracking-[0.08em] sm:tracking-widest xl:tracking-[0.2em] uppercase text-[var(--accent)] pointer-events-auto leading-tight whitespace-normal lg:whitespace-nowrap break-words">
              ARIRANG SPOTIFY TAKEOVER!!!
            </h1>
          </div>

          {/* Right Section - Desktop */}
          <div className="hidden md:flex items-center gap-3 lg:gap-4 xl:gap-6">
            {/* Help Desk Button */}
            <button
              onClick={() => setIsHelpOpen(true)}
              className="px-4 lg:px-5 xl:px-6 py-2 lg:py-2.5 text-xs lg:text-sm font-bold rounded-2xl
               bg-[var(--card-bg)]/40 backdrop-blur-xl
               border border-[var(--accent)]/40
               hover:bg-[var(--accent)]/10
               transition-all duration-300 whitespace-nowrap uppercase tracking-widest"
            >
              Help Desk
            </button>

            {user && (
              <div className="relative">
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="w-10 h-10 rounded-full bg-[var(--accent)] text-white flex items-center justify-center font-bold overflow-hidden border-2 border-[var(--accent)]/50 hover:border-[var(--accent)] transition-colors focus:outline-none"
                >
                  {user.profilePicture ? (
                    <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span>{getInitials(user.username || user.email)}</span>
                  )}
                </button>

                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-[var(--card-bg)] border border-[var(--accent)]/30 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-3 border-b border-[var(--accent)]/10 bg-[var(--accent)]/5 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[var(--accent)] text-white flex items-center justify-center font-bold overflow-hidden flex-shrink-0">
                        {user.profilePicture ? (
                          <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <span>{getInitials(user.username || user.email)}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{user.username || "User"}</p>
                        <p className="text-xs text-[var(--text-secondary)] truncate">{user.email}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        setIsProfilePicModalOpen(true);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--accent)]/10 transition-colors flex items-center gap-2"
                    >
                      <IconCamera /> Change Profile Picture
                    </button>

                    {user.lastfmUsername ? (
                      <button
                        onClick={() => setIsConfirmDisconnectOpen(true)}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-500/80 hover:bg-red-500/10 transition-colors flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <IconDisconnect /> Disconnect Last.fm
                        </div>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          const apiKey = "464d8861f37218838766eef3f52b0bb0";
                          const cb = window.location.origin;
                          window.location.href = `https://www.last.fm/api/auth/?api_key=${apiKey}&cb=${cb}`;
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--accent)]/10 transition-colors flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <IconMusic /> Connect Last.fm
                        </div>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        toggleTheme();
                        setIsProfileDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--accent)]/10 transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        {theme === "light" ? <IconMoon /> : <IconSun />} Theme
                      </div>
                      <span className="text-xs text-[var(--text-secondary)] capitalize">{theme}</span>
                    </button>

                    {user?.role === "admin" && (
                      <button
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          if (onToggleSection) onToggleSection('admin');
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--accent)]/10 transition-colors flex items-center gap-2 font-bold"
                      >
                        <IconTools /> Admin Panel
                      </button>
                    )}

                    <div className="border-t border-[var(--accent)]/10 mt-1 pt-1">
                      <button
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          logout();
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-2 font-bold"
                      >
                        <IconLogout /> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Section - Mobile Hamburger */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-[var(--text-primary)] focus:outline-none"
            >
              {isMenuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-[var(--bg-primary)]/95 backdrop-blur-xl border-b border-[var(--accent)] shadow-lg animate-in fade-in slide-in-from-top-5 duration-200">
            <div className="px-4 py-4 space-y-4 flex flex-col items-center">
              
              {/* Mobile Toggle Switch */}
              <div className="flex items-center justify-between w-full max-w-xs px-4">
                <span className="text-sm font-medium">Theme</span>
                <button
                  onClick={toggleTheme}
                  className="relative w-12 h-6 flex items-center rounded-full bg-[var(--accent)] transition-colors duration-300 flex-shrink-0"
                >
                  <span
                    className={`absolute left-1 top-1 w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-300 flex items-center justify-center text-[10px]
                    ${theme === "dark" ? "translate-x-6" : ""}
                  `}
                  >
                    {theme === "light" ? <IconSun className="w-3 h-3 text-amber-500" /> : <IconMoon className="w-3 h-3 text-slate-700" />}
                  </span>
                </button>
              </div>

              {/* Mobile Recent Battles Button */}
              <button
                onClick={() => {
                  if (onToggleSection) onToggleSection('recent-battles');
                  setIsMenuOpen(false);
                }}
                className="w-full max-w-xs px-5 py-3 text-sm font-bold rounded-xl
                 bg-[var(--card-bg)]/60 
                 border border-[var(--accent)]/40
                 hover:bg-[var(--accent)]/10
                 transition-all duration-300 tracking-widest uppercase"
              >
                Recent Battles
              </button>

              {/* Mobile Support Button */}
              <button
                onClick={() => {
                  if (onToggleSection) onToggleSection('contact');
                  setIsMenuOpen(false);
                }}
                className="w-full max-w-xs px-5 py-3 text-sm font-bold rounded-xl
                 bg-[var(--card-bg)]/60 
                 border border-[var(--accent)]/40
                 hover:bg-[var(--accent)]/10
                 transition-all duration-300 tracking-widest uppercase"
              >
                Support
              </button>

              {/* Mobile Profile Actions (if logged in) */}
              {user && (
                <div className="w-full max-w-xs space-y-2 border-t border-[var(--accent)]/20 pt-4 mt-2">
                  <p className="text-center text-sm font-bold text-[var(--text-secondary)] mb-2">Profile Options</p>
                  
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsProfilePicModalOpen(true);
                    }}
                    className="w-full px-5 py-3 text-sm font-bold rounded-xl bg-[var(--card-bg)]/60 border border-[var(--accent)]/20 hover:bg-[var(--accent)]/10 transition-all flex items-center justify-center gap-2"
                  >
                    <IconCamera /> Change Avatar
                  </button>

                  {user?.role === "admin" && (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        if (onToggleSection) onToggleSection('admin');
                      }}
                      className="w-full px-5 py-3 text-sm font-bold rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 hover:bg-[var(--accent)]/20 transition-all flex items-center justify-center gap-2"
                    >
                      <IconTools /> Admin Panel
                    </button>
                  )}

                  {user.lastfmUsername ? (
                    <button
                      onClick={() => {
                        setIsConfirmDisconnectOpen(true);
                        setIsMenuOpen(false);
                      }}
                      className="w-full px-5 py-3 text-sm font-bold rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      <IconDisconnect /> Disconnect Last.fm ({user.lastfmUsername})
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        const apiKey = "464d8861f37218838766eef3f52b0bb0";
                        const cb = window.location.origin;
                        window.location.href = `https://www.last.fm/api/auth/?api_key=${apiKey}&cb=${cb}`;
                      }}
                      className="w-full px-5 py-3 text-sm font-bold rounded-xl bg-[var(--card-bg)]/60 border border-[var(--accent)]/20 hover:bg-[var(--accent)]/10 transition-all flex items-center justify-center gap-2"
                    >
                      <IconMusic /> Connect Last.fm
                    </button>
                  )}

                  <button
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                    }}
                    className="w-full px-5 py-3 text-sm font-bold rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    <IconLogout /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Add ProfilePic Modal inline for now or create a separate component. Doing inline for simplicity using existing modal styles. */}
      {isProfilePicModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm text-[var(--text-primary)]">
          <div className="bg-[var(--card-bg)] border border-[var(--accent)]/50 p-6 rounded-2xl shadow-2xl w-full max-w-sm relative">
            <h2 className="text-xl font-bold mb-4 text-center text-[var(--accent)]">Update Profile Picture</h2>
            
            <div className="mb-6 flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-[var(--accent)]/10 border-2 border-[var(--accent)]/50 overflow-hidden mb-2 relative group">
                {previewUrl || user.profilePicture ? (
                  <img src={previewUrl || user.profilePicture} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-[var(--accent)]/30">
                    {getInitials(user.username || user.email)}
                  </div>
                )}
                {loading && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    </div>
                )}
              </div>
              <p className="text-xs text-[var(--text-secondary)]">Preview</p>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              const fileInput = e.target.elements.avatarFile;
              const file = fileInput.files[0];
              if (!file && !previewUrl) return;

              const finalImage = previewUrl || (file ? await new Promise(resolve => {
                const r = new FileReader();
                r.onloadend = () => resolve(r.result);
                r.readAsDataURL(file);
              }) : null);

              if (!finalImage) return;

              // Let the UI know it's saving
              const submitBtn = e.target.elements.saveBtn;
              if (submitBtn) submitBtn.disabled = true;
              setLoading(true);

              try {
                const res = await fetch("/api/auth/profile-picture", {
                  method: "POST",
                  headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                  body: JSON.stringify({ userId: user.id, profilePicture: finalImage })
                });
                if (res.ok) {
                  const { updatedUser } = await res.json();
                  updateUser(updatedUser);
                  setIsProfilePicModalOpen(false);
                  setPreviewUrl(null);
                }
              } catch (err) {
                console.error(err);
              } finally {
                if (submitBtn) submitBtn.disabled = false;
                setLoading(false);
              }
            }} className="space-y-4">
              <label className="block w-full px-4 py-6 text-center cursor-pointer rounded-xl bg-[var(--bg-primary)]/50 border border-dashed border-[var(--accent)]/50 focus-within:border-[var(--accent)] hover:bg-[var(--accent)]/5 transition-colors">
                <span className="text-sm font-bold text-[var(--accent)] break-words">
                  {previewUrl ? "Change selected image" : "Click to browse your device"}
                </span>
                <p className="text-xs text-[var(--text-secondary)] mt-1">Recommended: Square format, Max 2MB</p>
                <input 
                  name="avatarFile"
                  type="file" 
                  accept="image/*"
                  required={!previewUrl}
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      if (file.size > 2 * 1024 * 1024) {
                        alert("Image size should be less than 2MB to ensure fast loading.");
                        e.target.value = "";
                        return;
                      }
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setPreviewUrl(reader.result);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
              <div className="flex gap-3">
                <button type="button" onClick={() => { setIsProfilePicModalOpen(false); setPreviewUrl(null); }} className="flex-1 py-2 border border-[var(--accent)]/30 rounded-xl hover:bg-[var(--accent)]/10">Cancel</button>
                <button name="saveBtn" type="submit" className="flex-1 py-2 bg-[var(--accent)] text-white rounded-xl shadow-lg hover:opacity-80 disabled:opacity-50">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <HelpDeskModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      <ConfirmModal 
        isOpen={isConfirmDisconnectOpen}
        onClose={() => setIsConfirmDisconnectOpen(false)}
        onConfirm={async () => {
          try {
            const res = await fetch("/api/auth/lastfm-session", {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId: user.id })
            });
            if (res.ok) {
              updateUser({ ...user, lastfmUsername: null });
            }
          } catch (err) {
            console.error("Disconnect error:", err);
          }
        }}
        title="Disconnect Last.fm"
        message="Are you sure you want to disconnect your Last.fm account? You'll need to authorize Arirang Spotify Takeover again if you want to reconnect."
        confirmText="Yes, Disconnect"
        cancelText="No, Keep it"
      />
    </>

  );
}

export default Header;
