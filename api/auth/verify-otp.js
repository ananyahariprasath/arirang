import { getDb } from "../../lib/mongodb.js";

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
    const { email, otp } = req.body || {};

    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP are required" });
    }

    const db = await getDb();
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne({ email });
    if (!user || !user.resetOtp || user.resetOtp !== otp) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    if (new Date() > new Date(user.resetOtpExpiry)) {
      return res.status(400).json({ error: "OTP has expired" });
    }

    // Generate a temporary reset token so they can reset password securely
    const crypto = await import("crypto");
    const resetToken = crypto.randomBytes(32).toString("hex");

    await usersCollection.updateOne(
      { email },
      { 
        $set: { passwordResetToken: resetToken, passwordResetExpires: new Date(Date.now() + 15 * 60 * 1000) },
        $unset: { resetOtp: "", resetOtpExpiry: "" }
      }
    );

    return res.status(200).json({ success: true, resetToken });

  } catch (error) {
    console.error("Verify OTP API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
