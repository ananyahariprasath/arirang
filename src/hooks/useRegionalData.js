import { useState, useEffect } from "react";
import { INITIAL_REGIONS, GLOBAL_DEFAULT, DATA_SOURCE_URL, FOCUS_PLAYLISTS } from "../constants";



export default function useRegionalData() {
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (DATA_SOURCE_URL) {
          const response = await fetch(`${DATA_SOURCE_URL}?t=${Date.now()}`, { cache: "no-store" });
          const data = await response.json();
          if (data.regions) {
            // Ensure remote data also has playlists
            const withPlaylists = data.regions.map(r => ({
              ...r,
              playlists: r.playlists || FOCUS_PLAYLISTS
            }));
            setRegions(withPlaylists);
            setLoading(false);
            return;
          }
        }
      } catch (error) {
        console.error("Failed to fetch regions:", error);
      }

      const savedRegions = localStorage.getItem("regionalData");
      if (savedRegions) {
        let parsed = JSON.parse(savedRegions);
        parsed = parsed.map(r => {
          let updated = { ...r };
          // Migration: Hashtag to Goal
          if (!updated.goal && updated.hashtag) {
            updated.goal = "Stream and support ARIRANG! 💜";
            delete updated.hashtag;
          }
          // Migration: Ensure 20 playlists per region
          if (!updated.playlists) {
            updated.playlists = FOCUS_PLAYLISTS;
          }
          return updated;
        });
        setRegions(parsed);
      } else {
        setRegions(INITIAL_REGIONS);
        localStorage.setItem("regionalData", JSON.stringify(INITIAL_REGIONS));
      }

      setLoading(false);
    };

    loadData();
  }, []);

  const addRegion = (newRegion) => {
    const updated = [...regions.filter(r => r.country !== newRegion.country), newRegion];
    setRegions(updated);
    localStorage.setItem("regionalData", JSON.stringify(updated));
  };

  const deleteRegion = (country) => {
    const updated = regions.filter(r => r.country !== country);
    setRegions(updated);
    localStorage.setItem("regionalData", JSON.stringify(updated));
  };

  const resetRegions = () => {
    setRegions(INITIAL_REGIONS);
    localStorage.setItem("regionalData", JSON.stringify(INITIAL_REGIONS));
  };

  return { regions, addRegion, deleteRegion, resetRegions, loading };
}
