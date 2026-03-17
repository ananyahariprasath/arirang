import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import ConfirmModal from "../modals/ConfirmModal";

const DEFAULT_COVER = "/assets/images/bts-un-photo-1.jpg";
const TOPIC_ROOMS_EXITED_KEY_PREFIX = "topic_rooms_exited_v1_";
const TOPIC_ROOMS_READS_KEY_PREFIX = "topic_rooms_reads_v1_";
const TOPIC_ROOMS_UNREAD_KEY_PREFIX = "topic_rooms_unread_total_v1_";

function toIdentity(value) {
  return String(value || "").trim().replace(/^@+/, "").toLowerCase();
}

function formatTimeLeft(ms) {
  const safe = Math.max(0, ms);
  const totalSec = Math.floor(safe / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function UserNameWithBadge({ label, isAdmin }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={isAdmin ? "text-[var(--accent)]" : "text-pink-300"}>{label}</span>
    </span>
  );
}

function getInitials(label) {
  const value = String(label || "").trim();
  if (!value) return "?";
  return value.slice(0, 1).toUpperCase();
}

function Avatar({ label, src, className = "" }) {
  if (src) {
    return <img src={src} alt={label || "avatar"} className={`w-8 h-8 rounded-full object-cover border border-[var(--accent)]/30 ${className}`} />;
  }
  return (
    <div className={`w-8 h-8 rounded-full bg-[var(--accent)]/20 border border-[var(--accent)]/30 text-[var(--accent)] flex items-center justify-center text-xs font-black ${className}`}>
      {getInitials(label)}
    </div>
  );
}

export default function TopicRoomsModal({ isOpen = true, onClose, mode = "modal" }) {
  const { user } = useAuth();
  const toast = useToast();
  const [nowMs, setNowMs] = useState(Date.now());
  const [view, setView] = useState("landing"); // landing | create | join | room
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [previewImage, setPreviewImage] = useState(null);
  const [reportingMessageId, setReportingMessageId] = useState("");
  const [isReportConfirmOpen, setIsReportConfirmOpen] = useState(false);
  const [pendingReportMessage, setPendingReportMessage] = useState(null);

  const [config, setConfig] = useState({
    maxActiveRooms: 10,
    defaultDurationMins: 120,
  });

  const [rooms, setRooms] = useState([]);
  const [draft, setDraft] = useState({
    title: "",
    description: "",
    coverImage: DEFAULT_COVER,
    durationMins: 120,
  });
  const [draftCoverImageData, setDraftCoverImageData] = useState("");
  const [draftCoverImageName, setDraftCoverImageName] = useState("");
  const [messageDraft, setMessageDraft] = useState("");
  const [messageImageData, setMessageImageData] = useState("");
  const [messageImageName, setMessageImageName] = useState("");
  const [replyToMessage, setReplyToMessage] = useState(null);
  const [adminExpiryAt, setAdminExpiryAt] = useState("");
  const [exitedRoomIds, setExitedRoomIds] = useState([]);
  const [roomReadMap, setRoomReadMap] = useState({});
  const [storageReady, setStorageReady] = useState(false);
  const [exitConfirmRoomId, setExitConfirmRoomId] = useState("");
  const [transferTargetId, setTransferTargetId] = useState("");
  const messagesContainerRef = useRef(null);
  const adminExpiryInputRef = useRef(null);
  const isApplyingRemoteRef = useRef(false);
  const hasLoadedRemoteRef = useRef(false);

  const currentUserIdentity = toIdentity(user?.username || user?.email || "");
  const currentUserLabel = String(user?.username || user?.email || "you");
  const isAdmin = String(user?.role || "").toLowerCase() === "admin";
  const currentUserAvatar = String(user?.profilePicture || "");
  const currentUserRoomIdentity = currentUserIdentity || toIdentity(currentUserLabel);
  const exitedStorageKey = `${TOPIC_ROOMS_EXITED_KEY_PREFIX}${currentUserRoomIdentity || "guest"}`;
  const readsStorageKey = `${TOPIC_ROOMS_READS_KEY_PREFIX}${currentUserRoomIdentity || "guest"}`;
  const unreadStorageKey = `${TOPIC_ROOMS_UNREAD_KEY_PREFIX}${currentUserRoomIdentity || "guest"}`;

  const isUserInRoom = (room) =>
    room.participants.some((p) => toIdentity(p.id || p.label) === currentUserRoomIdentity);
  const isCreatorOfRoom = (room) =>
    toIdentity(room?.createdByIdentity) === currentUserRoomIdentity;

  useEffect(() => {
    let active = true;
    const fetchTopicRoomsState = async () => {
      try {
        const response = await fetch("/api/topic-rooms", { cache: "no-store" });
        const data = await response.json().catch(() => ({}));
        if (!active || !response.ok) return;
        isApplyingRemoteRef.current = true;
        setRooms(Array.isArray(data.rooms) ? data.rooms : []);
        setConfig((prev) => ({
          maxActiveRooms: Math.max(1, Number.parseInt(String(data?.config?.maxActiveRooms ?? prev.maxActiveRooms), 10) || prev.maxActiveRooms),
          defaultDurationMins: Math.max(5, Math.min(120, Number.parseInt(String(data?.config?.defaultDurationMins ?? prev.defaultDurationMins), 10) || prev.defaultDurationMins)),
        }));
        hasLoadedRemoteRef.current = true;
        setStorageReady(true);
      } catch {
        setStorageReady(true);
      } finally {
        setTimeout(() => {
          isApplyingRemoteRef.current = false;
        }, 0);
      }
    };
    fetchTopicRoomsState();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const intervalId = setInterval(async () => {
      try {
        const response = await fetch("/api/topic-rooms", { cache: "no-store" });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) return;
        isApplyingRemoteRef.current = true;
        setRooms(Array.isArray(data.rooms) ? data.rooms : []);
        setConfig((prev) => ({
          maxActiveRooms: Math.max(1, Number.parseInt(String(data?.config?.maxActiveRooms ?? prev.maxActiveRooms), 10) || prev.maxActiveRooms),
          defaultDurationMins: Math.max(5, Math.min(120, Number.parseInt(String(data?.config?.defaultDurationMins ?? prev.defaultDurationMins), 10) || prev.defaultDurationMins)),
        }));
      } catch {
        // Silent polling failure.
      } finally {
        setTimeout(() => {
          isApplyingRemoteRef.current = false;
        }, 0);
      }
    }, 15000);
    return () => clearInterval(intervalId);
  }, [isOpen]);


  useEffect(() => {
    if (!hasLoadedRemoteRef.current) return;
    if (isApplyingRemoteRef.current) return;
    const timeoutId = setTimeout(async () => {
      try {
        await fetch("/api/topic-rooms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rooms, config }),
        });
      } catch {
        // Silent write failure; next poll can reconcile.
      }
    }, 450);
    return () => clearTimeout(timeoutId);
  }, [rooms, config]);

  useEffect(() => {
    try {
      const rawExited = localStorage.getItem(exitedStorageKey);
      if (rawExited) {
        const parsed = JSON.parse(rawExited);
        setExitedRoomIds(Array.isArray(parsed) ? parsed : []);
      } else {
        setExitedRoomIds([]);
      }
    } catch {
      setExitedRoomIds([]);
    }
  }, [exitedStorageKey]);

  useEffect(() => {
    try {
      const rawReads = localStorage.getItem(readsStorageKey);
      if (rawReads) {
        const parsed = JSON.parse(rawReads);
        setRoomReadMap(parsed && typeof parsed === "object" ? parsed : {});
      } else {
        setRoomReadMap({});
      }
    } catch {
      setRoomReadMap({});
    }
  }, [readsStorageKey]);

  useEffect(() => {
    if (!storageReady) return;
    try {
      localStorage.setItem(exitedStorageKey, JSON.stringify(exitedRoomIds));
    } catch {
      // Best-effort persistence.
    }
  }, [exitedRoomIds, exitedStorageKey, storageReady]);

  useEffect(() => {
    if (!storageReady) return;
    try {
      localStorage.setItem(readsStorageKey, JSON.stringify(roomReadMap));
    } catch {
      // Best-effort persistence.
    }
  }, [roomReadMap, readsStorageKey, storageReady]);

  useEffect(() => {
    if (!isOpen) return;
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, [isOpen]);

  useEffect(() => {
    if (!rooms.length) return;
    setRooms((prev) =>
      {
        let changed = false;
        const next = prev.map((room) => {
        if (room.status !== "active") return room;
        if (room.expiresAt <= nowMs) {
          changed = true;
          return { ...room, status: "expired", expiredAt: nowMs, messages: [] };
        }
        return room;
      });
        return changed ? next : prev;
      }
    );
  }, [nowMs, rooms.length]);

  const activeRooms = useMemo(
    () => rooms.filter((room) => room.status === "active" && room.expiresAt > nowMs),
    [rooms, nowMs]
  );
  const currentUserActiveRooms = useMemo(
    () => activeRooms.filter((room) => isUserInRoom(room)),
    [activeRooms, currentUserRoomIdentity]
  );
  const currentUserCreatedActiveRoom = useMemo(
    () => activeRooms.find((room) => toIdentity(room.createdByIdentity) === currentUserRoomIdentity) || null,
    [activeRooms, currentUserRoomIdentity]
  );
  const visibleActiveRooms = useMemo(
    () =>
      activeRooms.filter((room) =>
        !exitedRoomIds.includes(room.id) || isUserInRoom(room) || isCreatorOfRoom(room)
      ),
    [activeRooms, exitedRoomIds, currentUserRoomIdentity]
  );

  const canCreateRoom = isAdmin || (activeRooms.length < config.maxActiveRooms && !currentUserCreatedActiveRoom);
  const selectedRoom = useMemo(
    () => rooms.find((room) => room.id === selectedRoomId) || null,
    [rooms, selectedRoomId]
  );

  const getRoomUnreadCount = (room) => {
    if (!room || !Array.isArray(room.messages)) return 0;
    const lastReadAt = Number(roomReadMap?.[room.id] || 0);
    return room.messages.filter((m) => {
      const fromOtherUser = toIdentity(m.authorIdentity) !== currentUserRoomIdentity;
      const createdAtMs = Number(m.createdAtMs || 0);
      return fromOtherUser && createdAtMs > lastReadAt;
    }).length;
  };

  const totalUnreadCount = useMemo(
    () => currentUserActiveRooms.reduce((sum, room) => sum + getRoomUnreadCount(room), 0),
    [currentUserActiveRooms, roomReadMap, currentUserRoomIdentity]
  );

  const markRoomAsRead = (roomId) => {
    if (!roomId) return;
    setRoomReadMap((prev) => ({ ...prev, [roomId]: Date.now() }));
  };

  useEffect(() => {
    if (view !== "room" || !selectedRoom) return;
    const el = messagesContainerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    markRoomAsRead(selectedRoom.id);
  }, [view, selectedRoomId, selectedRoom?.messages?.length]);

  useEffect(() => {
    try {
      localStorage.setItem(unreadStorageKey, String(totalUnreadCount));
    } catch {
      // Best-effort persistence.
    }
  }, [totalUnreadCount, unreadStorageKey]);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedRoomId("");
    setView("landing");
    setMessageDraft("");
    setMessageImageData("");
    setMessageImageName("");
    setReplyToMessage(null);
    setAdminExpiryAt("");
  }, [isOpen]);

  useEffect(() => {
    if (!selectedRoomId || !currentUserRoomIdentity) return;
    updateRoom(selectedRoomId, (prev) => {
      const existing = prev.userProfiles?.[currentUserRoomIdentity];
      const nextLabel = currentUserLabel;
      const nextAvatar = currentUserAvatar;
      if (existing?.label === nextLabel && existing?.avatar === nextAvatar) return prev;
      return {
        ...prev,
        userProfiles: {
          ...(prev.userProfiles || {}),
          [currentUserRoomIdentity]: { label: nextLabel, avatar: nextAvatar },
        },
      };
    });
  }, [selectedRoomId, currentUserRoomIdentity, currentUserLabel, currentUserAvatar]);

  const updateRoom = (roomId, updater) => {
    setRooms((prev) => prev.map((room) => (room.id === roomId ? updater(room) : room)));
  };

  const handleCreateRoom = () => {
    if (!isAdmin && currentUserCreatedActiveRoom) {
      toast.show("You can create only one active room at a time. Close or wait for expiry first.", "error");
      return;
    }
    if (!isAdmin && !canCreateRoom) {
      toast.show(`Room limit reached (${config.maxActiveRooms}). Wait for expiry or close a room.`, "error");
      return;
    }
    const title = String(draft.title || "").trim();
    if (title.length < 3) {
      toast.show("Room title must be at least 3 characters.", "error");
      return;
    }

    const duration = Number.parseInt(String(draft.durationMins || config.defaultDurationMins), 10);
    const boundedDuration = isAdmin
      ? (Number.isFinite(duration) ? Math.max(5, duration) : Math.max(5, config.defaultDurationMins))
      : 120;
    const creator = currentUserLabel;

    const newRoom = {
      id: `room-${Date.now()}`,
      title,
      description: String(draft.description || "").trim(),
      coverImage: draftCoverImageData || String(draft.coverImage || "").trim() || DEFAULT_COVER,
      coverImageName: draftCoverImageName || "",
      createdBy: creator,
      createdByRole: isAdmin ? "admin" : "user",
      createdByIdentity: currentUserRoomIdentity,
      createdAt: Date.now(),
      expiresAt: Date.now() + (boundedDuration * 60 * 1000),
      status: "active",
      participants: [{ id: currentUserRoomIdentity, label: creator }],
      userProfiles: {
        [currentUserRoomIdentity]: { label: creator, avatar: currentUserAvatar },
      },
      closedBy: "",
      closedAt: 0,
      messages: [],
    };

    setRooms((prev) => [newRoom, ...prev]);
    setSelectedRoomId(newRoom.id);
    setView("room");
    setDraft((prev) => ({
      ...prev,
      title: "",
      description: "",
      durationMins: isAdmin ? config.defaultDurationMins : 120,
    }));
    setDraftCoverImageData("");
    setDraftCoverImageName("");
    toast.show("Room created.", "success");
  };

  const handleJoinRoom = (roomId) => {
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return;
    if (room.status !== "active" || room.expiresAt <= nowMs) {
      toast.show("This room is not active anymore.", "error");
      return;
    }
    const exists = room.participants.some(
      (p) => toIdentity(p.id || p.label) === currentUserRoomIdentity
    );
    if (!exists) {
      updateRoom(roomId, (prev) => ({
        ...prev,
        participants: [...prev.participants, { id: currentUserRoomIdentity, label: currentUserLabel }],
        userProfiles: {
          ...(prev.userProfiles || {}),
          [currentUserRoomIdentity]: { label: currentUserLabel, avatar: currentUserAvatar },
        },
      }));
    }
    setExitedRoomIds((prev) => prev.filter((id) => id !== roomId));
    setSelectedRoomId(roomId);
    setView("room");
    markRoomAsRead(roomId);
  };

  const handleExitRoom = (roomId) => {
    if (!roomId) return;
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return;
    if (!isUserInRoom(room)) return;
    updateRoom(roomId, (prev) => ({
      ...prev,
      participants: prev.participants.filter(
        (p) => toIdentity(p.id || p.label) !== currentUserRoomIdentity
      ),
    }));
    setSelectedRoomId("");
    setView("landing");
    setExitedRoomIds((prev) => (prev.includes(roomId) ? prev : [...prev, roomId]));
    toast.show("You exited the room.", "success");
  };

  const handleAdminDeleteRoom = (roomId) => {
    if (!isAdmin) return;
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return;
    setRooms((prev) => prev.filter((r) => r.id !== roomId));
    setExitedRoomIds((prev) => prev.filter((id) => id !== roomId));
    if (selectedRoomId === roomId) {
      setSelectedRoomId("");
      setView("landing");
    }
    toast.show("Room deleted by admin.", "success");
  };

  const openExitPrompt = (roomId) => {
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return;
    setExitConfirmRoomId(roomId);
    setTransferTargetId("");
  };

  const closeExitPrompt = () => {
    setExitConfirmRoomId("");
    setTransferTargetId("");
  };

  const confirmSimpleExit = () => {
    if (!exitConfirmRoomId) return;
    handleExitRoom(exitConfirmRoomId);
    closeExitPrompt();
  };

  const confirmCreatorDeleteAndExit = () => {
    const room = rooms.find((r) => r.id === exitConfirmRoomId);
    if (!room) return;
    updateRoom(room.id, (prev) => ({
      ...prev,
      status: "closed",
      closedBy: currentUserLabel,
      closedAt: Date.now(),
      messages: [],
    }));
    setSelectedRoomId("");
    setView("landing");
    setExitedRoomIds((prev) => (prev.includes(room.id) ? prev : [...prev, room.id]));
    toast.show("Room deleted and you exited.", "success");
    closeExitPrompt();
  };

  const confirmCreatorTransferAndExit = () => {
    const room = rooms.find((r) => r.id === exitConfirmRoomId);
    if (!room) return;
    const nextOwner = room.participants.find(
      (p) => toIdentity(p.id || p.label) === toIdentity(transferTargetId)
    );
    if (!nextOwner) {
      toast.show("Select a user to transfer ownership.", "error");
      return;
    }
    updateRoom(room.id, (prev) => ({
      ...prev,
      createdBy: nextOwner.label || "User",
      createdByIdentity: toIdentity(nextOwner.id || nextOwner.label),
      createdByRole: "user",
      participants: prev.participants.filter(
        (p) => toIdentity(p.id || p.label) !== currentUserRoomIdentity
      ),
    }));
    setSelectedRoomId("");
    setView("landing");
    setExitedRoomIds((prev) => (prev.includes(room.id) ? prev : [...prev, room.id]));
    toast.show("Ownership transferred and you exited.", "success");
    closeExitPrompt();
  };

  const handleSelectMessageImage = (e) => {
    const file = e?.target?.files?.[0];
    if (!file) return;
    if (!String(file.type || "").startsWith("image/")) {
      toast.show("Please select an image file.", "error");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.show("Image must be 2MB or smaller.", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setMessageImageData(String(reader.result || ""));
      setMessageImageName(file.name || "image");
      toast.show("Image attached.", "success");
    };
    reader.onerror = () => toast.show("Failed to read image.", "error");
    reader.readAsDataURL(file);
  };

  const handleSelectDraftCoverImage = (e) => {
    const file = e?.target?.files?.[0];
    if (!file) return;
    if (!String(file.type || "").startsWith("image/")) {
      toast.show("Please select an image file.", "error");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.show("Image must be 2MB or smaller.", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setDraftCoverImageData(String(reader.result || ""));
      setDraftCoverImageName(file.name || "cover-image");
      toast.show("Title card image attached.", "success");
    };
    reader.onerror = () => toast.show("Failed to read image.", "error");
    reader.readAsDataURL(file);
  };

  const handleSendMessage = () => {
    if (!selectedRoom) return;
    if (selectedRoom.status !== "active" || selectedRoom.expiresAt <= nowMs) {
      toast.show("Room is closed or expired.", "error");
      return;
    }
    const text = String(messageDraft || "").trim();
    if (!text && !messageImageData) return;

    updateRoom(selectedRoom.id, (prev) => ({
      ...prev,
      messages: [
        ...prev.messages,
        {
          id: `msg-${Date.now()}`,
          author: currentUserLabel,
          authorIdentity: currentUserRoomIdentity,
          authorAvatar: currentUserAvatar,
          text,
          image: messageImageData || "",
          imageName: messageImageName || "",
          authorRole: isAdmin ? "admin" : "user",
          createdAt: new Date().toLocaleTimeString(),
          createdAtMs: Date.now(),
          replyToId: String(replyToMessage?.id || ""),
          replyToAuthor: String(replyToMessage?.author || ""),
          replyToText: String(replyToMessage?.text || ""),
          replyToImage: String(replyToMessage?.image || ""),
        },
      ],
      userProfiles: {
        ...(prev.userProfiles || {}),
        [currentUserRoomIdentity]: { label: currentUserLabel, avatar: currentUserAvatar },
      },
    }));
    setMessageDraft("");
    setMessageImageData("");
    setMessageImageName("");
    setReplyToMessage(null);
  };

  const handleReplyMessage = (message) => {
    if (!message) return;
    setReplyToMessage({
      id: String(message.id || ""),
      author: String(message.author || "User"),
      text: String(message.text || ""),
      image: String(message.image || ""),
    });
  };

  const handleReportUser = async (room, message) => {
    const author = String(message?.author || "").trim();
    if (!author) return;
    setReportingMessageId(String(message.id));
    try {
      const payload = {
        socialMedia: "topic-room-report",
        userId: currentUserLabel,
        query: `Urgent report in room "${room.title}": user "${author}" reported. Message: "${String(message?.text || "").trim() || "[image-only post]"}".`,
      };
      const response = await fetch("/api/support-tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Failed to notify admins");
      toast.show("Report sent. Admins have been notified.", "success");
    } catch (error) {
      toast.show(error.message || "Failed to report user", "error");
    } finally {
      setReportingMessageId("");
    }
  };

  if (mode === "modal" && !isOpen) return null;

  const containerClass =
    mode === "modal"
      ? "fixed inset-0 z-[116] p-2 sm:p-6 flex items-center justify-center pointer-events-none"
      : "w-full h-full";
  const panelClass =
    mode === "modal"
      ? "w-full max-w-5xl h-[96vh] sm:h-auto sm:max-h-[92vh] bg-[var(--bg-primary)] border border-[var(--accent)]/35 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col pointer-events-auto"
      : "w-full h-full bg-[var(--bg-primary)] border-0 rounded-none shadow-none overflow-hidden flex flex-col";
  const contentClass = mode === "modal" ? "p-4 sm:p-6 overflow-y-auto" : "p-3 sm:p-5 h-full min-h-0 overflow-y-auto no-scrollbar";
  const landingGridClass = isAdmin
    ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 xl:auto-rows-fr gap-3 items-start"
    : "grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-5 xl:grid-rows-3 gap-3 items-start xl:min-h-[58vh]";
  const landingCardClass = "min-h-[86px] sm:min-h-[96px] xl:min-h-[130px] rounded-xl border p-2.5 sm:p-3 flex flex-col";
  const nonAdminCreatePlacement = !isAdmin ? "order-1 xl:col-start-2 xl:row-start-2" : "";
  const nonAdminJoinPlacement = !isAdmin ? "order-2 xl:col-start-3 xl:row-start-2" : "";
  const nonAdminActivePlacement = !isAdmin ? "order-3 xl:col-start-4 xl:row-start-2" : "";

  return (
    <>
      {mode === "modal" ? (
        <div className="fixed inset-0 z-[115] bg-black/55 backdrop-blur-sm" onClick={onClose} />
      ) : null}
      <div className={containerClass}>
        <div className={panelClass}>
          <div className="px-4 sm:px-6 py-3 border-b border-[var(--accent)]/20 bg-[var(--card-bg)]/50 flex items-center justify-between">
            <h2 className="text-base sm:text-xl font-black uppercase tracking-tight text-[var(--accent)]">Chat Rooms</h2>
            <button onClick={onClose} className="px-3 py-1.5 rounded-lg border border-[var(--accent)]/30 text-[var(--accent)] text-[10px] font-black uppercase tracking-widest hover:bg-[var(--accent)]/10 transition-all">{mode === "modal" ? "Close" : "Back"}</button>
          </div>

          <div className={contentClass}>
            {view !== "room" ? (
              <div className="space-y-3">
                <div className={landingGridClass}>
                {isAdmin ? (
                <div className={`${landingCardClass} border-[var(--accent)]/25 bg-[var(--card-bg)]/40`}>
                  <p className="text-[10px] uppercase tracking-widest font-black text-[var(--text-secondary)]">Room Capacity Status</p>
                  <p className="mt-1.5 text-sm font-semibold">
                    Active Rooms: <span className="font-black text-[var(--accent)]">{activeRooms.length}/{config.maxActiveRooms}</span>
                  </p>
                  {!canCreateRoom ? (
                    <p className="mt-1.5 text-xs font-bold text-amber-300">
                      {currentUserCreatedActiveRoom
                        ? "You already have one active room created. You can still join multiple rooms."
                        : "Create Room is disabled until a room is closed or expires."}
                    </p>
                  ) : null}
                </div>
                ) : null}

                {isAdmin ? (
                  <div className={`${landingCardClass} border-[var(--accent)]/25 bg-[var(--card-bg)]/35`}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[10px] uppercase tracking-widest font-black text-[var(--text-secondary)]">Admin Room Manager</p>
                      <button
                        type="button"
                        onClick={() => setView("create")}
                        disabled={!canCreateRoom}
                        className="px-3 py-1.5 rounded-lg border border-[var(--accent)]/35 bg-[var(--accent)]/10 text-[var(--accent)] text-[10px] font-black uppercase tracking-widest hover:bg-[var(--accent)]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Add Room
                      </button>
                    </div>
                    <div className="mt-2 rounded-xl border border-[var(--accent)]/20 p-3">
                      <p className="text-[10px] uppercase tracking-widest font-black text-[var(--text-secondary)]">Creation Config (Admin Only)</p>
                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <label className="text-xs font-bold">Active Room Limit
                          <input
                            type="number"
                            min={1}
                            max={100}
                            value={config.maxActiveRooms}
                            onChange={(e) => setConfig((prev) => ({ ...prev, maxActiveRooms: Math.max(1, Number.parseInt(e.target.value || "1", 10) || 1) }))}
                            className="mt-1 w-full bg-[var(--bg-primary)] border border-[var(--accent)]/25 rounded-xl px-3 py-2 text-sm font-semibold"
                          />
                        </label>
                        <label className="text-xs font-bold">Default Duration (mins)
                          <input
                            type="number"
                            min={5}
                            max={120}
                            value={config.defaultDurationMins}
                            onChange={(e) => setConfig((prev) => ({ ...prev, defaultDurationMins: Math.max(5, Math.min(120, Number.parseInt(e.target.value || "5", 10) || 5)) }))}
                            className="mt-1 w-full bg-[var(--bg-primary)] border border-[var(--accent)]/25 rounded-xl px-3 py-2 text-sm font-semibold"
                          />
                        </label>
                      </div>
                    </div>
                    {rooms.length === 0 ? (
                      <p className="mt-1.5 text-sm font-semibold opacity-80">No rooms created yet.</p>
                    ) : (
                      <div className="mt-1.5 space-y-1.5 max-h-36 overflow-y-auto no-scrollbar">
                        {rooms.map((room) => (
                          <div key={`admin-room-${room.id}`} className="rounded-lg border border-[var(--accent)]/20 bg-[var(--bg-primary)]/45 p-2.5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedRoomId(room.id);
                                  setView("room");
                                  markRoomAsRead(room.id);
                                }}
                                className="text-left"
                              >
                                <p className="text-sm font-black text-[var(--accent)]">{room.title}</p>
                                <p className="mt-1 text-xs font-semibold text-[var(--text-secondary)]">
                                  {room.status.toUpperCase()} • {room.participants.length} users
                                </p>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAdminDeleteRoom(room.id)}
                                className="px-2.5 py-1 rounded-lg border border-red-400/40 text-red-300 text-[9px] font-black uppercase tracking-widest hover:bg-red-500/10 transition-all"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null}

                <div className={`${landingCardClass} ${nonAdminActivePlacement} border-[var(--accent)]/25 bg-[var(--card-bg)]/30 text-left hover:bg-[var(--accent)]/10 transition-all`}>
                  <p className="text-xs sm:text-sm font-black uppercase tracking-widest inline-flex items-center gap-1.5">
                    <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" aria-hidden="true">
                      <path d="M8 11A3 3 0 1 0 8 5A3 3 0 0 0 8 11Z" stroke="currentColor" strokeWidth="1.8" />
                      <path d="M16 10A2.5 2.5 0 1 0 16 5A2.5 2.5 0 0 0 16 10Z" stroke="currentColor" strokeWidth="1.8" />
                      <path d="M3.5 19C3.5 16.8 5.3 15 7.5 15H8.5C10.7 15 12.5 16.8 12.5 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                      <path d="M12.5 19C12.5 17.1 14.1 15.5 16 15.5H16.8C18.7 15.5 20.3 17.1 20.3 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                    Your Active Rooms
                    {totalUnreadCount > 0 ? (
                      <span className="ml-1 inline-flex min-w-5 h-5 px-1.5 items-center justify-center rounded-full bg-red-500/20 border border-red-400/50 text-red-200 text-[10px] font-black">
                        {totalUnreadCount}
                      </span>
                    ) : null}
                  </p>
                  {currentUserActiveRooms.length === 0 ? (
                    <p className="mt-1.5 text-sm font-semibold opacity-80">You have not joined any active room yet.</p>
                  ) : (
                    <div className="mt-1.5 space-y-1.5 max-h-36 overflow-y-auto no-scrollbar">
                      {currentUserActiveRooms.map((room) => (
                        <button
                          key={`my-room-${room.id}`}
                          onClick={() => {
                            setSelectedRoomId(room.id);
                            setView("room");
                            markRoomAsRead(room.id);
                          }}
                          className="w-full rounded-lg border border-[var(--accent)]/20 bg-[var(--bg-primary)]/45 p-2.5 text-left hover:bg-[var(--accent)]/10 transition-all"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-black text-[var(--accent)]">{room.title}</p>
                            <div className="flex items-center gap-1.5">
                              {getRoomUnreadCount(room) > 0 ? (
                                <span className="inline-flex min-w-5 h-5 px-1.5 items-center justify-center rounded-full bg-red-500/20 border border-red-400/50 text-red-200 text-[10px] font-black">
                                  {getRoomUnreadCount(room)}
                                </span>
                              ) : null}
                              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300">Open</span>
                            </div>
                          </div>
                          <p className="mt-1 text-xs font-semibold text-[var(--text-secondary)]">
                            By <UserNameWithBadge label={room.createdBy} isAdmin={String(room.createdByRole || "").toLowerCase() === "admin"} />
                            {room.createdByIdentity === currentUserRoomIdentity ? " • Your room" : ""} • {room.participants.length} users
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="contents">
                  <button
                    onClick={() => setView("create")}
                    disabled={!canCreateRoom}
                    className={`${landingCardClass} ${nonAdminCreatePlacement} border-[var(--accent)]/25 bg-[var(--card-bg)]/30 text-left hover:bg-[var(--accent)]/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <p className="text-xs sm:text-sm font-black uppercase tracking-widest inline-flex items-center gap-1.5">
                      <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" aria-hidden="true">
                        <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                      Create Room
                    </p>
                    <p className="mt-0.5 text-xs font-semibold opacity-90">Configure and open a new room.</p>
                  </button>
                  <button
                    onClick={() => setView("join")}
                    className={`${landingCardClass} ${nonAdminJoinPlacement} border-[var(--accent)]/25 bg-[var(--card-bg)]/30 text-left hover:bg-[var(--accent)]/10 transition-all`}
                  >
                    <p className="text-xs sm:text-sm font-black uppercase tracking-widest inline-flex items-center gap-1.5">
                      <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" aria-hidden="true">
                        <path d="M15 8L19 12L15 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                      Join Existing Room
                    </p>
                    <p className="mt-0.5 text-xs font-semibold opacity-90">Browse active rooms and join one.</p>
                    {totalUnreadCount > 0 ? (
                      <p className="mt-1 text-[10px] font-black text-red-200">Unread: {totalUnreadCount}</p>
                    ) : null}
                  </button>
                </div>
                </div>

                {view === "join" ? (
                  <div className="rounded-2xl border border-[var(--accent)]/20 bg-[var(--card-bg)]/30 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] uppercase tracking-widest font-black text-[var(--text-secondary)]">Join Active Room</p>
                      <button onClick={() => setView("landing")} className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--accent)]">Back</button>
                    </div>
                    {visibleActiveRooms.length === 0 ? (
                      <p className="text-sm font-semibold opacity-80">No active rooms available right now.</p>
                    ) : (
                      <div className="space-y-2">
                        {visibleActiveRooms.map((room) => (
                          <button key={room.id} onClick={() => handleJoinRoom(room.id)} className="w-full rounded-xl border border-[var(--accent)]/20 bg-[var(--bg-primary)]/45 p-3 text-left hover:bg-[var(--accent)]/10 transition-all">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-black text-[var(--accent)]">{room.title}</p>
                              <div className="flex items-center gap-1.5">
                                {getRoomUnreadCount(room) > 0 ? (
                                  <span className="inline-flex min-w-5 h-5 px-1.5 items-center justify-center rounded-full bg-red-500/20 border border-red-400/50 text-red-200 text-[10px] font-black">
                                    {getRoomUnreadCount(room)}
                                  </span>
                                ) : null}
                                <span className="text-[10px] font-black uppercase tracking-widest text-amber-300">Expires in {formatTimeLeft(room.expiresAt - nowMs)}</span>
                              </div>
                            </div>
                            <p className="mt-1 text-xs font-semibold text-[var(--text-secondary)]">
                              By <UserNameWithBadge label={room.createdBy} isAdmin={String(room.createdByRole || "").toLowerCase() === "admin"} />
                              {isUserInRoom(room) ? " • Joined" : ""} • {room.participants.length} users
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            ) : selectedRoom ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setView("landing")}
                    aria-label="Back to rooms"
                    title="Back to rooms"
                    className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-[var(--accent)]/30 text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-all"
                  >
                    <svg viewBox="0 0 24 24" fill="none" className="w-4.5 h-4.5" aria-hidden="true">
                      <path d="M15 6L9 12L15 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${selectedRoom.status === "active" ? "border-amber-300/40 text-amber-200 bg-amber-500/10" : "border-red-300/40 text-red-200 bg-red-500/10"}`}>
                      {selectedRoom.status === "active" ? `Expires in ${formatTimeLeft(selectedRoom.expiresAt - nowMs)}` : selectedRoom.status}
                    </span>
                    {isAdmin ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            if (adminExpiryInputRef.current?.showPicker) {
                              adminExpiryInputRef.current.showPicker();
                            } else {
                              adminExpiryInputRef.current?.focus();
                            }
                          }}
                          className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border border-[var(--accent)]/30 text-[var(--accent)] text-[9px] font-black uppercase tracking-widest hover:bg-[var(--accent)]/10 transition-all"
                        >
                          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" aria-hidden="true">
                            <path d="M7 3v3M17 3v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            <rect x="4" y="6" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
                            <path d="M4 10h16" stroke="currentColor" strokeWidth="2" />
                          </svg>
                          Set Expiry
                        </button>
                        <input
                          ref={adminExpiryInputRef}
                          type="datetime-local"
                          value={adminExpiryAt}
                          onChange={(e) => setAdminExpiryAt(e.target.value)}
                          className="sr-only"
                        />
                        {adminExpiryAt ? (
                          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">
                            {new Date(adminExpiryAt).toLocaleString()}
                          </span>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => {
                            if (!adminExpiryAt) {
                              toast.show("Select a new expiry time.", "error");
                              return;
                            }
                            const nextTime = new Date(adminExpiryAt);
                            if (Number.isNaN(nextTime.getTime())) {
                              toast.show("Invalid date/time.", "error");
                              return;
                            }
                            if (nextTime.getTime() <= Date.now()) {
                              toast.show("Expiry time must be in the future.", "error");
                              return;
                            }
                            updateRoom(selectedRoom.id, (prev) => ({
                              ...prev,
                              expiresAt: nextTime.getTime(),
                              status: "active",
                              expiredAt: 0,
                            }));
                            setAdminExpiryAt("");
                            toast.show("Room expiry updated.", "success");
                          }}
                          className="px-2.5 py-1 rounded-lg border border-[var(--accent)]/30 text-[var(--accent)] text-[9px] font-black uppercase tracking-widest hover:bg-[var(--accent)]/10 transition-all"
                        >
                          Apply
                        </button>
                      </div>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => openExitPrompt(selectedRoom.id)}
                      disabled={selectedRoom.status !== "active"}
                      aria-label="Exit room"
                      title="Exit room"
                      className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-red-400/40 text-red-300 hover:bg-red-500/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <svg viewBox="0 0 24 24" fill="none" className="w-4.5 h-4.5" aria-hidden="true">
                        <path d="M15 8L19 12L15 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M19 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <path d="M11 4H7C5.9 4 5 4.9 5 6V18C5 19.1 5.9 20 7 20H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[minmax(220px,1fr)_minmax(0,4fr)] gap-3 items-start w-full">
                  <aside className="rounded-xl border border-[var(--accent)]/20 bg-[var(--card-bg)]/40 p-3">
                    <p className="text-[10px] uppercase tracking-widest font-black text-[var(--text-secondary)] mb-2">Room Title Card</p>
                    <div className="relative aspect-[4/3] rounded-lg overflow-hidden border border-[var(--accent)]/20 mb-2">
                      <img src={selectedRoom.coverImage || DEFAULT_COVER} alt={selectedRoom.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-2">
                        <h3 className="text-sm font-black text-white line-clamp-2">{selectedRoom.title}</h3>
                      </div>
                    </div>
                    <p className="text-[11px] font-semibold text-[var(--text-secondary)]">{selectedRoom.participants.length} users</p>
                    <p className="mt-0.5 text-[11px] font-semibold text-[var(--text-secondary)]">
                      Created by{" "}
                      <UserNameWithBadge
                        label={selectedRoom.createdBy}
                        isAdmin={String(selectedRoom.createdByRole || "").toLowerCase() === "admin"}
                      />
                    </p>
                    {selectedRoom.description ? <p className="mt-1 text-xs opacity-90 break-words">{selectedRoom.description}</p> : null}
                  </aside>

                  <section className="w-full min-w-0 flex flex-col gap-2 lg:min-h-[calc(100vh-360px)]">
                    <div ref={messagesContainerRef} className="w-full rounded-2xl border border-[var(--accent)]/20 bg-[var(--bg-primary)]/35 p-4 h-[55vh] max-h-[57vh] overflow-y-auto no-scrollbar space-y-3">
                      {selectedRoom.messages.length === 0 ? (
                        <div className="rounded-xl border border-[var(--accent)]/20 bg-[var(--bg-primary)]/40 p-3">
                          <p className="text-[10px] uppercase tracking-widest font-black text-[var(--accent)]">Room Rules</p>
                          <div className="mt-2 space-y-1">
                            {[
                              "Be respectful to everyone in this room.",
                              "No spam or off-topic promotions.",
                              "No private information or abuse.",
                            ].map((rule, idx) => (
                              <p key={`rule-${idx}`} className="text-sm text-[var(--text-secondary)]">{idx + 1}. {rule}</p>
                            ))}
                          </div>
                        </div>
                      ) : (
                        selectedRoom.messages.map((message) => {
                          const isSelf = toIdentity(message.authorIdentity) === currentUserRoomIdentity;
                          const authorId = toIdentity(message.authorIdentity);
                          const authorAvatar = selectedRoom?.userProfiles?.[authorId]?.avatar || (isSelf ? currentUserAvatar : "");
                          return (
                            <div key={message.id} className={`flex ${isSelf ? "justify-end" : "justify-start"}`}>
                              <div className={`flex items-end gap-2 ${isSelf ? "flex-row-reverse" : "flex-row"}`}>
                                <Avatar
                                  label={message.author}
                                  src={authorAvatar}
                                  className="w-7 h-7"
                                />
                                <div className={`max-w-[94%] sm:max-w-[86%] rounded-2xl border p-3 ${isSelf ? "border-[var(--accent)]/35 bg-[var(--accent)]/10" : "border-[var(--accent)]/15 bg-[var(--bg-primary)]/40"}`}>
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <p className="text-[10px] tracking-widest font-black text-[var(--accent)]">
                                        <UserNameWithBadge label={message.author} isAdmin={String(message.authorRole || "").toLowerCase() === "admin"} />
                                      </p>
                                      <button
                                        type="button"
                                        onClick={() => handleReplyMessage(message)}
                                        title="Reply"
                                        aria-label="Reply"
                                        className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-[var(--accent)]/35 text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-all"
                                      >
                                        <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" aria-hidden="true">
                                          <path d="M10 8L6 12L10 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                          <path d="M6 12H14C17.3 12 20 14.7 20 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                        </svg>
                                      </button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {!isSelf ? (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setPendingReportMessage(message);
                                            setIsReportConfirmOpen(true);
                                          }}
                                          disabled={reportingMessageId === String(message.id)}
                                          title={reportingMessageId === String(message.id) ? "Reporting..." : "Report user"}
                                          aria-label="Report user"
                                          className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-red-400/40 text-red-300 hover:bg-red-500/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                          <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" aria-hidden="true">
                                            <path d="M6 3v18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                            <path d="M6 4.5c2.2-1.4 4.6-1.4 6.8 0 2.2 1.4 4.6 1.4 6.8 0v8c-2.2 1.4-4.6 1.4-6.8 0-2.2-1.4-4.6-1.4-6.8 0v-8z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                                          </svg>
                                        </button>
                                      ) : null}
                                    </div>
                                  </div>
                              {(message.replyToAuthor || message.replyToText || message.replyToImage) ? (
                                <div className="mt-1 rounded-lg border border-[var(--accent)]/20 bg-[var(--bg-primary)]/35 px-2.5 py-1.5">
                                  <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Reply to {message.replyToAuthor || "user"}</p>
                                  {message.replyToText ? <p className="text-xs opacity-90 line-clamp-2">{message.replyToText}</p> : null}
                                  {!message.replyToText && message.replyToImage ? <p className="text-xs opacity-80 italic">[image]</p> : null}
                                </div>
                              ) : null}
                              {message.text ? <p className="mt-1 text-sm">{message.text}</p> : null}
                              {message.image ? (
                                <button type="button" onClick={() => setPreviewImage({ src: message.image, name: message.imageName || "message upload" })} className="mt-2 w-full rounded-xl overflow-hidden border border-[var(--accent)]/20 bg-black/20 text-left">
                                  <img src={message.image} alt={message.imageName || "message upload"} className="w-full max-h-72 object-cover" />
                                </button>
                              ) : null}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {messageImageData ? (
                      <div className="rounded-xl border border-[var(--accent)]/20 bg-[var(--bg-primary)]/50 p-2.5 flex items-center gap-3">
                        <img src={messageImageData} alt={messageImageName || "attachment"} className="w-14 h-14 rounded-lg object-cover border border-[var(--accent)]/20" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[9px] uppercase tracking-widest font-black text-[var(--text-secondary)]">Image Attached</p>
                          <p className="text-xs font-semibold truncate">{messageImageName || "image"}</p>
                        </div>
                        <button type="button" onClick={() => { setMessageImageData(""); setMessageImageName(""); }} className="px-2.5 py-1 rounded-lg border border-red-400/40 text-red-300 text-[9px] font-black uppercase tracking-widest hover:bg-red-500/10 transition-all">Remove</button>
                      </div>
                    ) : null}

                    {replyToMessage ? (
                      <div className="rounded-xl border border-[var(--accent)]/20 bg-[var(--bg-primary)]/50 p-2.5 flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-[9px] uppercase tracking-widest font-black text-[var(--text-secondary)]">Replying to {replyToMessage.author || "user"}</p>
                          {replyToMessage.text ? (
                            <p className="text-xs font-semibold truncate">{replyToMessage.text}</p>
                          ) : (
                            <p className="text-xs font-semibold italic opacity-80">[image]</p>
                          )}
                        </div>
                        <button type="button" onClick={() => setReplyToMessage(null)} className="px-2.5 py-1 rounded-lg border border-red-400/40 text-red-300 text-[9px] font-black uppercase tracking-widest hover:bg-red-500/10 transition-all">Cancel</button>
                      </div>
                    ) : null}

                    <div className="w-full">
                      <div className="relative">
                        <input
                          type="text"
                          value={messageDraft}
                          onChange={(e) => setMessageDraft(e.target.value)}
                          disabled={selectedRoom.status !== "active"}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                          placeholder={selectedRoom.status === "active" ? "Write a message..." : "Room is closed or expired."}
                          className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/20 rounded-xl pl-3 pr-[116px] sm:pr-[126px] py-2.5 text-sm font-semibold outline-none focus:border-[var(--accent)] disabled:opacity-55 disabled:cursor-not-allowed"
                        />
                        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                          <label
                            title="Add image"
                            className={`inline-flex items-center justify-center w-9 h-9 rounded-lg border border-[var(--accent)]/30 text-[var(--accent)] bg-[var(--accent)]/5 hover:bg-[var(--accent)]/15 transition-all text-center cursor-pointer ${selectedRoom.status !== "active" ? "opacity-50 pointer-events-none" : ""}`}
                          >
                            <svg viewBox="0 0 24 24" fill="none" className="w-4.5 h-4.5" aria-hidden="true">
                              <path d="M4 7C4 5.9 4.9 5 6 5H18C19.1 5 20 5.9 20 7V17C20 18.1 19.1 19 18 19H6C4.9 19 4 18.1 4 17V7Z" stroke="currentColor" strokeWidth="2" />
                              <circle cx="9" cy="10" r="1.5" fill="currentColor" />
                              <path d="M6 16L11 12L14 14L18 11L20 13V17C20 18.1 19.1 19 18 19H6C4.9 19 4 18.1 4 17V16H6Z" fill="currentColor" fillOpacity="0.25" />
                            </svg>
                            <input type="file" accept="image/*" className="hidden" disabled={selectedRoom.status !== "active"} onChange={handleSelectMessageImage} />
                          </label>
                          <button
                            type="button"
                            onClick={handleSendMessage}
                            title="Send"
                            aria-label="Send message"
                            disabled={selectedRoom.status !== "active" || (!String(messageDraft || "").trim() && !messageImageData)}
                            className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-[var(--accent)]/40 bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <svg viewBox="0 0 24 24" fill="none" className="w-4.5 h-4.5" aria-hidden="true">
                              <path d="M3 11.5L20 4L13.5 21L11.2 13.8L3 11.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                              <path d="M11.2 13.8L20 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {previewImage ? (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm p-4 sm:p-8 flex items-center justify-center" onClick={() => setPreviewImage(null)}>
          <div className="relative w-full max-w-5xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setPreviewImage(null)} className="absolute -top-3 -right-2 sm:top-2 sm:right-2 z-10 px-3 py-1.5 rounded-full border border-white/30 bg-black/50 text-white text-xs font-black uppercase tracking-widest hover:bg-black/80 transition-all">Close</button>
            <img src={previewImage.src} alt={previewImage.name || "preview"} className="w-full max-h-[90vh] object-contain rounded-2xl border border-white/20 bg-black/40" />
          </div>
        </div>
      ) : null}

      {view === "create" ? (
        <div className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm p-4 sm:p-8 flex items-center justify-center" onClick={() => setView("landing")}>
          <div className="w-full max-w-xl max-h-[85vh] overflow-y-auto no-scrollbar rounded-2xl border border-[var(--accent)]/25 bg-[var(--card-bg)] shadow-2xl p-4 sm:p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-widest font-black text-[var(--text-secondary)]">Create Room</p>
              <button onClick={() => setView("landing")} className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--accent)]">Close</button>
            </div>

            <div className="mt-3 space-y-3">
              <input value={draft.title} onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))} placeholder="Room title" className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/25 rounded-xl px-3 py-2 text-sm font-semibold" />
              <textarea value={draft.description} onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))} placeholder="Short description (optional)" rows={2} className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/25 rounded-xl px-3 py-2 text-sm font-semibold resize-none" />
              <div className="rounded-xl border border-[var(--accent)]/20 p-3">
                <p className="text-[10px] uppercase tracking-widest font-black text-[var(--text-secondary)]">Title Card Image</p>
                {draftCoverImageData ? (
                  <div className="mt-2 flex items-center gap-3">
                    <img src={draftCoverImageData} alt={draftCoverImageName || "title card"} className="w-14 h-14 rounded-lg object-cover border border-[var(--accent)]/20" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold truncate">{draftCoverImageName || "image"}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setDraftCoverImageData("");
                        setDraftCoverImageName("");
                      }}
                      className="px-2.5 py-1 rounded-lg border border-red-400/40 text-red-300 text-[9px] font-black uppercase tracking-widest hover:bg-red-500/10 transition-all"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <p className="mt-2 text-xs font-semibold text-[var(--text-secondary)]">No image selected. Default card image will be used.</p>
                )}
                <label className="mt-2 inline-flex px-3 py-2 rounded-lg border border-[var(--accent)]/30 text-[var(--accent)] text-[10px] font-black uppercase tracking-widest bg-[var(--accent)]/5 hover:bg-[var(--accent)]/15 transition-all cursor-pointer">
                  Upload from device
                  <input type="file" accept="image/*" className="hidden" onChange={handleSelectDraftCoverImage} />
                </label>
              </div>

              {isAdmin ? (
                <label className="text-xs font-bold block">Duration (mins)
                  <input
                    type="number"
                    min={5}
                    value={draft.durationMins}
                    onChange={(e) => setDraft((p) => ({ ...p, durationMins: e.target.value }))}
                    className="mt-1 w-full bg-[var(--bg-primary)] border border-[var(--accent)]/25 rounded-xl px-3 py-2 text-sm font-semibold"
                  />
                  <p className="mt-1 text-[10px] font-semibold text-[var(--text-secondary)]">Admins can set any duration (minimum 5 minutes).</p>
                </label>
              ) : (
                <div className="text-xs font-bold">
                  <p>Duration (mins)</p>
                  <p className="mt-1 text-[10px] font-semibold text-[var(--text-secondary)]">
                    User rooms expire in 120 minutes.
                  </p>
                </div>
              )}

              <button onClick={handleCreateRoom} disabled={!canCreateRoom} className="w-full px-4 py-2.5 rounded-xl border border-[var(--accent)]/40 bg-[var(--accent)]/10 text-[var(--accent)] text-[10px] font-black uppercase tracking-widest hover:bg-[var(--accent)]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                Create Room
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {exitConfirmRoomId ? (
        <div className="fixed inset-0 z-[121] bg-black/70 backdrop-blur-sm p-4 flex items-center justify-center" onClick={closeExitPrompt}>
          <div className="w-full max-w-md rounded-2xl border border-[var(--accent)]/35 bg-[var(--bg-primary)] shadow-2xl p-4 sm:p-5" onClick={(e) => e.stopPropagation()}>
            {(() => {
              const room = rooms.find((r) => r.id === exitConfirmRoomId);
              const creatorExiting = isCreatorOfRoom(room);
              const transferCandidates = (room?.participants || []).filter(
                (p) => toIdentity(p.id || p.label) !== currentUserRoomIdentity
              );
              const needsTransferOrDelete = creatorExiting && room?.status === "active";
              return (
                <>
                  <p className="text-sm sm:text-base font-black uppercase tracking-widest text-[var(--accent)]">
                    Exit Room
                  </p>
                  {!needsTransferOrDelete ? (
                    <>
                      <p className="mt-2 text-sm font-semibold text-[var(--text-secondary)]">
                        Are you sure you want to exit this room?
                      </p>
                      <div className="mt-4 flex items-center justify-end gap-2">
                        <button type="button" onClick={closeExitPrompt} className="px-3 py-2 rounded-lg border border-[var(--accent)]/30 text-xs font-black uppercase tracking-widest hover:bg-[var(--accent)]/10 transition-all">
                          Cancel
                        </button>
                        <button type="button" onClick={confirmSimpleExit} className="px-3 py-2 rounded-lg border border-red-400/40 text-red-300 text-xs font-black uppercase tracking-widest hover:bg-red-500/10 transition-all">
                          Exit
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="mt-2 text-sm font-semibold text-[var(--text-secondary)]">
                        You are the room creator. Choose what to do before exiting.
                      </p>
                      <div className="mt-3 rounded-xl border border-[var(--accent)]/20 p-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">
                          Transfer ownership
                        </p>
                        {transferCandidates.length === 0 ? (
                          <p className="mt-2 text-xs font-semibold text-[var(--text-secondary)]">
                            No other participants available. You can delete the room and exit.
                          </p>
                        ) : (
                          <>
                            <select
                              value={transferTargetId}
                              onChange={(e) => setTransferTargetId(e.target.value)}
                              className="mt-2 w-full bg-[var(--bg-primary)] border border-[var(--accent)]/25 rounded-xl px-3 py-2 text-sm font-semibold"
                            >
                              <option value="">Select user</option>
                              {transferCandidates.map((p) => (
                                <option key={toIdentity(p.id || p.label)} value={toIdentity(p.id || p.label)}>
                                  {p.label}
                                </option>
                              ))}
                            </select>
                            <button type="button" onClick={confirmCreatorTransferAndExit} className="mt-2 w-full px-3 py-2 rounded-lg border border-emerald-400/40 text-emerald-300 text-xs font-black uppercase tracking-widest hover:bg-emerald-500/10 transition-all">
                              Transfer and Exit
                            </button>
                          </>
                        )}
                      </div>
                      <div className="mt-3 flex items-center justify-end gap-2">
                        <button type="button" onClick={closeExitPrompt} className="px-3 py-2 rounded-lg border border-[var(--accent)]/30 text-xs font-black uppercase tracking-widest hover:bg-[var(--accent)]/10 transition-all">
                          Cancel
                        </button>
                        <button type="button" onClick={confirmCreatorDeleteAndExit} className="px-3 py-2 rounded-lg border border-red-400/40 text-red-300 text-xs font-black uppercase tracking-widest hover:bg-red-500/10 transition-all">
                          Delete and Exit
                        </button>
                      </div>
                    </>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      ) : null}
      <ConfirmModal
        isOpen={isReportConfirmOpen}
        onClose={() => {
          setIsReportConfirmOpen(false);
          setPendingReportMessage(null);
        }}
        onConfirm={() => {
          if (!pendingReportMessage || !selectedRoom) return;
          setIsReportConfirmOpen(false);
          void handleReportUser(selectedRoom, pendingReportMessage);
          setPendingReportMessage(null);
        }}
        title="Report User"
        message={
          <>
            Do you wish to report user{" "}
            <span className="text-[var(--accent)] font-bold">
              {String(pendingReportMessage?.author || "this user")}
            </span>
            ?
          </>
        }
        confirmText="Yes, Report"
        cancelText="No, Cancel"
      />
    </>
  );
}
