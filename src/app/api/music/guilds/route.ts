import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

export const dynamic = "force-dynamic";

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
  const fromProcess = names.map((name) => process.env[name]).find((value) => value?.trim());
  if (fromProcess) return fromProcess;
  const fromFile = readEnv();
  return names.map((name) => fromFile[name]).find((value) => value?.trim()) || "";
};

const BOT_API_URL = envValue("MUSIC_BOT_API_URL");
const BOT_API_SECRET = envValue("MUSIC_API_SECRET");

export async function GET() {
  if (!BOT_API_URL) {
    return NextResponse.json({ error: "Music bot API is not configured", guilds: [] }, { status: 503 });
  }

  try {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (BOT_API_SECRET) headers.Authorization = `Bearer ${BOT_API_SECRET}`;

    const res = await fetch(`${BOT_API_URL.replace(/\/$/, "")}/guilds`, {
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json().catch(() => ({ guilds: [] }));
    if (!res.ok) {
      return NextResponse.json(
        { error: data.error || "Unable to load music bot servers", guilds: [] },
        { status: res.status },
      );
    }
    return NextResponse.json({ 
      guilds: data.guilds || [], 
      debug_api_url: BOT_API_URL, 
      debug_client_id: process.env.MUSIC_DISCORD_CLIENT_ID 
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Music bot is unreachable", guilds: [], debug_api_url: BOT_API_URL },
      { status: 503 },
    );
  }
}
