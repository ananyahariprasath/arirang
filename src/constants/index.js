export const REGION_PRESETS = {
  "South Asia": { s: "12:30 AM IST", a: "1:30 AM IST" },
  "North America": { s: "12:00 AM ET", a: "1:00 AM ET" },
  "Europe": { s: "12:00 AM CET", a: "1:00 AM CET" },
  "Oceania": { s: "12:00 AM AEST", a: "1:00 AM AEST" },
  "East Asia": { s: "12:00 AM JST/KST", a: "1:00 AM JST/KST" },
  "Southeast Asia": { s: "12:00 AM ICT", a: "1:00 AM ICT" },
  "Latin America": { s: "12:00 AM BRT", a: "1:00 AM BRT" },
  "Middle East": { s: "12:00 AM GST", a: "1:00 AM GST" }
};

export const COUNTRY_REGION_MAP = {
  "India": "South Asia",
  "Bangladesh": "South Asia",
  "Pakistan": "South Asia",
  "Sri Lanka": "South Asia",
  "USA": "North America",
  "Canada": "North America",
  "UK": "Europe",
  "Germany": "Europe",
  "France": "Europe",
  "Italy": "Europe",
  "Spain": "Europe",
  "Australia": "Oceania",
  "South Korea": "East Asia",
  "Japan": "East Asia",
  "Philippines": "Southeast Asia",
  "Brazil": "Latin America",
  "Mexico": "Latin America"
};

export const COUNTRIES = [
  "India", "Bangladesh", "Pakistan", "Sri Lanka", "USA", "South Korea", 
  "Japan", "UK", "Canada", "Australia", "Germany", "France", "Brazil", 
  "Italy", "Spain", "Mexico", "Philippines"
];

export const INITIAL_REGIONS = [
  {
    country: "India",
    region: "South Asia",
    hashtag: "#BTS_India #SouthAsia_Stream #PurpleProject",
    spotifyReset: "12:30 AM IST",
    appleReset: "1:30 AM IST",
    playlists: {
      spotify: [
        { name: "Top 50 India", url: "https://open.spotify.com/playlist/37i9dQZECXcR7U" },
        { name: "BTS Essentials", url: "https://open.spotify.com/playlist/37i9dQZF1DWY6t8ST7S7lD" },
        { name: "Global Viral 50", url: "https://open.spotify.com/playlist/37i9dQZEVXbLiRS9vS9v9" },
        { name: "This is BTS", url: "https://open.spotify.com/playlist/37i9dQZF1DX086nd7TYp8B" },
        { name: "K-Pop ON!", url: "https://open.spotify.com/playlist/37i9dQZF1DX9t9mBzbzhCt" },
        { name: "Hot Hits India", url: "https://open.spotify.com/playlist/37i9dQZF1DX0XUsKBCl9jG" }
      ],
      appleMusic: [
        { name: "Today's Hits", url: "https://music.apple.com/playlist/todays-hits" },
        { name: "BTS Essentials", url: "https://music.apple.com/playlist/bts-essentials" },
        { name: "A-List K-Pop", url: "https://music.apple.com/playlist/a-list-k-pop" },
        { name: "New Music Daily", url: "https://music.apple.com/playlist/new-music-daily" },
        { name: "Top 100: India", url: "https://music.apple.com/playlist/top-100-india" },
        { name: "Viral Hits", url: "https://music.apple.com/playlist/viral-hits" }
      ]
    },
    gFormUrl: "https://forms.gle/india_stream_proof"
  },
  {
    country: "USA",
    region: "North America",
    hashtag: "#BTS_USA #NA_Streaming #Dynamite",
    spotifyReset: "12:00 AM ET",
    appleReset: "1:00 AM ET",
    playlists: {
      spotify: [
        { name: "Today's Top Hits", url: "https://open.spotify.com/playlist/37i9dQZF1DXcBWf9p4H7hp" },
        { name: "BTS Essentials", url: "https://open.spotify.com/playlist/37i9dQZF1DWY6t8ST7S7lD" },
        { name: "Viral 50 USA", url: "https://open.spotify.com/playlist/37i9dQZEVXbKua9Cws9BIn" },
        { name: "Pop Rising", url: "https://open.spotify.com/playlist/37i9dQZF1DX6Sa99U30mB" },
        { name: "New Music Friday", url: "https://open.spotify.com/playlist/37i9dQZF1DX4Jp_u56637U" },
        { name: "Hot Country", url: "https://open.spotify.com/playlist/37i9dQZF1DX1lVhptv6uYI" }
      ],
      appleMusic: [
        { name: "Today's Hits", url: "https://music.apple.com/playlist/todays-hits" },
        { name: "BTS Essentials", url: "https://music.apple.com/playlist/bts-essentials" },
        { name: "A-List Pop", url: "https://music.apple.com/playlist/a-list-pop" },
        { name: "New Music Daily", url: "https://music.apple.com/playlist/new-music-daily" },
        { name: "Top 100: Global", url: "https://music.apple.com/playlist/top-100-global" },
        { name: "K-Pop Today", url: "https://music.apple.com/playlist/k-pop-today" }
      ]
    },
    gFormUrl: "https://forms.gle/usa_stream_proof"
  },
  {
    country: "Australia",
    region: "Oceania",
    hashtag: "#BTS_Australia #Oceania_Streaming #Butter",
    spotifyReset: "12:00 AM AEST",
    appleReset: "1:00 AM AEST",
    playlists: {
      spotify: [
        { name: "Top 50 Australia", url: "https://open.spotify.com/playlist/37i9dQZEVXbJP76WNN6HOH" },
        { name: "BTS Essentials", url: "https://open.spotify.com/playlist/37i9dQZF1DWY6t8ST7S7lD" },
        { name: "Viral 50 AU", url: "https://open.spotify.com/playlist/37i9dQZEVXbK4is2wUasBu" },
        { name: "Hot Hits AU", url: "https://open.spotify.com/playlist/37i9dQZF1DX6Xv87Id6XqC" },
        { name: "This is BTS", url: "https://open.spotify.com/playlist/37i9dQZF1DX086nd7TYp8B" },
        { name: "New Music AU", url: "https://open.spotify.com/playlist/37i9dQZF1DX7L7eO86uB8O" }
      ],
      appleMusic: [
        { name: "Today's Hits", url: "https://music.apple.com/playlist/todays-hits" },
        { name: "BTS Essentials", url: "https://music.apple.com/playlist/bts-essentials" },
        { name: "A-List K-Pop", url: "https://music.apple.com/playlist/a-list-k-pop" },
        { name: "Top 100: Australia", url: "https://music.apple.com/playlist/top-100-australia" },
        { name: "Viral Hits", url: "https://music.apple.com/playlist/viral-hits" },
        { name: "K-Pop Today", url: "https://music.apple.com/playlist/k-pop-today" }
      ]
    },
    gFormUrl: "https://forms.gle/oceania_stream_proof"
  }
];

