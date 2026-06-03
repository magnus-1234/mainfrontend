import type { Metadata } from "next";
import Home from "../page";

const title = "Whiteout Survival Chief Gear Calculator";
const description =
  "Calculate Whiteout Survival chief gear upgrade costs, material shortfalls, stat gains, and gear paths for every WOS slot.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/chief-gear-calculator" },
  openGraph: { type: "website", url: "/chief-gear-calculator", siteName: "WhiteoutSurvival.dev", title, description },
  twitter: { card: "summary_large_image", title, description, images: ["/social-preview-v2.png"] },
};

export default function ChiefGearCalculatorPage() {
  return <Home initialMenu="chiefGear" />;
}
