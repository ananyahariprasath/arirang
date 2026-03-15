import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import { getDb } from "../lib/mongodb.js";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_development_only";
const ALLOWED_SOCIALS = new Set(["instagram", "twitter", "facebook", "telegram", "discord", "weverse"]);

function setCors(res) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function extractBearerToken(req) {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) return null;
  return authHeader.slice("Bearer ".length).trim();
}

function verifyUserRequest(req, res) {
  const token = extractBearerToken(req);
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }

  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    res.status(401).json({ error: "Invalid token" });
    return null;
  }
}

function verifyAdminRequest(req, res) {
  const decoded = verifyUserRequest(req, res);
  if (!decoded) return null;
  if (decoded?.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return null;
  }
  return decoded;
}

function toDateKeyUTC(now = new Date()) {
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (!["GET", "POST", "DELETE"].includes(req.method)) {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const db = await getDb();
    const entriesCollection = db.collection("lucky_draw_entries");
    await entriesCollection.createIndex({ userId: 1, dateKey: 1 }, { unique: true });

    if (req.method === "GET") {
      const isAdmin = String(req.query?.admin || "") === "1";
      if (isAdmin) {
        const admin = verifyAdminRequest(req, res);
        if (!admin) return;
        const limitRaw = Number.parseInt(String(req.query?.limit || "200"), 10);
        const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(1000, limitRaw)) : 200;
        const rows = await entriesCollection
          .find({}, { sort: { createdAt: -1 }, limit })
          .toArray();
        return res.status(200).json({
          success: true,
          entries: rows.map((row) => ({
            id: String(row._id || ""),
            userId: String(row.userId || ""),
            username: String(row.username || ""),
            email: String(row.email || ""),
            platform: String(row.platform || ""),
            handle: String(row.handle || ""),
            dateKey: String(row.dateKey || ""),
            createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null,
            updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : null,
          })),
        });
      }

      const decoded = verifyUserRequest(req, res);
      if (!decoded) return;
      const userId = String(decoded.id || "").trim();
      if (!ObjectId.isValid(userId)) {
        return res.status(400).json({ error: "Invalid user id" });
      }
      const dateKey = String(req.query?.dateKey || toDateKeyUTC()).trim();
      const entry = await entriesCollection.findOne({ userId, dateKey });
      if (!entry) {
        return res.status(200).json({ success: true, entry: null });
      }
      return res.status(200).json({
        success: true,
        entry: {
          id: String(entry._id || ""),
          platform: String(entry.platform || ""),
          handle: String(entry.handle || ""),
          dateKey: String(entry.dateKey || ""),
          createdAt: entry.createdAt ? new Date(entry.createdAt).toISOString() : null,
        },
      });
    }

    if (req.method === "DELETE") {
      const admin = verifyAdminRequest(req, res);
      if (!admin) return;
      const idRaw = String(req.query?.id || req.body?.id || "").trim();
      if (!idRaw || !ObjectId.isValid(idRaw)) {
        return res.status(400).json({ error: "Invalid entry id" });
      }
      const result = await entriesCollection.deleteOne({ _id: new ObjectId(idRaw) });
      return res.status(200).json({ success: true, deletedCount: result.deletedCount || 0 });
    }

    const decoded = verifyUserRequest(req, res);
    if (!decoded) return;
    const userId = String(decoded.id || "").trim();
    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user id" });
    }

    const platform = String(req.body?.platform || "").trim().toLowerCase();
    const handle = String(req.body?.handle || "").trim();
    if (!ALLOWED_SOCIALS.has(platform)) {
      return res.status(400).json({ error: "Invalid social platform" });
    }
    if (!handle || handle.length < 2 || handle.length > 80) {
      return res.status(400).json({ error: "Invalid social handle" });
    }

    const usersCollection = db.collection("users");
    const user = await usersCollection.findOne(
      { _id: new ObjectId(userId) },
      { projection: { username: 1, email: 1 } }
    );
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const now = new Date();
    const dateKey = toDateKeyUTC(now);

    await entriesCollection.updateOne(
      { userId, dateKey },
      {
        $set: {
          platform,
          handle,
          username: String(user.username || ""),
          email: String(user.email || ""),
          updatedAt: now,
        },
        $setOnInsert: {
          userId,
          dateKey,
          createdAt: now,
        },
      },
      { upsert: true }
    );

    return res.status(200).json({
      success: true,
      entry: { userId, platform, handle, dateKey },
    });
  } catch (error) {
    console.error("Lucky draw API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
