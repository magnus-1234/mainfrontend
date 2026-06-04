import type { Metadata } from "next";
import { HomeApp } from "../../HomeApp";

const title = "Whiteout Survival Buildings Wiki";
const description =
  "Whiteout Survival buildings wiki for city structures, Fire Crystal upgrades, requirements, costs, timers, and WOS building reference tables.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "https://whiteoutsurvival.dev/wiki/buildings" },
  openGraph: { type: "website", url: "https://whiteoutsurvival.dev/wiki/buildings", siteName: "WhiteoutSurvival.dev", title, description, images: ["https://whiteoutsurvival.dev/social-preview-v2.png"] },
  twitter: { card: "summary_large_image", title, description, images: ["https://whiteoutsurvival.dev/social-preview-v2.png"] },
};

export default function WikiBuildingsPage() {
  return <HomeApp initialMenu="wikiBuildings" />;
}
