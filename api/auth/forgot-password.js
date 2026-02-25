import { getDb } from "../../lib/mongodb.js";
import nodemailer from "nodemailer";

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
    const { email } = req.body || {};

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const db = await getDb();
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne({ email });
    if (!user) {
      // Don't leak whether user exists, just return success
      return res.status(200).json({ success: true, message: "If an account exists, an OTP has been sent." });
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 2 * 60 * 1000); // 2 mins

    await usersCollection.updateOne(
      { email },
      { $set: { resetOtp: otp, resetOtpExpiry: otpExpiry } }
    );

    // Send Email - Dynamic Configuration
    let transporter;
    const smtpConfig = {
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    };

    if (process.env.SMTP_HOST) {
      // Explicit Host (Production or Custom SMTP)
      smtpConfig.host = process.env.SMTP_HOST;
      smtpConfig.port = parseInt(process.env.SMTP_PORT) || 587;
      smtpConfig.secure = process.env.SMTP_SECURE === "true" || smtpConfig.port === 465;
    } else if (process.env.SMTP_SERVICE) {
      // Specific Service (e.g. "gmail", "sendgrid")
      smtpConfig.service = process.env.SMTP_SERVICE;
    } else if (process.env.SMTP_USER && process.env.SMTP_USER.includes("ethereal.email")) {
      // Local Development Auto-detection for Ethereal
      smtpConfig.host = "smtp.ethereal.email";
      smtpConfig.port = 587;
      smtpConfig.secure = false;
    } else {
      // Default fallback (Gmail is common for hobby projects)
      smtpConfig.service = "gmail";
    }

    transporter = nodemailer.createTransport(smtpConfig);

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: "Arirang Spotify Takeover OTP Verification",
      text: `Your OTP for password reset is: ${otp}. It is valid for 2 minutes.`,
      html: `<p>Your OTP for password reset is: <b>${otp}</b></p><p>It is valid for 2 minutes.</p>`,
    };

    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        await transporter.sendMail(mailOptions);
        console.log("Email sent successfully to:", email);
      } catch (mailError) {
        console.error("Nodemailer sendMail failed:", mailError);
        // We still throw to trigger the 500 in the outer reach because the OTP wasn't sent
        throw mailError;
      }
    } else {
      console.warn("SMTP credentials missing. Mocking email send. OTP is:", otp);
    }

    return res.status(200).json({ success: true, message: "If an account exists, an OTP has been sent." });

  } catch (error) {
    console.error("Forgot Password API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
