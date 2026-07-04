import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Curated genres with their YTMusic search terms and accent colors
const GENRES = [
  { id: "pop", name: "Pop", query: "top pop hits 2024", color: "#E91E8C", thumb: "https://yt3.googleusercontent.com/ytc/AIdro_kC4ZkFGUCl_LCdRHV3ZuAirnWJXlGH0qrQ2P1WiGKl=s800" },
  { id: "hiphop", name: "Hip-Hop", query: "top hip hop rap hits 2024", color: "#FF6B35", thumb: "" },
  { id: "rock", name: "Rock", query: "top rock hits classics", color: "#E53935", thumb: "" },
  { id: "rnb", name: "R&B", query: "top r&b soul hits 2024", color: "#8E24AA", thumb: "" },
  { id: "electronic", name: "Electronic", query: "top electronic dance EDM hits", color: "#00B0FF", thumb: "" },
  { id: "phonk", name: "Phonk", query: "phonk drift music mix", color: "#880E4F", thumb: "" },
  { id: "lofi", name: "Lo-Fi", query: "lofi hip hop chill beats", color: "#546E7A", thumb: "" },
  { id: "kpop", name: "K-Pop", query: "top kpop hits 2024", color: "#F06292", thumb: "" },
  { id: "jazz", name: "Jazz", query: "best jazz music classics", color: "#795548", thumb: "" },
  { id: "classical", name: "Classical", query: "best classical music orchestral", color: "#1565C0", thumb: "" },
  { id: "latin", name: "Latin", query: "top latin hits reggaeton 2024", color: "#F57F17", thumb: "" },
  { id: "bollywood", name: "Bollywood", query: "top bollywood hindi songs 2024", color: "#FF8F00", thumb: "" },
  { id: "metal", name: "Metal", query: "top metal heavy metal songs", color: "#424242", thumb: "" },
  { id: "country", name: "Country", query: "top country music hits 2024", color: "#8D6E63", thumb: "" },
  { id: "indie", name: "Indie", query: "best indie alternative songs 2024", color: "#26A69A", thumb: "" },
  { id: "workout", name: "Workout", query: "best workout gym motivation music", color: "#D32F2F", thumb: "" },
  { id: "sleep", name: "Sleep & Relax", query: "relaxing sleep music ambient", color: "#1A237E", thumb: "" },
  { id: "study", name: "Study", query: "study focus music concentration", color: "#2E7D32", thumb: "" },
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
