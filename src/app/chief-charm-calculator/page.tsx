import type { Metadata } from "next";
import Home from "../page";

const title = "Whiteout Survival Charm Calculator";
const description =
  "Whiteout Survival chief charm calculator for material totals, charm slot costs, power gains, and troop stat upgrades for Infantry, Lancer, and Marksman.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "https://whiteoutsurvival.dev/chief-charm-calculator" },
  openGraph: { type: "website", url: "https://whiteoutsurvival.dev/chief-charm-calculator", siteName: "WhiteoutSurvival.dev", title, description, images: ["https://whiteoutsurvival.dev/social-preview-v2.png"] },
  twitter: { card: "summary_large_image", title, description, images: ["https://whiteoutsurvival.dev/social-preview-v2.png"] },
};

export default function ChiefCharmCalculatorPage() {
  return <Home initialMenu="chiefCharm" />;
}
