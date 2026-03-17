import { useState, useRef, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import HelpDeskModal from "../modals/HelpDeskModal";
import ConfirmModal from "../modals/ConfirmModal";
import HeaderLogo from "../branding/HeaderLogo";
import useDailyMissions from "../../hooks/useDailyMissions";
import DailyMissionsDrawer from "../ui/DailyMissionsDrawer";

const TOPIC_ROOMS_UNREAD_KEY_PREFIX = "topic_rooms_unread_total_v1_";

function toIdentity(value) {
  return String(value || "").trim().replace(/^@+/, "").toLowerCase();
}


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
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h.01a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55h.01a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.01a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1z" />
    </svg>
  );
}

function IconGlobe({ className = "w-4 h-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15 15 0 0 1 0 20" />
      <path d="M12 2a15 15 0 0 0 0 20" />
    </svg>
  );
}

function IconMessage({ className = "w-4 h-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
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

function IconDelete({ className = "w-4 h-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M7 6l1 14h8l1-14" />
      <path d="M10 10v7M14 10v7" />
    </svg>
  );
}

function IconShare({ className = "w-4 h-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.8 10.7l6.5-3.5M8.8 13.3l6.5 3.5" />
    </svg>
  );
}

function IconClipboard({ className = "w-4 h-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path d="M9 2h6a2 2 0 0 1 2 2v2H7V4a2 2 0 0 1 2-2z" />
      <path d="M7 6H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-2" />
    </svg>
  );
}

function IconTop({ className = "w-4 h-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" className={className} aria-hidden="true">
      <path d="M8 21h8" />
      <path d="M12 17v4" />
      <path d="M7 4h10v4a5 5 0 0 1-10 0z" />
    </svg>
  );
}

function IconRecent({ className = "w-4 h-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" className={className} aria-hidden="true">
      <path d="M12 8v5l3 3" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

function IconSupport({ className = "w-4 h-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" className={className} aria-hidden="true">
      <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" />
      <path d="M4.5 7l7.5 6 7.5-6" />
    </svg>
  );
}

function IconGift({ className = "w-4 h-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <rect x="3" y="8" width="18" height="13" rx="2" />
      <path d="M12 8v13" />
      <path d="M3 12h18" />
      <path d="M7 5c0 1.7 2.2 3 5 3s5-1.3 5-3c0-1.1-1-2-2.3-2-1.6 0-2.7 1.2-2.7 2 0-0.8-1.1-2-2.7-2C8 3 7 3.9 7 5z" />
    </svg>
  );
}


function Header({ onToggleSection }) {
  const { toggleTheme, theme } = useTheme();
  const { user, token, logout, updateUser, openAuthModal } = useAuth();
  const { missions, loading: missionsLoading } = useDailyMissions();
  const toast = useToast();
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isProfilePicModalOpen, setIsProfilePicModalOpen] = useState(false);
  const [isMissionsOpen, setIsMissionsOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isConfirmDisconnectOpen, setIsConfirmDisconnectOpen] = useState(false);
  const [isConfirmDeleteAccountOpen, setIsConfirmDeleteAccountOpen] = useState(false);
  const [deleteAccountPassword, setDeleteAccountPassword] = useState("");
  const [deleteAccountVerified, setDeleteAccountVerified] = useState(false);
  const [deleteAccountVerifying, setDeleteAccountVerifying] = useState(false);
  const [deleteAccountSubmitting, setDeleteAccountSubmitting] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState("");
  const [isTranslateOpen, setIsTranslateOpen] = useState(false);
  const [selectedTranslateLang, setSelectedTranslateLang] = useState("en");
  const [availableTranslateLanguages, setAvailableTranslateLanguages] = useState([]);
  const [translateSearch, setTranslateSearch] = useState("");
  const [translateLoading, setTranslateLoading] = useState(true);
  const [isMobileTranslateOpen, setIsMobileTranslateOpen] = useState(false);
  const [topicRoomsUnread, setTopicRoomsUnread] = useState(0);
  const [topicRoomsActiveCount, setTopicRoomsActiveCount] = useState(0);
  const [completedMissions, setCompletedMissions] = useState({});
  const [isLuckyDrawModalOpen, setIsLuckyDrawModalOpen] = useState(false);
  const [luckyDrawEntry, setLuckyDrawEntry] = useState(null);
  const [luckyDrawLoading, setLuckyDrawLoading] = useState(false);
  const [luckyDrawSubmitting, setLuckyDrawSubmitting] = useState(false);
  const [luckyDrawError, setLuckyDrawError] = useState("");
  const [socialPlatform, setSocialPlatform] = useState("");
  const [socialHandle, setSocialHandle] = useState("");
  const [justCompletedMissionId, setJustCompletedMissionId] = useState(null);
  const [referralVerifiedCount, setReferralVerifiedCount] = useState(0);
  const [isScrobblerModalOpen, setIsScrobblerModalOpen] = useState(false);
  const [scrobblerType, setScrobblerType] = useState("lastfm");
  const [scrobblerLink, setScrobblerLink] = useState("");
  const [scrobblerError, setScrobblerError] = useState("");
  const [scrobblerSaving, setScrobblerSaving] = useState(false);

  const profileRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const translateRef = useRef(null);

  useEffect(() => {
    const stored = String(localStorage.getItem("site_translate_lang") || "en").toLowerCase();
    if (stored) setSelectedTranslateLang(stored);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let timer;

    const syncLanguagesFromGoogle = () => {
      const combo = document.querySelector(".goog-te-combo");
      if (!combo) return false;

      const options = Array.from(combo.options || [])
        .map((opt) => ({
          code: String(opt.value || "").trim().toLowerCase(),
          label: String(opt.textContent || opt.label || "").trim(),
        }))
        .filter((opt) => opt.code && opt.label);

      if (options.length === 0) return false;

      const unique = [];
      const seen = new Set();
      for (const item of options) {
        if (seen.has(item.code)) continue;
        seen.add(item.code);
        unique.push(item);
      }

      if (!seen.has("en")) unique.unshift({ code: "en", label: "English" });
      unique.sort((a, b) => {
        if (a.code === "en") return -1;
        if (b.code === "en") return 1;
        return a.label.localeCompare(b.label);
      });

      setAvailableTranslateLanguages(unique);
      setTranslateLoading(false);
      return true;
    };

    const startLanguageSyncPolling = () => {
      let tries = 0;
      const maxTries = 50;
      timer = setInterval(() => {
        tries += 1;
        const ok = syncLanguagesFromGoogle();
        if (ok || tries >= maxTries) {
          clearInterval(timer);
          if (!ok) setTranslateLoading(false);
        }
      }, 150);
    };

    const initGoogleTranslateElement = () => {
      if (!window.google?.translate?.TranslateElement) return;
      if (!window.__googleTranslateElementMounted) {
        new window.google.translate.TranslateElement(
          { pageLanguage: "en", autoDisplay: false },
          "google_translate_element"
        );
        window.__googleTranslateElementMounted = true;
      }
      startLanguageSyncPolling();
    };

    window.googleTranslateElementInit = initGoogleTranslateElement;

    if (window.google?.translate?.TranslateElement) {
      initGoogleTranslateElement();
    } else {
      const existingScript = document.getElementById("google-translate-script");
      if (!existingScript) {
        const script = document.createElement("script");
        script.id = "google-translate-script";
        script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
        script.async = true;
        document.body.appendChild(script);
      } else {
        startLanguageSyncPolling();
      }
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    const hideGoogleTranslateBanner = () => {
      const bannerFrames = document.querySelectorAll("iframe.goog-te-banner-frame, .goog-te-banner-frame");
      bannerFrames.forEach((node) => {
        if (node && node.style) {
          node.style.display = "none";
          node.style.visibility = "hidden";
          node.style.height = "0px";
          node.style.width = "0px";
        }
      });

      const bannerContainers = document.querySelectorAll(".skiptranslate, .goog-te-banner-frame.skiptranslate");
      bannerContainers.forEach((node) => {
        if (node && node.style) {
          node.style.display = "none";
          node.style.visibility = "hidden";
          node.style.height = "0px";
        }
      });

      document.body.style.top = "0px";
      document.documentElement.style.top = "0px";
    };

    hideGoogleTranslateBanner();
    const intervalId = setInterval(hideGoogleTranslateBanner, 500);
    const observer = new MutationObserver(() => hideGoogleTranslateBanner());
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });

    return () => {
      clearInterval(intervalId);
      observer.disconnect();
    };
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
      if (translateRef.current && !translateRef.current.contains(event.target)) {
        setIsTranslateOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (translateLoading) return;
    const exists = availableTranslateLanguages.some((item) => item.code === selectedTranslateLang);
    if (!exists) {
      setSelectedTranslateLang("en");
      localStorage.setItem("site_translate_lang", "en");
    }
  }, [availableTranslateLanguages, selectedTranslateLang, translateLoading]);

  useEffect(() => {
    if (!isTranslateOpen) setTranslateSearch("");
  }, [isTranslateOpen]);

  useEffect(() => {
    if (!isMenuOpen) {
      setIsMobileTranslateOpen(false);
    }
  }, [isMenuOpen]);

  useEffect(() => {
    const openMissions = () => setIsMissionsOpen(true);
    window.addEventListener("open-daily-missions", openMissions);
    const closeMissions = () => setIsMissionsOpen(false);
    window.addEventListener("close-daily-missions", closeMissions);
    return () => {
      window.removeEventListener("open-daily-missions", openMissions);
      window.removeEventListener("close-daily-missions", closeMissions);
    };
  }, []);

  useEffect(() => {
    const identity = toIdentity(user?.username || user?.email || "");
    if (!identity) {
      setTopicRoomsUnread(0);
      return;
    }
    const key = `${TOPIC_ROOMS_UNREAD_KEY_PREFIX}${identity}`;
    const syncUnread = () => {
      const raw = localStorage.getItem(key);
      const count = Number.parseInt(String(raw || "0"), 10);
      setTopicRoomsUnread(Number.isFinite(count) ? Math.max(0, count) : 0);
    };
    syncUnread();
    const onStorage = (e) => {
      if (!e.key || e.key === key) syncUnread();
    };
    window.addEventListener("storage", onStorage);
    const intervalId = setInterval(syncUnread, 1500);
    return () => {
      window.removeEventListener("storage", onStorage);
      clearInterval(intervalId);
    };
  }, [user?.username, user?.email]);

  useEffect(() => {
    let active = true;
    const loadActiveRooms = async () => {
      try {
        const response = await fetch("/api/topic-rooms", { cache: "no-store" });
        const data = await response.json().catch(() => ({}));
        if (!active || !response.ok) return;
        const now = Date.now();
        const rooms = Array.isArray(data?.rooms) ? data.rooms : [];
        const count = rooms.filter((room) => room.status === "active" && Number(room.expiresAt || 0) > now).length;
        setTopicRoomsActiveCount(count);
      } catch {
        // Silent failure
      }
    };
    loadActiveRooms();
    const intervalId = setInterval(loadActiveRooms, 30000);
    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const userKey = String(user?.id || user?.username || user?.email || "guest").toLowerCase();
    const dateKey = new Date().toLocaleDateString("en-CA");
    const storageKey = `daily_missions_done_v1_${userKey}_${dateKey}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setCompletedMissions(JSON.parse(saved) || {});
      } catch {
        setCompletedMissions({});
      }
    } else {
      setCompletedMissions({});
    }
  }, [user?.id, user?.username, user?.email]);

  const persistCompletedMissions = (next) => {
    if (typeof window === "undefined") return;
    const userKey = String(user?.id || user?.username || user?.email || "guest").toLowerCase();
    const dateKey = new Date().toLocaleDateString("en-CA");
    const storageKey = `daily_missions_done_v1_${userKey}_${dateKey}`;
    localStorage.setItem(storageKey, JSON.stringify(next));
  };

  const referralCode = String(user?.referralCode || user?.username || "").trim();
  const referralLink = referralCode && typeof window !== "undefined"
    ? `${window.location.origin}/auth?ref=${encodeURIComponent(referralCode)}`
    : "";
  const hasScrobblerConnected = Boolean(user?.lastfmUsername || user?.scrobblerLink);
  const scrobblerCtaLabel = hasScrobblerConnected ? "Manage Scrobbler" : "Connect your Scrobbler";
  const LUCKY_DRAW_SOCIALS = ["instagram", "twitter", "facebook", "telegram", "discord", "weverse"];

  const openScrobblerModal = () => {
    const nextType = user?.lastfmUsername
      ? "lastfm"
      : String(user?.scrobblerType || "lastfm");
    setScrobblerType(nextType);
    setScrobblerLink(String(user?.scrobblerLink || ""));
    setScrobblerError("");
    setIsScrobblerModalOpen(true);
  };

  const handleSaveScrobbler = async () => {
    if (!token) return;
    const currentConnectedType = user?.lastfmUsername
      ? "lastfm"
      : (user?.scrobblerLink ? String(user?.scrobblerType || "") : "");
    if (currentConnectedType && currentConnectedType !== scrobblerType) {
      setScrobblerError("Disconnect your existing scrobbler to add a new one.");
      return;
    }
    if (scrobblerType === "lastfm") {
      const apiKey = "464d8861f37218838766eef3f52b0bb0";
      const cb = window.location.origin;
      window.location.href = `https://www.last.fm/api/auth/?api_key=${apiKey}&cb=${cb}`;
      return;
    }
    const link = String(scrobblerLink || "").trim();
    if (!link) {
      setScrobblerError("Please paste your scrobbler link.");
      return;
    }

    setScrobblerSaving(true);
    setScrobblerError("");
    try {
      const response = await fetch("/api/auth/scrobbler-connect", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ scrobblerType, scrobblerLink: link }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Failed to save scrobbler link");
      }
      updateUser({
        scrobblerType: data?.user?.scrobblerType || scrobblerType,
        scrobblerLink: data?.user?.scrobblerLink || link,
      });
      toast.show("Scrobbler saved.", "success");
      setIsScrobblerModalOpen(false);
    } catch (error) {
      setScrobblerError(error.message || "Failed to save scrobbler link");
    } finally {
      setScrobblerSaving(false);
    }
  };

  const handleClearScrobbler = async () => {
    if (!token) return;
    setScrobblerSaving(true);
    setScrobblerError("");
    try {
      const response = await fetch("/api/auth/scrobbler-connect", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ scrobblerType: "" }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Failed to disconnect scrobbler");
      }
      updateUser({
        scrobblerType: data?.user?.scrobblerType || null,
        scrobblerLink: data?.user?.scrobblerLink || null,
      });
      setScrobblerLink("");
      toast.show("Scrobbler disconnected.", "success");
      setIsScrobblerModalOpen(false);
    } catch (error) {
      setScrobblerError(error.message || "Failed to disconnect scrobbler");
    } finally {
      setScrobblerSaving(false);
    }
  };

  useEffect(() => {
    if (!isLuckyDrawModalOpen) return;
    if (!token) {
      setLuckyDrawEntry(null);
      setLuckyDrawLoading(false);
      return;
    }
    let active = true;
    setLuckyDrawLoading(true);
    setLuckyDrawError("");
    fetch("/api/lucky-draw", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json().then((data) => ({ res, data })))
      .then(({ res, data }) => {
        if (!active) return;
        if (!res.ok) {
          throw new Error(data?.error || "Failed to load entry");
        }
        setLuckyDrawEntry(data?.entry || null);
        if (data?.entry?.platform) setSocialPlatform(String(data.entry.platform));
        if (data?.entry?.handle) setSocialHandle(String(data.entry.handle));
      })
      .catch((error) => {
        if (!active) return;
        setLuckyDrawError(error.message || "Failed to load entry");
      })
      .finally(() => {
        if (active) setLuckyDrawLoading(false);
      });
    return () => {
      active = false;
    };
  }, [isLuckyDrawModalOpen, token]);

  useEffect(() => {
    if (!isMissionsOpen || !token) return;
    let active = true;
    fetch("/api/auth/referral-stats", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json().then((data) => ({ res, data })))
      .then(({ res, data }) => {
        if (!active || !res.ok) return;
        const verified = Number(data?.totals?.verified || 0);
        setReferralVerifiedCount(verified);
        if (verified >= 5) {
          const referralMission = missions.find((mission) => mission.type === "referral");
          if (referralMission && !completedMissions[referralMission.id]) {
            const next = { ...completedMissions, [referralMission.id]: true };
            setCompletedMissions(next);
            persistCompletedMissions(next);
          }
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [isMissionsOpen, token, missions, completedMissions]);

  const filteredTranslateLanguages = availableTranslateLanguages.filter((lang) =>
    lang.label.toLowerCase().includes(translateSearch.trim().toLowerCase())
  );

  const translateTo = (langCode) => {
    const code = String(langCode || "en").toLowerCase();
    setSelectedTranslateLang(code);
    localStorage.setItem("site_translate_lang", code);
    setIsTranslateOpen(false);

    // Google website translator uses this cookie to choose language.
    const googTransValue = code === "en" ? "/auto/en" : `/auto/${code}`;
    document.cookie = `googtrans=${googTransValue};path=/`;
    document.cookie = `googtrans=${googTransValue};path=/;SameSite=Lax`;
    window.location.reload();
  };

  const handleLuckyDrawSubmit = async (e, visibleMissions) => {
    e.preventDefault();
    if (!token || !user?.id) {
      openAuthModal?.();
      toast.show("Please log in to submit your lucky draw entry.", "error");
      return;
    }
    const allComplete = visibleMissions.length === 5
      && visibleMissions.every((mission) => completedMissions[mission.id]);
    if (!allComplete) {
      toast.show("Complete all 5 missions to unlock the lucky draw entry.", "error");
      return;
    }
    if (luckyDrawEntry) {
      toast.show("Entry already submitted for today.", "info");
      return;
    }
    const platform = String(socialPlatform || "").trim().toLowerCase();
    const handle = String(socialHandle || "").trim();
    if (!LUCKY_DRAW_SOCIALS.includes(platform)) {
      toast.show("Select a valid social platform.", "error");
      return;
    }
    if (!handle) {
      toast.show("Please enter your social ID.", "error");
      return;
    }

    setLuckyDrawSubmitting(true);
    setLuckyDrawError("");
    try {
      const response = await fetch("/api/lucky-draw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ platform, handle }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Failed to submit entry");
      }
      setLuckyDrawEntry(data?.entry || { platform, handle });
      setIsLuckyDrawModalOpen(false);
      toast.show("Lucky draw entry submitted!", "success");
    } catch (error) {
      setLuckyDrawError(error.message || "Failed to submit entry");
      toast.show(error.message || "Failed to submit entry", "error");
    } finally {
      setLuckyDrawSubmitting(false);
    }
  };

  // Generate initials for avatar fallback
  const getInitials = (name) => {
    if (!name) return "U";
    return name.substring(0, 2).toUpperCase();
  };

  const openDeleteAccountModal = () => {
    setDeleteAccountPassword("");
    setDeleteAccountVerified(false);
    setDeleteAccountVerifying(false);
    setDeleteAccountSubmitting(false);
    setDeleteAccountError("");
    setIsConfirmDeleteAccountOpen(true);
  };

  const verifyDeletePassword = async () => {
    const password = String(deleteAccountPassword || "").trim();
    if (!password || !token) return;

    setDeleteAccountVerifying(true);
    setDeleteAccountError("");
    try {
      const response = await fetch("/api/auth/verify-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Failed to verify password");
      if (!data.valid) {
        setDeleteAccountVerified(false);
        setDeleteAccountError("Password does not match.");
        return;
      }
      setDeleteAccountVerified(true);
      setDeleteAccountError("");
    } catch (err) {
      setDeleteAccountVerified(false);
      setDeleteAccountError(err.message || "Failed to verify password");
    } finally {
      setDeleteAccountVerifying(false);
    }
  };

  const deleteAccountNow = async () => {
    if (!deleteAccountVerified || !token) return;
    setDeleteAccountSubmitting(true);
    setDeleteAccountError("");
    try {
      const response = await fetch("/api/auth/delete-account", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password: deleteAccountPassword }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Failed to delete account");
      setIsConfirmDeleteAccountOpen(false);
      logout();
    } catch (err) {
      setDeleteAccountError(err.message || "Failed to delete account");
    } finally {
      setDeleteAccountSubmitting(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[var(--bg-primary)]/80 border-b border-[var(--accent)] transition-all duration-300">
        <div className="w-full px-2 sm:px-4 lg:px-6 py-2 md:py-2.5 relative flex items-center justify-between">

          {/* Left: Logo */}
          <div className="flex-shrink-0 h-10 md:h-12 flex items-center">
            <HeaderLogo />
          </div>

          {/* Center: Website Name */}
          <div className="flex-1 min-w-0 text-center pointer-events-none px-2 xl:px-6">
            <h1 className="block text-[11px] sm:text-base lg:text-2xl xl:text-3xl font-black tracking-[0.08em] sm:tracking-widest xl:tracking-[0.2em] uppercase text-[var(--accent)] pointer-events-auto leading-tight whitespace-normal lg:whitespace-nowrap break-words">
              ARIRANG SPOTIFY TAKEOVER!!!
            </h1>
          </div>

          {/* Right Section - Desktop */}
          <div className="hidden md:flex items-center justify-end ml-auto gap-2 lg:gap-3">
            {onToggleSection && (
              <button
                onClick={() => {
                  onToggleSection("topic-rooms");
                }}
                className="relative w-9 h-9 rounded-full bg-[var(--card-bg)]/50 backdrop-blur-xl border border-[var(--accent)]/40 hover:bg-[var(--accent)]/10 hover:border-[var(--accent)] transition-all duration-300 flex items-center justify-center"
                aria-label="Topic Rooms"
                title="Topic Rooms"
              >
                <IconMessage className="w-4 h-4" />
                {topicRoomsUnread > 0 ? (
                  <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-black leading-none flex items-center justify-center border border-white/20">
                    {topicRoomsUnread > 99 ? "99+" : topicRoomsUnread}
                  </span>
                ) : topicRoomsActiveCount > 0 ? (
                  <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border border-[var(--bg-primary)]/80" />
                ) : null}
              </button>
            )}

            <button
              onClick={() => setIsLuckyDrawModalOpen(true)}
              className="relative w-9 h-9 rounded-full bg-[var(--card-bg)]/50 backdrop-blur-xl border border-[var(--accent)]/40 hover:bg-[var(--accent)]/10 hover:border-[var(--accent)] transition-all duration-300 flex items-center justify-center"
              aria-label="Lucky Draw"
              title="Lucky Draw"
            >
              <IconGift className="w-4 h-4" />
            </button>

            <div id="onboarding-header-translate" className="relative" ref={translateRef}>
              <button
                onClick={() => {
                  setIsTranslateOpen((prev) => !prev);
                  setTranslateSearch("");
                }}
                className="w-9 h-9 rounded-full bg-[var(--card-bg)]/50 backdrop-blur-xl border border-[var(--accent)]/40 hover:bg-[var(--accent)]/10 hover:border-[var(--accent)] transition-all duration-300 flex items-center justify-center"
                aria-label="Translate"
                title="Translate"
                aria-expanded={isTranslateOpen}
                aria-haspopup="menu"
              >
                <IconGlobe className="w-4 h-4" />
              </button>

              {isTranslateOpen && (
                <div className="absolute right-0 mt-2 w-56 max-h-72 overflow-y-auto no-scrollbar bg-[var(--card-bg)] border border-[var(--accent)]/30 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <p className="px-3 pb-2 text-[10px] leading-snug text-[var(--text-secondary)]/80 text-center">
                    If you see &quot;No language found&quot;, please refresh the page and you&apos;ll be able to see them.
                  </p>
                  <div className="px-3 pb-2 border-b border-[var(--accent)]/20">
                    <input
                      type="text"
                      value={translateSearch}
                      onChange={(e) => setTranslateSearch(e.target.value)}
                      placeholder="Search language..."
                      className="w-full bg-[var(--bg-primary)]/50 border border-[var(--accent)]/30 rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-all"
                    />
                  </div>
                  {translateLoading ? (
                    <div className="px-4 py-3 text-xs text-[var(--text-secondary)]/70">Loading languages...</div>
                  ) : filteredTranslateLanguages.length === 0 ? (
                    <div className="px-4 py-3 text-xs text-[var(--text-secondary)]/70">No language found</div>
                  ) : filteredTranslateLanguages.map((lang) => {
                    const active = selectedTranslateLang === lang.code;
                    return (
                      <button
                        key={lang.code}
                        onClick={() => translateTo(lang.code)}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${
                          active ? "bg-[var(--accent)]/10 text-[var(--accent)] font-bold" : "hover:bg-[var(--accent)]/10"
                        }`}
                      >
                        <span>{lang.label}</span>
                        {active ? <span className="text-[10px] uppercase tracking-widest">Selected</span> : null}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {user && (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="w-9 h-9 rounded-full bg-[var(--accent)] text-white flex items-center justify-center text-sm font-bold overflow-hidden border-2 border-[var(--accent)]/50 hover:border-[var(--accent)] transition-colors focus:outline-none"
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
                    ) : null}
                    <button
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        openScrobblerModal();
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--accent)]/10 transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <IconMusic /> {scrobblerCtaLabel}
                      </div>
                    </button>

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

                    <button
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        if (onToggleSection) onToggleSection("share-milestone");
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--accent)]/10 transition-colors flex items-center gap-2"
                    >
                      <IconShare /> Share Milestone
                    </button>

                    <button
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        if (onToggleSection) onToggleSection("settings");
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--accent)]/10 transition-colors flex items-center gap-2"
                    >
                      <IconTools /> Account Settings
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

            {/* Help Desk Button */}
            <button
              onClick={() => setIsHelpOpen(true)}
              className="px-3 lg:px-4 py-1.5 lg:py-2 text-[10px] lg:text-xs font-bold rounded-xl
               bg-[var(--card-bg)]/40 backdrop-blur-xl
               border border-[var(--accent)]/40
               hover:bg-[var(--accent)]/10
               transition-all duration-300 whitespace-nowrap uppercase tracking-widest"
            >
              Help
            </button>

          </div>

          {/* Right Section - Mobile Hamburger */}
          <div className="md:hidden flex items-center" ref={mobileMenuRef}>
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

            {/* Mobile Menu Dropdown */}
            {isMenuOpen && (
              <div className="absolute top-full right-0 w-64 max-h-[calc(100vh-72px)] overflow-y-auto overscroll-contain no-scrollbar bg-[var(--bg-primary)]/95 backdrop-blur-xl border border-[var(--accent)]/30 rounded-bl-3xl shadow-2xl animate-in fade-in slide-in-from-top-5 duration-200 z-50">
                <div className="px-4 py-5 space-y-4 flex flex-col items-stretch">
                  
                  {/* Mobile Toggle Switch */}
                  <div className="flex items-center justify-between px-2">
                    <span className="text-xs font-black uppercase tracking-widest opacity-60">Theme</span>
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

                  <div className="px-2">
                    <button
                      type="button"
                      onClick={() => setIsMobileTranslateOpen((prev) => !prev)}
                      className="w-full px-3 py-2 text-[10px] font-black rounded-xl bg-[var(--card-bg)]/60 border border-[var(--accent)]/40 hover:bg-[var(--accent)]/10 transition-all tracking-widest uppercase flex items-center justify-between"
                    >
                      <span className="inline-flex items-center gap-2">
                        <IconGlobe className="w-3.5 h-3.5" />
                        Translate
                      </span>
                      <svg viewBox="0 0 24 24" fill="none" className={`w-3.5 h-3.5 transition-transform ${isMobileTranslateOpen ? "rotate-180" : ""}`} aria-hidden="true">
                        <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    {isMobileTranslateOpen ? (
                      <div className="mt-2">
                        <p className="text-[10px] leading-snug text-[var(--text-secondary)]/80 mb-2 text-center">
                          If you see &quot;No language found&quot;, please refresh the page and you&apos;ll be able to see them.
                        </p>
                        <input
                          type="text"
                          value={translateSearch}
                          onChange={(e) => setTranslateSearch(e.target.value)}
                          placeholder="Search language..."
                          className="w-full mb-2 bg-[var(--card-bg)]/60 border border-[var(--accent)]/30 rounded-lg px-3 py-2 text-[10px] font-semibold focus:outline-none focus:border-[var(--accent)]"
                        />
                        <div className="relative">
                          <IconGlobe className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 opacity-60" />
                          <select
                            value={selectedTranslateLang}
                            onChange={(e) => {
                              setIsMenuOpen(false);
                              translateTo(e.target.value);
                            }}
                            className="w-full pl-9 pr-3 py-2.5 text-[10px] font-black rounded-xl bg-[var(--card-bg)]/60 border border-[var(--accent)]/40 hover:bg-[var(--accent)]/10 transition-all uppercase tracking-widest appearance-none"
                          >
                            {translateLoading ? (
                              <option value={selectedTranslateLang}>Loading languages...</option>
                            ) : filteredTranslateLanguages.length === 0 ? (
                              <option value={selectedTranslateLang}>No language found</option>
                            ) : (
                              filteredTranslateLanguages.map((lang) => (
                                <option key={lang.code} value={lang.code}>
                                  {lang.label}
                                </option>
                              ))
                            )}
                          </select>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {/* Mobile Missions Button */}
                  <button
                    onClick={() => {
                      if (onToggleSection) onToggleSection("missions");
                      setIsMenuOpen(false);
                    }}
                    className="w-full px-5 py-3 text-[10px] font-black rounded-xl
                     bg-[var(--card-bg)]/60 
                     border border-[var(--accent)]/40
                     hover:bg-[var(--accent)]/10
                     transition-all duration-300 tracking-widest uppercase flex items-center justify-center gap-2"
                  >
                    <IconClipboard /> Missions
                  </button>

                  {/* Mobile Top Achievers Button */}
                  <button
                    onClick={() => {
                      if (onToggleSection) onToggleSection('top-achievers');
                      setIsMenuOpen(false);
                    }}
                    className="w-full px-5 py-3 text-[10px] font-black rounded-xl
                     bg-[var(--card-bg)]/60 
                     border border-[var(--accent)]/40
                     hover:bg-[var(--accent)]/10
                     transition-all duration-300 tracking-widest uppercase flex items-center justify-center gap-2"
                  >
                    <IconTop /> Top 10 Achievers
                  </button>

                  {onToggleSection && (
                    <button
                      onClick={() => {
                        onToggleSection("topic-rooms");
                        setIsMenuOpen(false);
                      }}
                      className="w-full px-5 py-3 text-[10px] font-black rounded-xl
                       bg-[var(--card-bg)]/60 
                       border border-[var(--accent)]/40
                       hover:bg-[var(--accent)]/10
                       transition-all duration-300 tracking-widest uppercase flex items-center justify-center gap-2"
                    >
                      <IconMessage /> Chat Rooms
                      {topicRoomsUnread > 0 ? (
                        <span className="min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-black leading-none flex items-center justify-center border border-white/20">
                          {topicRoomsUnread > 99 ? "99+" : topicRoomsUnread}
                        </span>
                      ) : null}
                    </button>
                  )}

                  {/* Mobile Recent Battles Button */}
                  <button
                    onClick={() => {
                      if (onToggleSection) onToggleSection('recent-battles');
                      setIsMenuOpen(false);
                    }}
                    className="w-full px-5 py-3 text-[10px] font-black rounded-xl
                     bg-[var(--card-bg)]/60 
                     border border-[var(--accent)]/40
                     hover:bg-[var(--accent)]/10
                     transition-all duration-300 tracking-widest uppercase flex items-center justify-center gap-2"
                  >
                    <IconRecent /> Recent Battles
                  </button>

                  {/* Mobile Support Button */}
                  <button
                    onClick={() => {
                      if (onToggleSection) onToggleSection('contact');
                      setIsMenuOpen(false);
                    }}
                    className="w-full px-5 py-3 text-[10px] font-black rounded-xl
                     bg-[var(--card-bg)]/60 
                     border border-[var(--accent)]/40
                     hover:bg-[var(--accent)]/10
                     transition-all duration-300 tracking-widest uppercase flex items-center justify-center gap-2"
                  >
                    <IconSupport /> Support
                  </button>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsLuckyDrawModalOpen(true);
                    }}
                    className="w-full px-5 py-3 text-[10px] font-black rounded-xl
                     bg-[var(--card-bg)]/60 
                     border border-[var(--accent)]/40
                     hover:bg-[var(--accent)]/10
                     transition-all duration-300 tracking-widest uppercase flex items-center justify-center gap-2"
                  >
                    <IconGift /> Lucky Draw
                  </button>

                  {/* Mobile Profile Actions (if logged in) */}
                  {user && (
                    <div className="space-y-2 border-t border-[var(--accent)]/20 pt-4 mt-2">
                      <p className="text-center text-[9px] font-black uppercase tracking-[0.2em] opacity-40 mb-3">Account</p>
                      
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          setIsProfilePicModalOpen(true);
                        }}
                        className="w-full px-5 py-3 text-[10px] font-black rounded-xl bg-[var(--card-bg)]/60 border border-[var(--accent)]/20 hover:bg-[var(--accent)]/10 transition-all flex items-center justify-center gap-2 tracking-widest uppercase"
                      >
                        <IconCamera /> Profile Pic
                      </button>

                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          if (onToggleSection) onToggleSection("share-milestone");
                        }}
                        className="w-full px-5 py-3 text-[10px] font-black rounded-xl bg-[var(--card-bg)]/60 border border-[var(--accent)]/20 hover:bg-[var(--accent)]/10 transition-all flex items-center justify-center gap-2 tracking-widest uppercase"
                      >
                        <IconShare /> Share Milestone
                      </button>

                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          if (onToggleSection) onToggleSection("settings");
                        }}
                        className="w-full px-5 py-3 text-[10px] font-black rounded-xl bg-[var(--card-bg)]/60 border border-[var(--accent)]/20 hover:bg-[var(--accent)]/10 transition-all flex items-center justify-center gap-2 tracking-widest uppercase"
                      >
                        <IconTools /> Account Settings
                      </button>

                      {user?.role === "admin" && (
                        <button
                          onClick={() => {
                            setIsMenuOpen(false);
                            if (onToggleSection) onToggleSection('admin');
                          }}
                          className="w-full px-5 py-3 text-[10px] font-black rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 hover:bg-[var(--accent)]/20 transition-all flex items-center justify-center gap-2 tracking-widest uppercase"
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
                          className="w-full px-5 py-3 text-[10px] font-black rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-all flex items-center justify-center gap-2 tracking-widest uppercase"
                        >
                          <IconDisconnect /> Disconnect LF
                        </button>
                      ) : null}
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          openScrobblerModal();
                        }}
                        className="w-full px-5 py-3 text-[10px] font-black rounded-xl bg-[var(--card-bg)]/60 border border-[var(--accent)]/20 hover:bg-[var(--accent)]/10 transition-all flex items-center justify-center gap-2 tracking-widest uppercase"
                      >
                        <IconMusic /> {scrobblerCtaLabel}
                      </button>

                      <button
                        onClick={() => {
                          logout();
                          setIsMenuOpen(false);
                        }}
                        className="w-full px-5 py-3 text-[10px] font-black rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-all flex items-center justify-center gap-2 tracking-widest uppercase"
                      >
                        <IconLogout /> Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <DailyMissionsDrawer
        isOpen={isMissionsOpen}
        onClose={() => {
          setIsMissionsOpen(false);
          window.dispatchEvent(new Event("close-daily-missions"));
        }}
        missions={missions}
        missionsLoading={missionsLoading}
        completedMissions={completedMissions}
        onCompleteMission={(missionId) => {
          const mission = missions.find((item) => item.id === missionId);
          if (mission?.type === "referral") {
            toast.show("Referral mission auto-completes after 5 friends join.", "info");
            return;
          }
          const next = { ...completedMissions, [missionId]: true };
          setCompletedMissions(next);
          persistCompletedMissions(next);
        }}
        referralVerifiedCount={referralVerifiedCount}
        referralLink={referralLink}
      />

      {isLuckyDrawModalOpen && (
        <div className="fixed inset-0 z-[96] flex items-center justify-center bg-black/60 backdrop-blur-sm text-[var(--text-primary)]">
          <div className="bg-[var(--card-bg)] border border-[var(--accent)]/40 p-6 rounded-2xl shadow-2xl w-[92%] max-w-lg relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setIsLuckyDrawModalOpen(false)}
              className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              aria-label="Close lucky draw"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center">
                <IconGift className="w-5 h-5 text-[var(--accent)]" />
              </div>
              <div>
                <h2 className="text-xl font-black text-[var(--accent)]">Lucky Draw</h2>
                <p className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)]">
                  Complete all 5 missions to enter
                </p>
              </div>
            </div>

            {luckyDrawLoading ? (
              <p className="text-sm font-semibold text-[var(--text-secondary)]">Loading entry...</p>
            ) : (
              (() => {
                const visibleMissions = missions.filter((mission) => mission.active !== false);
                const completedCount = visibleMissions.filter((mission) => completedMissions[mission.id]).length;
                const allComplete = visibleMissions.length === 5
                  && visibleMissions.every((mission) => completedMissions[mission.id]);
                return (
                  <>
                    <div className="rounded-xl border border-[var(--accent)]/15 bg-[var(--bg-primary)]/30 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-3">
                      Progress: {completedCount}/{visibleMissions.length || 5}
                    </div>

                    <div className="space-y-2 max-h-[38vh] overflow-y-auto no-scrollbar pr-1">
                      {visibleMissions.map((mission) => (
                        <div key={mission.id} className="rounded-xl border border-[var(--accent)]/15 bg-[var(--bg-primary)]/40 p-3">
                          <div className="flex items-start justify-between gap-3 mb-1">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-black text-[var(--accent)] truncate">{mission.title}</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              aria-label="Mark complete"
                              disabled={Boolean(completedMissions[mission.id])}
                              onClick={() => {
                                const next = { ...completedMissions, [mission.id]: true };
                                setCompletedMissions(next);
                                persistCompletedMissions(next);
                                setJustCompletedMissionId(mission.id);
                                setTimeout(() => setJustCompletedMissionId((prev) => (prev === mission.id ? null : prev)), 500);
                              }}
                              className={`shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-xl transition-all ${
                                completedMissions[mission.id]
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-not-allowed"
                                  : "bg-[var(--accent)] text-black hover:brightness-110 border border-[var(--accent)]/40"
                              } ${justCompletedMissionId === mission.id ? "scale-110 ring-2 ring-emerald-400/60" : ""}`}
                            >
                              <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.6" aria-hidden="true">
                                <path d="M4 10l4 4 8-8" />
                              </svg>
                            </button>
                          </div>
                          <p className="text-xs font-semibold text-[var(--text-primary)]/80">{mission.description}</p>
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <p className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-black">
                              Target: {mission.target} {mission.unit}
                            </p>
                          </div>
                          {mission.type === "referral" && referralLink ? (
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  await navigator.clipboard.writeText(referralLink);
                                  toast.show("Referral link copied!", "success");
                                } catch {
                                  toast.show("Copy failed. Please copy manually.", "error");
                                }
                              }}
                              className="mt-2 px-3 py-1.5 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 text-[9px] font-black uppercase tracking-widest hover:bg-[var(--accent)] hover:text-black transition-all flex items-center gap-2"
                            >
                              <IconClipboard className="w-3.5 h-3.5" /> Copy Referral
                            </button>
                          ) : null}
                        </div>
                      ))}
                    </div>

                    {allComplete ? (
                      <form onSubmit={(e) => handleLuckyDrawSubmit(e, visibleMissions)} className="mt-4 rounded-xl border border-[var(--accent)]/20 bg-[var(--bg-primary)]/40 p-3">
                        <p className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-black mb-3">
                          Submit your social contact
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr_auto] gap-2">
                          <select
                            value={socialPlatform}
                            onChange={(e) => setSocialPlatform(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-[var(--bg-primary)]/60 border border-[var(--accent)]/30 text-xs font-semibold focus:outline-none focus:border-[var(--accent)] appearance-none"
                          >
                            <option value="">Select Platform</option>
                            {LUCKY_DRAW_SOCIALS.map((platform) => (
                              <option key={platform} value={platform}>
                                {platform}
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={socialHandle}
                            onChange={(e) => setSocialHandle(e.target.value)}
                            placeholder="Your ID/handle"
                            className="w-full px-3 py-2 rounded-xl bg-[var(--bg-primary)]/60 border border-[var(--accent)]/30 text-xs font-semibold focus:outline-none focus:border-[var(--accent)]"
                          />
                          <button
                            type="submit"
                            disabled={luckyDrawSubmitting || Boolean(luckyDrawEntry)}
                            className="px-3 py-2 rounded-xl bg-[var(--accent)] text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {luckyDrawEntry ? "Submitted" : luckyDrawSubmitting ? "Submitting..." : "Submit"}
                          </button>
                        </div>
                        {luckyDrawEntry && (
                          <p className="mt-3 text-[10px] font-black uppercase tracking-widest text-emerald-400">
                            Entry already submitted for today.
                          </p>
                        )}
                        {luckyDrawError && (
                          <p className="mt-2 text-[10px] font-black text-red-400">{luckyDrawError}</p>
                        )}
                      </form>
                    ) : (
                      <p className="mt-3 text-xs font-semibold text-[var(--text-secondary)]">
                        Finish all missions to unlock the entry form.
                      </p>
                    )}
                  </>
                );
              })()
            )}
          </div>
        </div>
      )}

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
      {isScrobblerModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-[92%] max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl bg-[var(--card-bg)]/85 backdrop-blur-2xl border border-[var(--accent)]/30 text-[var(--text-primary)]">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight text-[var(--accent)]">Connect Your Scrobbler</h2>
                <p className="text-[11px] font-semibold text-[var(--text-secondary)] mt-1">
                  Last.fm connects automatically. stats.fm and Musicat require a profile link.
                </p>
              </div>
              <button
                onClick={() => setIsScrobblerModalOpen(false)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                aria-label="Close scrobbler modal"
              >
                X
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Scrobbler</p>
                <select
                  value={scrobblerType}
                  onChange={(e) => {
                    setScrobblerType(e.target.value);
                    setScrobblerError("");
                  }}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-2.5 rounded-xl text-sm outline-none focus:border-[var(--accent)]"
                >
                  <option value="lastfm">Last.fm</option>
                  <option value="statsfm">stats.fm</option>
                  <option value="musicat">Musicat</option>
                </select>
              </div>

              {scrobblerType !== "lastfm" && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Profile Link</p>
                  <input
                    value={scrobblerLink}
                    onChange={(e) => setScrobblerLink(e.target.value)}
                    placeholder="Paste your profile link"
                    className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 p-2.5 rounded-xl text-sm outline-none focus:border-[var(--accent)]"
                  />
                </div>
              )}

              {user?.lastfmUsername && scrobblerType === "lastfm" && (
                <p className="text-xs font-semibold text-emerald-300">
                  Connected: {user.lastfmUsername}
                </p>
              )}
              {user?.scrobblerLink && scrobblerType !== "lastfm" && (
                <p className="text-xs font-semibold text-[var(--text-secondary)] break-all">
                  Current link: {user.scrobblerLink}
                </p>
              )}
              {scrobblerError && <p className="text-xs font-bold text-red-400">{scrobblerError}</p>}
            </div>

            <div className="mt-5 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => setIsScrobblerModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-[var(--accent)]/30 text-[var(--text-secondary)] font-bold hover:bg-[var(--accent)]/10 transition-all"
              >
                Cancel
              </button>
              {scrobblerType !== "lastfm" && (user?.scrobblerLink || scrobblerLink) && (
                <button
                  type="button"
                  onClick={handleClearScrobbler}
                  disabled={scrobblerSaving}
                  className="flex-1 py-2.5 rounded-xl border border-red-400/30 text-red-300 font-bold hover:bg-red-500/10 transition-all disabled:opacity-50"
                >
                  Disconnect
                </button>
              )}
              <button
                type="button"
                onClick={handleSaveScrobbler}
                disabled={scrobblerSaving}
                className="flex-1 py-2.5 rounded-xl bg-[var(--accent)] text-white font-bold hover:opacity-90 transition-all disabled:opacity-50"
              >
                {scrobblerType === "lastfm" ? "Connect Last.fm" : "Save Link"}
              </button>
            </div>
          </div>
        </div>
      )}
      <div id="google_translate_element" className="hidden" />

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
              updateUser({
                ...user,
                lastfmUsername: null,
                scrobblerType: user?.scrobblerType === "lastfm" ? null : user?.scrobblerType,
                scrobblerLink: user?.scrobblerType === "lastfm" ? null : user?.scrobblerLink,
              });
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

      {isConfirmDeleteAccountOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-[90%] max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative transition-all duration-300 transform animate-in zoom-in-95 duration-300 bg-[var(--card-bg)]/80 backdrop-blur-2xl border-2 border-[var(--accent)]/30 text-[var(--text-primary)]">
            <h2 className="text-2xl font-black mb-3 text-center uppercase tracking-tighter">
              Delete Account
            </h2>
            <p className="text-center text-sm mb-5 opacity-80 leading-relaxed font-medium">
              Once you confirm your password, your account will be permanently deleted. This action cannot be undone. Please make sure to back up any important data before proceeding.
            </p>

            <div className="space-y-3">
              <input
                type="password"
                value={deleteAccountPassword}
                onChange={(e) => {
                  setDeleteAccountPassword(e.target.value);
                  setDeleteAccountVerified(false);
                  setDeleteAccountError("");
                }}
                placeholder="Enter your password"
                className="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)]/50 border border-[var(--accent)]/30 focus:border-[var(--accent)] outline-none transition-colors text-[var(--text-primary)]"
              />
              <button
                onClick={() => void verifyDeletePassword()}
                disabled={deleteAccountVerifying || !String(deleteAccountPassword || "").trim()}
                className="w-full py-3 rounded-2xl border border-[var(--accent)]/30 text-[var(--accent)] font-black uppercase tracking-widest text-xs hover:bg-[var(--accent)]/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteAccountVerifying ? "Verifying..." : "Verify Password"}
              </button>

              {deleteAccountVerified ? (
                <p className="text-center text-xs font-black uppercase tracking-widest text-emerald-400">Password verified</p>
              ) : null}
              {deleteAccountError ? (
                <p className="text-center text-xs font-black text-red-400">{deleteAccountError}</p>
              ) : null}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-2">
              <button
                onClick={() => void deleteAccountNow()}
                disabled={!deleteAccountVerified || deleteAccountSubmitting}
                className="w-full py-2.5 rounded-xl bg-red-500 text-white font-black uppercase tracking-wider text-[11px] hover:opacity-90 transition-all shadow-lg shadow-red-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteAccountSubmitting ? "Deleting..." : "Delete Account"}
              </button>
              <button
                onClick={() => setIsConfirmDeleteAccountOpen(false)}
                className="w-full py-2.5 rounded-xl bg-transparent border border-[var(--accent)]/30 text-[var(--text-primary)] font-bold uppercase tracking-wider text-[11px] hover:bg-[var(--accent)]/5 transition-all active:scale-95"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>

  );
}

export default Header;
