import { useState, useEffect } from "react";
import { INITIAL_REGIONS, GLOBAL_DEFAULT } from "../constants";

export { GLOBAL_DEFAULT };

export default function useRegionalData() {
  const [regions, setRegions] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem("regionalData");
    if (saved) {
      setRegions(JSON.parse(saved));
    } else {
      setRegions(INITIAL_REGIONS);
      localStorage.setItem("regionalData", JSON.stringify(INITIAL_REGIONS));
    }
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

  return { regions, addRegion, deleteRegion, resetRegions };
}
