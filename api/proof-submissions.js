import { getDb } from "../lib/mongodb.js";

function setCors(res) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const db = await getDb();
    const submissionsCollection = db.collection("proof_submissions");

    if (req.method === "GET") {
      const submissions = await submissionsCollection
        .find({})
        .sort({ submissionTime: -1, createdAt: -1 })
        .toArray();

      const normalized = submissions.map((submission) => ({
        id: submission._id.toString(),
        submissionTime: submission.submissionTime,
        country: submission.country,
        region: submission.region,
        username: submission.username,
        platform: submission.platform,
        screenshotUrl: submission.screenshotUrl,
        albumStreamCount: submission.albumStreamCount,
        titleTrackStreamCount: submission.titleTrackStreamCount,
        notes: submission.notes || "",
      }));

      return res.status(200).json({ success: true, submissions: normalized });
    }

    if (req.method === "POST") {
      const {
        country,
        region,
        username,
        platform,
        screenshotUrl,
        albumStreamCount,
        titleTrackStreamCount,
        notes = "",
      } = req.body || {};

      if (!country || !region || !username || !platform || !screenshotUrl) {
        return res.status(400).json({ error: "country, region, username, platform, and screenshotUrl are required" });
      }

      const albumCount = Number(albumStreamCount);
      const titleCount = Number(titleTrackStreamCount);

      if (!Number.isFinite(albumCount) || albumCount < 1) {
        return res.status(400).json({ error: "albumStreamCount must be a number >= 1" });
      }
      if (!Number.isFinite(titleCount) || titleCount < 1) {
        return res.status(400).json({ error: "titleTrackStreamCount must be a number >= 1" });
      }

      const now = new Date();
      const submission = {
        submissionTime: now.toISOString(),
        createdAt: now,
        country: String(country).trim(),
        region: String(region).trim(),
        username: String(username).trim(),
        platform: String(platform).trim(),
        screenshotUrl: String(screenshotUrl).trim(),
        albumStreamCount: albumCount,
        titleTrackStreamCount: titleCount,
        notes: String(notes || "").trim(),
      };

      const result = await submissionsCollection.insertOne(submission);

      return res.status(201).json({
        success: true,
        submission: {
          id: result.insertedId.toString(),
          ...submission,
        },
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Proof submissions API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

