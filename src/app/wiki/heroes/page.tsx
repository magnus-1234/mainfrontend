import type { Metadata } from "next";
import Home from "../../page";

const title = "Whiteout Survival Heroes Wiki";
const description =
  "Whiteout Survival heroes wiki with WOS hero rarity, season, class, skills, images, and searchable reference data for planning stronger lineups.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "https://whiteoutsurvival.dev/wiki/heroes" },
  openGraph: { type: "website", url: "https://whiteoutsurvival.dev/wiki/heroes", siteName: "WhiteoutSurvival.dev", title, description, images: ["https://whiteoutsurvival.dev/social-preview-v2.png"] },
  twitter: { card: "summary_large_image", title, description, images: ["https://whiteoutsurvival.dev/social-preview-v2.png"] },
};

export default function WikiHeroesPage() {
  return <Home initialMenu="wikiHeroes" />;
}
