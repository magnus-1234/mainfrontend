import type { Metadata } from "next";
import Home from "../page";

const title = "Whiteout Survival Sneak Peek News";
const description =
  "Whiteout Survival sneak peek tracker for upcoming WOS features, event previews, update clues, rewards, and community-ready summaries for players.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "https://whiteoutsurvival.dev/sneak-peek" },
  openGraph: { type: "website", url: "https://whiteoutsurvival.dev/sneak-peek", siteName: "WhiteoutSurvival.dev", title, description, images: ["https://whiteoutsurvival.dev/social-preview-v2.png"] },
  twitter: { card: "summary_large_image", title, description, images: ["https://whiteoutsurvival.dev/social-preview-v2.png"] },
};

export default function SneakPeekPage() {
  return <Home initialMenu="sneak" />;
}
