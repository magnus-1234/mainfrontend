import { Long, MongoClient, ObjectId, type Document } from "mongodb";
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
  iconUrl?: unknown;
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

const mongoUri = envValue("MONGODB_URI", "MONGO_URI", "MONGO_URI_FALLBACK") || "mongodb+srv://iammagnusx1_db_user:zYFHUOjjXhfGLpMs@reminder.hlx5aem.mongodb.net/?appName=REMINDER";
const mongoDbName = envValue("MONGODB_DB", "MONGO_DB", "MONGO_DB_NAME", "MONGO_DB_WOS") || "reminderbot";
// The Discord bot writes to 'playlists'; the web UI writes to 'music_playlists'.
// We query both and merge, so users see all their playlists in one place.
const WEB_COLLECTION = envValue("MUSIC_PLAYLIST_COLLECTION") || "music_playlists";

declare global {
  var musicPlaylistMongoClient: MongoClient | undefined;
}

const getDb = async () => {
  if (!mongoUri) {
    throw new Error("Music playlist storage is not configured");
  }
  if (!globalThis.musicPlaylistMongoClient) {
    globalThis.musicPlaylistMongoClient = new MongoClient(mongoUri);
  }
  await globalThis.musicPlaylistMongoClient.connect();
  return globalThis.musicPlaylistMongoClient.db(mongoDbName);
};

// Used for mutations (POST/PUT/DELETE) — always operates on the web collection.
const collection = async () => {
  const db = await getDb();
  return db.collection<MusicPlaylistDoc>(WEB_COLLECTION);
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
    id: playlist._id?.toString() || "",
    guildId: stringValue(playlist.guild_id),
    userId: stringValue(playlist.user_id),
    name: stringValue(playlist.name) || "Untitled playlist",
    iconUrl: stringValue(playlist.iconUrl),
    trackCount: tracks.length,
    tracks: tracks.map(publicTrack),
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

    // Query the web-written collection
    const db = await getDb();
    const docs = await db.collection<MusicPlaylistDoc>(WEB_COLLECTION)
      .find(query)
      .sort({ updated_at: -1 })
      .limit(100)
      .toArray();

    const guilds = Array.from(new Set(docs.map((doc) => stringValue(doc.guild_id)).filter(Boolean)));

    return NextResponse.json({
      playlists: docs.map(publicPlaylist),
      guilds,
      storage: {
        database: mongoDbName,
        collections: [WEB_COLLECTION],
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load music playlists", playlists: [] },
      { status: 503 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = request.headers.get("x-user-id") || url.searchParams.get("userId") || "";

    if (!userId.trim()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, guildId, iconUrl, tracks } = body;

    if (!name || !guildId) {
      return NextResponse.json({ error: "Playlist name and guildId required" }, { status: 400 });
    }

    const col = await collection();
    
    // Check if playlist already exists for this user in this guild
    const existing = await col.findOne({
      name: name.trim(),
      guild_id: { $in: idCandidates(guildId) },
      user_id: { $in: idCandidates(userId) }
    });
    
    if (existing) {
      return NextResponse.json({ error: "Playlist with this name already exists" }, { status: 400 });
    }

    const newPlaylist: MusicPlaylistDoc = {
      user_id: String(userId),
      guild_id: String(guildId),
      name: name.trim(),
      iconUrl: iconUrl || "",
      tracks: tracks || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const result = await col.insertOne(newPlaylist);

    return NextResponse.json({ success: true, id: result.insertedId.toString() });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create playlist" },
      { status: 503 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = request.headers.get("x-user-id") || url.searchParams.get("userId") || "";

    if (!userId.trim()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, iconUrl, tracks } = body;

    if (!id) {
      return NextResponse.json({ error: "Playlist ID required" }, { status: 400 });
    }

    const db = await getDb();
    const query: Document = { _id: new ObjectId(id), user_id: { $in: idCandidates(userId) } };

    const setFields: Document = { updated_at: new Date().toISOString() };
    if (name !== undefined) setFields.name = name;
    if (iconUrl !== undefined) setFields.iconUrl = iconUrl;
    if (tracks !== undefined) setFields.tracks = tracks;

    const result = await db.collection(WEB_COLLECTION).updateOne(query, { $set: setFields });

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Playlist not found or access denied" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update playlist" },
      { status: 503 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = request.headers.get("x-user-id") || url.searchParams.get("userId") || "";
    const id = url.searchParams.get("id");

    if (!userId.trim()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!id) {
      return NextResponse.json({ error: "Playlist ID required" }, { status: 400 });
    }

    const db = await getDb();
    const query: Document = { _id: new ObjectId(id), user_id: { $in: idCandidates(userId) } };

    const result = await db.collection(WEB_COLLECTION).deleteOne(query);

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Playlist not found or access denied" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to delete playlist" },
      { status: 503 },
    );
  }
}
