import type { Metadata } from "next";
import Home from "../page";

const title = "Whiteout Survival Gear Calculator";
const description =
  "Whiteout Survival chief gear calculator for upgrade costs, material shortfalls, stat gains, and WOS gear planning across every chief slot and level.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "https://whiteoutsurvival.dev/chief-gear-calculator" },
  openGraph: { type: "website", url: "https://whiteoutsurvival.dev/chief-gear-calculator", siteName: "WhiteoutSurvival.dev", title, description, images: ["https://whiteoutsurvival.dev/social-preview-v2.png"] },
  twitter: { card: "summary_large_image", title, description, images: ["https://whiteoutsurvival.dev/social-preview-v2.png"] },
};

export default function ChiefGearCalculatorPage() {
  return <Home initialMenu="chiefGear" />;
}
