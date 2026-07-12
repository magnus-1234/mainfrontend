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

import YTMusic from "ytmusic-api";

// ── Extract video ID from various YouTube URL formats ─────────────────────────

function extractPlaylistId(input: string): string | null {
  const trimmed = input.trim();
  try {
    const url = new URL(trimmed);
    if (url.searchParams.has("list")) {
      return url.searchParams.get("list");
    }
  } catch {
    const match = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    if (match) return match[1];
  }
  return null;
}

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

// ── Fallback: YouTube Web Scraper ──────────────────────────────────────────────

async function resolveViaScraping(videoId: string): Promise<ResolvedTrack | null> {
  try {
    const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9"
      },
      cache: "no-store"
    });
    
    if (!res.ok) return null;
    const html = await res.text();
    
    const titleMatch = html.match(/<meta\s+name="title"\s+content="([^"]+)"/i) || html.match(/<title>([^<]+)<\/title>/i);
    let title = titleMatch ? titleMatch[1] : "Unknown Title";
    title = title.replace(" - YouTube", "");

    const authorMatch = html.match(/<link\s+itemprop="name"\s+content="([^"]+)"/i);
    const artist = authorMatch ? authorMatch[1] : "Unknown Artist";
    
    const durationMatch = html.match(/"lengthSeconds":"(\d+)"/);
    let duration: string | undefined = undefined;
    if (durationMatch) {
      const durationSecs = parseInt(durationMatch[1], 10);
      const mins = Math.floor(durationSecs / 60);
      const secs = durationSecs % 60;
      duration = `${mins}:${secs.toString().padStart(2, "0")}`;
    }

    return {
      type: "song",
      videoId,
      title,
      artist,
      duration,
      thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
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
  
  // 1. Check if it's a playlist URL
  const playlistId = extractPlaylistId(inputUrl);
  if (playlistId) {
    try {
      const ytmusic = new YTMusic();
      await ytmusic.initialize();
      const videos = await ytmusic.getPlaylistVideos(playlistId);
      
      if (videos && videos.length > 0) {
        const tracks = videos.map(vid => {
          const durationSecs = vid.duration || 0;
          const mins = Math.floor(durationSecs / 60);
          const secs = durationSecs % 60;
          const durationStr = `${mins}:${secs.toString().padStart(2, "0")}`;
          
          return {
            type: "song",
            videoId: vid.videoId,
            title: vid.name || "Unknown Track",
            artist: vid.artist?.name || "Unknown Artist",
            duration: durationStr,
            thumbnail: vid.thumbnails?.[0]?.url || `https://img.youtube.com/vi/${vid.videoId}/hqdefault.jpg`
          };
        });
        
        return NextResponse.json(tracks, {
          headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=600" },
        });
      }
    } catch {
      // Fallback if ytmusic-api fails
      console.error("Failed to fetch playlist tracks");
    }
    
    return NextResponse.json(
      { error: "Could not fetch videos from this playlist. It might be empty or private." },
      { status: 404 }
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
  
  // Fallback to scraping for unlisted/restricted videos
  if (!track) {
    track = await resolveViaScraping(videoId);
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
