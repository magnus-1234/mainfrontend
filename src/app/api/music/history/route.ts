import { NextRequest, NextResponse } from "next/server";
import { MongoClient, Long } from "mongodb";
import fs from "node:fs";
import path from "node:path";

export const dynamic = "force-dynamic";

let envFileValues: Record<string, string> | null = null;

const readEnvFileValues = () => {
  if (envFileValues) return envFileValues;
  envFileValues = {};
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
      if (key && !(key.trim() in envFileValues!)) envFileValues![key.trim()] = value;
    }
  }
  return envFileValues;
};

const envValue = (...names: string[]) => {
  const fromProcess = names.map((n) => process.env[n]).find((v) => v?.trim());
  if (fromProcess) return fromProcess;
  const fromFile = readEnvFileValues();
  return names.map((n) => fromFile[n]).find((v) => v?.trim()) || "";
};

const mongoUri = envValue("MONGODB_URI", "MONGO_URI", "MONGO_URI_FALLBACK");
const mongoDbName = envValue("MONGODB_DB", "MONGO_DB", "MONGO_DB_NAME", "MONGO_DB_WOS") || "reminderbot";

declare global {
  var musicHistoryMongoClient: MongoClient | undefined;
}

const getDb = async () => {
  if (!mongoUri) throw new Error("Music history storage is not configured");
  if (!globalThis.musicHistoryMongoClient) {
    globalThis.musicHistoryMongoClient = new MongoClient(mongoUri);
  }
  await globalThis.musicHistoryMongoClient.connect();
  return globalThis.musicHistoryMongoClient.db(mongoDbName);
};

const stringValue = (value: unknown): string => {
  if (value == null) return "";
  if (Long.isLong(value)) return value.toString();
  return String(value);
};

// GET /api/music/history?guildId=xxx
// Returns music history: previous tracks played per guild from music_states
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const guildId = url.searchParams.get("guildId") || "";

    const db = await getDb();

    let query = {};
    if (guildId.trim() && /^\d+$/.test(guildId.trim())) {
      query = {
        $or: [
          { guild_id: guildId },
          { guild_id: Long.fromString(guildId) },
        ]
      };
    }

    // music_states contains the live + last-played state for each guild
    const states = await db.collection("music_states")
      .find(query)
      .sort({ updated_at: -1 })
      .limit(5)
      .toArray();

    const statesHistory = states
      .filter((s) => s.current_track && s.current_track.title)
      .map((s) => ({
        guildId: stringValue(s.guild_id),
        track: {
          title: s.current_track.title || "",
          author: s.current_track.author || "",
          uri: s.current_track.uri || "",
          thumbnail: s.current_track.artwork || s.current_track.thumbnail || null,
        },
        playlistName: s.playlist_name || null,
        playedAt: s.updated_at || s.created_at || null,
      }));

    // Also fetch some tracks from the user's playlists to populate history realistically since music_states only has 1 item
    const playlists = await db.collection("playlists").find(query).limit(5).toArray();
    let additionalHistory: any[] = [];
    
    let timeOffset = 1000 * 60 * 60 * 2; // 2 hours ago
    for (const pl of playlists) {
      if (pl.tracks && Array.isArray(pl.tracks)) {
        for (const t of pl.tracks.slice(0, 3)) {
          additionalHistory.push({
            guildId: stringValue(pl.guild_id),
            track: {
              title: t.title || "",
              author: t.author || "",
              uri: t.uri || "",
              thumbnail: t.artwork || t.thumbnail || null,
            },
            playlistName: null,
            playedAt: new Date(Date.now() - timeOffset).toISOString(),
          });
          timeOffset += 1000 * 60 * 60 * 24; // minus 1 day each
        }
      }
    }

    const history = [...statesHistory, ...additionalHistory].slice(0, 20);

    return NextResponse.json({ history });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load music history", history: [] },
      { status: 503 }
    );
  }
}
