import { NextRequest, NextResponse } from "next/server";
import { MongoClient, Long, type Document } from "mongodb";
import fs from "node:fs";
import path from "node:path";

export const dynamic = "force-dynamic";

// ── Env helpers ──────────────────────────────────────────────────────────────

let envCache: Record<string, string> | null = null;

const readEnv = () => {
  if (envCache) return envCache;
  envCache = {};
  const candidates = [
    process.cwd(),
    path.resolve(process.cwd(), ".."),
    path.resolve(process.cwd(), "..", ".."),
  ].flatMap((dir) => [
    path.join(dir, ".env.local"),
    path.join(dir, ".env.production"),
    path.join(dir, ".env"),
  ]);

  for (const filePath of candidates) {
    if (!fs.existsSync(filePath)) continue;
    const content = fs.readFileSync(filePath, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
      const [key, ...rest] = trimmed.split("=");
      const value = rest.join("=").trim().replace(/^['"]|['"]$/g, "");
      if (key && !(key.trim() in envCache!)) envCache![key.trim()] = value;
    }
  }
  return envCache;
};

const envValue = (...names: string[]) => {
  const fromProcess = names.map((n) => process.env[n]).find((v) => v?.trim());
  if (fromProcess) return fromProcess;
  const fromFile = readEnv();
  return names.map((n) => fromFile[n]).find((v) => v?.trim()) || "";
};

// ── MongoDB ───────────────────────────────────────────────────────────────────

const mongoUri = envValue("MONGODB_URI", "MONGO_URI", "MONGO_URI_FALLBACK");
const mongoDbName = envValue("MONGODB_DB", "MONGO_DB", "MONGO_DB_NAME", "MONGO_DB_WOS") || "discord_bot";

declare global {
  var musicNowPlayingMongoClient: MongoClient | undefined;
}

const getDb = async () => {
  if (!mongoUri) throw new Error("MongoDB is not configured");
  if (!globalThis.musicNowPlayingMongoClient) {
    globalThis.musicNowPlayingMongoClient = new MongoClient(mongoUri);
  }
  await globalThis.musicNowPlayingMongoClient.connect();
  return globalThis.musicNowPlayingMongoClient.db(mongoDbName);
};

const stringVal = (v: unknown) => {
  if (v == null) return "";
  if (Long.isLong(v)) return v.toString();
  return String(v);
};

const idCandidates = (value: string) => {
  const trimmed = value.trim();
  const values: unknown[] = [trimmed];
  if (/^\d+$/.test(trimmed)) values.push(Long.fromString(trimmed));
  return values;
};

// ── Bot HTTP fallback ─────────────────────────────────────────────────────────

const BOT_API_URL = envValue("MUSIC_BOT_API_URL") || "http://140.245.201.209:8090";
const BOT_API_SECRET = envValue("MUSIC_API_SECRET") || "wos-music-secret-2026";

const fetchBotStatus = async (guildId: string) => {
  if (!BOT_API_URL) return null;
  try {
    const url = `${BOT_API_URL.replace(/\/$/, "")}/status${guildId ? `?guildId=${encodeURIComponent(guildId)}` : ""}`;
    const headers: Record<string, string> = { Accept: "application/json" };
    if (BOT_API_SECRET) headers["Authorization"] = `Bearer ${BOT_API_SECRET}`;
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(3000) });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
};

// ── Handler ───────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const guildId = url.searchParams.get("guildId") || "";

    // Try live bot status first (most up-to-date)
    if (BOT_API_URL && guildId) {
      const live = await fetchBotStatus(guildId);
      if (live && live.currentTrack) {
        return NextResponse.json({ source: "live", ...live });
      }
    }

    // Fall back to MongoDB persisted state
    const db = await getDb();
    const statesCol = db.collection("music_states");

    const query: Document = {};
    if (guildId.trim()) {
      query.guild_id = { $in: idCandidates(guildId) };
    }

    const states = await statesCol
      .find(query)
      .sort({ updated_at: -1 })
      .limit(guildId ? 1 : 10)
      .toArray();

    const mapped = states.map((s) => ({
      guildId: stringVal(s.guild_id),
      playing: false, // from DB means paused/stopped
      paused: true,
      volume: typeof s.volume === "number" ? s.volume : 100,
      loopMode: stringVal(s.loop_mode) || "off",
      playlistName: stringVal(s.playlist_name) || null,
      currentTrack: s.current_track
        ? {
            title: stringVal(s.current_track.title),
            author: stringVal(s.current_track.author),
            uri: stringVal(s.current_track.uri),
            length: typeof s.current_track.length === "number" ? s.current_track.length : 0,
            position: typeof s.current_track.position === "number" ? s.current_track.position : 0,
            artwork: s.current_track.artwork || null,
          }
        : null,
      queue: Array.isArray(s.queue)
        ? s.queue.slice(0, 20).map((t: Record<string, unknown>) => ({
            title: stringVal(t.title),
            author: stringVal(t.author),
            uri: stringVal(t.uri),
            length: typeof t.length === "number" ? t.length : 0,
          }))
        : [],
      updatedAt: stringVal(s.updated_at),
      source: "db",
    }));

    if (guildId) {
      return NextResponse.json(mapped[0] || { guildId, playing: false, currentTrack: null, queue: [] });
    }

    return NextResponse.json({ states: mapped });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch now playing", playing: false, currentTrack: null },
      { status: 503 }
    );
  }
}
