import type { Metadata } from "next";
import { HomeApp } from "../../HomeApp";

const title = "Whiteout Survival Posters Gallery";
const description =
  "Whiteout Survival official posters gallery with locally mirrored WOS hero, event, festival, and survivor artwork in the wiki.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "https://whiteoutsurvival.dev/wiki/posters" },
  openGraph: { type: "website", url: "https://whiteoutsurvival.dev/wiki/posters", siteName: "WhiteoutSurvival.dev", title, description, images: ["https://whiteoutsurvival.dev/social-preview-v2.png"] },
  twitter: { card: "summary_large_image", title, description, images: ["https://whiteoutsurvival.dev/social-preview-v2.png"] },
};

export default function WikiPostersPage() {
  return <HomeApp initialMenu="wikiPosters" />;
}
