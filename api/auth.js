import { getDb } from "../lib/mongodb.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import crypto from "crypto";
import { ObjectId } from "mongodb";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_development_only";
const CACHE_TTL_MS = 75 * 1000;
const MAX_USERS_PER_SYNC = 120;
const MAX_CONCURRENT_USERS = 3;
const BATTLE_START_AT_ISO = "2026-03-20T13:00:00+09:00";
const USERNAME_REGEX = /^[A-Za-z0-9_]+$/;
const STRONG_PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function renderOtpEmailHtml({ heading, subheading, otp, expiryMinutes = 2 }) {
  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
        <style>
          .app-bg { background:#f6f3ff; color:#1a1230; }
          .card { background:#ffffff; border:1px solid rgba(99,102,241,0.28); }
          .muted { color:#5b4f7a; }
          .otp-wrap { background:#f3efff; border:1px dashed rgba(99,102,241,0.45); }
          .otp { color:#4f46e5; }
          .top { background:linear-gradient(135deg,#efe9ff,#ffffff); }
          @media (prefers-color-scheme: dark) {
            .app-bg { background:#0f0a1a !important; color:#f5f2ff !important; }
            .card { background:#1b1030 !important; border-color:rgba(167,139,250,0.35) !important; }
            .muted { color:#d8c8ff !important; }
            .otp-wrap { background:#140a25 !important; border-color:rgba(167,139,250,0.5) !important; }
            .otp { color:#c4a1ff !important; }
            .top { background:linear-gradient(135deg,#2a184a,#1b1030) !important; }
          }
        </style>
      </head>
      <body class="app-bg" style="margin:0;padding:24px;font-family:Segoe UI,Arial,sans-serif;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;border-radius:14px;overflow:hidden;" class="card">
          <tr>
            <td style="padding:20px 22px;border-bottom:1px solid rgba(99,102,241,0.2);" class="top">
              <h1 style="margin:0;font-size:20px;line-height:1.2;font-weight:800;letter-spacing:0.2px;" class="otp">
                ARIRANG SPOTIFY TAKEOVER
              </h1>
              <p style="margin:6px 0 0;font-size:12px;opacity:0.9;" class="muted">
                ${subheading}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:22px;">
              <p style="margin:0 0 12px;font-size:14px;line-height:1.55;" class="muted">
                ${heading}
              </p>
              <div style="margin:14px 0 16px;padding:14px 16px;border-radius:12px;text-align:center;" class="otp-wrap">
                <span style="display:inline-block;font-size:28px;letter-spacing:6px;font-weight:900;" class="otp">
                  ${otp}
                </span>
              </div>
              <p style="margin:0 0 8px;font-size:12px;" class="muted">
                This OTP expires in <strong style="color:inherit;">${expiryMinutes} minutes</strong>.
              </p>
              <p style="margin:0;font-size:12px;" class="muted">
                If you did not request this, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 22px;border-top:1px solid rgba(99,102,241,0.18);">
              <p style="margin:0;font-size:11px;opacity:0.9;" class="muted">
                This is an automated message from Arirang Support.
              </p>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

function escapeRegex(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toUsernameKey(value = "") {
  return String(value || "").trim().toLowerCase();
}

function toReferralKey(value = "") {
  return String(value || "").trim().toLowerCase();
}

function toEmailKey(value = "") {
  return String(value || "").trim().toLowerCase();
}

function setCors(res) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function toAction(value) {
  if (Array.isArray(value)) return String(value[0] || "").trim().toLowerCase();
  return String(value || "").trim().toLowerCase();
}

function extractBearerToken(req) {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) return null;
  return authHeader.slice("Bearer ".length).trim();
}

function verifyAdminRequest(req, res) {
  const token = extractBearerToken(req);
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded?.role !== "admin") {
      res.status(403).json({ error: "Forbidden" });
      return null;
    }
    return decoded;
  } catch {
    res.status(401).json({ error: "Invalid token" });
    return null;
  }
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

function generateSignature(params, secret) {
  const sortedKeys = Object.keys(params).sort();
  let signature = "";
  for (const key of sortedKeys) {
    signature += key + params[key];
  }
  signature += secret;
  return crypto.createHash("md5").update(signature).digest("hex");
}

function normalizeRegion(value = "") {
  return String(value).trim().toLowerCase();
}

function normalizeTarget(value = "") {
  return String(value).trim().toLowerCase();
}

function toResetKeyUTC(now = new Date()) {
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getAutomaticBattleNotification(now = new Date()) {
  const startsAt = new Date(BATTLE_START_AT_ISO);
  const diffMs = startsAt.getTime() - now.getTime();
  const campaignId = startsAt.toISOString();
  let active = null;

  if (diffMs <= 0) {
    active = {
      id: `${campaignId}:live`,
      phase: "live",
      message: "Battle is live now. Start streaming.",
      level: "success",
    };
  } else if (diffMs <= 15 * 60 * 1000) {
    active = {
      id: `${campaignId}:15m`,
      phase: "15m",
      message: "Battle starts in 15 minutes. Get ready now.",
      level: "info",
    };
  } else if (diffMs <= 60 * 60 * 1000) {
    active = {
      id: `${campaignId}:1h`,
      phase: "1h",
      message: "Battle starts in 1 hour. Final prep time.",
      level: "info",
    };
  } else if (diffMs <= 24 * 60 * 60 * 1000) {
    active = {
      id: `${campaignId}:24h`,
      phase: "24h",
      message: "Battle starts in 24 hours. Prepare your streaming team.",
      level: "info",
    };
  }

  return { startsAt: startsAt.toISOString(), active };
}

async function getBattleNotificationPayload(now = new Date()) {
  const auto = getAutomaticBattleNotification(now);

  let customActive = null;
  try {
    const db = await getDb();
    const customCollection = db.collection("battle_notifications");
    const custom = await customCollection.findOne(
      {
        status: { $in: ["active", "scheduled"] },
        startsAt: { $lte: now },
        endsAt: { $gt: now },
      },
      { sort: { createdAt: -1 } }
    );

    if (custom) {
      if (String(custom.status || "") === "scheduled") {
        await customCollection.updateOne(
          { _id: custom._id, status: "scheduled" },
          { $set: { status: "active", activatedAt: now } }
        );
      }
      customActive = {
        id: `custom:${String(custom._id)}`,
        phase: "custom",
        message: String(custom.message || "").trim(),
        level: ["success", "error", "info"].includes(String(custom.level || "").toLowerCase())
          ? String(custom.level || "").toLowerCase()
          : "info",
        startsAt: custom.startsAt ? new Date(custom.startsAt).toISOString() : null,
        endsAt: custom.endsAt ? new Date(custom.endsAt).toISOString() : null,
      };
    }
  } catch (error) {
    console.error("Battle notifications custom lookup failed:", error);
  }

  return {
    success: true,
    startsAt: auto.startsAt,
    serverTime: now.toISOString(),
    source: customActive ? "custom" : "automatic",
    active: customActive || auto.active,
  };
}

function parsePlaycount(value) {
  const parsed = Number.parseInt(String(value ?? "0"), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

async function fetchUserPlaycount({ apiKey, username, artist, target, type }) {
  try {
    const method = type === "album" ? "album.getInfo" : "track.getInfo";
    const targetParam = type === "album" ? "album" : "track";
    const url = `https://ws.audioscrobbler.com/2.0/?method=${method}&api_key=${apiKey}&artist=${encodeURIComponent(artist)}&${targetParam}=${encodeURIComponent(target)}&username=${encodeURIComponent(username)}&format=json`;

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok || data?.error) {
      return 0;
    }

    if (type === "album") {
      return parsePlaycount(data?.album?.userplaycount);
    }
    return parsePlaycount(data?.track?.userplaycount);
  } catch {
    return 0;
  }
}

async function mapWithConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let index = 0;

  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const current = index;
      index += 1;
      if (current >= items.length) break;
      results[current] = await worker(items[current], current);
    }
  });

  await Promise.all(workers);
  return results;
}

async function handleLogin(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  const normalizedEmail = toEmailKey(email);

  const db = await getDb();
  const usersCollection = db.collection("users");

  const user = await usersCollection.findOne({
    $or: [
      { email: normalizedEmail },
      { emailKey: normalizedEmail },
      { email: new RegExp(`^${escapeRegex(normalizedEmail)}$`, "i") },
    ],
  });
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign(
    { id: user._id.toString(), email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  return res.status(200).json({
    success: true,
    token,
    user: {
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role,
      profilePicture: user.profilePicture || null,
      lastfmUsername: user.lastfmUsername || null,
      country: user.country || null,
      region: user.region || null,
      referralCode: user.referralCode || user.username || null,
      onboardingComplete: Boolean(user.onboardingComplete),
      onboardingSnoozeUntil: user.onboardingSnoozeUntil || null,
    },
  });
}

async function handleSignup(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, password, username, country, region } = req.body || {};
  if (!email || !password || !username || !country || !region) {
    return res.status(400).json({ error: "Email, password, username, country, and region are required" });
  }

  const referralCodeRaw = String(req.body?.referralCode || "").trim();

  const normalizedUsername = String(username || "").trim();
  const usernameKey = toUsernameKey(normalizedUsername);
  const normalizedEmail = toEmailKey(email);
  if (!USERNAME_REGEX.test(normalizedUsername)) {
    return res.status(400).json({
      error: "Username can contain only letters, numbers, and underscore (_) with no spaces.",
    });
  }

  if (!EMAIL_REGEX.test(normalizedEmail)) {
    return res.status(400).json({ error: "Please provide a valid email address" });
  }

  if (!STRONG_PASSWORD_REGEX.test(String(password || ""))) {
    return res.status(400).json({
      error: "Password must be at least 8 characters and include 1 uppercase letter, 1 number, and 1 symbol.",
    });
  }

  const db = await getDb();
  const usersCollection = db.collection("users");
  const referralsCollection = db.collection("referrals");

  const existingUser = await usersCollection.findOne({
    $or: [
      { email: normalizedEmail },
      { emailKey: normalizedEmail },
      { email: new RegExp(`^${escapeRegex(normalizedEmail)}$`, "i") },
    ],
  });
  if (existingUser) {
    return res.status(400).json({ error: "User with this email already exists" });
  }

  const existingUsername = await usersCollection.findOne({
    $or: [
      { username: normalizedUsername },
      { usernameKey },
      { username: new RegExp(`^${escapeRegex(normalizedUsername)}$`, "i") },
    ],
  });
  if (existingUsername) {
    return res.status(400).json({ error: "Username is already in use" });
  }

  let referrer = null;
  let referralCodeKey = "";
  if (referralCodeRaw) {
    referralCodeKey = toReferralKey(referralCodeRaw);
    referrer = await usersCollection.findOne(
      {
        $or: [
          { referralCodeKey },
          { usernameKey: referralCodeKey },
          { username: new RegExp(`^${escapeRegex(referralCodeKey)}$`, "i") },
        ],
      },
      { projection: { _id: 1, username: 1, email: 1 } }
    );
    if (!referrer) {
      return res.status(400).json({ error: "Invalid referral code" });
    }
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const now = new Date();
  const derivedReferralCode = normalizedUsername;
  const newUser = {
    email: normalizedEmail,
    emailKey: normalizedEmail,
    username: normalizedUsername,
    usernameKey,
    referralCode: derivedReferralCode,
    referralCodeKey: toReferralKey(derivedReferralCode),
    password: hashedPassword,
    country,
    region,
    role: "user",
    onboardingComplete: false,
    onboardingSnoozeUntil: null,
    referredBy: referrer ? referrer._id.toString() : null,
    referralAcceptedAt: referrer ? now : null,
    referralCount: 0,
    referralVerifiedCount: 0,
    createdAt: now,
  };

  const result = await usersCollection.insertOne(newUser);

  if (referrer) {
    const referredUserId = result.insertedId.toString();
    try {
      const insertResult = await referralsCollection.updateOne(
        { referredUserId },
        {
          $setOnInsert: {
            referrerId: referrer._id.toString(),
            referrerUsername: String(referrer.username || ""),
            referredUserId,
            referralCodeKey,
            status: "verified",
            createdAt: now,
          },
        },
        { upsert: true }
      );

      if (insertResult.upsertedCount || insertResult.matchedCount === 0) {
        await usersCollection.updateOne(
          { _id: referrer._id },
          {
            $inc: { referralCount: 1, referralVerifiedCount: 1 },
            $set: { referralUpdatedAt: now },
          }
        );
      }
    } catch (error) {
      console.error("Failed to record referral:", error);
    }
  }

  const token = jwt.sign(
    { id: result.insertedId.toString(), email: normalizedEmail, role: newUser.role },
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
      country: newUser.country,
      region: newUser.region,
      profilePicture: null,
      lastfmUsername: null,
      referralCode: newUser.referralCode,
      onboardingComplete: false,
      onboardingSnoozeUntil: null,
    },
  });
}

async function handleForgotPassword(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email } = req.body || {};
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  const db = await getDb();
  const usersCollection = db.collection("users");

  const user = await usersCollection.findOne({ email });
  if (!user) {
    return res.status(200).json({ success: true, message: "If an account exists, an OTP has been sent." });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = new Date(Date.now() + 2 * 60 * 1000);

  await usersCollection.updateOne(
    { email },
    { $set: { resetOtp: otp, resetOtpExpiry: otpExpiry } }
  );

  let transporter;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpService = process.env.SMTP_SERVICE;
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);

  if (smtpUser && smtpPass) {
    if (smtpService) {
      transporter = nodemailer.createTransport({
        service: smtpService,
        auth: { user: smtpUser, pass: smtpPass },
      });
    } else if (smtpHost) {
      transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass },
      });
    } else if (smtpUser.includes("ethereal.email")) {
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: { user: smtpUser, pass: smtpPass },
      });
    } else {
      transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: smtpUser, pass: smtpPass },
      });
    }
  }

  const mailOptions = {
    from: `"Arirang Support" <${smtpUser}>`,
    to: email,
    subject: "Arirang Spotify Takeover OTP Verification",
    text: `Your OTP for password reset is: ${otp}. It is valid for 2 minutes.`,
    html: renderOtpEmailHtml({
      heading: "Use the OTP below to reset your password:",
      subheading: "Password Reset Verification",
      otp,
      expiryMinutes: 2,
    }),
  };

  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    await transporter.sendMail(mailOptions);
  } else {
    console.warn("SMTP credentials missing. Mocking email send. OTP is:", otp);
  }

  return res.status(200).json({ success: true, message: "If an account exists, an OTP has been sent." });
}

async function handleProfileEmailOtpSend(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const decoded = verifyUserRequest(req, res);
  if (!decoded) return;

  const userId = String(decoded.id || "").trim();
  if (!ObjectId.isValid(userId)) {
    return res.status(400).json({ error: "Invalid user id" });
  }

  const newEmailRaw = String(req.body?.newEmail || "").trim();
  const newEmailKey = toEmailKey(newEmailRaw);
  if (!EMAIL_REGEX.test(newEmailKey)) {
    return res.status(400).json({ error: "Please provide a valid email address" });
  }

  const db = await getDb();
  const usersCollection = db.collection("users");
  const objectId = new ObjectId(userId);
  const currentUser = await usersCollection.findOne(
    { _id: objectId },
    { projection: { email: 1, emailKey: 1 } }
  );
  if (!currentUser) {
    return res.status(404).json({ error: "User not found" });
  }

  const currentEmailKey = toEmailKey(currentUser.emailKey || currentUser.email || "");
  if (newEmailKey === currentEmailKey) {
    return res.status(400).json({ error: "New email must be different from current email" });
  }

  const duplicateEmail = await usersCollection.findOne(
    {
      _id: { $ne: objectId },
      $or: [
        { email: newEmailKey },
        { emailKey: newEmailKey },
        { email: new RegExp(`^${escapeRegex(newEmailKey)}$`, "i") },
      ],
    },
    { projection: { _id: 1 } }
  );
  if (duplicateEmail) {
    return res.status(400).json({ error: "Email is already in use" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = new Date(Date.now() + 2 * 60 * 1000);

  await usersCollection.updateOne(
    { _id: objectId },
    {
      $set: {
        pendingEmailKey: newEmailKey,
        pendingEmailOtp: otp,
        pendingEmailOtpExpiry: otpExpiry,
      },
    }
  );

  let transporter;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpService = process.env.SMTP_SERVICE;
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);

  if (smtpUser && smtpPass) {
    if (smtpService) {
      transporter = nodemailer.createTransport({
        service: smtpService,
        auth: { user: smtpUser, pass: smtpPass },
      });
    } else if (smtpHost) {
      transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass },
      });
    } else if (smtpUser.includes("ethereal.email")) {
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: { user: smtpUser, pass: smtpPass },
      });
    } else {
      transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: smtpUser, pass: smtpPass },
      });
    }
  }

  const mailOptions = {
    from: `"Arirang Support" <${smtpUser}>`,
    to: newEmailKey,
    subject: "Verify your new email - OTP",
    text: `Your OTP to verify this email change is: ${otp}. It is valid for 2 minutes.`,
    html: renderOtpEmailHtml({
      heading: "We received a request to change your account email. Use the OTP below to verify this email address:",
      subheading: "Email Change Verification",
      otp,
      expiryMinutes: 2,
    }),
  };

  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      await transporter.sendMail(mailOptions);
      return res.status(200).json({ success: true, message: "OTP sent to new email" });
    } catch (error) {
      console.error("Email-change OTP send failed:", error);
      return res.status(502).json({
        error: "Failed to send OTP email. Check SMTP configuration.",
      });
    }
  }

  // Local/dev fallback: no SMTP configured.
  if (process.env.NODE_ENV !== "production") {
    console.warn("SMTP credentials missing. Dev email-change OTP:", otp);
    return res.status(200).json({
      success: true,
      message: "SMTP not configured. Use dev OTP from server logs.",
      devOtp: otp,
    });
  }

  return res.status(500).json({
    error: "Email service not configured.",
  });
}

