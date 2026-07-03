import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Music Player",
  description: "Control Discord music playback, queues, and playlists from your browser.",
  robots: { index: false, follow: false },
};

export default function MusicPlayerLayout({ children }: { children: React.ReactNode }) {
  return <div className="music-player-root">{children}</div>;
}
