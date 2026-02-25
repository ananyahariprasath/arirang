import { getDb } from "../../lib/mongodb.js";

const CACHE_TTL_MS = 75 * 1000;
const MAX_USERS_PER_SYNC = 120;
const MAX_CONCURRENT_USERS = 3;

function setCors(res) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
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

export default async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      artist,
      albumName,
      trackName,
      regionA,
      regionB,
    } = req.body || {};

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
          regions: {
            regionA,
            regionB,
          },
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

    const baselineByUserId = new Map(
      existingBaselines.map((doc) => [doc.userId, doc])
    );

    const totals = {
      [regionA]: { album: 0, title: 0, users: 0 },
      [regionB]: { album: 0, title: 0, users: 0 },
    };

    const baselineUpserts = [];
    let processedUsers = 0;

    const perUserResults = await mapWithConcurrency(
      limitedUsers,
      MAX_CONCURRENT_USERS,
      async (user) => {
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
    }
    );

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
      regions: {
        regionA,
        regionB,
      },
      totals,
      processedUsers,
      eligibleUsers: eligibleUsers.length,
      limitedUsers: limitedUsers.length,
      source: "lastfm-live",
    });
  } catch (error) {
    console.error("Last.fm battle stats API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