async function handleProfileEmailOtpVerify(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const decoded = verifyUserRequest(req, res);
  if (!decoded) return;

  const userId = String(decoded.id || "").trim();
  if (!ObjectId.isValid(userId)) {
    return res.status(400).json({ error: "Invalid user id" });
  }

  const newEmailKey = toEmailKey(req.body?.newEmail || "");
  const otp = String(req.body?.otp || "").trim();
  if (!newEmailKey || !otp) {
    return res.status(400).json({ error: "newEmail and otp are required" });
  }

  const db = await getDb();
  const usersCollection = db.collection("users");
  const user = await usersCollection.findOne(
    { _id: new ObjectId(userId) },
    { projection: { pendingEmailKey: 1, pendingEmailOtp: 1, pendingEmailOtpExpiry: 1 } }
  );
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const pendingEmailKey = toEmailKey(user.pendingEmailKey || "");
  if (!pendingEmailKey || pendingEmailKey !== newEmailKey) {
    return res.status(200).json({ success: true, valid: false, reason: "email_mismatch" });
  }

  if (!user.pendingEmailOtpExpiry || new Date() > new Date(user.pendingEmailOtpExpiry)) {
    return res.status(200).json({ success: true, valid: false, reason: "expired" });
  }

  const valid = String(user.pendingEmailOtp || "") === otp;
  return res.status(200).json({ success: true, valid });
}

