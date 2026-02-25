import { useState, useEffect } from "react";
import { DATA_SOURCE_URL } from "../constants";

const INITIAL_BATTLES = [];

const INITIAL_LIVE_BATTLES = [
  {
    id: "lb1",
    title: "SOUTH ASIA vs CENTRAL & SOUTH AMERICA",
    regionA: "South Asia",
    regionB: "Central & South America",
    goal: "320M",
    albumGoal: "320M",
    titleTrackGoal: "30M",
    progress: 0,
    titleTrackProgress: 0,
    platform: "Spotify",
    status: "Yet to Start",
    titleTrackStatus: "Yet to Start",
    artist: "",
    albumName: "",
    trackName: "",
    regionAAlbumManual: 0,
    regionATitleManual: 0,
    regionBAlbumManual: 0,
    regionBTitleManual: 0,
  },
  {
    id: "lb2",
    title: "OCEANIA vs WEST & CENTRAL ASIA",
    regionA: "Oceania",
    regionB: "West & Central Asia",
    goal: "320M",
    albumGoal: "320M",
    titleTrackGoal: "30M",
    progress: 0,
    titleTrackProgress: 0,
    platform: "Spotify",
    status: "Yet to Start",
    titleTrackStatus: "Yet to Start",
    artist: "",
    albumName: "",
    trackName: "",
    regionAAlbumManual: 0,
    regionATitleManual: 0,
    regionBAlbumManual: 0,
    regionBTitleManual: 0,
  },
  {
    id: "lb3",
    title: "NORTH AMERICA vs EAST & SOUTH EAST ASIA",
    regionA: "North America",
    regionB: "East & South East Asia",
    goal: "320M",
    albumGoal: "320M",
    titleTrackGoal: "30M",
    progress: 0,
    titleTrackProgress: 0,
    platform: "Spotify",
    status: "Yet to Start",
    titleTrackStatus: "Yet to Start",
    artist: "",
    albumName: "",
    trackName: "",
    regionAAlbumManual: 0,
    regionATitleManual: 0,
    regionBAlbumManual: 0,
    regionBTitleManual: 0,
  },
  {
    id: "lb4",
    title: "EUROPE vs AFRICA",
    regionA: "Europe",
    regionB: "Africa",
    goal: "320M",
    albumGoal: "320M",
    titleTrackGoal: "30M",
    progress: 0,
    titleTrackProgress: 0,
    platform: "Spotify",
    status: "Yet to Start",
    titleTrackStatus: "Yet to Start",
    artist: "",
    albumName: "",
    trackName: "",
    regionAAlbumManual: 0,
    regionATitleManual: 0,
    regionBAlbumManual: 0,
    regionBTitleManual: 0,
  },
];

function parseRegionsFromTitle(title = "") {
  const parts = String(title).split(/\s+vs\s+/i).map((part) => part.trim());
  return [parts[0] || "", parts[1] || ""];
}

