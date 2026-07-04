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

export async function GET(_request: NextRequest) {
  try {
    const client = await getClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sections: any[] = await client.getHomeSections();

    const newReleases: object[] = [];
    const trending: object[] = [];
    const featured: object[] = [];

    for (const section of sections) {
      const title: string = (section.title ?? "").toLowerCase();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const contents: any[] = section.contents ?? [];

      if (title.includes("new release") || title.includes("release")) {
        for (const item of contents.slice(0, 10)) {
          if (item.type === "ALBUM" || item.albumId) {
            newReleases.push({
              id: item.albumId,
              playlistId: item.playlistId,
              name: item.name,
              artist: item.artist?.name ?? "",
              artistId: item.artist?.artistId ?? "",
              thumbnail: bestThumb(item.thumbnails ?? []),
              year: item.year,
            });
          }
        }
      } else if (title.includes("trending") || title.includes("chart") || title.includes("top")) {
        for (const item of contents.slice(0, 12)) {
          if (item.videoId || item.type === "SONG") {
            trending.push({
              videoId: item.videoId,
              title: item.name ?? item.title,
              artist: item.artist?.name ?? item.artists?.[0]?.name ?? "",
              artistId: item.artist?.artistId ?? item.artists?.[0]?.artistId ?? "",
              album: item.album?.name ?? "",
              albumId: item.album?.albumId ?? "",
              thumbnail: bestThumb(item.thumbnails ?? []),
              duration: item.duration,
            });
          } else if (item.type === "ALBUM" || item.albumId) {
            featured.push({
              id: item.albumId,
              playlistId: item.playlistId,
              name: item.name,
              artist: item.artist?.name ?? "",
              artistId: item.artist?.artistId ?? "",
              thumbnail: bestThumb(item.thumbnails ?? []),
            });
          }
        }
      } else {
        for (const item of contents.slice(0, 8)) {
          if (item.type === "ALBUM" || item.albumId) {
            featured.push({
              id: item.albumId,
              playlistId: item.playlistId,
              name: item.name,
              artist: item.artist?.name ?? "",
              artistId: item.artist?.artistId ?? "",
              thumbnail: bestThumb(item.thumbnails ?? []),
            });
          }
        }
      }
    }

    return NextResponse.json(
      { newReleases, trending, featured },
      { headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=600" } }
    );
  } catch (err) {
    console.error("home API error:", err);
    return NextResponse.json({ newReleases: [], trending: [], featured: [] }, { status: 503 });
  }
}
