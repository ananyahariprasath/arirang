import { useState, useEffect } from "react";
import { DATA_SOURCE_URL } from "../constants";

const INITIAL_MODS = [
  {
    id: "mod-a",
    name: "Mod A",
    status: "online",
    accounts: [
      { platform: "X", url: "https://x.com/moda" },
      { platform: "Instagram", url: "https://instagram.com/moda" }
    ],
  },
  {
    id: "mod-b",
    name: "Mod B",
    status: "online",
    accounts: [
      { platform: "X", url: "https://x.com/modb" },
      { platform: "Instagram", url: "https://instagram.com/modb" }
    ],
  },
  {
    id: "mod-c",
    name: "Mod C",
    status: "online",
    accounts: [
      { platform: "X", url: "https://x.com/modc" },
      { platform: "Instagram", url: "https://instagram.com/modc" }
    ],
  },
  {
    id: "mod-d",
    name: "Mod D",
    status: "online",
    accounts: [
      { platform: "X", url: "https://x.com/modd" },
      { platform: "Instagram", url: "https://instagram.com/modd" }
    ],
  },
  {
    id: "mod-e",
    name: "Mod E",
    status: "online",
    accounts: [
      { platform: "X", url: "https://x.com/mode" },
      { platform: "Instagram", url: "https://instagram.com/mode" }
    ],
  },
  {
    id: "mod-f",
    name: "Mod F",
    status: "online",
    accounts: [
      { platform: "X", url: "https://x.com/modf" },
      { platform: "Instagram", url: "https://instagram.com/modf" }
    ],
  },
];

export default function useModStatus() {
  const [mods, setMods] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (DATA_SOURCE_URL) {
          const response = await fetch(`${DATA_SOURCE_URL}?t=${Date.now()}`, { cache: "no-store" });
          const data = await response.json();
          if (data.mods) {
            setMods(data.mods);
            setLoading(false);
            return;
          }
        }
      } catch (error) {
        console.error("Failed to fetch mods:", error);
      }

      const saved = localStorage.getItem("modStatusData");
      if (saved) {
        let parsed = JSON.parse(saved);
        // Migration: If we have old 'links' object but no 'accounts', convert it
        const migrated = parsed.map(m => {
          if (!m.accounts && m.links) {
            const accounts = [
              { platform: "X", url: m.links.x || "" },
              { platform: "Instagram", url: m.links.instagram || "" }
            ];
            return { ...m, accounts };
          }
          return m;
        });
        setMods(migrated);
      } else {
        setMods(INITIAL_MODS);
        localStorage.setItem("modStatusData", JSON.stringify(INITIAL_MODS));
      }
      setLoading(false);
    };

    loadData();
  }, []);


  const toggleStatus = (id) => {
    setMods(prev => {
      const updated = prev.map((m) =>
        m.id === id ? { ...m, status: m.status === "online" ? "offline" : "online" } : m
      );
      localStorage.setItem("modStatusData", JSON.stringify(updated));
      return updated;
    });
  };

  const updateModDetails = (id, newName, newAccounts) => {
    setMods(prev => {
      const updated = prev.map((m) => 
        m.id === id ? { ...m, name: newName, accounts: newAccounts } : m
      );
      localStorage.setItem("modStatusData", JSON.stringify(updated));
      return updated;
    });
  };

  const resetMods = () => {
    setMods(INITIAL_MODS);
    localStorage.setItem("modStatusData", JSON.stringify(INITIAL_MODS));
  };

  return {
    mods,
    toggleStatus,
    updateModDetails,
    resetMods,
    loading,
  };
}
