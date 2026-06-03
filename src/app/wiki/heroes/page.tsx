import type { Metadata } from "next";
import Home from "../../page";

const title = "Whiteout Survival Heroes Wiki";
const description =
  "Whiteout Survival heroes wiki with WOS hero rarity, season, class, skills, images, and searchable reference data for planning lineups.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/wiki/heroes" },
  openGraph: { type: "website", url: "/wiki/heroes", siteName: "WhiteoutSurvival.dev", title, description },
  twitter: { card: "summary_large_image", title, description, images: ["/social-preview-v2.png"] },
};

export default function WikiHeroesPage() {
  return <Home initialMenu="wikiHeroes" />;
}
