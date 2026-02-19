import { useState, useEffect } from "react";
import { DATA_SOURCE_URL } from "../constants";

const INITIAL_BATTLES = [
  { id: 1, date: "2026-02-15", time: "22:00", regions: ["India", "Korea", "USA"], target: "15M" },
  { id: 2, date: "2026-02-15", time: "18:00", regions: ["Global"], target: "50M" },
  { id: 3, date: "2026-02-14", time: "23:00", regions: ["Japan", "SE Asia"], target: "10M" },
  { id: 4, date: "2026-02-14", time: "14:00", regions: ["Europe", "L-Am"], target: "8M" },
  { id: 5, date: "2026-02-13", time: "20:00", regions: ["Global"], target: "100M" },
  { id: 6, date: "2026-02-12", time: "21:00", regions: ["USA", "Canada"], target: "12M" },
];

const INITIAL_LIVE_BATTLES = [
  { id: "lb1", title: "South Asia vs Africa", goal: "200M", progress: 85, platform: "Spotify", status: "Surging" },
  { id: "lb2", title: "Oceania vs West Asia", goal: "150M", progress: 62, platform: "Spotify", status: "On Track" },
  { id: "lb3", title: "North America vs South & Central America", goal: "80M", progress: 41, platform: "Spotify", status: "Heating Up" },
  { id: "lb4", title: "Europe vs East & South East Asia", goal: "50M", progress: 78, platform: "Spotify", status: "Almost There" },
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
      if (saved) setBattles(JSON.parse(saved));
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

  // liveBattle kept for backward compat
  const liveBattle = liveBattles[0] ?? INITIAL_LIVE_BATTLES[0];

  return { battles, liveBattle, liveBattles, addBattle, updateLiveBattles, deleteBattle, clearBattles, loading };
}
