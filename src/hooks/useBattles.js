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

const INITIAL_LIVE = {
  title: "Butter vs Dynamite",
  goal: "200M",
  progress: 85
};

export default function useBattles() {
  const [battles, setBattles] = useState([]);
  const [liveBattle, setLiveBattle] = useState(INITIAL_LIVE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (DATA_SOURCE_URL) {
          const response = await fetch(DATA_SOURCE_URL);
          const data = await response.json();
          if (data.battles) setBattles(data.battles);
          if (data.liveBattle) setLiveBattle(data.liveBattle);
          if (data.battles || data.liveBattle) {
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

      const savedLive = localStorage.getItem("liveBattle");
      if (savedLive) setLiveBattle(JSON.parse(savedLive));
      else localStorage.setItem("liveBattle", JSON.stringify(INITIAL_LIVE));
      setLoading(false);
    };

    loadData();
  }, []);

  const addBattle = (newBattle) => {
    const updated = [newBattle, ...battles];
    setBattles(updated);
    localStorage.setItem("battleData", JSON.stringify(updated));
  };

  const updateLiveBattle = (updatedLive) => {
    setLiveBattle(updatedLive);
    localStorage.setItem("liveBattle", JSON.stringify(updatedLive));
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

  return { battles, liveBattle, addBattle, updateLiveBattle, deleteBattle, clearBattles, loading };
}
