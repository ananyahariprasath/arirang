import { useState, useEffect } from "react";
import { DATA_SOURCE_URL } from "../constants";

const INITIAL_TIMELINE = [
  { id: 1, date: "March 20", time: "13:00", platform: "YouTube", event: "Official MV Release & Premiere" },
  { id: 2, date: "March 20", time: "13:10", platform: "All Platforms", event: "Digital Single Release" },
  { id: 3, date: "March 21", time: "18:00", regions: "Global", platform: "Spotify", event: "First 24H Streaming Report" },
  { id: 4, date: "March 22", time: "10:00", platform: "Apple Music", event: "Artist Spotlight Feature" },
  { id: 5, date: "March 23", time: "22:00", platform: "Weverse", event: "Special Live Celebration" },
  { id: 6, date: "March 27", time: "13:00", platform: "YouTube", event: "Official Remix Pack Release" },
];

export default function useTimeline() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      let hasServerConfig = false;
      try {
        const configResponse = await fetch("/api/app-config?key=timeline", { cache: "no-store" });
        if (configResponse.ok) {
          const configData = await configResponse.json();
          if (Array.isArray(configData?.value)) {
            setEvents(configData.value);
            localStorage.setItem("timelineData", JSON.stringify(configData.value));
            hasServerConfig = true;
          }
        }

        if (DATA_SOURCE_URL) {
          const response = await fetch(`${DATA_SOURCE_URL}?t=${Date.now()}`, { cache: "no-store" });
          const data = await response.json();
          if (!hasServerConfig && data.timeline) {
            setEvents(data.timeline);
            localStorage.setItem("timelineData", JSON.stringify(data.timeline));
            setLoading(false);
            return;
          }
          if (hasServerConfig || data.timeline) {
            setLoading(false);
            return;
          }
        }
      } catch (error) {
        console.error("Failed to fetch timeline:", error);
      }

      if (!hasServerConfig) {
        const saved = localStorage.getItem("timelineData");
        if (saved) {
          setEvents(JSON.parse(saved));
        } else {
          setEvents(INITIAL_TIMELINE);
          localStorage.setItem("timelineData", JSON.stringify(INITIAL_TIMELINE));
        }
      }
      setLoading(false);
    };

    loadData();
  }, []);

  const persistTimeline = async (nextTimeline) => {
    try {
      await fetch("/api/app-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "timeline", value: nextTimeline }),
      });
    } catch (error) {
      console.error("Failed to persist timeline config:", error);
    }
  };

  const addEvent = (newEvent) => {
    const updated = [...events, newEvent].sort((a, b) => {
      // Very simple sort by date/time string for now
      return a.date.localeCompare(b.date) || a.time.localeCompare(b.time);
    });
    setEvents(updated);
    localStorage.setItem("timelineData", JSON.stringify(updated));
    void persistTimeline(updated);
  };

  const deleteEvent = (id) => {
    const updated = events.filter(e => e.id !== id);
    setEvents(updated);
    localStorage.setItem("timelineData", JSON.stringify(updated));
    void persistTimeline(updated);
  };

  const clearTimeline = () => {
    setEvents([]);
    localStorage.removeItem("timelineData");
    void persistTimeline([]);
  };

  const resetToDefault = () => {
    setEvents(INITIAL_TIMELINE);
    localStorage.setItem("timelineData", JSON.stringify(INITIAL_TIMELINE));
    void persistTimeline(INITIAL_TIMELINE);
  };

  const updateEvent = (id, changes) => {
    const updated = events.map(e => e.id === id ? { ...e, ...changes } : e);
    setEvents(updated);
    localStorage.setItem("timelineData", JSON.stringify(updated));
    void persistTimeline(updated);
  };

  return { events, addEvent, updateEvent, deleteEvent, clearTimeline, resetToDefault, loading };
}
