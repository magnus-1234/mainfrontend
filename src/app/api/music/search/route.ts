import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export type SearchSong = {
  type: "song";
  videoId: string;
  title: string;
  artist: string;
  album?: string;
  duration?: string;
  thumbnail?: string;
};

export type SearchAlbum = {
  type: "album";
  browseId: string;
  title: string;
  artist: string;
  year?: string;
  thumbnail?: string;
};

export type SearchArtist = {
  type: "artist";
  browseId: string;
  name: string;
  subscribers?: string;
  thumbnail?: string;
};

export type SearchResult = {
  songs: SearchSong[];
  albums: SearchAlbum[];
  artists: SearchArtist[];
};

// ── YouTube Music internal API ──────────────────────────────────────────────

const YTM_KEY = "AIzaSyC9XL3ZjWddXya6X74dJoCTL-FUHU13d8";
const YTM_URL = `https://music.youtube.com/youtubei/v1/search?key=${YTM_KEY}&prettyPrint=false`;
const CONTEXT = {
  client: {
    clientName: "WEB_REMIX",
    clientVersion: "1.20240101.00.00",
    hl: "en",
    gl: "US",
  },
};

const PARAMS: Record<string, string> = {
  songs:    "EgWKAQIIAWoKEAkQBRAKEAMQBA%3D%3D",
  albums:   "EgWKAQIYAWoKEAkQChAFEAMQBA%3D%3D",
  artists:  "EgWKAQIgAWoKEAkQChAFEAMQBA%3D%3D",
};

async function searchCategory(query: string, cat: keyof typeof PARAMS): Promise<unknown[]> {
  const res = await fetch(YTM_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "https://music.youtube.com",
      Referer: "https://music.youtube.com/",
    },
    body: JSON.stringify({ context: CONTEXT, query, params: PARAMS[cat] }),
    cache: "no-store",
  });
  if (!res.ok) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await res.json();

  // Navigate to the music shelf contents
  const tabs = data?.contents?.tabbedSearchResultsRenderer?.tabs;
  if (!Array.isArray(tabs)) return [];
  const sections = tabs[0]?.tabRenderer?.content?.sectionListRenderer?.contents;
  if (!Array.isArray(sections)) return [];
  for (const section of sections) {
    const contents = section?.musicShelfRenderer?.contents;
    if (Array.isArray(contents)) return contents;
  }
  return [];
}

function safeText(obj: unknown): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const runs = (obj as any)?.runs;
  if (Array.isArray(runs) && runs.length > 0) return String(runs[0].text ?? "");
  return "";
}

function safeThumbnail(obj: unknown): string | undefined {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const arr = (obj as any)?.thumbnails;
  if (!Array.isArray(arr) || arr.length === 0) return undefined;
  const sorted = [...arr].sort((a, b) => (b.width ?? 0) - (a.width ?? 0));
  return sorted[0]?.url ?? undefined;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseSongs(items: any[]): SearchSong[] {
  const out: SearchSong[] = [];
  for (const item of items) {
    try {
      const r = item?.musicResponsiveListItemRenderer;
      if (!r) continue;

      const videoId: string =
        r?.overlay?.musicItemThumbnailOverlayRenderer?.content?.musicPlayButtonRenderer
          ?.playNavigationEndpoint?.watchEndpoint?.videoId ??
        r?.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text
          ?.runs?.[0]?.navigationEndpoint?.watchEndpoint?.videoId;

      if (!videoId) continue;

      const title = safeText(r?.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text);
      // subtitle runs: artist · album
      const subtitleRuns: { text: string }[] = r?.flexColumns?.[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs ?? [];
      const subtitleText = subtitleRuns.map((x) => x.text).join("");
      const artist = subtitleText.split("•")[0]?.trim() ?? "";
      const album = subtitleText.split("•")[1]?.trim();

      const duration: string | undefined =
        r?.fixedColumns?.[0]?.musicResponsiveListItemFixedColumnRenderer?.text?.runs?.[0]?.text;

      const thumbnail = safeThumbnail(r?.thumbnail?.musicThumbnailRenderer?.thumbnail);

      out.push({ type: "song", videoId, title, artist, album, duration, thumbnail });
    } catch {}
  }
  return out.slice(0, 15);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseAlbums(items: any[]): SearchAlbum[] {
  const out: SearchAlbum[] = [];
  for (const item of items) {
    try {
      const r = item?.musicResponsiveListItemRenderer;
      if (!r) continue;
      const browseId: string = r?.navigationEndpoint?.browseEndpoint?.browseId;
      if (!browseId) continue;
      const title = safeText(r?.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text);
      const meta = safeText(r?.flexColumns?.[1]?.musicResponsiveListItemFlexColumnRenderer?.text);
      const thumbnail = safeThumbnail(r?.thumbnail?.musicThumbnailRenderer?.thumbnail);
      const parts = meta.split("•");
      const artist = parts.find((p) => p.trim() && !/^\d{4}$/.test(p.trim()))?.trim() ?? "";
      const year = parts.find((p) => /^\d{4}$/.test(p.trim()))?.trim();
      out.push({ type: "album", browseId, title, artist, year, thumbnail });
    } catch {}
  }
  return out.slice(0, 6);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseArtists(items: any[]): SearchArtist[] {
  const out: SearchArtist[] = [];
  for (const item of items) {
    try {
      const r = item?.musicResponsiveListItemRenderer;
      if (!r) continue;
      const browseId: string = r?.navigationEndpoint?.browseEndpoint?.browseId;
      if (!browseId) continue;
      const name = safeText(r?.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text);
      const subscribers = safeText(r?.flexColumns?.[1]?.musicResponsiveListItemFlexColumnRenderer?.text);
      const thumbnail = safeThumbnail(r?.thumbnail?.musicThumbnailRenderer?.thumbnail);
      out.push({ type: "artist", browseId, name, subscribers, thumbnail });
    } catch {}
  }
  return out.slice(0, 5);
}

// ── Route ──────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const query = (url.searchParams.get("q") ?? "").trim();

  if (query.length < 2) {
    return NextResponse.json<SearchResult>({ songs: [], albums: [], artists: [] });
  }

  try {
    const [rawSongs, rawAlbums, rawArtists] = await Promise.allSettled([
      searchCategory(query, "songs"),
      searchCategory(query, "albums"),
      searchCategory(query, "artists"),
    ]);

    const result: SearchResult = {
      songs:   parseSongs(rawSongs.status   === "fulfilled" ? rawSongs.value   : []),
      albums:  parseAlbums(rawAlbums.status === "fulfilled" ? rawAlbums.value  : []),
      artists: parseArtists(rawArtists.status === "fulfilled" ? rawArtists.value : []),
    };

    return NextResponse.json(result, {
      headers: { "Cache-Control": "s-maxage=30, stale-while-revalidate=60" },
    });
  } catch (error) {
    return NextResponse.json<SearchResult>(
      { songs: [], albums: [], artists: [] },
      { status: 503 }
    );
  }
}
