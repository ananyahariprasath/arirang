import { useState, useEffect } from "react";
import { DATA_SOURCE_URL } from "../constants";

const INITIAL_MODS = [
  {
    id: "mod-a",
    name: "Mod A",
    status: "online",
    links: {
      x: "https://x.com/moda",
      instagram: "https://instagram.com/moda",
      weverse: "https://weverse.io/moda",
      facebook: "https://facebook.com/moda",
      telegram: "https://t.me/moda",
    },
  },
  {
    id: "mod-b",
    name: "Mod B",
    status: "online",
    links: {
      x: "https://x.com/modb",
      instagram: "https://instagram.com/modb",
      weverse: "https://weverse.io/modb",
      facebook: "https://facebook.com/modb",
      telegram: "https://t.me/modb",
    },
  },
  {
    id: "mod-c",
    name: "Mod C",
    status: "online",
    links: {
      x: "https://x.com/modc",
      instagram: "https://instagram.com/modc",
      weverse: "https://weverse.io/modc",
      facebook: "https://facebook.com/modc",
      telegram: "https://t.me/modc",
    },
  },
  {
    id: "mod-d",
    name: "Mod D",
    status: "online",
    links: {
      x: "https://x.com/modd",
      instagram: "https://instagram.com/modd",
      weverse: "https://weverse.io/modd",
      facebook: "https://facebook.com/modd",
      telegram: "https://t.me/modd",
    },
  },
  {
    id: "mod-e",
    name: "Mod E",
    status: "online",
    links: {
      x: "https://x.com/mode",
      instagram: "https://instagram.com/mode",
      weverse: "https://weverse.io/mode",
      facebook: "https://facebook.com/mode",
      telegram: "https://t.me/mode",
    },
  },
  {
    id: "mod-f",
    name: "Mod F",
    status: "online",
    links: {
      x: "https://x.com/modf",
      instagram: "https://instagram.com/modf",
      weverse: "https://weverse.io/modf",
      facebook: "https://facebook.com/modf",
      telegram: "https://t.me/modf",
    },
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
        setMods(JSON.parse(saved));
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

  const updateModDetails = (id, newName, newLinks) => {
    setMods(prev => {
      const updated = prev.map((m) => 
        m.id === id ? { ...m, name: newName, links: newLinks } : m
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