function toNumberOrZero(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function clampPercent(value) {
  return Math.max(0, Math.min(100, Math.round(toNumberOrZero(value))));
}

function normalizeRegions(value) {
  if (Array.isArray(value)) {
    return value.map((part) => String(part || "").trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value.split(",").map((part) => part.trim()).filter(Boolean);
  }
  return [];
}

function toCount(value) {
  return Math.max(0, Math.floor(toNumberOrZero(value)));
}

function normalizeBattleRecord(rawBattle = {}) {
  const regions = normalizeRegions(rawBattle.regions);
  return {
    ...rawBattle,
    id: rawBattle.id ? String(rawBattle.id) : `battle_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    date: rawBattle.date ? String(rawBattle.date).trim() : "",
    time: rawBattle.time ? String(rawBattle.time).trim() : "",
    regions,
    target: rawBattle.target ? String(rawBattle.target).trim() : "",
    progress: clampPercent(rawBattle.progress),
    reachedTarget: Boolean(rawBattle.reachedTarget),
    winner: rawBattle.winner ? String(rawBattle.winner).trim() : "",
    albumProgress: clampPercent(rawBattle.albumProgress),
    titleProgress: clampPercent(rawBattle.titleProgress),
    albumCount: toCount(rawBattle.albumCount),
    titleCount: toCount(rawBattle.titleCount),
    titleTarget: rawBattle.titleTarget ? String(rawBattle.titleTarget).trim() : "",
    source: rawBattle.source ? String(rawBattle.source).trim() : "manual",
    snapshotKey: rawBattle.snapshotKey ? String(rawBattle.snapshotKey).trim() : null,
  };
}

function saveBattlesLocal(battles) {
  localStorage.setItem("battleData", JSON.stringify(battles));
}

function saveLiveBattlesLocal(liveBattles) {
  localStorage.setItem("liveBattles", JSON.stringify(liveBattles));
}

function readArrayFromLocalStorage(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

async function createBattleOnServer(battle) {
  try {
    await fetch("/api/battle-history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(battle),
    });
  } catch (error) {
    console.error("Failed to persist battle record:", error);
  }
}

async function updateBattleOnServer(id, changes) {
  try {
    await fetch("/api/battle-history", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: String(id), changes }),
    });
  } catch (error) {
    console.error("Failed to update battle record:", error);
  }
}

async function deleteBattleOnServer(id) {
  try {
    await fetch(`/api/battle-history?id=${encodeURIComponent(String(id))}`, {
      method: "DELETE",
    });
  } catch (error) {
    console.error("Failed to delete battle record:", error);
  }
}

async function clearBattlesOnServer() {
  try {
    await fetch("/api/battle-history?clearAll=1", { method: "DELETE" });
  } catch (error) {
    console.error("Failed to clear battle history:", error);
  }
}

function normalizeLiveBattle(rawBattle = {}) {
  const [titleRegionA, titleRegionB] = parseRegionsFromTitle(rawBattle.title);
  const regionA = rawBattle.regionA || titleRegionA;
  const regionB = rawBattle.regionB || titleRegionB;

  return {
    ...rawBattle,
    regionA,
    regionB,
    albumGoal: rawBattle.albumGoal ?? rawBattle.goal ?? "",
    titleTrackGoal: rawBattle.titleTrackGoal ?? rawBattle.goal ?? "",
    titleTrackStatus: rawBattle.titleTrackStatus || rawBattle.status || "Yet to Start",
    artist: rawBattle.artist || "",
    albumName: rawBattle.albumName || "",
    trackName: rawBattle.trackName || rawBattle.targetName || "",
    regionAAlbumManual: toNumberOrZero(rawBattle.regionAAlbumManual),
    regionATitleManual: toNumberOrZero(rawBattle.regionATitleManual),
    regionBAlbumManual: toNumberOrZero(rawBattle.regionBAlbumManual),
    regionBTitleManual: toNumberOrZero(rawBattle.regionBTitleManual),
  };
}

export default function useBattles(options = {}) {
  const { refreshToken = 0 } = options;
  const [battles, setBattles] = useState([]);
  const [liveBattles, setLiveBattles] = useState(
    INITIAL_LIVE_BATTLES.map(normalizeLiveBattle)
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      let hasServerBattleHistory = false;
      let hasServerLiveConfig = false;

      try {
        const historyResponse = await fetch("/api/battle-history", { cache: "no-store" });
        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          const nextBattles = Array.isArray(historyData?.battles)
            ? historyData.battles.map(normalizeBattleRecord)
            : [];
          setBattles(nextBattles);
          saveBattlesLocal(nextBattles);
          hasServerBattleHistory = true;
        }

        const configResponse = await fetch("/api/live-battles-config", { cache: "no-store" });
        if (configResponse.ok) {
          const configData = await configResponse.json();
          if (Array.isArray(configData?.liveBattles) && configData.liveBattles.length > 0) {
            setLiveBattles(configData.liveBattles.map(normalizeLiveBattle));
            hasServerLiveConfig = true;
          }
        }

        if (DATA_SOURCE_URL) {
          const response = await fetch(`${DATA_SOURCE_URL}?t=${Date.now()}`, { cache: "no-store" });
          const data = await response.json();
          if (!hasServerBattleHistory && Array.isArray(data?.battles)) {
            const nextBattles = data.battles.map(normalizeBattleRecord);
            setBattles(nextBattles);
            saveBattlesLocal(nextBattles);
          }
          if (!hasServerLiveConfig && Array.isArray(data?.liveBattles)) {
            setLiveBattles(data.liveBattles.map(normalizeLiveBattle));
          }
          if (
            hasServerBattleHistory ||
            Array.isArray(data?.battles) ||
            Array.isArray(data?.liveBattles)
          ) {
            setLoading(false);
            return;
          }
        }
      } catch (error) {
        console.error("Failed to fetch battles:", error);
      }

      const parsed = readArrayFromLocalStorage("battleData");
      if (!hasServerBattleHistory && Array.isArray(parsed) && parsed.length > 0) {
        setBattles(parsed.map(normalizeBattleRecord));
      }
      else {
        if (!hasServerBattleHistory) {
          setBattles(INITIAL_BATTLES.map(normalizeBattleRecord));
          saveBattlesLocal(INITIAL_BATTLES.map(normalizeBattleRecord));
        }
      }

      const savedLive = readArrayFromLocalStorage("liveBattles");
      if (!hasServerLiveConfig) {
        if (Array.isArray(savedLive)) {
          setLiveBattles(savedLive.map(normalizeLiveBattle));
        } else {
          saveLiveBattlesLocal(INITIAL_LIVE_BATTLES);
        }
      }
      setLoading(false);
    };

    loadData();
  }, [refreshToken]);

  const addBattle = (newBattle) => {
    const normalized = normalizeBattleRecord(newBattle);
    const updated = [normalized, ...battles];
    setBattles(updated);
    saveBattlesLocal(updated);
    void createBattleOnServer(normalized);
  };

  const updateLiveBattles = (updatedLives) => {
    const normalized = updatedLives.map(normalizeLiveBattle);
    setLiveBattles(normalized);
    saveLiveBattlesLocal(normalized);
  };

  const deleteBattle = (id) => {
    const updated = battles.filter((battle) => String(battle.id) !== String(id));
    setBattles(updated);
    saveBattlesLocal(updated);
    void deleteBattleOnServer(id);
  };

  const clearBattles = () => {
    setBattles([]);
    localStorage.removeItem("battleData");
    void clearBattlesOnServer();
  };

  const updateBattle = (id, changes) => {
    const updated = battles.map((battle) =>
      String(battle.id) === String(id) ? normalizeBattleRecord({ ...battle, ...changes, id: String(id) }) : battle
    );
    setBattles(updated);
    saveBattlesLocal(updated);
    void updateBattleOnServer(id, changes);
  };

  const resetLiveBattles = () => {
    const reset = INITIAL_LIVE_BATTLES.map(normalizeLiveBattle);
    setLiveBattles(reset);
    saveLiveBattlesLocal(reset);
  };

  const liveBattle = liveBattles[0] ?? INITIAL_LIVE_BATTLES[0];

  return { battles, liveBattle, liveBattles, addBattle, updateBattle, updateLiveBattles, deleteBattle, clearBattles, resetLiveBattles, loading };
}
