import type { Metadata } from "next";
import { HomeApp } from "../HomeApp";

const title = "Whiteout Survival Fire Crystal Calculator";
const description =
  "Whiteout Survival Fire Crystal calculator for FC1 to FC10 Furnace costs, Refined Fire Crystals, resource shortfalls, prerequisites, and upgrade time.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "https://whiteoutsurvival.dev/fire-crystals" },
  openGraph: {
    type: "website",
    url: "https://whiteoutsurvival.dev/fire-crystals",
    siteName: "WhiteoutSurvival.dev",
    title,
    description,
    images: ["https://whiteoutsurvival.dev/social-preview-v2.png"],
  },
  twitter: { card: "summary_large_image", title, description, images: ["https://whiteoutsurvival.dev/social-preview-v2.png"] },
};

export default function FireCrystalsPage() {
  return <HomeApp initialMenu="fireCrystals" />;
}
