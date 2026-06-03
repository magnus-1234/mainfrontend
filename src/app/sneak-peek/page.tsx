import type { Metadata } from "next";
import Home from "../page";

const title = "Whiteout Survival Sneak Peek";
const description =
  "Whiteout Survival sneak peek tracker for upcoming WOS features, event previews, update clues, and community-ready summaries.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/sneak-peek" },
  openGraph: { type: "website", url: "/sneak-peek", siteName: "WhiteoutSurvival.dev", title, description },
  twitter: { card: "summary_large_image", title, description, images: ["/social-preview-v2.png"] },
};

export default function SneakPeekPage() {
  return <Home initialMenu="sneak" />;
}