async function handleVerifyOtp(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

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

  const resetToken = crypto.randomBytes(32).toString("hex");

  await usersCollection.updateOne(
    { email },
    {
      $set: { passwordResetToken: resetToken, passwordResetExpires: new Date(Date.now() + 15 * 60 * 1000) },
      $unset: { resetOtp: "", resetOtpExpiry: "" },
    }
  );

  return res.status(200).json({ success: true, resetToken });
}

async function handleResetPassword(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, resetToken, newPassword } = req.body || {};
  if (!email || !resetToken || !newPassword) {
    return res.status(400).json({ error: "Email, reset token, and new password are required" });
  }

  const db = await getDb();
  const usersCollection = db.collection("users");

  const user = await usersCollection.findOne({
    email,
    passwordResetToken: resetToken,
    passwordResetExpires: { $gt: new Date() },
  });

  if (!user) {
    return res.status(400).json({ error: "Invalid or expired reset token" });
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  await usersCollection.updateOne(
    { email },
    {
      $set: { password: hashedPassword },
      $unset: { passwordResetToken: "", passwordResetExpires: "" },
    }
  );

  return res.status(200).json({ success: true, message: "Password updated successfully" });
}

async function handleProfilePicture(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];
  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }

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
      onboardingComplete: Boolean(result.onboardingComplete),
      onboardingSnoozeUntil: result.onboardingSnoozeUntil || null,
    },
  });
}

