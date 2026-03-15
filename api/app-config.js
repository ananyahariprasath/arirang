import { getDb } from "../lib/mongodb.js";

const ALLOWED_KEYS = new Set(["timeline", "regions", "mods", "galleryImages", "dailyUpdates", "dailyMissions"]);

function setCors(res) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function parseKey(req) {
  if (req.method === "GET") {
    return String(req.query?.key || "").trim();
  }
  return String(req.body?.key || "").trim();
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (!["GET", "POST"].includes(req.method)) {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const key = parseKey(req);
    if (!ALLOWED_KEYS.has(key)) {
      return res.status(400).json({ error: "Invalid key" });
    }

    const db = await getDb();
    const configCollection = db.collection("app_config");
    await configCollection.createIndex({ key: 1 }, { unique: true });

    if (req.method === "GET") {
      const doc = await configCollection.findOne({ key });
      return res.status(200).json({
        success: true,
        key,
        value: Array.isArray(doc?.value) ? doc.value : null,
        updatedAt: doc?.updatedAt || null,
      });
    }

    const value = req.body?.value;
    if (!Array.isArray(value)) {
      return res.status(400).json({ error: "value must be an array" });
    }

    await configCollection.updateOne(
      { key },
      {
        $set: {
          key,
          value,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    return res.status(200).json({ success: true, key, value });
  } catch (error) {
    console.error("App config API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
