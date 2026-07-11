import type { Metadata } from "next";
import { HomeApp } from "../HomeApp";

const title = "Whiteout Survival Discord Music Bot | Play, Manage, Cloud Playlists";
const description =
  "The ultimate Whiteout Survival Discord music bot. Manage 24/7 lofi stations, upload MP3s, stream high-quality audio, and save cloud playlists directly from the web dashboard.";
const keywords = [
  "whiteout survival music bot",
  "discord music bot",
  "whiteout survival discord bot",
  "discord 24/7 lofi bot",
  "discord mp3 bot",
  "wos music bot",
  "discord cloud playlists",
  "whiteout survival bot",
  "discord bot dashboard"
];

export const metadata: Metadata = {
  title,
  description,
  keywords,
  authors: [{ name: "WhiteoutSurvival.dev" }],
  category: "technology",
  alternates: { canonical: "https://whiteoutsurvival.dev/music" },
  openGraph: { 
    type: "website", 
    url: "https://whiteoutsurvival.dev/music", 
    siteName: "WhiteoutSurvival.dev", 
    title, 
    description, 
    images: ["https://whiteoutsurvival.dev/showcase-music-system.png"] 
  },
  twitter: { 
    card: "summary_large_image", 
    title, 
    description, 
    images: ["https://whiteoutsurvival.dev/showcase-music-system.png"] 
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function MusicPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Whiteout Survival Music Bot",
            "operatingSystem": "Discord",
            "applicationCategory": "MultimediaApplication",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "description": description,
            "url": "https://whiteoutsurvival.dev/music",
            "image": "https://whiteoutsurvival.dev/showcase-music-system.png"
          })
        }}
      />
      <HomeApp initialMenu="music" />
    </>
  );
}
