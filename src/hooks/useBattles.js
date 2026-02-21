import { useState, useEffect } from "react";
import { DATA_SOURCE_URL } from "../constants";

const INITIAL_BATTLES = [];

const INITIAL_LIVE_BATTLES = [
  { id: "lb1", title: "SOUTH ASIA vs CENTRAL & SOUTH AMERICA", goal: "320M", progress: 0, platform: "Spotify", status: "Yet to Start" },
  { id: "lb2", title: "OCEANIA vs WEST & CENTRAL ASIA", goal: "320M", progress: 0, platform: "Spotify", status: "Yet to Start" },
  { id: "lb3", title: "NORTH AMERICA vs EAST & SOUTH EAST ASIA", goal: "320M", progress: 0, platform: "Spotify", status: "Yet to Start" },
  { id: "lb4", title: "EUROPE vs AFRICA", goal: "320M", progress: 0, platform: "Spotify", status: "Yet to Start" },
];

export default function useBattles() {
  const [battles, setBattles] = useState([]);
  const [liveBattles, setLiveBattles] = useState(INITIAL_LIVE_BATTLES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (DATA_SOURCE_URL) {
          const response = await fetch(`${DATA_SOURCE_URL}?t=${Date.now()}`, { cache: "no-store" });
          const data = await response.json();
          if (data.battles) setBattles(data.battles);
          // Only accept the new liveBattles array from remote — ignore old single liveBattle key
          if (data.liveBattles) setLiveBattles(data.liveBattles);
          if (data.battles || data.liveBattles) {
            setLoading(false);
            return;
          }
        }
      } catch (error) {
        console.error("Failed to fetch battles:", error);
      }

      const saved = localStorage.getItem("battleData");
      const parsed = saved ? JSON.parse(saved) : null;
      if (parsed && parsed.length > 0) setBattles(parsed);
      else {
        setBattles(INITIAL_BATTLES);
        localStorage.setItem("battleData", JSON.stringify(INITIAL_BATTLES));
      }

      const savedLive = localStorage.getItem("liveBattles");
      if (savedLive) setLiveBattles(JSON.parse(savedLive));
      else localStorage.setItem("liveBattles", JSON.stringify(INITIAL_LIVE_BATTLES));
      setLoading(false);
    };

    loadData();
  }, []);

  const addBattle = (newBattle) => {
    const updated = [newBattle, ...battles];
    setBattles(updated);
    localStorage.setItem("battleData", JSON.stringify(updated));
  };

  const updateLiveBattles = (updatedLives) => {
    setLiveBattles(updatedLives);
    localStorage.setItem("liveBattles", JSON.stringify(updatedLives));
  };

  const deleteBattle = (id) => {
    const updated = battles.filter(b => b.id !== id);
    setBattles(updated);
    localStorage.setItem("battleData", JSON.stringify(updated));
  };

  const clearBattles = () => {
    setBattles([]);
    localStorage.removeItem("battleData");
  };

  const updateBattle = (id, changes) => {
    const updated = battles.map(b => b.id === id ? { ...b, ...changes } : b);
    setBattles(updated);
    localStorage.setItem("battleData", JSON.stringify(updated));
  };

  const resetLiveBattles = () => {
    setLiveBattles(INITIAL_LIVE_BATTLES);
    localStorage.setItem("liveBattles", JSON.stringify(INITIAL_LIVE_BATTLES));
  };

  // liveBattle kept for backward compat
  const liveBattle = liveBattles[0] ?? INITIAL_LIVE_BATTLES[0];

  return { battles, liveBattle, liveBattles, addBattle, updateBattle, updateLiveBattles, deleteBattle, clearBattles, resetLiveBattles, loading };
}
