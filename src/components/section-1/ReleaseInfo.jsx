import { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";

const ReleaseInfo = () => {
  const { theme } = useTheme();
  const [localNow, setLocalNow] = useState("");
  const [timeZone, setTimeZone] = useState("");

  useEffect(() => {
    // Initialize immediately
    const now = new Date();
    setLocalNow(
      now.toLocaleString([], {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    );
    setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);

    // Update every second
    const localTimer = setInterval(() => {
      const now = new Date();
      setLocalNow(
        now.toLocaleString([], {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
      setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    }, 1000);

    return () => {
      clearInterval(localTimer);
    };
  }, []);

  return (
    <div className="text-center mb-4">
      <p className="text-sm md:text-base font-medium opacity-90">
        Release Date: 20 March 2026, 01:00PM KST
      </p>
      <p className="text-xs md:text-sm opacity-70 mt-1">
        Your Time: {localNow} ({timeZone})
      </p>
    </div>
  );
};

export default ReleaseInfo;
