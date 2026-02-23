import { ObjectId } from "mongodb";
import { getDb } from "../lib/mongodb.js";

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

  try {
    const db = await getDb();
    const ticketsCollection = db.collection("support_tickets");

    if (req.method === "GET") {
      const tickets = await ticketsCollection
        .find({})
        .sort({ createdAt: -1 })
        .toArray();

      const normalized = tickets.map((ticket) => ({
        id: ticket._id.toString(),
        socialMedia: ticket.socialMedia,
        userId: ticket.userId,
        query: ticket.query,
        status: ticket.status || "Open",
        timestamp: ticket.timestamp || new Date(ticket.createdAt).toLocaleString(),
        createdAt: ticket.createdAt,
      }));

      return res.status(200).json({ success: true, tickets: normalized });
    }

    if (req.method === "POST") {
      const { socialMedia, userId, query } = req.body || {};
      if (!socialMedia || !userId || !query) {
        return res.status(400).json({ error: "socialMedia, userId, and query are required" });
      }

      const now = new Date();
      const ticket = {
        socialMedia: String(socialMedia).trim(),
        userId: String(userId).trim(),
        query: String(query).trim(),
        status: "Open",
        timestamp: now.toLocaleString(),
        createdAt: now,
      };

      const result = await ticketsCollection.insertOne(ticket);

      return res.status(201).json({
        success: true,
        ticket: {
          id: result.insertedId.toString(),
          ...ticket,
        },
      });
    }

    if (req.method === "DELETE") {
      const { id, clearAll } = req.query || {};

      if (clearAll === "1") {
        await ticketsCollection.deleteMany({});
        return res.status(200).json({ success: true, deletedAll: true });
      }

      if (!id) {
        return res.status(400).json({ error: "id or clearAll=1 is required" });
      }

      const result = await ticketsCollection.deleteOne({ _id: new ObjectId(id) });
      if (!result.deletedCount) {
        return res.status(404).json({ error: "Ticket not found" });
      }

      return res.status(200).json({ success: true, deletedId: id });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Support tickets API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

