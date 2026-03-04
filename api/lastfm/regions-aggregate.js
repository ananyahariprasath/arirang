import { getDb } from "../../lib/mongodb.js";

function setCors(res) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function getResetKeyUTC(now = new Date()) {
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const resetKey = String(req.query?.resetKey || getResetKeyUTC(new Date())).trim();
    const db = await getDb();
    const collection = db.collection("lastfm_battle_aggregates");

    const docs = await collection
      .find({ resetKey })
      .project({
        _id: 0,
        regionA: 1,
        regionB: 1,
        "totals.sideA.album": 1,
        "totals.sideA.title": 1,
        "totals.sideA.users": 1,
        "totals.sideB.album": 1,
        "totals.sideB.title": 1,
        "totals.sideB.users": 1,
        updatedAt: 1,
      })
      .toArray();

    const aggregate = new Map();
    let latestUpdate = null;

    for (const doc of docs) {
      const regionA = String(doc?.regionA || "").trim();
      const regionB = String(doc?.regionB || "").trim();
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

      const upsert = (region, side) => {
        if (!region) return;
        const prev = aggregate.get(region) || { album: 0, title: 0, users: 0 };
        aggregate.set(region, {
          album: prev.album + side.album,
          title: prev.title + side.title,
          users: prev.users + side.users,
        });
      };

      upsert(regionA, sideA);
      upsert(regionB, sideB);

      if (doc?.updatedAt) {
        const at = new Date(doc.updatedAt);
        if (!Number.isNaN(at.getTime()) && (!latestUpdate || at.getTime() > latestUpdate.getTime())) {
          latestUpdate = at;
        }
      }
    }

    const regions = Array.from(aggregate.entries())
      .map(([region, totals]) => ({
        region,
        album: totals.album,
        title: totals.title,
        users: totals.users,
        totalStreams: totals.album + totals.title,
      }))
      .sort((a, b) => {
        if (b.totalStreams !== a.totalStreams) return b.totalStreams - a.totalStreams;
        return a.region.localeCompare(b.region);
      });

    return res.status(200).json({
      success: true,
      resetKey,
      regions,
      meta: {
        source: "lastfm_battle_aggregates",
        updatedAt: latestUpdate ? latestUpdate.toISOString() : null,
      },
    });
  } catch (error) {
    console.error("Regions aggregate API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
