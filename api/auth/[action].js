import { getDb } from "../../lib/mongodb.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import crypto from "crypto";
import { ObjectId } from "mongodb";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_development_only";
const CACHE_TTL_MS = 75 * 1000;
const MAX_USERS_PER_SYNC = 120;
const MAX_CONCURRENT_USERS = 3;

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

  const db = await getDb();
  const usersCollection = db.collection("users");

  const user = await usersCollection.findOne({ email });
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

  const db = await getDb();
  const usersCollection = db.collection("users");

  const existingUser = await usersCollection.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ error: "User with this email already exists" });
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const now = new Date();
  const newUser = {
    email,
    username,
    password: hashedPassword,
    country,
    region,
    role: "user",
    createdAt: now,
  };

  const result = await usersCollection.insertOne(newUser);

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
      country: newUser.country,
      region: newUser.region,
      profilePicture: null,
      lastfmUsername: null,
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
    html: `<p>Your OTP for password reset is: <b>${otp}</b></p><p>It is valid for 2 minutes.</p>`,
  };

  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    await transporter.sendMail(mailOptions);
  } else {
    console.warn("SMTP credentials missing. Mocking email send. OTP is:", otp);
  }

  return res.status(200).json({ success: true, message: "If an account exists, an OTP has been sent." });
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
    },
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
    .project({ _id: 0, role: 1, lastfmUsername: 1 })
    .toArray();

  const regularUsers = users.filter((u) => (u.role || "user") !== "admin");
  const connectedCount = regularUsers.filter((u) => String(u.lastfmUsername || "").trim().length > 0).length;
  const totalUsers = regularUsers.length;
  const notConnectedCount = Math.max(0, totalUsers - connectedCount);

  return res.status(200).json({
    success: true,
    counts: {
      signups: totalUsers,
      lastfmConnected: connectedCount,
      lastfmNotConnected: notConnectedCount,
    },
    generatedAt: new Date().toISOString(),
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
    return res.status(syncResponse.status).json({
      error: syncData.error || "Failed to run Last.fm sync",
      details: syncData,
    });
  }

  return res.status(200).json({
    success: true,
    triggeredBy: admin.email || admin.id || "admin",
    sync: syncData,
  });
}

async function handleTopScrobblers(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const admin = verifyAdminRequest(req, res);
  if (!admin) return;

  const db = await getDb();
  const leaderboardCollection = db.collection("lastfm_user_leaderboard");

  const resetKey = String(req.query?.resetKey || toResetKeyUTC(new Date())).trim();
  const battleId = String(req.query?.battleId || "").trim();
  const limitRaw = Number.parseInt(String(req.query?.limit || "10"), 10);
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(50, limitRaw)) : 10;

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

  return res.status(200).json({
    success: true,
    resetKey,
    battleId: battleId || null,
    top: rows.map((row, index) => ({
      rank: index + 1,
      userId: row.userId || row._id || "",
      lastfmUsername: row.lastfmUsername || "",
      region: row.region || "",
      albumStreams: Number(row.albumStreams || 0),
      titleStreams: Number(row.titleStreams || 0),
      totalStreams: Number(row.totalStreams || 0),
      battleCount: Number(row.battleCount || 0),
      updatedAt: row.updatedAt || null,
    })),
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
      case "lastfm-session":
        return await handleLastfmSession(req, res);
      case "lastfm-battle-stats":
        return await handleLastfmBattleStats(req, res);
      case "users-summary":
        return await handleUsersSummary(req, res);
      case "lastfm-sync-now":
        return await handleLastfmSyncNow(req, res);
      case "top-scrobblers":
        return await handleTopScrobblers(req, res);
      default:
        return res.status(404).json({ error: "Not found" });
    }
  } catch (error) {
    console.error(`Auth route error (${action}):`, error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
