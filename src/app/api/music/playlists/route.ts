import { Long, MongoClient, type Document } from "mongodb";
import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

export const dynamic = "force-dynamic";

type MusicTrackDoc = {
  title?: unknown;
  author?: unknown;
  uri?: unknown;
  length?: unknown;
};

type MusicPlaylistDoc = {
  guild_id?: unknown;
  user_id?: unknown;
  name?: unknown;
  tracks?: MusicTrackDoc[];
  created_at?: unknown;
  updated_at?: unknown;
};

let envFileValues: Record<string, string> | null = null;

const readEnvFileValues = () => {
  if (envFileValues) {
    return envFileValues;
  }

  envFileValues = {};
  const candidates = [
    process.cwd(),
    path.resolve(process.cwd(), ".."),
    path.resolve(process.cwd(), "..", ".."),
  ].flatMap((dir) => [path.join(dir, ".env.local"), path.join(dir, ".env.production"), path.join(dir, ".env")]);

  for (const filePath of candidates) {
    if (!fs.existsSync(filePath)) {
      continue;
    }
    const content = fs.readFileSync(filePath, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
        continue;
      }
      const [key, ...rest] = trimmed.split("=");
      const value = rest.join("=").trim().replace(/^['"]|['"]$/g, "");
      if (key && !(key in envFileValues)) {
        envFileValues[key.trim()] = value;
      }
    }
  }

  return envFileValues;
};

const envValue = (...names: string[]) => {
  const fromProcess = names.map((name) => process.env[name]).find((value) => value && value.trim());
  if (fromProcess) {
    return fromProcess;
  }
  const fromFile = readEnvFileValues();
  return names.map((name) => fromFile[name]).find((value) => value && value.trim()) || "";
};

const mongoUri = envValue("MONGODB_URI", "MONGO_URI", "MONGO_URI_FALLBACK");
const mongoDbName = envValue("MONGODB_DB", "MONGO_DB", "MONGO_DB_NAME", "MONGO_DB_WOS") || "discord_bot";
const playlistCollectionName = envValue("MUSIC_PLAYLIST_COLLECTION") || "music_playlists";

declare global {
  var musicPlaylistMongoClient: MongoClient | undefined;
}

const collection = async () => {
  if (!mongoUri) {
    throw new Error("Music playlist storage is not configured");
  }
  if (!globalThis.musicPlaylistMongoClient) {
    globalThis.musicPlaylistMongoClient = new MongoClient(mongoUri);
  }
  await globalThis.musicPlaylistMongoClient.connect();
  return globalThis.musicPlaylistMongoClient.db(mongoDbName).collection<MusicPlaylistDoc>(playlistCollectionName);
};

const stringValue = (value: unknown) => {
  if (value == null) {
    return "";
  }
  if (Long.isLong(value)) {
    return value.toString();
  }
  return String(value);
};

const idCandidates = (value: string) => {
  const trimmed = value.trim();
  const values: unknown[] = [trimmed];
  if (/^\d+$/.test(trimmed)) {
    values.push(Long.fromString(trimmed));
  }
  return values;
};

const publicTrack = (track: MusicTrackDoc) => ({
  title: stringValue(track.title) || "Untitled track",
  author: stringValue(track.author),
  uri: stringValue(track.uri),
  length: typeof track.length === "number" ? track.length : Number(track.length || 0),
});

const publicPlaylist = (playlist: MusicPlaylistDoc & Document) => {
  const tracks = Array.isArray(playlist.tracks) ? playlist.tracks : [];
  return {
    guildId: stringValue(playlist.guild_id),
    userId: stringValue(playlist.user_id),
    name: stringValue(playlist.name) || "Untitled playlist",
    trackCount: tracks.length,
    tracks: tracks.slice(0, 50).map(publicTrack),
    createdAt: stringValue(playlist.created_at),
    updatedAt: stringValue(playlist.updated_at),
  };
};

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = request.headers.get("x-user-id") || url.searchParams.get("userId") || "";
    const guildId = url.searchParams.get("guildId") || "";

    if (!userId.trim()) {
      return NextResponse.json({ error: "Sign in with Discord to load music playlists", playlists: [] }, { status: 401 });
    }

    const query: Document = { user_id: { $in: idCandidates(userId) } };
    if (guildId.trim()) {
      query.guild_id = { $in: idCandidates(guildId) };
    }

    const col = await collection();
    const docs = await col.find(query).sort({ updated_at: -1 }).limit(100).toArray();
    const guilds = Array.from(new Set(docs.map((doc) => stringValue(doc.guild_id)).filter(Boolean)));

    return NextResponse.json({
      playlists: docs.map(publicPlaylist),
      guilds,
      storage: {
        database: mongoDbName,
        collection: playlistCollectionName,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load music playlists", playlists: [] },
      { status: 503 },
    );
  }
}
