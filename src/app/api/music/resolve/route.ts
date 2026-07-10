import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/music/resolve?url=<youtube_url>
 *
 * Resolves a YouTube / YouTube Music URL (including unlisted videos)
 * into a normalized song object with title, artist, thumbnail, duration, and videoId.
 *
 * Supports:
 *   - https://www.youtube.com/watch?v=VIDEO_ID
 *   - https://youtu.be/VIDEO_ID
 *   - https://music.youtube.com/watch?v=VIDEO_ID
 *   - Plain video IDs (11 characters)
 */

type ResolvedTrack = {
  type: "song";
  videoId: string;
  title: string;
  artist: string;
  album?: string;
  duration?: string;
  thumbnail?: string;
};

// ── Extract video ID from various YouTube URL formats ─────────────────────────

function extractVideoId(input: string): string | null {
  const trimmed = input.trim();

  // Plain 11-char video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    const host = url.hostname.replace("www.", "");

    // youtube.com/watch?v=ID or music.youtube.com/watch?v=ID
    if ((host === "youtube.com" || host === "music.youtube.com") && url.searchParams.get("v")) {
      return url.searchParams.get("v");
    }

    // youtu.be/ID
    if (host === "youtu.be" && url.pathname.length > 1) {
      return url.pathname.slice(1).split("/")[0] || null;
    }

    // youtube.com/embed/ID or youtube.com/v/ID
    const embedMatch = url.pathname.match(/^\/(?:embed|v)\/([a-zA-Z0-9_-]{11})/);
    if (embedMatch) return embedMatch[1];

    // youtube.com/shorts/ID
    const shortsMatch = url.pathname.match(/^\/shorts\/([a-zA-Z0-9_-]{11})/);
    if (shortsMatch) return shortsMatch[1];
  } catch {
    // Not a valid URL, try regex fallback
    const match = trimmed.match(/(?:v=|\/|^)([a-zA-Z0-9_-]{11})(?:[&?\/]|$)/);
    if (match) return match[1];
  }

  return null;
}

// ── Fetch metadata via YouTube Music internal API ─────────────────────────────

const YTM_KEY = "AIzaSyC9XL3ZjWddXya6X74dJoCTL-FUHU13d8";

const CONTEXT = {
  client: {
    clientName: "WEB_REMIX",
    clientVersion: "1.20240101.00.00",
    hl: "en",
    gl: "US",
  },
};

async function resolveViaYTMusicPlayer(videoId: string): Promise<ResolvedTrack | null> {
  try {
    const res = await fetch(
      `https://music.youtube.com/youtubei/v1/player?key=${YTM_KEY}&prettyPrint=false`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "https://music.youtube.com",
          Referer: "https://music.youtube.com/",
        },
        body: JSON.stringify({
          context: CONTEXT,
          videoId,
        }),
        cache: "no-store",
      }
    );

    if (!res.ok) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await res.json();
    const details = data?.videoDetails;
    if (!details?.videoId) return null;

    const durationSecs = parseInt(details.lengthSeconds || "0", 10);
    const mins = Math.floor(durationSecs / 60);
    const secs = durationSecs % 60;
    const duration = `${mins}:${secs.toString().padStart(2, "0")}`;

    // Grab the best thumbnail
    const thumbnails = details.thumbnail?.thumbnails ?? [];
    const sorted = [...thumbnails].sort(
      (a: { width?: number }, b: { width?: number }) => (b.width ?? 0) - (a.width ?? 0)
    );
    const thumbnail = sorted[0]?.url;

    return {
      type: "song",
      videoId: details.videoId,
      title: details.title || "Untitled",
      artist: details.author || "Unknown Artist",
      duration: durationSecs > 0 ? duration : undefined,
      thumbnail,
    };
  } catch {
    return null;
  }
}

// ── Fallback: oEmbed API ─────────────────────────────────────────────────────

async function resolveViaOEmbed(videoId: string): Promise<ResolvedTrack | null> {
  try {
    const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await res.json();

    return {
      type: "song",
      videoId,
      title: data.title || "Untitled",
      artist: data.author_name || "Unknown Artist",
      thumbnail: data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    };
  } catch {
    return null;
  }
}

// ── Route Handler ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const inputUrl = (url.searchParams.get("url") ?? "").trim();

  if (!inputUrl) {
    return NextResponse.json(
      { error: "Missing 'url' query parameter" },
      { status: 400 }
    );
  }

  const videoId = extractVideoId(inputUrl);

  if (!videoId) {
    return NextResponse.json(
      { error: "Could not extract video ID from the provided URL" },
      { status: 400 }
    );
  }

  // Try YouTube Music player API first (gives duration + better metadata)
  let track = await resolveViaYTMusicPlayer(videoId);

  // Fallback to oEmbed if the player API fails
  if (!track) {
    track = await resolveViaOEmbed(videoId);
  }

  if (!track) {
    return NextResponse.json(
      { error: "Could not resolve the YouTube video. It may be private or region-locked." },
      { status: 404 }
    );
  }

  return NextResponse.json(track, {
    headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=600" },
  });
}
