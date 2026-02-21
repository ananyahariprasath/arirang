const ABBR_OVERRIDES = {
  // --- AFRICA ---
  "Africa/Abidjan": "GMT",
  "Africa/Accra": "GMT",
  "Africa/Addis_Ababa": "EAT",
  "Africa/Algiers": "CET",
  "Africa/Asmara": "EAT",
  "Africa/Bamako": "GMT",
  "Africa/Bangui": "WAT",
  "Africa/Banjul": "GMT",
  "Africa/Bissau": "GMT",
  "Africa/Blantyre": "CAT",
  "Africa/Brazzaville": "WAT",
  "Africa/Bujumbura": "CAT",
  "Africa/Cairo": "EET",
  "Africa/Casablanca": "WEST",
  "Africa/Conakry": "GMT",
  "Africa/Dakar": "GMT",
  "Africa/Dar_es_Salaam": "EAT",
  "Africa/Djibouti": "EAT",
  "Africa/Douala": "WAT",
  "Africa/Freetown": "GMT",
  "Africa/Gaborone": "CAT",
  "Africa/Harare": "CAT",
  "Africa/Johannesburg": "SAST",
  "Africa/Juba": "CAT",
  "Africa/Kampala": "EAT",
  "Africa/Khartoum": "CAT",
  "Africa/Kigali": "CAT",
  "Africa/Kinshasa": "WAT",
  "Africa/Lagos": "WAT",
  "Africa/Libreville": "WAT",
  "Africa/Lome": "GMT",
  "Africa/Luanda": "WAT",
  "Africa/Lusaka": "CAT",
  "Africa/Malabo": "WAT",
  "Africa/Maputo": "CAT",
  "Africa/Maseru": "SAST",
  "Africa/Mbabane": "SAST",
  "Africa/Mogadishu": "EAT",
  "Africa/Monrovia": "GMT",
  "Africa/Nairobi": "EAT",
  "Africa/Ndjamena": "WAT",
  "Africa/Niamey": "WAT",
  "Africa/Nouakchott": "GMT",
  "Africa/Ouagadougou": "GMT",
  "Africa/Porto-Novo": "WAT",
  "Africa/Sao_Tome": "GMT",
  "Africa/Tripoli": "EET",
  "Africa/Tunis": "CET",
  "Africa/Windhoek": "CAT",

  // --- AMERICAS ---
  "America/Anchorage": "AKT",
  "America/Antigua": "AST",
  "America/Argentina/Buenos_Aires": "ART",
  "America/Asuncion": "PYT",
  "America/Barbados": "AST",
  "America/Cayman": "EST",
  "America/Belize": "CT",
  "America/Bogota": "COT",
  "America/Caracas": "VET",
  "America/Chicago": "CT",
  "America/Costa_Rica": "CT",
  "America/Danmarkshavn": "GMT",
  "America/Denver": "MT",
  "America/Dominica": "AST",
  "America/Edmonton": "MT",
  "America/El_Salvador": "CT",
  "America/Godthab": "WGT",
  "America/Grenada": "AST",
  "America/Guatemala": "CT",
  "America/Guayaquil": "ECT",
  "America/Guyana": "GYT",
  "America/Halifax": "AT",
  "America/Havana": "CT",
  "America/Hermosillo": "MST",
  "America/Jamaica": "ET",
  "America/La_Paz": "BOT",
  "America/Lima": "PET",
  "America/Los_Angeles": "PT",
  "America/Managua": "CT",
  "America/Manaus": "AMT",
  "America/Mexico_City": "CT",
  "America/Monterrey": "CT",
  "America/Montevideo": "UYT",
  "America/Nassau": "ET",
  "America/New_York": "ET",
  "America/Noronha": "FNT",
  "America/Panama": "ET",
  "America/Phoenix": "MST",
  "America/Paramaribo": "SRT",
  "America/Port-au-Prince": "ET",
  "America/Port_of_Spain": "AST",
  "America/Puerto_Rico": "AST",
  "America/Rio_Branco": "ACT",
  "America/Santiago": "CLT",
  "America/Santo_Domingo": "AST",
  "America/Sao_Paulo": "BRT",
  "America/Scoresbysund": "EGT",
  "America/St_Johns": "NST",
  "America/St_Kitts": "AST",
  "America/St_Lucia": "AST",
  "America/St_Vincent": "AST",
  "America/Tegucigalpa": "CT",
  "America/Thule": "AST",
  "America/Tijuana": "PT",
  "America/Toronto": "ET",
  "America/Vancouver": "PT",
  "America/Winnipeg": "CT",

  // --- ASIA ---
  "Asia/Aden": "AST",
  "Asia/Almaty": "ALMT",
  "Asia/Amman": "EET",
  "Asia/Anadyr": "ANAT",
  "Asia/Aqtau": "AQTT",
  "Asia/Ashgabat": "TMT",
  "Asia/Baghdad": "AST",
  "Asia/Bahrain": "AST",
  "Asia/Baku": "AZT",
  "Asia/Bangkok": "ICT",
  "Asia/Beirut": "EET",
  "Asia/Bishkek": "KGT",
  "Asia/Brunei": "BNT",
  "Asia/Chita": "CHIT",
  "Asia/Colombo": "SLST",
  "Asia/Damascus": "EET",
  "Asia/Dhaka": "BST",
  "Asia/Dili": "TLST",
  "Asia/Dubai": "GST",
  "Asia/Dushanbe": "TJT",
  "Asia/Gaza": "EET",
  "Asia/Hebron": "EET",
  "Asia/Ho_Chi_Minh": "ICT",
  "Asia/Hong_Kong": "HKT",
  "Asia/Irkutsk": "IRKT",
  "Asia/Jakarta": "WIB",
  "Asia/Jayapura": "WIT",
  "Asia/Jerusalem": "IST",
  "Asia/Kabul": "AFT",
  "Asia/Kamchatka": "PETT",
  "Asia/Karachi": "PKT",
  "Asia/Kathmandu": "NPT",
  "Asia/Khandyga": "YAKT",
  "Asia/Kolkata": "IST",
  "Asia/Krasnoyarsk": "KRAT",
  "Asia/Kuala_Lumpur": "MYT",
  "Asia/Kuwait": "AST",
  "Asia/Macau": "CST",
  "Asia/Magadan": "MAGT",
  "Asia/Makassar": "WITA",
  "Asia/Manila": "PHT",
  "Asia/Muscat": "GST",
  "Asia/Nicosia": "EET",
  "Asia/Novosibirsk": "NOVT",
  "Asia/Omsk": "OMST",
  "Asia/Phnom_Penh": "ICT",
  "Asia/Pyongyang": "KST",
  "Asia/Qatar": "AST",
  "Asia/Riyadh": "AST",
  "Asia/Seoul": "KST",
  "Asia/Shanghai": "CST",
  "Asia/Singapore": "SGT",
  "Asia/Srednekolymsk": "SRET",
  "Asia/Taipei": "CST",
  "Asia/Tashkent": "UZT",
  "Asia/Tbilisi": "GET",
  "Asia/Tehran": "IRST",
  "Asia/Thimphu": "BTT",
  "Asia/Tokyo": "JST",
  "Asia/Ulaanbaatar": "ULAT",
  "Asia/Urumqi": "XJT",
  "Asia/Uzbekistan": "UZT",
  "Asia/Vientiane": "ICT",
  "Asia/Vladivostok": "VLAT",
  "Asia/Yakutsk": "YAKT",
  "Asia/Yangon": "MMT",
  "Asia/Yekaterinburg": "YEKT",
  "Asia/Yerevan": "AMT",

  // --- EUROPE ---
  "Europe/Amsterdam": "CET",
  "Europe/Andorra": "CET",
  "Europe/Athens": "EET",
  "Europe/Belgrade": "CET",
  "Europe/Berlin": "CET",
  "Europe/Kaliningrad": "EET",
  "Europe/Bratislava": "CET",
  "Europe/Brussels": "CET",
  "Europe/Bucharest": "EET",
  "Europe/Budapest": "CET",
  "Europe/Chisinau": "EET",
  "Europe/Copenhagen": "CET",
  "Europe/Dublin": "GMT",
  "Europe/Helsinki": "EET",
  "Europe/Istanbul": "TRT",
  "Europe/Kiev": "EET",
  "Europe/Lisbon": "WET",
  "Europe/Ljubljana": "CET",
  "Europe/London": "GMT",
  "Europe/Luxembourg": "CET",
  "Europe/Madrid": "CET",
  "Europe/Malta": "CET",
  "Europe/Minsk": "MSK",
  "Europe/Moscow": "MSK",
  "Europe/Monaco": "CET",
  "Europe/Samara": "SAMT",
  "Europe/Oslo": "CET",
  "Europe/Paris": "CET",
  "Europe/Podgorica": "CET",
  "Europe/Prague": "CET",
  "Europe/Riga": "EET",
  "Europe/Rome": "CET",
  "Europe/Sarajevo": "CET",
  "Europe/Skopje": "CET",
  "Europe/Sofia": "EET",
  "Europe/Stockholm": "CET",
  "Europe/Tallinn": "EET",
  "Europe/Tirane": "CET",
  "Europe/Vienna": "CET",
  "Europe/Vilnius": "EET",
  "Europe/Warsaw": "CET",
  "Europe/Vatican": "CET",
  "Europe/Vaduz": "CET",
  "Europe/San_Marino": "CET",
  "Europe/Zagreb": "CET",
  "Europe/Zurich": "CET",

  // --- INDIAN OCEAN ---
  "Indian/Antananarivo": "EAT",
  "Indian/Comoro": "EAT",
  "Indian/Mahe": "SCT",
  "Indian/Maldives": "MVT",
  "Indian/Mauritius": "MUT",
  "Indian/Reunion": "RET",

  // --- ATLANTIC OCEAN ---
  "Atlantic/Cape_Verde": "CVT",
  "Atlantic/Bermuda": "AST",
  "Atlantic/Reykjavik": "GMT",

  // --- OCEANIA ---
  "Australia/Sydney": "AEST",
  "Australia/Adelaide": "ACST",
  "Australia/Brisbane": "AEST",
  "Australia/Hobart": "AEST",
  "Australia/Melbourne": "AEST",
  "Australia/Perth": "AWST",
  "Australia/Darwin": "ACST",
  "Australia/Eucla": "ACWST",
  "Australia/Lord_Howe": "LHST",
  "Pacific/Auckland": "NZST",
  "Pacific/Apia": "WSST",
  "Pacific/Chuuk": "CHUT",
  "Pacific/Efate": "VUT",
  "Pacific/Enderbury": "PHOT",
  "Pacific/Fiji": "FJT",
  "Pacific/Funafuti": "TVT",
  "Pacific/Guadalcanal": "SBT",
  "Pacific/Guam": "ChST",
  "Pacific/Kiritimati": "LINT",
  "Pacific/Majuro": "MHT",
  "Pacific/Nauru": "NRT",
  "Pacific/Noumea": "NCT",
  "Pacific/Palau": "PWT",
  "Pacific/Port_Moresby": "PGT",
  "Pacific/Tahiti": "TAHT",
  "Pacific/Tarawa": "GILT",
  "Pacific/Tongatapu": "TOT",
  "Pacific/Honolulu": "HST"
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

/**
 * Generic UTC to local time converter
 * @param {string} timezone - Target IANA timezone
 * @param {number} utcHours - UTC hours (0-23)
 * @param {number} utcMinutes - UTC minutes (0-59)
 * @param {Date} [referenceDate] - Optional date to calculate for (useful for DST/seasonal shifts)
 * @returns {string} - Formatted time with abbreviation
 */
export const formatTimeFromUTC = (timezone, utcHours, utcMinutes = 0, referenceDate = new Date()) => {
  if (!timezone) return "Unknown";
  
  try {
    const date = new Date(referenceDate);
    date.setUTCHours(utcHours, utcMinutes, 0, 0);

    // Specific adjustment for Morocco - User expects UTC+1 (5 AM / 1 AM) but the browser
    // often returns UTC+0 during Ramadan. We manually add 1 hour if we detect UTC+0.
    if (timezone === "Africa/Casablanca") {
      const currentHour = parseInt(new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        hour12: false,
        timeZone: timezone
      }).format(date));
      
      if (currentHour === utcHours) {
        date.setUTCHours(utcHours + 1);
      }
    }

    const formattedTime = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: timezone
    });

    let tzAbbr = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "short"
    }).formatToParts(date).find(p => p.type === "timeZoneName")?.value || "";

    if (ABBR_OVERRIDES[timezone] && (tzAbbr.includes("GMT") || tzAbbr.includes("+") || tzAbbr.includes("-"))) {
      tzAbbr = ABBR_OVERRIDES[timezone];
    }

    return `${formattedTime} ${tzAbbr}`;
  } catch (error) {
    console.error("Error converting UTC to local:", error);
    return "Error";
  }
};

/**
 * Converts standard release time (1:00 PM KST) to target timezone
 * 1:00 PM KST is 4:00 AM UTC
 * Calculated specifically for March 20, 2026
 */
export const convertKSTToLocal = (timezone) => {
  const releaseDate = new Date("2026-03-20T04:00:00Z");
  return formatTimeFromUTC(timezone, 4, 0, releaseDate);
};

/**
 * Converts standard Spotify Reset (12:00 AM UTC) to target timezone
 */
export const convertSpotifyReset = (timezone) => {
  return formatTimeFromUTC(timezone, 0, 0);
};
