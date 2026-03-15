import { useEffect, useState } from "react";
import { DATA_SOURCE_URL, DEFAULT_DAILY_MISSIONS } from "../constants";

const DEFAULT_MISSION = {
  title: "",
  description: "",
  type: "custom",
  target: 1,
  unit: "actions",
  autoCheck: true,
  active: true
};

function normalizeMissions(items = []) {
  const base = Array.isArray(items) ? items : [];
  return base.map((item, index) => {
    const target = Number(item?.target ?? 1);
    return {
      id: String(item?.id || `${Date.now()}-${index}`),
      title: String(item?.title || "").trim(),
      description: String(item?.description || "").trim(),
      type: String(item?.type || DEFAULT_MISSION.type),
      target: Number.isFinite(target) && target > 0 ? target : DEFAULT_MISSION.target,
      unit: String(item?.unit || DEFAULT_MISSION.unit).trim(),
      autoCheck: Boolean(item?.autoCheck ?? DEFAULT_MISSION.autoCheck),
      active: Boolean(item?.active ?? DEFAULT_MISSION.active),
      order: Number.isFinite(item?.order) ? Number(item.order) : index + 1,
      updatedAt: item?.updatedAt || new Date().toISOString()
    };
  }).sort((a, b) => a.order - b.order);
}

export default function useDailyMissions() {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      let hasServerConfig = false;
      try {
        const configResponse = await fetch("/api/app-config?key=dailyMissions", { cache: "no-store" });
        if (configResponse.ok) {
          const configData = await configResponse.json();
          if (Array.isArray(configData?.value)) {
            const next = normalizeMissions(configData.value);
            setMissions(next);
            localStorage.setItem("dailyMissions", JSON.stringify(next));
            hasServerConfig = true;
          }
        }

        if (DATA_SOURCE_URL) {
          const response = await fetch(`${DATA_SOURCE_URL}?t=${Date.now()}`, { cache: "no-store" });
          const data = await response.json();
          if (!hasServerConfig && Array.isArray(data?.dailyMissions)) {
            const next = normalizeMissions(data.dailyMissions);
            setMissions(next);
            localStorage.setItem("dailyMissions", JSON.stringify(next));
            setLoading(false);
            return;
          }
          if (hasServerConfig || Array.isArray(data?.dailyMissions)) {
            setLoading(false);
            return;
          }
        }
      } catch (error) {
        console.error("Failed to fetch daily missions:", error);
      }

      if (!hasServerConfig) {
        const saved = localStorage.getItem("dailyMissions");
        if (saved) {
          setMissions(normalizeMissions(JSON.parse(saved)));
        } else {
          const next = normalizeMissions(DEFAULT_DAILY_MISSIONS);
          setMissions(next);
          localStorage.setItem("dailyMissions", JSON.stringify(next));
        }
      }

      setLoading(false);
    };

    loadData();
  }, []);

  const persistMissions = async (nextMissions) => {
    try {
      await fetch("/api/app-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "dailyMissions", value: nextMissions })
      });
    } catch (error) {
      console.error("Failed to persist daily missions config:", error);
    }
  };

  const updateMissions = (next) => {
    const normalized = normalizeMissions(next);
    setMissions(normalized);
    localStorage.setItem("dailyMissions", JSON.stringify(normalized));
    void persistMissions(normalized);
  };

  const addMission = (mission) => {
    const now = new Date().toISOString();
    const next = [
      ...missions,
      {
        id: now,
        updatedAt: now,
        order: missions.length + 1,
        ...DEFAULT_MISSION,
        ...mission
      }
    ];
    updateMissions(next);
  };

  const updateMission = (id, changes) => {
    const next = missions.map((mission) =>
      String(mission.id) === String(id)
        ? { ...mission, ...changes, updatedAt: new Date().toISOString() }
        : mission
    );
    updateMissions(next);
  };

  const deleteMission = (id) => {
    const next = missions.filter((mission) => String(mission.id) !== String(id));
    updateMissions(next);
  };

  const clearMissions = () => {
    updateMissions([]);
  };

  const resetMissions = () => {
    updateMissions(DEFAULT_DAILY_MISSIONS);
  };

  return {
    missions,
    loading,
    addMission,
    updateMission,
    deleteMission,
    clearMissions,
    resetMissions
  };
}

