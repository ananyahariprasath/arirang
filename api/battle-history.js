import { getDb } from "../lib/mongodb.js";

function setCors(res) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function toNumberOrZero(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeRegions(value) {
  if (Array.isArray(value)) {
    return value.map((part) => String(part || "").trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value.split(",").map((part) => part.trim()).filter(Boolean);
  }
  return [];
}

const RESERVED_KEYS = new Set([
  "_id",
  "id",
  "date",
  "time",
  "regions",
  "target",
  "progress",
  "reachedTarget",
  "winner",
  "albumProgress",
  "titleProgress",
  "albumCount",
  "titleCount",
  "titleTarget",
  "source",
  "snapshotKey",
  "createdAt",
  "updatedAt",
]);

function extractExtraFields(input = {}) {
  return Object.entries(input).reduce((acc, [key, value]) => {
    if (!RESERVED_KEYS.has(key)) {
      acc[key] = value;
    }
    return acc;
  }, {});
}

function normalizeBattle(input = {}) {
  const now = new Date();
  const regions = normalizeRegions(input.regions);
  const id = input.id ? String(input.id) : `battle_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const extras = extractExtraFields(input);
  return {
    ...extras,
    id,
    date: input.date ? String(input.date).trim() : "",
    time: input.time ? String(input.time).trim() : "",
    regions,
    target: input.target ? String(input.target).trim() : "",
    progress: Math.max(0, Math.min(100, Math.round(toNumberOrZero(input.progress)))),
    reachedTarget: Boolean(input.reachedTarget),
    winner: input.winner ? String(input.winner).trim() : "",
    albumProgress: Math.max(0, Math.min(100, Math.round(toNumberOrZero(input.albumProgress)))),
    titleProgress: Math.max(0, Math.min(100, Math.round(toNumberOrZero(input.titleProgress)))),
    albumCount: Math.max(0, Math.floor(toNumberOrZero(input.albumCount))),
    titleCount: Math.max(0, Math.floor(toNumberOrZero(input.titleCount))),
    titleTarget: input.titleTarget ? String(input.titleTarget).trim() : "",
    source: input.source ? String(input.source).trim() : "manual",
    snapshotKey: input.snapshotKey ? String(input.snapshotKey).trim() : null,
    createdAt: input.createdAt ? new Date(input.createdAt) : now,
    updatedAt: now,
  };
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const db = await getDb();
    const historyCollection = db.collection("battle_history");
    await historyCollection.createIndex({ id: 1 }, { unique: true });
    await historyCollection.createIndex({ snapshotKey: 1, id: 1 });

    if (req.method === "GET") {
      const records = await historyCollection
        .find({})
        .sort({ createdAt: -1, id: -1 })
        .toArray();

      return res.status(200).json({
        success: true,
        battles: records.map(({ _id, ...rest }) => rest),
      });
    }

    if (req.method === "POST") {
      const battle = normalizeBattle(req.body || {});
      await historyCollection.updateOne(
        { id: battle.id },
        {
          $set: battle,
          $setOnInsert: { createdAt: battle.createdAt },
        },
        { upsert: true }
      );
      return res.status(201).json({ success: true, battle });
    }

    if (req.method === "PATCH") {
      const { id, changes } = req.body || {};
      if (!id || !changes || typeof changes !== "object") {
        return res.status(400).json({ error: "id and changes object are required" });
      }

      const existing = await historyCollection.findOne({ id: String(id) });
      if (!existing) {
        return res.status(404).json({ error: "Battle record not found" });
      }

      const next = normalizeBattle({ ...existing, ...changes, id: String(id), createdAt: existing.createdAt });
      await historyCollection.updateOne({ id: String(id) }, { $set: next });
      return res.status(200).json({ success: true, battle: next });
    }

    if (req.method === "DELETE") {
      const { id, clearAll } = req.query || {};

      if (clearAll === "1") {
        await historyCollection.deleteMany({});
        return res.status(200).json({ success: true, deletedAll: true });
      }

      if (!id) {
        return res.status(400).json({ error: "id or clearAll=1 is required" });
      }

      const result = await historyCollection.deleteOne({ id: String(id) });
      if (!result.deletedCount) {
        return res.status(404).json({ error: "Battle record not found" });
      }

      return res.status(200).json({ success: true, deletedId: String(id) });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Battle history API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
