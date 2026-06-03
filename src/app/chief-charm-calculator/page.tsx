import type { Metadata } from "next";
import Home from "../page";

const title = "Whiteout Survival Chief Charm Calculator";
const description =
  "Plan Whiteout Survival chief charm upgrades with material totals, slot costs, power gains, and troop stat tracking.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/chief-charm-calculator" },
  openGraph: { type: "website", url: "/chief-charm-calculator", siteName: "WhiteoutSurvival.dev", title, description },
  twitter: { card: "summary_large_image", title, description, images: ["/social-preview-v2.png"] },
};

export default Home;
