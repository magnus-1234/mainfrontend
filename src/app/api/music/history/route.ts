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

    // Fetch actual playback history
    const historyDocs = await db.collection("music_history")
      .find(query)
      .sort({ played_at: -1 })
      .limit(50)
      .toArray();

    const history = historyDocs.map((h) => ({
      guildId: stringValue(h.guild_id),
      track: {
        title: h.track?.title || "",
        author: h.track?.author || "",
        uri: h.track?.uri || "",
        thumbnail: h.track?.artwork || null,
      },
      playedAt: h.played_at || null,
    }));

    return NextResponse.json({ history });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load music history", history: [] },
      { status: 503 }
    );
  }
}
