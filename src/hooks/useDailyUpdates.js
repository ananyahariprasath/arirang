import { useState, useEffect } from "react";
import { DATA_SOURCE_URL } from "../constants";

function normalizeUpdates(items = []) {
  return (Array.isArray(items) ? items : [])
    .map((item) => ({
      id: item?.id || item?.updatedAt || item?.createdAt || String(Date.now()),
      title: String(item?.title || "").trim(),
      message: String(item?.message || "").trim(),
      imageUrl: String(item?.imageUrl || "").trim(),
      quote: String(item?.quote || "").trim(),
      updatedAt: item?.updatedAt || item?.createdAt || new Date().toISOString(),
    }))
    .filter((item) => item.message.length > 0)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export default function useDailyUpdates() {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      let hasServerConfig = false;
      try {
        const configResponse = await fetch("/api/app-config?key=dailyUpdates", { cache: "no-store" });
        if (configResponse.ok) {
          const configData = await configResponse.json();
          if (Array.isArray(configData?.value)) {
            const next = normalizeUpdates(configData.value);
            setUpdates(next);
            localStorage.setItem("dailyUpdates", JSON.stringify(next));
            hasServerConfig = true;
          }
        }

        if (DATA_SOURCE_URL) {
          const response = await fetch(`${DATA_SOURCE_URL}?t=${Date.now()}`, { cache: "no-store" });
          const data = await response.json();
          if (!hasServerConfig && Array.isArray(data?.dailyUpdates)) {
            const next = normalizeUpdates(data.dailyUpdates);
            setUpdates(next);
            localStorage.setItem("dailyUpdates", JSON.stringify(next));
            setLoading(false);
            return;
          }
          if (hasServerConfig || Array.isArray(data?.dailyUpdates)) {
            setLoading(false);
            return;
          }
        }
      } catch (error) {
        console.error("Failed to fetch daily updates:", error);
      }

      if (!hasServerConfig) {
        const saved = localStorage.getItem("dailyUpdates");
        if (saved) {
          const parsed = JSON.parse(saved);
          setUpdates(normalizeUpdates(parsed));
        } else {
          setUpdates([]);
          localStorage.setItem("dailyUpdates", JSON.stringify([]));
        }
      }

      setLoading(false);
    };

    loadData();
  }, []);

  const persistUpdates = async (nextUpdates) => {
    try {
      await fetch("/api/app-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "dailyUpdates", value: nextUpdates }),
      });
    } catch (error) {
      console.error("Failed to persist daily updates config:", error);
    }
  };

  const addUpdate = ({ title, message, imageUrl, quote }) => {
    const now = new Date().toISOString();
    const newItem = {
      id: now,
      title: String(title || "").trim(),
      message: String(message || "").trim(),
      imageUrl: String(imageUrl || "").trim(),
      quote: String(quote || "").trim(),
      updatedAt: now,
    };
    setUpdates((prev) => {
      const next = normalizeUpdates([newItem, ...prev]);
      localStorage.setItem("dailyUpdates", JSON.stringify(next));
      void persistUpdates(next);
      return next;
    });
  };

  const deleteUpdate = (id) => {
    setUpdates((prev) => {
      const next = normalizeUpdates(prev.filter((item) => String(item.id) !== String(id)));
      localStorage.setItem("dailyUpdates", JSON.stringify(next));
      void persistUpdates(next);
      return next;
    });
  };

  const clearUpdates = () => {
    setUpdates([]);
    localStorage.setItem("dailyUpdates", JSON.stringify([]));
    void persistUpdates([]);
  };

  return { updates, latestUpdate: updates[0] || null, addUpdate, deleteUpdate, clearUpdates, loading };
}
