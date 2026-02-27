import { getDb } from "../../lib/mongodb.js";
import { ObjectId } from "mongodb";

const DEFAULT_DATA_SOURCE_URL = "https://gist.githubusercontent.com/ananyahariprasath/df1b0b42e90f29c96bc43b59167dbe8a/raw/arirang-data.json";
function toPositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const BATCH_SIZE = toPositiveInt(process.env.LASTFM_SYNC_BATCH_SIZE, 25);
const CONCURRENCY = toPositiveInt(process.env.LASTFM_SYNC_CONCURRENCY, 2);
const MAX_BATTLES_PER_RUN = toPositiveInt(process.env.LASTFM_SYNC_MAX_BATTLES_PER_RUN, 4);
const RECENT_TRACKS_LIMIT = toPositiveInt(process.env.LASTFM_SYNC_RECENT_LIMIT, 200);
const MAX_RECENT_PAGES = toPositiveInt(process.env.LASTFM_SYNC_RECENT_MAX_PAGES, 3);
const SNAPSHOT_GRACE_MINUTES = toPositiveInt(process.env.LASTFM_SNAPSHOT_GRACE_MINUTES, 30);
const MAX_BATCHES_PER_RUN = toPositiveInt(process.env.LASTFM_SYNC_MAX_BATCHES_PER_RUN, 8);
const NOW_PLAYING_COOLDOWN_SECONDS = toPositiveInt(process.env.LASTFM_NOW_PLAYING_COOLDOWN_SECONDS, 180);

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
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toResetKeyUTC(now = new Date()) {
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseRegionsFromTitle(title = "") {
  const parts = String(title).split(/\s+vs\s+/i).map((part) => part.trim());
  return [parts[0] || "", parts[1] || ""];
}

function buildConfigKey({ regionA, regionB, artist, albumName, trackName }) {
  const sideKey = [normalizeRegion(regionA), normalizeRegion(regionB)].sort().join("::");
  return [
    sideKey,
    normalizeTarget(artist),
    normalizeTarget(albumName),
    normalizeTarget(trackName),
  ].join("|");
}

function toPreviousResetKeyUTC(now = new Date()) {
  const previous = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  return toResetKeyUTC(previous);
}

function parseGoalValue(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const text = String(value || "").trim().toUpperCase().replace(/,/g, "");
  const match = text.match(/^(\d+(?:\.\d+)?)\s*([KMB])?$/);
  if (!match) return 0;
  const amount = Number(match[1]);
  const suffix = match[2] || "";
  const multiplier =
    suffix === "B" ? 1_000_000_000 : suffix === "M" ? 1_000_000 : suffix === "K" ? 1_000 : 1;
  return Math.round(amount * multiplier);
}

function toCount(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
}

function toPercent(count, goal) {
  if (!Number.isFinite(goal) || goal <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((count / goal) * 100)));
}

