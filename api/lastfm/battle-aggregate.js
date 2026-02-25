import { getDb } from "../../lib/mongodb.js";

function setCors(res) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function normalizeRegion(value = "") {
  return String(value).trim().toLowerCase();
}

function normalizeTarget(value = "") {
  return String(value).trim().toLowerCase();
}

function getResetKeyUTC(now = new Date()) {
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildConfigKey({ regionA, regionB, artist, albumName, trackName }) {
  const sideKey = [normalizeRegion(regionA), normalizeRegion(regionB)].sort().join("::");
  return [
    sideKey,
    normalizeTarget(artist),
    normalizeTarget(albumName),
    normalizeTarget(trackName),
  ].join("|");
}

function toCount(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { battleId, regionA, regionB, artist, albumName, trackName } = req.body || {};
    if (!battleId || !regionA || !regionB || !artist || !albumName || !trackName) {
      return res.status(400).json({
        error: "battleId, regionA, regionB, artist, albumName, and trackName are required",
      });
    }

    const resetKey = getResetKeyUTC(new Date());
    const configKey = buildConfigKey({ regionA, regionB, artist, albumName, trackName });

    const db = await getDb();
    const aggregatesCollection = db.collection("lastfm_battle_aggregates");
    const doc = await aggregatesCollection.findOne({ battleId: String(battleId), resetKey, configKey });

    const sideA = {
      album: toCount(doc?.totals?.sideA?.album),
      title: toCount(doc?.totals?.sideA?.title),
      users: toCount(doc?.totals?.sideA?.users),
    };
    const sideB = {
      album: toCount(doc?.totals?.sideB?.album),
      title: toCount(doc?.totals?.sideB?.title),
      users: toCount(doc?.totals?.sideB?.users),
    };

    return res.status(200).json({
      success: true,
      battleId: String(battleId),
      resetKey,
      configKey,
      totals: {
        [regionA]: sideA,
        [regionB]: sideB,
      },
      meta: {
        source: "precomputed-aggregate",
        updatedAt: doc?.updatedAt || null,
      },
    });
  } catch (error) {
    console.error("Battle aggregate API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
