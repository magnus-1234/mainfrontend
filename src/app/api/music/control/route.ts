import { NextRequest, NextResponse } from "next/server";
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

// ── Auth helpers ──────────────────────────────────────────────────────────────

const AUTH_COOKIE = process.env.AUTH_COOKIE_NAME || "wos_session";
const BACKEND_URL = envValue("BACKEND_URL", "PUBLIC_API_URL") || "http://140.245.201.209:3001";
const BOT_API_URL = envValue("MUSIC_BOT_API_URL");
const BOT_API_SECRET = envValue("MUSIC_API_SECRET");

const VALID_ACTIONS = new Set(["pause", "resume", "skip", "previous", "stop", "disconnect", "volume", "loop", "shuffle", "play_playlist", "channels", "play", "play_now", "now_playing", "remove_queue"]);

// Get current user from the existing backend session
const getCurrentUser = async (cookie: string) => {
  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/session`, {
      headers: { Cookie: cookie, Accept: "application/json" },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.user || data;
  } catch {
    return null;
  }
};

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // Require authentication
  const cookieHeader = request.headers.get("cookie") || "";
  const sessionCookie = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${AUTH_COOKIE}=`));

  if (!sessionCookie) {
    return NextResponse.json({ error: "Sign in with Discord to control the music bot" }, { status: 401 });
  }

  // Verify the user session
  const user = await getCurrentUser(cookieHeader);
  if (!user?.id) {
    return NextResponse.json({ error: "Sign in with Discord to control the music bot" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const action = String(body.action || "");
  const guildId = String(body.guildId || "");
  const value = body.value;

  if (!VALID_ACTIONS.has(action)) {
    return NextResponse.json(
      { error: `Invalid action. Allowed: ${Array.from(VALID_ACTIONS).join(", ")}` },
      { status: 400 }
    );
  }

  if (!guildId) {
    return NextResponse.json({ error: "guildId is required" }, { status: 400 });
  }

  if (!BOT_API_URL) {
    return NextResponse.json(
      { error: "Music bot control API is not configured. Set MUSIC_BOT_API_URL." },
      { status: 503 }
    );
  }

  // Forward to the bot's control server
  try {
    const botUrl = `${BOT_API_URL.replace(/\/$/, "")}/control`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (BOT_API_SECRET) headers["Authorization"] = `Bearer ${BOT_API_SECRET}`;

    // The backend bot doesn't support play_now natively, so we just fallback to play.
    // We used to simulate it by sending a "stop", but that causes a race condition 
    const botRes = await fetch(botUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        action: action,
        guildId,
        value,
        voiceChannelId: body.voiceChannelId,
        textChannelId: body.textChannelId,
        userId: body.userId || user.discordUserId || user.id,
      }),
      signal: AbortSignal.timeout(action === "play_playlist" ? 20000 : 5000),
    });

    const data = await botRes.json().catch(() => ({ ok: false }));

    if (!botRes.ok) {
      return NextResponse.json(
        { error: data.error || "Bot control command failed" },
        { status: botRes.status }
      );
    }

    return NextResponse.json({ ok: true, ...data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Music bot is unreachable";
    // If bot is offline, return a helpful message
    return NextResponse.json(
      { error: `Music bot is offline or unreachable: ${msg}` },
      { status: 503 }
    );
  }
}

// CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
