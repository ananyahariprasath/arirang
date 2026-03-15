import { getDb } from "../lib/mongodb.js";

function setCors(res) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function sanitizeConfig(input = {}) {
  const maxActiveRooms = Math.max(1, Number.parseInt(String(input.maxActiveRooms || "10"), 10) || 10);
  const defaultDurationMins = Math.max(
    5,
    Math.min(120, Number.parseInt(String(input.defaultDurationMins || "120"), 10) || 120)
  );
  return { maxActiveRooms, defaultDurationMins };
}

function sanitizeRooms(input) {
  if (!Array.isArray(input)) return [];
  return input
    .map((room) => ({
      id: String(room?.id || "").trim(),
      title: String(room?.title || "").trim(),
      description: String(room?.description || "").trim(),
      coverImage: String(room?.coverImage || "").trim(),
      coverImageName: String(room?.coverImageName || "").trim(),
      createdBy: String(room?.createdBy || "").trim(),
      createdByRole: String(room?.createdByRole || "user").trim().toLowerCase() === "admin" ? "admin" : "user",
      createdByIdentity: String(room?.createdByIdentity || "").trim().toLowerCase(),
      createdAt: Number(room?.createdAt || 0) || 0,
      expiresAt: Number(room?.expiresAt || 0) || 0,
      status: String(room?.status || "active").trim(),
      participants: Array.isArray(room?.participants)
        ? room.participants.map((p) => ({
            id: String(p?.id || "").trim().toLowerCase(),
            label: String(p?.label || "").trim(),
          }))
        : [],
      userProfiles:
        room?.userProfiles && typeof room.userProfiles === "object"
          ? Object.fromEntries(
              Object.entries(room.userProfiles)
                .map(([id, profile]) => [
                  String(id || "").trim().toLowerCase(),
                  {
                    label: String(profile?.label || "").trim(),
                    avatar: String(profile?.avatar || "").trim(),
                  },
                ])
                .filter(([id]) => id)
            )
          : {},
      closedBy: String(room?.closedBy || "").trim(),
      closedAt: Number(room?.closedAt || 0) || 0,
      messages: Array.isArray(room?.messages)
        ? room.messages.map((m) => ({
            id: String(m?.id || "").trim(),
            author: String(m?.author || "").trim(),
            authorIdentity: String(m?.authorIdentity || "").trim().toLowerCase(),
            text: String(m?.text || ""),
            image: String(m?.image || ""),
          imageName: String(m?.imageName || ""),
          authorRole: String(m?.authorRole || "user").trim().toLowerCase() === "admin" ? "admin" : "user",
          createdAt: String(m?.createdAt || ""),
          createdAtMs: Number(m?.createdAtMs || 0) || 0,
          replyToId: String(m?.replyToId || "").trim(),
          replyToAuthor: String(m?.replyToAuthor || "").trim(),
          replyToText: String(m?.replyToText || ""),
          replyToImage: String(m?.replyToImage || ""),
        }))
        : [],
    }))
    .filter((room) => room.id && room.title);
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
    const db = await getDb();
    const collection = db.collection("topic_rooms_state");

    if (req.method === "GET") {
      const doc = await collection.findOne({ _id: "global" });
      return res.status(200).json({
        success: true,
        rooms: Array.isArray(doc?.rooms) ? doc.rooms : [],
        config: sanitizeConfig(doc?.config || {}),
        updatedAt: doc?.updatedAt || null,
      });
    }

    const rooms = sanitizeRooms(req.body?.rooms);
    const config = sanitizeConfig(req.body?.config || {});

    await collection.updateOne(
      { _id: "global" },
      {
        $set: {
          rooms,
          config,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    return res.status(200).json({ success: true, rooms, config });
  } catch (error) {
    console.error("Topic rooms API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
