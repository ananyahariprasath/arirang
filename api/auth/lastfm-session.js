import { getDb } from "../../lib/mongodb.js";
import crypto from "crypto";
import { ObjectId } from "mongodb";

function setCors(res) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function generateSignature(params, secret) {
  const sortedKeys = Object.keys(params).sort();
  let signature = "";
  for (const key of sortedKeys) {
    signature += key + params[key];
  }
  signature += secret;
  return crypto.createHash("md5").update(signature).digest("hex");
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "DELETE") {
    try {
      const { userId } = req.body;
      if (!userId) return res.status(400).json({ error: "userId is required" });

      const db = await getDb();
      await db.collection("users").updateOne(
        { _id: new ObjectId(userId) },
        { $unset: { lastfmUsername: "", lastfmSessionKey: "", lastfmLinkedAt: "" } }
      );

      return res.status(200).json({ success: true, message: "Last.fm disconnected" });
    } catch (error) {
      console.error("Disconnect error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { token, userId } = req.body;

    if (!token || !userId) {
      return res.status(400).json({ error: "Token and userId are required" });
    }

    const apiKey = process.env.LASTFM_API_KEY;
    const sharedSecret = process.env.LASTFM_SHARED_SECRET;

    if (!apiKey || !sharedSecret) {
      return res.status(500).json({ error: "Last.fm API configuration missing" });
    }

    // 1. Exchange token for session
    const sigParams = {
      api_key: apiKey,
      method: "auth.getSession",
      token: token,
    };
    const api_sig = generateSignature(sigParams, sharedSecret);

    const lastfmUrl = `https://ws.audioscrobbler.com/2.0/?method=auth.getSession&token=${token}&api_key=${apiKey}&api_sig=${api_sig}&format=json`;

    const response = await fetch(lastfmUrl);
    const data = await response.json();

    if (data.error) {
      return res.status(400).json({ error: data.message || "Last.fm authentication failed" });
    }

    const lastfmSessionKey = data.session.key;
    const lastfmUsername = data.session.name;

    // 2. Save to user document
    const db = await getDb();
    const usersCollection = db.collection("users");

    await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { 
          lastfmUsername, 
          lastfmSessionKey,
          lastfmLinkedAt: new Date()
        } 
      }
    );

    return res.status(200).json({ 
      success: true, 
      lastfmUsername 
    });

  } catch (error) {
    console.error("Last.fm Session API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
