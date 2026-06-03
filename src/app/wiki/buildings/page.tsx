import type { Metadata } from "next";
import Home from "../../page";

const title = "Whiteout Survival Buildings Wiki";
const description =
  "Explore Whiteout Survival building data, Fire Crystal upgrades, city structures, requirements, and WOS reference tables.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/wiki/buildings" },
  openGraph: { type: "website", url: "/wiki/buildings", siteName: "WhiteoutSurvival.dev", title, description },
  twitter: { card: "summary_large_image", title, description, images: ["/social-preview-v2.png"] },
};

export default function WikiBuildingsPage() {
  return <Home initialMenu="wikiBuildings" />;
}
