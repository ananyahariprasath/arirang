import { useState, useEffect } from "react";
import { DATA_SOURCE_URL } from "../constants";

const INITIAL_MODS = [
  {
    id: "mod-a",
    name: "Mod A",
    status: "online",
    accounts: [
      { platform: "X", url: "https://x.com/moda" },
      { platform: "Instagram", url: "https://instagram.com/moda" },
    ],
  },
  {
    id: "mod-b",
    name: "Mod B",
    status: "online",
    accounts: [
      { platform: "X", url: "https://x.com/modb" },
      { platform: "Instagram", url: "https://instagram.com/modb" },
    ],
  },
  {
    id: "mod-c",
    name: "Mod C",
    status: "online",
    accounts: [
      { platform: "X", url: "https://x.com/modc" },
      { platform: "Instagram", url: "https://instagram.com/modc" },
    ],
  },
  {
    id: "mod-d",
    name: "Mod D",
    status: "online",
    accounts: [
      { platform: "X", url: "https://x.com/modd" },
      { platform: "Instagram", url: "https://instagram.com/modd" },
    ],
  },
  {
    id: "mod-e",
    name: "Mod E",
    status: "online",
    accounts: [
      { platform: "X", url: "https://x.com/mode" },
      { platform: "Instagram", url: "https://instagram.com/mode" },
    ],
  },
  {
    id: "mod-f",
    name: "Mod F",
    status: "online",
    accounts: [
      { platform: "X", url: "https://x.com/modf" },
      { platform: "Instagram", url: "https://instagram.com/modf" },
    ],
  },
];

function normalizeMods(mods = []) {
  return mods.map((mod) => {
    if (!mod.accounts && mod.links) {
      return {
        ...mod,
        accounts: [
          { platform: "X", url: mod.links.x || "" },
          { platform: "Instagram", url: mod.links.instagram || "" },
        ],
      };
    }
    return mod;
  });
}

export default function useModStatus() {
  const [mods, setMods] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      let hasServerConfig = false;
      try {
        const configResponse = await fetch("/api/app-config?key=mods", { cache: "no-store" });
        if (configResponse.ok) {
          const configData = await configResponse.json();
          if (Array.isArray(configData?.value)) {
            const next = normalizeMods(configData.value);
            setMods(next);
            localStorage.setItem("modStatusData", JSON.stringify(next));
            hasServerConfig = true;
          }
        }

        if (DATA_SOURCE_URL) {
          const response = await fetch(`${DATA_SOURCE_URL}?t=${Date.now()}`, { cache: "no-store" });
          const data = await response.json();
          if (!hasServerConfig && Array.isArray(data?.mods)) {
            const next = normalizeMods(data.mods);
            setMods(next);
            localStorage.setItem("modStatusData", JSON.stringify(next));
            setLoading(false);
            return;
          }
          if (hasServerConfig || Array.isArray(data?.mods)) {
            setLoading(false);
            return;
          }
        }
      } catch (error) {
        console.error("Failed to fetch mods:", error);
      }

      if (!hasServerConfig) {
        const saved = localStorage.getItem("modStatusData");
        if (saved) {
          const parsed = JSON.parse(saved);
          setMods(normalizeMods(Array.isArray(parsed) ? parsed : []));
        } else {
          setMods(INITIAL_MODS);
          localStorage.setItem("modStatusData", JSON.stringify(INITIAL_MODS));
        }
      }

      setLoading(false);
    };

    loadData();
  }, []);

  const persistMods = async (nextMods) => {
    try {
      await fetch("/api/app-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "mods", value: nextMods }),
      });
    } catch (error) {
      console.error("Failed to persist mods config:", error);
    }
  };

  const toggleStatus = (id) => {
    setMods((prev) => {
      const updated = prev.map((mod) =>
        mod.id === id ? { ...mod, status: mod.status === "online" ? "offline" : "online" } : mod
      );
      localStorage.setItem("modStatusData", JSON.stringify(updated));
      void persistMods(updated);
      return updated;
    });
  };

  const updateModDetails = (id, newName, newAccounts) => {
    setMods((prev) => {
      const updated = prev.map((mod) =>
        mod.id === id ? { ...mod, name: newName, accounts: newAccounts } : mod
      );
      localStorage.setItem("modStatusData", JSON.stringify(updated));
      void persistMods(updated);
      return updated;
    });
  };

  const resetMods = () => {
    setMods(INITIAL_MODS);
    localStorage.setItem("modStatusData", JSON.stringify(INITIAL_MODS));
    void persistMods(INITIAL_MODS);
  };

  return {
    mods,
    toggleStatus,
    updateModDetails,
    resetMods,
    loading,
  };
}

