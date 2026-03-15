import { useState, useEffect } from "react";
import { INITIAL_REGIONS, DATA_SOURCE_URL, clonePlaylists } from "../constants";

function normalizeRegion(region = {}) {
  const updated = { ...region };
  if (!updated.goal && updated.hashtag) {
    updated.goal = "Stream and support ARIRANG!";
    delete updated.hashtag;
  }
  if (!updated.playlists) {
    updated.playlists = clonePlaylists();
  } else {
    updated.playlists = clonePlaylists(updated.playlists);
  }
  return updated;
}

function normalizeRegions(regions = []) {
  return regions.map((region) => normalizeRegion(region));
}

export default function useRegionalData() {
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      let hasServerConfig = false;
      try {
        const configResponse = await fetch("/api/app-config?key=regions", { cache: "no-store" });
        if (configResponse.ok) {
          const configData = await configResponse.json();
          if (Array.isArray(configData?.value)) {
            const next = normalizeRegions(configData.value);
            setRegions(next);
            localStorage.setItem("regionalData", JSON.stringify(next));
            hasServerConfig = true;
          }
        }

        if (DATA_SOURCE_URL) {
          const response = await fetch(`${DATA_SOURCE_URL}?t=${Date.now()}`, { cache: "no-store" });
          const data = await response.json();
          if (!hasServerConfig && Array.isArray(data?.regions)) {
            const next = normalizeRegions(data.regions);
            setRegions(next);
            localStorage.setItem("regionalData", JSON.stringify(next));
            setLoading(false);
            return;
          }
          if (hasServerConfig || Array.isArray(data?.regions)) {
            setLoading(false);
            return;
          }
        }
      } catch (error) {
        console.error("Failed to fetch regions:", error);
      }

      if (!hasServerConfig) {
        const savedRegions = localStorage.getItem("regionalData");
        if (savedRegions) {
          const parsed = JSON.parse(savedRegions);
          setRegions(normalizeRegions(Array.isArray(parsed) ? parsed : []));
        } else {
          const initial = normalizeRegions(INITIAL_REGIONS);
          setRegions(initial);
          localStorage.setItem("regionalData", JSON.stringify(initial));
        }
      }

      setLoading(false);
    };

    loadData();
  }, []);

  const persistRegions = async (nextRegions) => {
    try {
      await fetch("/api/app-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "regions", value: nextRegions }),
      });
    } catch (error) {
      console.error("Failed to persist regions config:", error);
    }
  };

  const addRegion = (newRegion) => {
    const incoming = Array.isArray(newRegion) ? newRegion : [newRegion];
    setRegions((prev) => {
      const updated = normalizeRegions([
        ...prev.filter((region) => !incoming.some((next) => next.country === region.country)),
        ...incoming,
      ]);
      localStorage.setItem("regionalData", JSON.stringify(updated));
      void persistRegions(updated);
      return updated;
    });
  };

  const deleteRegion = (country) => {
    const updated = normalizeRegions(regions.filter((region) => region.country !== country));
    setRegions(updated);
    localStorage.setItem("regionalData", JSON.stringify(updated));
    void persistRegions(updated);
  };

  const resetRegions = () => {
    const initial = normalizeRegions(INITIAL_REGIONS);
    setRegions(initial);
    localStorage.setItem("regionalData", JSON.stringify(initial));
    void persistRegions(initial);
  };

  return { regions, addRegion, deleteRegion, resetRegions, loading };
}
