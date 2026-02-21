const ABBR_OVERRIDES = {
  // South & Central Asia
  "Asia/Karachi": "PKT",
  "Asia/Kolkata": "IST",
  "Asia/Dhaka": "BST",
  "Asia/Colombo": "IST",
  "Asia/Kabul": "AFT",
  "Asia/Kathmandu": "NPT",
  "Asia/Tashkent": "UZT",
  "Asia/Almaty": "ALMT",

  // Southeast & East Asia
  "Asia/Bangkok": "ICT",
  "Asia/Jakarta": "WIB",
  "Asia/Manila": "PHT",
  "Asia/Singapore": "SGT",
  "Asia/Ho_Chi_Minh": "ICT",
  "Asia/Seoul": "KST",
  "Asia/Tokyo": "JST",

  // Europe
  "Europe/London": "GMT",
  "Europe/Paris": "CET",
  "Europe/Berlin": "CET",
  "Europe/Rome": "CET",
  "Europe/Madrid": "CET",
  "Europe/Amsterdam": "CET",
  "Europe/Brussels": "CET",
  "Europe/Vienna": "CET",
  "Europe/Warsaw": "CET",

  // Middle East
  "Asia/Dubai": "GST",
  "Asia/Riyadh": "AST",
  "Asia/Qatar": "AST",

  // Americas
  "America/New_York": "ET",
  "America/Chicago": "CT",
  "America/Denver": "MT",
  "America/Los_Angeles": "PT",
  "America/Sao_Paulo": "BRT",
  "America/Argentina/Buenos_Aires": "ART",

  // Oceania
  "Australia/Sydney": "AEST",
  "Pacific/Auckland": "NZST"
};

export const formatResetTime = (timeStr, timezone) => {
  if (!timeStr || !timezone) return timeStr;
  
  try {
    let hours, minutes;
    
    // Check if it's 12h format (e.g., "12:30 AM") - more flexible regex to handle suffixes like IST
    const match12 = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)(?:\s+\w+)?$/i);
    if (match12) {
      hours = parseInt(match12[1]);
      minutes = parseInt(match12[2]);
      const isPM = match12[3].toUpperCase() === "PM";
      
      if (isPM && hours < 12) hours += 12;
      if (!isPM && hours === 12) hours = 0;
    } else {
      // Fallback to 24h format (e.g., "00:30")
      const parts = timeStr.split(":").map(Number);
      if (parts.length >= 2) {
        [hours, minutes] = parts;
      } else {
        return timeStr;
      }
    }

    const date = new Date();
    date.setHours(hours, minutes, 0, 0);

    // Format for display: "12:30 AM"
    const formattedTime = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: timezone
    });

    // Get timezone abbreviation: "IST"
    let tzAbbr = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "short"
    }).formatToParts(date).find(p => p.type === "timeZoneName")?.value || "";

    // Apply overrides if it's an offset (contains GMT or + or -)
    if (ABBR_OVERRIDES[timezone] && (tzAbbr.includes("GMT") || tzAbbr.includes("+") || tzAbbr.includes("-"))) {
      tzAbbr = ABBR_OVERRIDES[timezone];
    }

    return `${formattedTime} ${tzAbbr}`;
  } catch (error) {
    console.error("Error formatting reset time:", error);
    return timeStr;
  }
};
