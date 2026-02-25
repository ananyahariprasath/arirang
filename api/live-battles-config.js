import { getDb } from "../lib/mongodb.js";

function setCors(res) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function parseRegionsFromTitle(title = "") {
  const parts = String(title).split(/\s+vs\s+/i).map((part) => part.trim());
  return [parts[0] || "", parts[1] || ""];
}

function normalizeBattle(battle = {}) {
  const [titleRegionA, titleRegionB] = parseRegionsFromTitle(battle.title);
  return {
    ...battle,
    id: battle.id || `lb_${Date.now()}`,
    regionA: battle.regionA || titleRegionA || "",
    regionB: battle.regionB || titleRegionB || "",
    artist: battle.artist || "",
    albumName: battle.albumName || "",
    trackName: battle.trackName || "",
    albumGoal: battle.albumGoal ?? battle.goal ?? "",
    titleTrackGoal: battle.titleTrackGoal ?? battle.goal ?? "",
    regionAAlbumManual: Number.isFinite(Number(battle.regionAAlbumManual)) ? Number(battle.regionAAlbumManual) : 0,
    regionATitleManual: Number.isFinite(Number(battle.regionATitleManual)) ? Number(battle.regionATitleManual) : 0,
    regionBAlbumManual: Number.isFinite(Number(battle.regionBAlbumManual)) ? Number(battle.regionBAlbumManual) : 0,
    regionBTitleManual: Number.isFinite(Number(battle.regionBTitleManual)) ? Number(battle.regionBTitleManual) : 0,
  };
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const db = await getDb();
    const configCollection = db.collection("app_config");
    const key = "liveBattles";

    if (req.method === "GET") {
      const doc = await configCollection.findOne({ key });
      return res.status(200).json({
        success: true,
        liveBattles: Array.isArray(doc?.value) ? doc.value : [],
        updatedAt: doc?.updatedAt || null,
      });
    }

    if (req.method === "POST") {
      const { liveBattles } = req.body || {};
      if (!Array.isArray(liveBattles)) {
        return res.status(400).json({ error: "liveBattles must be an array" });
      }

      const normalized = liveBattles.map(normalizeBattle);
      await configCollection.updateOne(
        { key },
        {
          $set: {
            key,
            value: normalized,
            updatedAt: new Date(),
          },
          $setOnInsert: {
            createdAt: new Date(),
          },
        },
        { upsert: true }
      );

      return res.status(200).json({
        success: true,
        liveBattles: normalized,
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Live battles config API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
