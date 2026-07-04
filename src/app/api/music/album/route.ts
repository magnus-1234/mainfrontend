import { NextRequest, NextResponse } from "next/server";
import YTMusic from "ytmusic-api";

export const dynamic = "force-dynamic";

let ytmusic: InstanceType<typeof YTMusic> | null = null;
let initPromise: Promise<any> | null = null;

async function getClient() {
  if (!ytmusic) {
    ytmusic = new YTMusic();
    initPromise = ytmusic.initialize();
  }
  await initPromise;
  return ytmusic!;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function bestThumb(thumbnails: any[]): string {
  if (!Array.isArray(thumbnails) || thumbnails.length === 0) return "";
  const sorted = [...thumbnails].sort((a, b) => (b.width ?? 0) - (a.width ?? 0));
  return sorted[0]?.url ?? "";
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const albumId = url.searchParams.get("id") ?? "";

  if (!albumId) {
    return NextResponse.json({ error: "Album ID required" }, { status: 400 });
  }

  try {
    const client = await getClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const album: any = await client.getAlbum(albumId);

    const tracks = (album?.songs ?? album?.tracks ?? []).map((t: any, i: number) => ({
      videoId: t.videoId,
      title: t.name ?? t.title,
      artist: t.artist?.name ?? t.artists?.[0]?.name ?? album?.artist?.name ?? "",
      albumId,
      album: album?.name ?? "",
      thumbnail: bestThumb(t.thumbnails ?? album?.thumbnails ?? []),
      duration: t.duration,
      trackNumber: i + 1,
    }));

    return NextResponse.json(
      {
        id: albumId,
        name: album?.name ?? "",
        artist: album?.artist?.name ?? album?.artists?.[0]?.name ?? "",
        artistId: album?.artist?.artistId ?? album?.artists?.[0]?.artistId ?? "",
        year: album?.year,
        description: album?.description ?? "",
        thumbnail: bestThumb(album?.thumbnails ?? []),
        trackCount: tracks.length,
        tracks,
      },
      { headers: { "Cache-Control": "s-maxage=600, stale-while-revalidate=1200" } }
    );
  } catch (err) {
    console.error("album API error:", err);
    return NextResponse.json({ error: "Failed to fetch album data" }, { status: 503 });
  }
}