function hashString(value = "") {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

function buildSnapshotId(resetKey, battleId, configKey) {
  return `auto_${resetKey}_${String(battleId)}_${hashString(String(configKey))}`;
}

function isAuthorized(req) {
  if (req.headers["x-vercel-cron"]) return true;

  const secret = process.env.CRON_SECRET;
  if (!secret) return true;

  const authHeader = req.headers.authorization || "";
  const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : "";
  const altHeader = req.headers["x-cron-secret"] || "";
  return bearer === secret || altHeader === secret;
}

function normalizeBattleConfig(rawBattle = {}) {
  const [titleRegionA, titleRegionB] = parseRegionsFromTitle(rawBattle.title);
  const regionA = rawBattle.regionA || titleRegionA;
  const regionB = rawBattle.regionB || titleRegionB;
  const artist = rawBattle.artist || "";
  const albumName = rawBattle.albumName || "";
  const trackName = rawBattle.trackName || rawBattle.targetName || "";

  if (!rawBattle.id || !regionA || !regionB || !artist || !albumName || !trackName) {
    return null;
  }

  return {
    id: String(rawBattle.id),
    title: String(rawBattle.title || "").trim(),
    regionA: String(regionA).trim(),
    regionB: String(regionB).trim(),
    artist: String(artist).trim(),
    albumName: String(albumName).trim(),
    trackName: String(trackName).trim(),
    goal: rawBattle.goal ?? "",
    albumGoal: rawBattle.albumGoal ?? rawBattle.goal ?? "",
    titleTrackGoal: rawBattle.titleTrackGoal ?? rawBattle.goal ?? "",
  };
}

async function fetchAndCountUserScrobblesSince({
  apiKey,
  username,
  fromUts,
  toUts = null,
  artistTarget,
  albumTarget,
  trackTarget,
}) {
  let page = 1;
  let maxSeenUts = fromUts;
  let albumDelta = 0;
  let titleDelta = 0;
  let nowPlayingSignature = "";
  let nowPlayingAlbumMatch = false;
  let nowPlayingTitleMatch = false;
  let ok = true;

  while (page <= MAX_RECENT_PAGES) {
    const url =
      `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks` +
      `&api_key=${apiKey}` +
      `&user=${encodeURIComponent(username)}` +
      `&from=${Math.max(0, fromUts + 1)}` +
      (Number.isFinite(toUts) ? `&to=${Math.max(0, toUts)}` : "") +
      `&limit=${RECENT_TRACKS_LIMIT}` +
      `&page=${page}` +
      `&format=json`;

    let data;
    try {
      const response = await fetch(url);
      data = await response.json();
      if (!response.ok || data?.error) {
        ok = false;
        break;
      }
    } catch {
      ok = false;
      break;
    }

    const list = data?.recenttracks?.track;
    const tracks = Array.isArray(list) ? list : list ? [list] : [];
    if (tracks.length === 0) break;

    let pageHadEligible = false;
    for (const track of tracks) {
      const artist = normalizeTarget(
        track?.artist?.["#text"] || track?.artist?.name || track?.artist || ""
      );
      if (artist !== artistTarget) continue;

      const scrobbleTrack = normalizeTarget(track?.name || "");
      const scrobbleAlbum = normalizeTarget(track?.album?.["#text"] || track?.album || "");
      const isNowPlaying = String(track?.["@attr"]?.nowplaying || "").toLowerCase() === "true";

      if (isNowPlaying) {
        nowPlayingSignature = `${artist}|${scrobbleAlbum}|${scrobbleTrack}`;
        nowPlayingTitleMatch = scrobbleTrack === trackTarget;
        nowPlayingAlbumMatch = scrobbleAlbum === albumTarget;
        continue;
      }

      const utsRaw = track?.date?.uts;
      if (!utsRaw) continue;

      const uts = Number.parseInt(String(utsRaw), 10);
      if (!Number.isFinite(uts) || uts <= fromUts) continue;
      if (Number.isFinite(toUts) && uts > toUts) continue;

      pageHadEligible = true;
      if (uts > maxSeenUts) maxSeenUts = uts;

      if (scrobbleTrack === trackTarget) titleDelta += 1;
      if (scrobbleAlbum === albumTarget) albumDelta += 1;
    }

    if (!pageHadEligible) break;

    const totalPages = Number.parseInt(
      String(data?.recenttracks?.["@attr"]?.totalPages || "1"),
      10
    );
    if (!Number.isFinite(totalPages) || page >= totalPages) break;
    page += 1;
  }

  return {
    ok,
    maxSeenUts,
    albumDelta,
    titleDelta,
    nowPlayingSignature,
    nowPlayingAlbumMatch,
    nowPlayingTitleMatch,
  };
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

async function fetchLiveBattlesForSync(db) {
  const configCollection = db.collection("app_config");
  const fromDb = await configCollection.findOne({ key: "liveBattles" });
  if (Array.isArray(fromDb?.value) && fromDb.value.length > 0) {
    return fromDb.value.map(normalizeBattleConfig).filter(Boolean);
  }

  const sourceUrl = process.env.DATA_SOURCE_URL || DEFAULT_DATA_SOURCE_URL;
  const response = await fetch(sourceUrl);
  const data = await response.json();
  const liveBattles = Array.isArray(data?.liveBattles) ? data.liveBattles : [];
  return liveBattles.map(normalizeBattleConfig).filter(Boolean);
}

async function ensureIndexes(db) {
  await db.collection("lastfm_battle_sync_state").createIndex(
    { battleId: 1, resetKey: 1, configKey: 1 },
    { unique: true }
  );
  await db.collection("lastfm_battle_user_state").createIndex(
    { battleId: 1, resetKey: 1, configKey: 1, userId: 1 },
    { unique: true }
  );
  await db.collection("lastfm_battle_aggregates").createIndex(
    { battleId: 1, resetKey: 1, configKey: 1 },
    { unique: true }
  );
  await db.collection("users").createIndex(
    { region: 1, lastfmUsername: 1, _id: 1 }
  );
  await db.collection("battle_history").createIndex(
    { id: 1 },
    { unique: true }
  );
  await db.collection("lastfm_snapshot_state").createIndex(
    { id: 1 },
    { unique: true }
  );
  await db.collection("lastfm_user_leaderboard").createIndex(
    { resetKey: 1, userId: 1, battleId: 1, configKey: 1 },
    { unique: true }
  );
  await db.collection("lastfm_user_leaderboard").createIndex(
    { resetKey: 1, totalStreams: -1 }
  );
}

async function snapshotCompletedReset({ db, liveBattles, completedResetKey }) {
  const snapshotStateCollection = db.collection("lastfm_snapshot_state");
  const aggregateCollection = db.collection("lastfm_battle_aggregates");
  const historyCollection = db.collection("battle_history");
  const snapshotStateId = "battle-history-snapshot";

  const snapshotState = await snapshotStateCollection.findOne({ id: snapshotStateId });
  if (snapshotState?.lastCompletedResetKey === completedResetKey) {
    return {
      resetKey: completedResetKey,
      skipped: true,
      reason: "already-snapshotted",
      created: 0,
      updated: 0,
    };
  }

  const aggregates = await aggregateCollection.find({ resetKey: completedResetKey }).toArray();
  if (aggregates.length === 0) {
    return {
      resetKey: completedResetKey,
      skipped: true,
      reason: "no-aggregates",
      created: 0,
      updated: 0,
    };
  }

  const configByBattleAndKey = new Map();
  for (const battle of liveBattles) {
    const configKey = buildConfigKey(battle);
    configByBattleAndKey.set(`${battle.id}|${configKey}`, battle);
  }

  const now = new Date();
  const operations = aggregates.map((doc) => {
    const liveConfig = configByBattleAndKey.get(`${doc.battleId}|${doc.configKey}`);
    const regionA = liveConfig?.regionA || doc.regionA || "Region A";
    const regionB = liveConfig?.regionB || doc.regionB || "Region B";
    const sideAAlbum = toCount(doc?.totals?.sideA?.album);
    const sideATitle = toCount(doc?.totals?.sideA?.title);
    const sideBAlbum = toCount(doc?.totals?.sideB?.album);
    const sideBTitle = toCount(doc?.totals?.sideB?.title);
    const albumCount = sideAAlbum + sideBAlbum;
    const titleCount = sideATitle + sideBTitle;
    const albumTargetText = String(liveConfig?.albumGoal ?? liveConfig?.goal ?? "").trim();
    const titleTargetText = String(liveConfig?.titleTrackGoal ?? liveConfig?.goal ?? "").trim();
    const albumGoal = parseGoalValue(albumTargetText);
    const titleGoal = parseGoalValue(titleTargetText);
    const albumProgress = albumGoal > 0 ? toPercent(albumCount, albumGoal) : 0;
    const titleProgress = titleGoal > 0 ? toPercent(titleCount, titleGoal) : 0;
    const reachedTarget =
      (albumGoal > 0 ? albumCount >= albumGoal : true) &&
      (titleGoal > 0 ? titleCount >= titleGoal : true) &&
      (albumGoal > 0 || titleGoal > 0);
    const snapshotId = buildSnapshotId(completedResetKey, doc.battleId, doc.configKey);

    const historyRecord = {
      id: snapshotId,
      date: completedResetKey,
      time: "00:00 UTC",
      regions: [regionA, regionB].filter(Boolean),
      target: albumTargetText,
      progress: albumProgress,
      reachedTarget,
      winner: "",
      albumProgress,
      titleProgress,
      albumCount,
      titleCount,
      titleTarget: titleTargetText,
      source: "auto:lastfm",
      snapshotKey: completedResetKey,
      battleId: String(doc.battleId || liveConfig?.id || ""),
      configKey: String(doc.configKey || ""),
      title: String(liveConfig?.title || "").trim(),
      regionA,
      regionB,
      regionAAlbumCount: sideAAlbum,
      regionATitleCount: sideATitle,
      regionBAlbumCount: sideBAlbum,
      regionBTitleCount: sideBTitle,
      artist: String(liveConfig?.artist || doc.artist || "").trim(),
      albumName: String(liveConfig?.albumName || doc.albumName || "").trim(),
      trackName: String(liveConfig?.trackName || doc.trackName || "").trim(),
      updatedAt: now,
    };

    return {
      updateOne: {
        filter: { id: snapshotId },
        update: {
          $set: historyRecord,
          $setOnInsert: { createdAt: now },
        },
        upsert: true,
      },
    };
  });

  const bulkResult = operations.length > 0
    ? await historyCollection.bulkWrite(operations, { ordered: false })
    : null;

  await snapshotStateCollection.updateOne(
    { id: snapshotStateId },
    {
      $set: {
        id: snapshotStateId,
        lastCompletedResetKey: completedResetKey,
        updatedAt: now,
      },
      $setOnInsert: {
        createdAt: now,
      },
    },
    { upsert: true }
  );

  return {
    resetKey: completedResetKey,
    skipped: false,
    created: bulkResult?.upsertedCount || 0,
    updated: bulkResult?.matchedCount || 0,
    total: operations.length,
  };
}

async function processBattleBatch({ db, battle, apiKey, resetKey, toUts = null }) {
  const usersCollection = db.collection("users");
  const stateCollection = db.collection("lastfm_battle_sync_state");
  const userStateCollection = db.collection("lastfm_battle_user_state");
  const aggregateCollection = db.collection("lastfm_battle_aggregates");
  const leaderboardCollection = db.collection("lastfm_user_leaderboard");

  const configKey = buildConfigKey(battle);
  const stateFilter = { battleId: battle.id, resetKey, configKey };
  const state = await stateCollection.findOne(stateFilter);

  const regionNames = [battle.regionA, battle.regionB];
  const query = {
    lastfmUsername: { $exists: true, $ne: null },
    region: { $in: regionNames },
  };

  if (state?.cursorId) {
    query._id = { $gt: new ObjectId(state.cursorId) };
  }

  const users = await usersCollection
    .find(query)
    .sort({ _id: 1 })
    .limit(BATCH_SIZE)
    .project({ _id: 1, lastfmUsername: 1, region: 1 })
    .toArray();

  // End of one full pass: restart from beginning on next run.
  const reachedEnd = users.length < BATCH_SIZE;
  const nextCursorId = reachedEnd || users.length === 0 ? null : String(users[users.length - 1]._id);
  const cycle = reachedEnd ? (state?.cycle || 0) + 1 : state?.cycle || 0;

  const increments = {
    sideA: { album: 0, title: 0, users: 0 },
    sideB: { album: 0, title: 0, users: 0 },
  };
  const resetStartUts = Math.floor(Date.parse(`${resetKey}T00:00:00.000Z`) / 1000);
  const artistTarget = normalizeTarget(battle.artist);
  const albumTarget = normalizeTarget(battle.albumName);
  const trackTarget = normalizeTarget(battle.trackName);

  const processed = await mapWithConcurrency(users, Math.max(1, CONCURRENCY), async (user) => {
    const username = String(user.lastfmUsername || "").trim();
    if (!username) return null;

    const userId = String(user._id);
    const userStateFilter = { battleId: battle.id, resetKey, configKey, userId };
    const previous = await userStateCollection.findOne(userStateFilter);
    const side = normalizeRegion(user.region) === normalizeRegion(battle.regionA) ? "sideA" : "sideB";
    const previousUts = Number.parseInt(String(previous?.lastSyncedUts || `${resetStartUts - 1}`), 10);
    const fromUts = Number.isFinite(previousUts) ? Math.max(previousUts, resetStartUts - 1) : resetStartUts - 1;

    const counted = await fetchAndCountUserScrobblesSince({
      apiKey,
      username,
      fromUts,
      toUts,
      artistTarget,
      albumTarget,
      trackTarget,
    });

    if (!counted.ok) {
      return null;
    }

    const boundedMaxSeenUts = Number.isFinite(toUts)
      ? Math.min(counted.maxSeenUts, toUts)
      : counted.maxSeenUts;
    const nextUts = Math.max(fromUts, boundedMaxSeenUts);
    const now = new Date();
    const nowPlayingPrevSig = String(previous?.lastNowPlayingSignature || "");
    const nowPlayingPrevAt = Number.parseInt(String(previous?.lastNowPlayingCountedAtUts || "0"), 10);
    const nowPlayingEligible =
      Boolean(counted.nowPlayingSignature) &&
      (
        counted.nowPlayingSignature !== nowPlayingPrevSig ||
        !Number.isFinite(nowPlayingPrevAt) ||
        (nowUts - nowPlayingPrevAt) >= NOW_PLAYING_COOLDOWN_SECONDS
      );
    const nowPlayingAlbumDelta = nowPlayingEligible && counted.nowPlayingAlbumMatch ? 1 : 0;
    const nowPlayingTitleDelta = nowPlayingEligible && counted.nowPlayingTitleMatch ? 1 : 0;
    const totalAlbumDelta = counted.albumDelta + nowPlayingAlbumDelta;
    const totalTitleDelta = counted.titleDelta + nowPlayingTitleDelta;

    if (!previous) {
      await userStateCollection.insertOne({
        battleId: battle.id,
        resetKey,
        configKey,
        userId,
        username,
        region: user.region,
        lastSyncedUts: nextUts,
        lastNowPlayingSignature: counted.nowPlayingSignature || "",
        lastNowPlayingCountedAtUts: nowPlayingEligible ? nowUts : 0,
        createdAt: now,
        updatedAt: now,
      });
      return {
        side,
        albumDelta: totalAlbumDelta,
        trackDelta: totalTitleDelta,
        firstSeen: true,
        userId,
        username,
        region: user.region,
      };
    }

    if (
      nextUts > fromUts ||
      counted.nowPlayingSignature !== nowPlayingPrevSig ||
      nowPlayingEligible
    ) {
      await userStateCollection.updateOne(
        userStateFilter,
        {
          $set: {
            lastSyncedUts: nextUts,
            lastNowPlayingSignature: counted.nowPlayingSignature || nowPlayingPrevSig,
            lastNowPlayingCountedAtUts: nowPlayingEligible ? nowUts : (Number.isFinite(nowPlayingPrevAt) ? nowPlayingPrevAt : 0),
            updatedAt: now,
          },
        }
      );
    }

    return {
      side,
      albumDelta: totalAlbumDelta,
      trackDelta: totalTitleDelta,
      firstSeen: false,
      userId,
      username,
      region: user.region,
    };
  });

  for (const item of processed) {
    if (!item) continue;
    increments[item.side].album += item.albumDelta;
    increments[item.side].title += item.trackDelta;
    if (item.firstSeen) increments[item.side].users += 1;
  }

  const leaderboardOps = [];
  const now = new Date();
  for (const item of processed) {
    if (!item) continue;
    const albumDelta = Number(item.albumDelta || 0);
    const titleDelta = Number(item.trackDelta || 0);
    const totalDelta = albumDelta + titleDelta;
    if (totalDelta <= 0) continue;

    leaderboardOps.push({
      updateOne: {
        filter: {
          resetKey,
          userId: String(item.userId),
          battleId: String(battle.id),
          configKey,
        },
        update: {
          $set: {
            resetKey,
            userId: String(item.userId),
            battleId: String(battle.id),
            configKey,
            lastfmUsername: String(item.username || ""),
            region: String(item.region || ""),
            updatedAt: now,
          },
          $setOnInsert: {
            createdAt: now,
            albumStreams: 0,
            titleStreams: 0,
            totalStreams: 0,
          },
          $inc: {
            albumStreams: albumDelta,
            titleStreams: titleDelta,
            totalStreams: totalDelta,
          },
        },
        upsert: true,
      },
    });
  }
  if (leaderboardOps.length > 0) {
    await leaderboardCollection.bulkWrite(leaderboardOps, { ordered: false });
  }

  await aggregateCollection.updateOne(
    { battleId: battle.id, resetKey, configKey },
    {
      $setOnInsert: {
        battleId: battle.id,
        resetKey,
        configKey,
        regionA: battle.regionA,
        regionB: battle.regionB,
        artist: battle.artist,
        albumName: battle.albumName,
        trackName: battle.trackName,
        totals: {
          sideA: { album: 0, title: 0, users: 0 },
          sideB: { album: 0, title: 0, users: 0 },
        },
        createdAt: new Date(),
      },
      $set: {
        regionA: battle.regionA,
        regionB: battle.regionB,
        artist: battle.artist,
        albumName: battle.albumName,
        trackName: battle.trackName,
        updatedAt: new Date(),
      },
      $inc: {
        "totals.sideA.album": increments.sideA.album,
        "totals.sideA.title": increments.sideA.title,
        "totals.sideA.users": increments.sideA.users,
        "totals.sideB.album": increments.sideB.album,
        "totals.sideB.title": increments.sideB.title,
        "totals.sideB.users": increments.sideB.users,
      },
    },
    { upsert: true }
  );

  await stateCollection.updateOne(
    stateFilter,
    {
      $set: {
        battleId: battle.id,
        resetKey,
        configKey,
        cursorId: nextCursorId,
        cycle,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        createdAt: new Date(),
      },
      $inc: {
        processedUsers: users.length,
      },
    },
    { upsert: true }
  );

  return {
    battleId: battle.id,
    processedUsers: users.length,
    nextCursorId,
    cycle,
    increments,
  };
}

async function processBattleForRun({
  db,
  battle,
  apiKey,
  resetKey,
  toUts = null,
}) {
  const summaries = [];
  for (let batch = 0; batch < MAX_BATCHES_PER_RUN; batch += 1) {
    const result = await processBattleBatch({ db, battle, apiKey, resetKey, toUts });
    summaries.push(result);
    if (!result?.nextCursorId || result?.processedUsers < BATCH_SIZE) break;
  }

  const totals = summaries.reduce(
    (acc, item) => {
      if (!item) return acc;
      acc.processedUsers += Number(item.processedUsers || 0);
      acc.increments.sideA.album += Number(item?.increments?.sideA?.album || 0);
      acc.increments.sideA.title += Number(item?.increments?.sideA?.title || 0);
      acc.increments.sideA.users += Number(item?.increments?.sideA?.users || 0);
      acc.increments.sideB.album += Number(item?.increments?.sideB?.album || 0);
      acc.increments.sideB.title += Number(item?.increments?.sideB?.title || 0);
      acc.increments.sideB.users += Number(item?.increments?.sideB?.users || 0);
      acc.nextCursorId = item.nextCursorId ?? acc.nextCursorId;
      acc.cycle = item.cycle ?? acc.cycle;
      return acc;
    },
    {
      processedUsers: 0,
      nextCursorId: null,
      cycle: 0,
      increments: {
        sideA: { album: 0, title: 0, users: 0 },
        sideB: { album: 0, title: 0, users: 0 },
      },
    }
  );

  return {
    battleId: battle.id,
    processedUsers: totals.processedUsers,
    nextCursorId: totals.nextCursorId,
    cycle: totals.cycle,
    increments: totals.increments,
    batchesRun: summaries.length,
  };
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (!["GET", "POST"].includes(req.method)) {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!isAuthorized(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const apiKey = process.env.LASTFM_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "LASTFM_API_KEY is not configured" });
    }

    const db = await getDb();
    await ensureIndexes(db);

    const now = new Date();
    const nowUts = Math.floor(now.getTime() / 1000);
    const todayStartUts = Math.floor(Date.parse(`${toResetKeyUTC(now)}T00:00:00.000Z`) / 1000);
    const graceWindowEndUts = todayStartUts + (SNAPSHOT_GRACE_MINUTES * 60);
    const withinGraceWindow = nowUts < graceWindowEndUts;
    const previousDayEndUts = todayStartUts - 1;
    const liveBattles = await fetchLiveBattlesForSync(db);
    const activeBattles = liveBattles.slice(0, Math.max(1, MAX_BATTLES_PER_RUN));
    const resetKey = toResetKeyUTC(now);
    const completedResetKey = toPreviousResetKeyUTC(now);

    const results = [];
    if (withinGraceWindow) {
      for (const battle of activeBattles) {
        const previousResult = await processBattleForRun({
          db,
          battle,
          apiKey,
          resetKey: completedResetKey,
          toUts: previousDayEndUts,
        });
        results.push({
          ...previousResult,
          mode: "previous-day-backfill",
        });
      }
    }

    for (const battle of activeBattles) {
      const result = await processBattleForRun({
        db,
        battle,
        apiKey,
        resetKey,
        toUts: null,
      });
      results.push({
        ...result,
        mode: "current-day",
      });
    }

    const snapshot = nowUts >= graceWindowEndUts
      ? await snapshotCompletedReset({
          db,
          liveBattles,
          completedResetKey,
        })
      : {
          resetKey: completedResetKey,
          skipped: true,
          reason: "grace-window-active",
          graceMinutes: SNAPSHOT_GRACE_MINUTES,
          graceWindowEndsAtUtc: new Date(graceWindowEndUts * 1000).toISOString(),
        };

    return res.status(200).json({
      success: true,
      resetKey,
      completedResetKey,
      processedBattles: activeBattles.length,
      results,
      snapshot,
      batchSize: BATCH_SIZE,
      concurrency: CONCURRENCY,
    });
  } catch (error) {
    console.error("Last.fm cron sync error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
