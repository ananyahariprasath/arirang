import { getDb } from "../../lib/mongodb.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

function setCors(res) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_development_only";

export default async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, password, username } = req.body || {};

    if (!email || !password || !username) {
      return res.status(400).json({ error: "Email, password, and username are required" });
    }

    const db = await getDb();
    const usersCollection = db.collection("users");

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User with this email already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const now = new Date();
    const newUser = {
      email,
      username,
      password: hashedPassword,
      role: "user", // Default role
      createdAt: now,
    };

    const result = await usersCollection.insertOne(newUser);

    // Create JWT token
    const token = jwt.sign(
      { id: result.insertedId.toString(), email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: result.insertedId.toString(),
        email: newUser.email,
        username: newUser.username,
        role: newUser.role,
        profilePicture: null,
      }
    });

  } catch (error) {
    console.error("Signup API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