async function handleProfilePreferences(req, res) {
  if (!["GET", "POST"].includes(req.method)) {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const decoded = verifyUserRequest(req, res);
  if (!decoded) return;

  const db = await getDb();
  const usersCollection = db.collection("users");
  const userId = decoded.id;

  let objectId;
  try {
    objectId = new ObjectId(userId);
  } catch {
    return res.status(400).json({ error: "Invalid user ID format" });
  }

  if (req.method === "GET") {
    const user = await usersCollection.findOne(
      { _id: objectId },
      { projection: { onboardingComplete: 1, onboardingSnoozeUntil: 1 } }
    );
    if (!user) return res.status(404).json({ error: "User not found" });

    return res.status(200).json({
      success: true,
      preferences: {
        onboardingComplete: Boolean(user.onboardingComplete),
        onboardingSnoozeUntil: user.onboardingSnoozeUntil || null,
      },
    });
  }

  const nextComplete = Boolean(req.body?.onboardingComplete);
  const snoozeInput = req.body?.onboardingSnoozeUntil;
  let onboardingSnoozeUntil = null;

  if (snoozeInput) {
    const parsed = new Date(snoozeInput);
    if (!Number.isNaN(parsed.getTime())) {
      onboardingSnoozeUntil = parsed;
    }
  }

  const result = await usersCollection.findOneAndUpdate(
    { _id: objectId },
    {
      $set: {
        onboardingComplete: nextComplete,
        onboardingSnoozeUntil,
      },
    },
    { returnDocument: "after" }
  );
  if (!result) return res.status(404).json({ error: "User not found" });

  return res.status(200).json({
    success: true,
    preferences: {
      onboardingComplete: Boolean(result.onboardingComplete),
      onboardingSnoozeUntil: result.onboardingSnoozeUntil || null,
    },
  });
}

async function handleProfile(req, res) {
  if (!["GET", "POST"].includes(req.method)) {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const decoded = verifyUserRequest(req, res);
  if (!decoded) return;

  const userId = String(decoded.id || "");
  if (!ObjectId.isValid(userId)) {
    return res.status(400).json({ error: "Invalid user ID format" });
  }

  const db = await getDb();
  const usersCollection = db.collection("users");
  const objectId = new ObjectId(userId);

  if (req.method === "GET") {
    const user = await usersCollection.findOne(
      { _id: objectId },
      { projection: { username: 1, email: 1, country: 1, region: 1, lastfmUsername: 1, createdAt: 1 } }
    );
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.status(200).json({
      success: true,
      user: {
        username: String(user.username || ""),
        email: String(user.email || ""),
        country: user.country || null,
        region: user.region || null,
        lastfmUsername: user.lastfmUsername || null,
        createdAt: user.createdAt || null,
      },
    });
  }

  const username = String(req.body?.username || "").trim();
  const email = String(req.body?.email || "").trim();
  const usernameKey = toUsernameKey(username);
  const emailKey = toEmailKey(email);
  const country = String(req.body?.country || "").trim();
  const region = String(req.body?.region || "").trim();
  if (!username || !email || !country || !region) {
    return res.status(400).json({ error: "username, email, country and region are required" });
  }
  if (!USERNAME_REGEX.test(username)) {
    return res.status(400).json({
      error: "Username can contain only letters, numbers, and underscore (_) with no spaces.",
    });
  }
  if (!EMAIL_REGEX.test(emailKey)) {
    return res.status(400).json({ error: "Please provide a valid email address" });
  }

  const currentUser = await usersCollection.findOne(
    { _id: objectId },
    { projection: { email: 1, emailKey: 1, pendingEmailKey: 1, pendingEmailOtp: 1, pendingEmailOtpExpiry: 1 } }
  );
  if (!currentUser) return res.status(404).json({ error: "User not found" });

  const currentEmailKey = toEmailKey(currentUser.emailKey || currentUser.email || "");
  const emailChanged = emailKey !== currentEmailKey;
  if (emailChanged) {
    const emailOtp = String(req.body?.emailOtp || "").trim();
    if (!emailOtp) {
      return res.status(400).json({ error: "Email OTP is required to change email" });
    }
    const pendingEmailKey = toEmailKey(currentUser.pendingEmailKey || "");
    if (!pendingEmailKey || pendingEmailKey !== emailKey) {
      return res.status(400).json({ error: "Request a new OTP for this email address" });
    }
    if (String(currentUser.pendingEmailOtp || "") !== emailOtp) {
      return res.status(400).json({ error: "Invalid email OTP" });
    }
    if (!currentUser.pendingEmailOtpExpiry || new Date() > new Date(currentUser.pendingEmailOtpExpiry)) {
      return res.status(400).json({ error: "Email OTP has expired" });
    }
  }

  const duplicateUsername = await usersCollection.findOne(
    {
      _id: { $ne: objectId },
      $or: [
        { username },
        { usernameKey },
        { username: new RegExp(`^${escapeRegex(username)}$`, "i") },
      ],
    },
    { projection: { _id: 1 } }
  );
  if (duplicateUsername) {
    return res.status(400).json({ error: "Username is already in use" });
  }

  const duplicateEmail = await usersCollection.findOne(
    {
      _id: { $ne: objectId },
      $or: [
        { email: emailKey },
        { emailKey },
        { email: new RegExp(`^${escapeRegex(emailKey)}$`, "i") },
      ],
    },
    { projection: { _id: 1 } }
  );
  if (duplicateEmail) {
    return res.status(400).json({ error: "Email is already in use" });
  }

  const updateDoc = {
    $set: { username, usernameKey, email: emailKey, emailKey, country, region },
  };
  if (emailChanged) {
    updateDoc.$unset = { pendingEmailKey: "", pendingEmailOtp: "", pendingEmailOtpExpiry: "" };
  }

  const result = await usersCollection.findOneAndUpdate(
    { _id: objectId },
    updateDoc,
    { returnDocument: "after", projection: { username: 1, email: 1, country: 1, region: 1, lastfmUsername: 1, createdAt: 1 } }
  );
  if (!result) return res.status(404).json({ error: "User not found" });

  return res.status(200).json({
    success: true,
    user: {
      username: String(result.username || ""),
      email: String(result.email || ""),
      country: result.country || null,
      region: result.region || null,
      lastfmUsername: result.lastfmUsername || null,
      createdAt: result.createdAt || null,
    },
  });
}

async function handleHealth(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const admin = verifyAdminRequest(req, res);
  if (!admin) return;

  const checks = {
    auth: { status: "ok", detail: "Authenticated admin session" },
    db: { status: "error", detail: "" },
    sync: { status: "warn", detail: "" },
    aggregate: { status: "warn", detail: "" },
  };

  try {
    const db = await getDb();
    await db.command({ ping: 1 });
    checks.db = { status: "ok", detail: "MongoDB reachable" };

    const liveConfigDoc = await db.collection("app_config").findOne({ key: "liveBattles" });
    const liveCount = Array.isArray(liveConfigDoc?.value) ? liveConfigDoc.value.length : 0;
    checks.aggregate = liveCount > 0
      ? { status: "ok", detail: `${liveCount} live battle config entries` }
      : { status: "warn", detail: "No live battle config found" };
  } catch (error) {
    checks.db = { status: "error", detail: error instanceof Error ? error.message : "DB error" };
  }

  if (process.env.LASTFM_API_KEY) {
    checks.sync = { status: "ok", detail: "LASTFM_API_KEY configured" };
  } else {
    checks.sync = { status: "error", detail: "LASTFM_API_KEY missing" };
  }

  return res.status(200).json({
    success: true,
    generatedAt: new Date().toISOString(),
    checks,
  });
}

async function handleLastfmSession(req, res) {
  if (req.method === "DELETE") {
    const { userId } = req.body || {};
    if (!userId) return res.status(400).json({ error: "userId is required" });

    const db = await getDb();
    await db.collection("users").updateOne(
      { _id: new ObjectId(userId) },
      { $unset: { lastfmUsername: "", lastfmSessionKey: "", lastfmLinkedAt: "" } }
    );

    return res.status(200).json({ success: true, message: "Last.fm disconnected" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { token, userId } = req.body || {};
  if (!token || !userId) {
    return res.status(400).json({ error: "Token and userId are required" });
  }

  const apiKey = process.env.LASTFM_API_KEY;
  const sharedSecret = process.env.LASTFM_SHARED_SECRET;
  if (!apiKey || !sharedSecret) {
    return res.status(500).json({ error: "Last.fm API configuration missing" });
  }

  const sigParams = {
    api_key: apiKey,
    method: "auth.getSession",
    token,
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

  const db = await getDb();
  const usersCollection = db.collection("users");

  await usersCollection.updateOne(
    { _id: new ObjectId(userId) },
    {
      $set: {
        lastfmUsername,
        lastfmSessionKey,
        lastfmLinkedAt: new Date(),
      },
    }
  );

  return res.status(200).json({ success: true, lastfmUsername });
}

async function handleLastfmBattleStats(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { artist, albumName, trackName, regionA, regionB } = req.body || {};

  if (!artist || !albumName || !trackName || !regionA || !regionB) {
    return res.status(400).json({
      error: "artist, albumName, trackName, regionA, and regionB are required",
    });
  }

  const normalizedA = normalizeRegion(regionA);
  const normalizedB = normalizeRegion(regionB);
  if (!normalizedA || !normalizedB || normalizedA === normalizedB) {
    return res.status(400).json({ error: "regionA and regionB must be different valid regions" });
  }

  const apiKey = process.env.LASTFM_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Last.fm API key is not configured" });
  }

  const db = await getDb();
  const usersCollection = db.collection("users");
  const baselinesCollection = db.collection("lastfm_scrobble_baselines");
  const totalsCacheCollection = db.collection("lastfm_battle_totals_cache");

  const users = await usersCollection
    .find({
      lastfmUsername: { $exists: true, $ne: null },
      region: { $exists: true, $ne: null },
    })
    .project({ _id: 1, lastfmUsername: 1, region: 1 })
    .toArray();

  const eligibleUsers = users.filter((user) => {
    const userRegion = normalizeRegion(user.region);
    return userRegion === normalizedA || userRegion === normalizedB;
  });

  const resetKey = toResetKeyUTC(new Date());
  const artistKey = normalizeTarget(artist);
  const albumKey = normalizeTarget(albumName);
  const trackKey = normalizeTarget(trackName);
  const regionPairKey = [normalizedA, normalizedB].sort().join("::");
  const cacheKey = `${resetKey}|${regionPairKey}|${artistKey}|${albumKey}|${trackKey}`;

  const cachedTotals = await totalsCacheCollection.findOne({ cacheKey });
  if (cachedTotals?.fetchedAt) {
    const ageMs = Date.now() - new Date(cachedTotals.fetchedAt).getTime();
    if (ageMs <= CACHE_TTL_MS) {
      return res.status(200).json({
        success: true,
        resetKey,
        artist,
        albumName,
        trackName,
        regions: { regionA, regionB },
        totals: cachedTotals.totals || {
          [regionA]: { album: 0, title: 0, users: 0 },
          [regionB]: { album: 0, title: 0, users: 0 },
        },
        processedUsers: cachedTotals.processedUsers || 0,
        eligibleUsers: cachedTotals.eligibleUsers || eligibleUsers.length,
        source: "lastfm-cache",
        cachedAt: cachedTotals.fetchedAt,
      });
    }
  }

  const limitedUsers = eligibleUsers.slice(0, MAX_USERS_PER_SYNC);
  const userIds = limitedUsers.map((user) => String(user._id));

  const existingBaselines = userIds.length
    ? await baselinesCollection
        .find({
          resetKey,
          artistKey,
          albumKey,
          trackKey,
          userId: { $in: userIds },
        })
        .toArray()
    : [];

  const baselineByUserId = new Map(existingBaselines.map((doc) => [doc.userId, doc]));

  const totals = {
    [regionA]: { album: 0, title: 0, users: 0 },
    [regionB]: { album: 0, title: 0, users: 0 },
  };

  const baselineUpserts = [];
  let processedUsers = 0;

  const perUserResults = await mapWithConcurrency(limitedUsers, MAX_CONCURRENT_USERS, async (user) => {
    const username = String(user.lastfmUsername || "").trim();
    if (!username) return null;

    const [albumPlaycount, trackPlaycount] = await Promise.all([
      fetchUserPlaycount({
        apiKey,
        username,
        artist,
        target: albumName,
        type: "album",
      }),
      fetchUserPlaycount({
        apiKey,
        username,
        artist,
        target: trackName,
        type: "track",
      }),
    ]);

    const userId = String(user._id);
    const baseline = baselineByUserId.get(userId);

    let albumDelta = 0;
    let trackDelta = 0;

    if (!baseline) {
      baselineUpserts.push({
        updateOne: {
          filter: { userId, resetKey, artistKey, albumKey, trackKey },
          update: {
            $setOnInsert: {
              userId,
              username,
              region: user.region,
              resetKey,
              artistKey,
              albumKey,
              trackKey,
              albumBaseline: albumPlaycount,
              trackBaseline: trackPlaycount,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          },
          upsert: true,
        },
      });
    } else {
      albumDelta = Math.max(0, albumPlaycount - parsePlaycount(baseline.albumBaseline));
      trackDelta = Math.max(0, trackPlaycount - parsePlaycount(baseline.trackBaseline));
    }

    const sideKey = normalizeRegion(user.region) === normalizedA ? regionA : regionB;
    return { sideKey, albumDelta, trackDelta };
  });

  for (const result of perUserResults) {
    if (!result) continue;
    totals[result.sideKey].album += result.albumDelta;
    totals[result.sideKey].title += result.trackDelta;
    totals[result.sideKey].users += 1;
    processedUsers += 1;
  }

  if (baselineUpserts.length) {
    await baselinesCollection.bulkWrite(baselineUpserts, { ordered: false });
  }

  await totalsCacheCollection.updateOne(
    { cacheKey },
    {
      $set: {
        cacheKey,
        resetKey,
        artistKey,
        albumKey,
        trackKey,
        totals,
        processedUsers,
        eligibleUsers: eligibleUsers.length,
        limitedUsers: limitedUsers.length,
        fetchedAt: new Date(),
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  );

  return res.status(200).json({
    success: true,
    resetKey,
    artist,
    albumName,
    trackName,
    regions: { regionA, regionB },
    totals,
    processedUsers,
    eligibleUsers: eligibleUsers.length,
    limitedUsers: limitedUsers.length,
    source: "lastfm-live",
  });
}

async function handleUsersSummary(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const admin = verifyAdminRequest(req, res);
  if (!admin) return;

  const db = await getDb();
  const usersCollection = db.collection("users");

  const users = await usersCollection
    .find({})
    .project({ _id: 0, role: 1, username: 1, email: 1, lastfmUsername: 1 })
    .toArray();

  const regularUsers = users.filter((u) => (u.role || "user") !== "admin");
  const getDisplayName = (user) => String(user?.username || user?.email || "").trim();
  const connectedUsers = regularUsers.filter((u) => String(u.lastfmUsername || "").trim().length > 0);
  const notConnectedUsers = regularUsers.filter((u) => String(u.lastfmUsername || "").trim().length === 0);
  const connectedCount = connectedUsers.length;
  const totalUsers = regularUsers.length;
  const notConnectedCount = Math.max(0, totalUsers - connectedCount);
  const connectedUsernames = connectedUsers
    .map(getDisplayName)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  const notConnectedUsernames = notConnectedUsers
    .map(getDisplayName)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

  return res.status(200).json({
    success: true,
    counts: {
      signups: totalUsers,
      lastfmConnected: connectedCount,
      lastfmNotConnected: notConnectedCount,
    },
    usernames: {
      lastfmConnected: connectedUsernames,
      lastfmNotConnected: notConnectedUsernames,
    },
    generatedAt: new Date().toISOString(),
  });
}

async function handleReferralStats(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const decoded = verifyUserRequest(req, res);
  if (!decoded) return;

  const userId = String(decoded.id || "").trim();
  if (!ObjectId.isValid(userId)) {
    return res.status(400).json({ error: "Invalid user id" });
  }

  const db = await getDb();
  const usersCollection = db.collection("users");
  const referralsCollection = db.collection("referrals");

  const user = await usersCollection.findOne(
    { _id: new ObjectId(userId) },
    { projection: { referralCode: 1, username: 1, referralCount: 1, referralVerifiedCount: 1 } }
  );
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const recent = await referralsCollection
    .find({ referrerId: userId }, { sort: { createdAt: -1 }, limit: 10 })
    .project({ _id: 0, referredUserId: 1, createdAt: 1, status: 1 })
    .toArray();

  return res.status(200).json({
    success: true,
    referralCode: user.referralCode || user.username || null,
    totals: {
      total: Number(user.referralCount || 0),
      verified: Number(user.referralVerifiedCount || 0),
    },
    recent: recent.map((row) => ({
      referredUserId: String(row.referredUserId || ""),
      status: String(row.status || "verified"),
      createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null,
    })),
  });
}

async function handleLastfmSyncNow(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const admin = verifyAdminRequest(req, res);
  if (!admin) return;

  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const proto = req.headers["x-forwarded-proto"] || "https";
  if (!host) {
    return res.status(400).json({ error: "Unable to resolve host for sync trigger" });
  }

  const headers = { "Content-Type": "application/json" };
  if (process.env.CRON_SECRET) {
    headers.Authorization = `Bearer ${process.env.CRON_SECRET}`;
  }

  const syncResponse = await fetch(`${proto}://${host}/api/cron/lastfm-sync`, {
    method: "POST",
    headers,
  });
  const syncData = await syncResponse.json().catch(() => ({}));
  if (!syncResponse.ok) {
    const errorMessage = [syncData.error, syncData.detail].filter(Boolean).join(": ");
    return res.status(syncResponse.status).json({
      error: errorMessage || "Failed to run Last.fm sync",
      details: syncData,
    });
  }

  return res.status(200).json({
    success: true,
    triggeredBy: admin.email || admin.id || "admin",
    sync: syncData,
  });
}

async function fetchTopScrobblerRows({ resetKey, battleId, limit }) {
  const db = await getDb();
  const leaderboardCollection = db.collection("lastfm_user_leaderboard");

  const match = { resetKey };
  if (battleId) {
    match.battleId = battleId;
  }

  const rows = await leaderboardCollection
    .aggregate([
      { $match: match },
      {
        $group: {
          _id: "$userId",
          userId: { $first: "$userId" },
          lastfmUsername: { $first: "$lastfmUsername" },
          region: { $first: "$region" },
          albumStreams: { $sum: "$albumStreams" },
          titleStreams: { $sum: "$titleStreams" },
          totalStreams: { $sum: "$totalStreams" },
          battleCount: { $sum: 1 },
          updatedAt: { $max: "$updatedAt" },
        },
      },
      { $sort: { totalStreams: -1, titleStreams: -1, albumStreams: -1 } },
      { $limit: limit },
    ])
    .toArray();

  return rows.map((row, index) => ({
    rank: index + 1,
    userId: row.userId || row._id || "",
    lastfmUsername: row.lastfmUsername || "",
    region: row.region || "",
    albumStreams: Number(row.albumStreams || 0),
    titleStreams: Number(row.titleStreams || 0),
    totalStreams: Number(row.totalStreams || 0),
    battleCount: Number(row.battleCount || 0),
    updatedAt: row.updatedAt || null,
  }));
}

async function handleTopScrobblers(req, res) {
  if (!["GET", "DELETE"].includes(req.method)) {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const admin = verifyAdminRequest(req, res);
  if (!admin) return;

  if (req.method === "DELETE") {
    const userId = String(req.body?.userId || req.query?.userId || "").trim();
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const resetKey = String(req.body?.resetKey || req.query?.resetKey || toResetKeyUTC(new Date())).trim();
    const battleId = String(req.body?.battleId || req.query?.battleId || "").trim();

    const db = await getDb();
    const leaderboardCollection = db.collection("lastfm_user_leaderboard");
    const filter = { resetKey, userId };
    if (battleId) filter.battleId = battleId;

    const result = await leaderboardCollection.deleteMany(filter);
    return res.status(200).json({
      success: true,
      resetKey,
      battleId: battleId || null,
      userId,
      deletedCount: result.deletedCount || 0,
    });
  }

  const resetKey = String(req.query?.resetKey || toResetKeyUTC(new Date())).trim();
  const battleId = String(req.query?.battleId || "").trim();
  const limitRaw = Number.parseInt(String(req.query?.limit || "10"), 10);
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(50, limitRaw)) : 10;
  const top = await fetchTopScrobblerRows({ resetKey, battleId, limit });

  return res.status(200).json({
    success: true,
    resetKey,
    battleId: battleId || null,
    top,
  });
}

async function handleDeleteAccount(req, res) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const decoded = verifyUserRequest(req, res);
  if (!decoded) return;

  const userId = String(decoded.id || "").trim();
  if (!ObjectId.isValid(userId)) {
    return res.status(400).json({ error: "Invalid user id" });
  }

  const password = String(req.body?.password || "").trim();
  if (!password) {
    return res.status(400).json({ error: "Password is required" });
  }

  const db = await getDb();
  const usersCollection = db.collection("users");
  const leaderboardCollection = db.collection("lastfm_user_leaderboard");
  const userStateCollection = db.collection("lastfm_battle_user_state");
  const baselinesCollection = db.collection("lastfm_scrobble_baselines");
  const ticketsCollection = db.collection("support_tickets");
  const proofsCollection = db.collection("proof_submissions");

  const objectId = new ObjectId(userId);
  const user = await usersCollection.findOne({ _id: objectId }, { projection: { password: 1 } });
  if (!user?.password) {
    return res.status(404).json({ error: "User not found" });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ error: "Incorrect password" });
  }

  await Promise.all([
    usersCollection.deleteOne({ _id: objectId }),
    leaderboardCollection.deleteMany({ userId }),
    userStateCollection.deleteMany({ userId }),
    baselinesCollection.deleteMany({ userId }),
    ticketsCollection.deleteMany({ userId }),
    proofsCollection.deleteMany({ userId }),
  ]);

  return res.status(200).json({ success: true, deletedUserId: userId });
}

async function handleVerifyPassword(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const decoded = verifyUserRequest(req, res);
  if (!decoded) return;

  const userId = String(decoded.id || "").trim();
  if (!ObjectId.isValid(userId)) {
    return res.status(400).json({ error: "Invalid user id" });
  }

  const password = String(req.body?.password || "").trim();
  if (!password) {
    return res.status(400).json({ error: "Password is required" });
  }

  const db = await getDb();
  const usersCollection = db.collection("users");
  const user = await usersCollection.findOne(
    { _id: new ObjectId(userId) },
    { projection: { password: 1 } }
  );
  if (!user?.password) {
    return res.status(404).json({ error: "User not found" });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  return res.status(200).json({ success: true, valid: Boolean(isMatch) });
}

async function handlePublicTopScrobblers(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Lightweight cache to reduce serverless invocations on Vercel free plan.
  res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");

  const resetKey = String(req.query?.resetKey || toResetKeyUTC(new Date())).trim();
  const battleId = String(req.query?.battleId || "").trim();
  const limitRaw = Number.parseInt(String(req.query?.limit || "10"), 10);
  // Public endpoint supports larger limits for visualizations while still bounded for free-tier safety.
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(500, limitRaw)) : 50;
  const top = await fetchTopScrobblerRows({ resetKey, battleId, limit });

  return res.status(200).json({
    success: true,
    resetKey,
    battleId: battleId || null,
    top: top.map((row) => ({
      rank: row.rank,
      lastfmUsername: row.lastfmUsername,
      region: row.region,
      totalStreams: row.totalStreams,
      updatedAt: row.updatedAt,
    })),
  });
}

async function handleBattleNotifications(req, res) {
  if (req.method === "GET") {
    const adminView = String(req.query?.adminView || "").trim() === "1";
    if (adminView) {
      const admin = verifyAdminRequest(req, res);
      if (!admin) return;

      const db = await getDb();
      const customCollection = db.collection("battle_notifications");
      const now = new Date();
      const payload = await getBattleNotificationPayload(now);
      const scheduled = await customCollection
        .find(
          {
            type: "custom",
            status: "scheduled",
            startsAt: { $gt: now },
          },
          { sort: { startsAt: 1 }, limit: 20 }
        )
        .project({
          _id: 1,
          message: 1,
          level: 1,
          status: 1,
          startsAt: 1,
          endsAt: 1,
          createdAt: 1,
          createdBy: 1,
        })
        .toArray();

      return res.status(200).json({
        ...payload,
        scheduled: scheduled.map((item) => ({
          id: `custom:${String(item._id)}`,
          message: String(item.message || ""),
          level: String(item.level || "info"),
          status: String(item.status || "scheduled"),
          startsAt: item.startsAt ? new Date(item.startsAt).toISOString() : null,
          endsAt: item.endsAt ? new Date(item.endsAt).toISOString() : null,
          createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : null,
          createdBy: String(item.createdBy || ""),
        })),
      });
    }

    // Short cache for consistency while keeping response near real-time.
    res.setHeader("Cache-Control", "public, s-maxage=5, stale-while-revalidate=10");
    return res.status(200).json(await getBattleNotificationPayload(new Date()));
  }

  if (!["POST", "DELETE"].includes(req.method)) {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const admin = verifyAdminRequest(req, res);
  if (!admin) return;

  if (req.method === "DELETE") {
    const db = await getDb();
    const customCollection = db.collection("battle_notifications");
    const idRaw = String(req.body?.id || req.query?.id || "").trim();
    const now = new Date();
    const update = {
      $set: {
        status: "cancelled",
        cancelledAt: now,
        cancelledBy: admin.email || admin.id || "admin",
      },
    };

    if (idRaw) {
      const cleanId = idRaw.startsWith("custom:") ? idRaw.slice("custom:".length) : idRaw;
      if (!ObjectId.isValid(cleanId)) {
        return res.status(400).json({ error: "Invalid notification id" });
      }

      const result = await customCollection.updateOne(
        { _id: new ObjectId(cleanId), type: "custom", status: { $in: ["active", "scheduled"] } },
        update
      );
      if (!result.matchedCount) {
        return res.status(404).json({ error: "Custom notification not found" });
      }
      return res.status(200).json({ success: true, cancelledCount: result.modifiedCount || 1 });
    }

    const result = await customCollection.updateMany(
      { type: "custom", status: { $in: ["active", "scheduled"] } },
      update
    );
    return res.status(200).json({ success: true, cancelledCount: result.modifiedCount || 0 });
  }

  const message = String(req.body?.message || "").trim();
  const levelRaw = String(req.body?.level || "info").trim().toLowerCase();
  const level = ["info", "success", "error"].includes(levelRaw) ? levelRaw : "info";
  const hoursRaw = Number.parseInt(String(req.body?.durationHours || "0"), 10);
  const minutesRaw = Number.parseInt(String(req.body?.durationMinutes || "0"), 10);
  const secondsRaw = Number.parseInt(String(req.body?.durationSeconds || "0"), 10);
  const fallbackMinutesRaw = Number.parseInt(String(req.body?.durationMinutesLegacy || "30"), 10);

  const hours = Number.isFinite(hoursRaw) ? Math.max(0, Math.min(24, hoursRaw)) : 0;
  const minutes = Number.isFinite(minutesRaw) ? Math.max(0, Math.min(59, minutesRaw)) : 0;
  const seconds = Number.isFinite(secondsRaw) ? Math.max(0, Math.min(59, secondsRaw)) : 0;
  let durationSeconds = (hours * 3600) + (minutes * 60) + seconds;
  if (durationSeconds <= 0) {
    const fallbackMinutes = Number.isFinite(fallbackMinutesRaw) ? Math.max(1, Math.min(1440, fallbackMinutesRaw)) : 30;
    durationSeconds = fallbackMinutes * 60;
  }
  durationSeconds = Math.max(1, Math.min(86400, durationSeconds));

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }
  if (message.length > 240) {
    return res.status(400).json({ error: "Message must be 240 characters or fewer" });
  }

  const now = new Date();
  const scheduleAtRaw = String(req.body?.scheduleAt || "").trim();
  let startsAt = now;
  if (scheduleAtRaw) {
    const parsed = new Date(scheduleAtRaw);
    if (Number.isNaN(parsed.getTime())) {
      return res.status(400).json({ error: "Invalid schedule time" });
    }
    if (parsed.getTime() <= now.getTime()) {
      return res.status(400).json({ error: "Schedule time must be in the future" });
    }
    startsAt = parsed;
  }
  const endsAt = new Date(startsAt.getTime() + durationSeconds * 1000);
  const status = startsAt.getTime() > now.getTime() ? "scheduled" : "active";

  const db = await getDb();
  const customCollection = db.collection("battle_notifications");
  const result = await customCollection.insertOne({
    type: "custom",
    status,
    message,
    level,
    startsAt,
    endsAt,
    createdAt: now,
    createdBy: admin.email || admin.id || "admin",
  });

  return res.status(200).json({
    success: true,
    mode: status,
    notification: {
      id: `custom:${String(result.insertedId)}`,
      phase: "custom",
      message,
      level,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      durationSeconds,
    },
  });
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const action = toAction(req.query?.action);

  try {
    switch (action) {
      case "login":
        return await handleLogin(req, res);
      case "signup":
        return await handleSignup(req, res);
      case "forgot-password":
        return await handleForgotPassword(req, res);
      case "verify-otp":
        return await handleVerifyOtp(req, res);
      case "reset-password":
        return await handleResetPassword(req, res);
      case "profile-picture":
        return await handleProfilePicture(req, res);
      case "profile-preferences":
        return await handleProfilePreferences(req, res);
      case "profile":
        return await handleProfile(req, res);
      case "profile-email-otp-send":
        return await handleProfileEmailOtpSend(req, res);
      case "profile-email-otp-verify":
        return await handleProfileEmailOtpVerify(req, res);
      case "lastfm-session":
        return await handleLastfmSession(req, res);
      case "lastfm-battle-stats":
        return await handleLastfmBattleStats(req, res);
      case "users-summary":
        return await handleUsersSummary(req, res);
      case "lastfm-sync-now":
        return await handleLastfmSyncNow(req, res);
      case "referral-stats":
        return await handleReferralStats(req, res);
      case "top-scrobblers":
        return await handleTopScrobblers(req, res);
      case "public-top-scrobblers":
        return await handlePublicTopScrobblers(req, res);
      case "delete-account":
        return await handleDeleteAccount(req, res);
      case "verify-password":
        return await handleVerifyPassword(req, res);
      case "health":
        return await handleHealth(req, res);
      case "battle-notifications":
        return await handleBattleNotifications(req, res);
      default:
        return res.status(404).json({ error: "Not found" });
    }
  } catch (error) {
    console.error(`Auth route error (${action}):`, error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
