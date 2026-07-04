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
  const artistId = url.searchParams.get("id") ?? "";

  if (!artistId) {
    return NextResponse.json({ error: "Artist ID required" }, { status: 400 });
  }

  try {
    const client = await getClient();

    const [artistData, songsData, albumsData] = await Promise.allSettled([
      client.getArtist(artistId),
      client.getArtistSongs(artistId),
      client.getArtistAlbums(artistId),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const artist: any = artistData.status === "fulfilled" ? artistData.value : null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawSongs: any[] = songsData.status === "fulfilled" ? songsData.value : [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawAlbums: any[] = albumsData.status === "fulfilled" ? albumsData.value : [];

    const songs = rawSongs.slice(0, 15).map((s) => ({
      videoId: s.videoId,
      title: s.name ?? s.title,
      artist: s.artist?.name ?? s.artists?.[0]?.name ?? "",
      album: s.album?.name ?? "",
      albumId: s.album?.albumId ?? "",
      thumbnail: bestThumb(s.thumbnails ?? []),
      duration: s.duration,
    }));

    const albums = rawAlbums.slice(0, 12).map((a) => ({
      id: a.albumId,
      playlistId: a.playlistId,
      name: a.name,
      artist: a.artist?.name ?? "",
      year: a.year,
      thumbnail: bestThumb(a.thumbnails ?? []),
      type: a.type ?? "ALBUM",
    }));

    return NextResponse.json(
      {
        id: artistId,
        name: artist?.name ?? "",
        description: artist?.description ?? "",
        subscribers: artist?.subscribers ?? "",
        thumbnail: bestThumb(artist?.thumbnails ?? []),
        songs,
        albums,
      },
      { headers: { "Cache-Control": "s-maxage=600, stale-while-revalidate=1200" } }
    );
  } catch (err) {
    console.error("artist API error:", err);
    return NextResponse.json({ error: "Failed to fetch artist data" }, { status: 503 });
  }
}
