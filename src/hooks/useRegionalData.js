import { useState, useEffect } from "react";
import { INITIAL_REGIONS, GLOBAL_DEFAULT, DATA_SOURCE_URL } from "../constants";

export { GLOBAL_DEFAULT };

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
            setRegions(data.regions);
            setLoading(false);
            return;
          }
        }
      } catch (error) {
        console.error("Failed to fetch regions:", error);
      }

      const saved = localStorage.getItem("regionalData");
      if (saved) {
        setRegions(JSON.parse(saved));
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
