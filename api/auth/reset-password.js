import { getDb } from "../../lib/mongodb.js";
import bcrypt from "bcryptjs";

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

  try {
    const { email, resetToken, newPassword } = req.body || {};

    if (!email || !resetToken || !newPassword) {
      return res.status(400).json({ error: "Email, reset token, and new password are required" });
    }

    const db = await getDb();
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne({ 
      email, 
      passwordResetToken: resetToken,
      passwordResetExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await usersCollection.updateOne(
      { email },
      { 
        $set: { password: hashedPassword },
        $unset: { passwordResetToken: "", passwordResetExpires: "" }
      }
    );

    return res.status(200).json({ success: true, message: "Password updated successfully" });

  } catch (error) {
    console.error("Reset Password API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
