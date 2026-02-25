import { getDb } from "../../lib/mongodb.js";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_development_only";

function setCors(res) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Verify auth token
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];
  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }

  try {
    const { userId, profilePicture } = req.body || {};

    if (!userId || !profilePicture) {
      return res.status(400).json({ error: "User ID and profile picture URL are required" });
    }

    if (decoded.id !== userId) {
      return res.status(403).json({ error: "Forbidden: Cannot update another user's profile" });
    }

    const db = await getDb();
    const usersCollection = db.collection("users");

    let objectId;
    try {
      objectId = new ObjectId(userId);
    } catch {
      return res.status(400).json({ error: "Invalid user ID format" });
    }

    const result = await usersCollection.findOneAndUpdate(
      { _id: objectId },
      { $set: { profilePicture } },
      { returnDocument: "after" }
    );

    if (!result) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({
      success: true,
      updatedUser: {
        id: result._id.toString(),
        email: result.email,
        username: result.username,
        role: result.role,
        profilePicture: result.profilePicture,
        lastfmUsername: result.lastfmUsername || null,
        country: result.country || null,
        region: result.region || null,
      }
    });

  } catch (error) {
    console.error("Profile Picture API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
