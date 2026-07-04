import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Curated genres with their YTMusic search terms and accent colors
const GENRES = [
  { id: "pop", name: "Pop", query: "top pop hits 2024", color: "#E91E8C", thumb: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop" },
  { id: "hiphop", name: "Hip-Hop", query: "top hip hop rap hits 2024", color: "#FF6B35", thumb: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&h=300&fit=crop" },
  { id: "rock", name: "Rock", query: "top rock hits classics", color: "#E53935", thumb: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=300&h=300&fit=crop" },
  { id: "rnb", name: "R&B", query: "top r&b soul hits 2024", color: "#8E24AA", thumb: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300&h=300&fit=crop" },
  { id: "electronic", name: "Electronic", query: "top electronic dance EDM hits", color: "#00B0FF", thumb: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop" },
  { id: "phonk", name: "Phonk", query: "phonk drift music mix", color: "#880E4F", thumb: "https://images.unsplash.com/photo-1596727282855-90df9db172f3?w=300&h=300&fit=crop" },
  { id: "lofi", name: "Lo-Fi", query: "lofi hip hop chill beats", color: "#546E7A", thumb: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop" },
  { id: "kpop", name: "K-Pop", query: "top kpop hits 2024", color: "#F06292", thumb: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=300&h=300&fit=crop" },
  { id: "jazz", name: "Jazz", query: "best jazz music classics", color: "#795548", thumb: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=300&h=300&fit=crop" },
  { id: "classical", name: "Classical", query: "best classical music orchestral", color: "#1565C0", thumb: "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=300&h=300&fit=crop" },
  { id: "latin", name: "Latin", query: "top latin hits reggaeton 2024", color: "#F57F17", thumb: "https://images.unsplash.com/photo-1533240332313-0db49b459ad6?w=300&h=300&fit=crop" },
  { id: "bollywood", name: "Bollywood", query: "top bollywood hindi songs 2024", color: "#FF8F00", thumb: "https://images.unsplash.com/photo-1583324113626-70df0f4deaab?w=300&h=300&fit=crop" },
  { id: "metal", name: "Metal", query: "top metal heavy metal songs", color: "#424242", thumb: "https://images.unsplash.com/photo-1598387181032-a3103a2db5b3?w=300&h=300&fit=crop" },
  { id: "country", name: "Country", query: "top country music hits 2024", color: "#8D6E63", thumb: "https://images.unsplash.com/photo-1516223725307-6f76b9ec8742?w=300&h=300&fit=crop" },
  { id: "indie", name: "Indie", query: "best indie alternative songs 2024", color: "#26A69A", thumb: "https://images.unsplash.com/photo-1525362081669-2b476bb628c3?w=300&h=300&fit=crop" },
  { id: "workout", name: "Workout", query: "best workout gym motivation music", color: "#D32F2F", thumb: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300&h=300&fit=crop" },
  { id: "sleep", name: "Sleep & Relax", query: "relaxing sleep music ambient", color: "#1A237E", thumb: "https://images.unsplash.com/photo-1511295742362-92c96b1cf484?w=300&h=300&fit=crop" },
  { id: "study", name: "Study", query: "study focus music concentration", color: "#2E7D32", thumb: "https://images.unsplash.com/photo-1456406644174-8ddd4cd52a06?w=300&h=300&fit=crop" },
];

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const genreId = url.searchParams.get("genre") ?? "";

  if (genreId) {
    // Return songs for a specific genre
    const genre = GENRES.find((g) => g.id === genreId);
    if (!genre) return NextResponse.json({ error: "Unknown genre" }, { status: 404 });

    try {
      const YTMusic = (await import("ytmusic-api")).default;
      const client = new YTMusic();
      await client.initialize();
      const songs = await client.searchSongs(genre.query);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const bestThumb = (thumbnails: any[]) => {
        if (!Array.isArray(thumbnails) || thumbnails.length === 0) return "";
        return [...thumbnails].sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0]?.url ?? "";
      };

      const tracks = songs.slice(0, 20).map((s: any) => ({
        videoId: s.videoId,
        title: s.name ?? s.title,
        artist: s.artist?.name ?? s.artists?.[0]?.name ?? "",
        artistId: s.artist?.artistId ?? s.artists?.[0]?.artistId ?? "",
        album: s.album?.name ?? "",
        albumId: s.album?.albumId ?? "",
        thumbnail: bestThumb(s.thumbnails ?? []),
        duration: s.duration,
      }));

      return NextResponse.json(
        { genre, tracks },
        { headers: { "Cache-Control": "s-maxage=1800, stale-while-revalidate=3600" } }
      );
    } catch (err) {
      console.error("genre songs error:", err);
      return NextResponse.json({ error: "Failed to fetch genre songs" }, { status: 503 });
    }
  }

  // Return genre list
  return NextResponse.json(
    { genres: GENRES },
    { headers: { "Cache-Control": "s-maxage=86400" } }
  );
}
