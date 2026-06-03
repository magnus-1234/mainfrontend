import type { Metadata } from "next";
import Home from "../../page";

const title = "Whiteout Survival Buildings Wiki";
const description =
  "Whiteout Survival buildings wiki for city structures, Fire Crystal upgrades, requirements, costs, timers, and WOS building reference tables.";

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
