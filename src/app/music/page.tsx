import type { Metadata } from "next";
import { HomeApp } from "../HomeApp";

const title = "Whiteout Survival Music Bot";
const description =
  "Manage Whiteout Survival Discord music bot playlists, server music access, and saved cloud playlists from the main website.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "https://whiteoutsurvival.dev/music" },
  openGraph: { type: "website", url: "https://whiteoutsurvival.dev/music", siteName: "WhiteoutSurvival.dev", title, description, images: ["https://whiteoutsurvival.dev/showcase-music-system.png"] },
  twitter: { card: "summary_large_image", title, description, images: ["https://whiteoutsurvival.dev/showcase-music-system.png"] },
};

export default function MusicPage() {
  return <HomeApp initialMenu="music" />;
}