export const GLOBAL_DEFAULT = {
  country: "Global",
  region: "Global",
  hashtag: "#BTS_Global #StreamingParty #BTSSingle",
  spotifyReset: "12:00 AM GMT",
  appleReset: "1:00 AM GMT",
  playlists: {
    spotify: [
      { name: "Global Top 50", url: "https://open.spotify.com/playlist/37i9dQZEVXbMDoHDwVN2t6" },
      { name: "BTS Essentials", url: "https://open.spotify.com/playlist/37i9dQZF1DWY6t8ST7S7lD" },
      { name: "Today's Top Hits", url: "https://open.spotify.com/playlist/37i9dQZF1DXcBWf9p4H7hp" },
      { name: "K-Pop ON!", url: "https://open.spotify.com/playlist/37i9dQZF1DX9t9mBzbzhCt" },
      { name: "This is BTS", url: "https://open.spotify.com/playlist/37i9dQZF1DX086nd7TYp8B" },
      { name: "Viral 50 Global", url: "https://open.spotify.com/playlist/37i9dQZEVXbLiRS9vS9v9" }
    ],
    appleMusic: [
      { name: "Today's Hits", url: "https://music.apple.com/playlist/todays-hits" },
      { name: "BTS Essentials", url: "https://music.apple.com/playlist/bts-essentials" },
      { name: "A-List K-Pop", url: "https://music.apple.com/playlist/a-list-k-pop" },
      { name: "New Music Daily", url: "https://music.apple.com/playlist/new-music-daily" },
      { name: "Top 100: Global", url: "https://music.apple.com/playlist/top-100-global" },
      { name: "Viral Hits", url: "https://music.apple.com/playlist/viral-hits" }
    ]
  },
  gFormUrl: "https://forms.gle/global_stream_proof"
};

export const PRESAVE_LINKS = {
  spotify: "https://open.spotify.com/prerelease/1DcxHW214MCDxXju71RbvX?si=07b5e009c3ee4c0b",
  appleMusic: "https://music.apple.com/us/album/arirang/1868862375"
};

// URL for live global updates (e.g., a GitHub Gist raw URL)
// If empty, the app will use local data.json and localStorage
export const DATA_SOURCE_URL = ""; 
