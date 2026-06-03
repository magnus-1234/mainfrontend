import type { Metadata } from "next";
import Home from "../page";

const title = "Whiteout Survival VIP Calculator";
const description =
  "Whiteout Survival VIP calculator for XP needed, VIP 12 progress, gem conversion, pack cost estimates, and pack efficiency comparison.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "https://whiteoutsurvival.dev/vip-calculator" },
  openGraph: { type: "website", url: "https://whiteoutsurvival.dev/vip-calculator", siteName: "WhiteoutSurvival.dev", title, description, images: ["https://whiteoutsurvival.dev/social-preview-v2.png"] },
  twitter: { card: "summary_large_image", title, description, images: ["https://whiteoutsurvival.dev/social-preview-v2.png"] },
};

export default function VipCalculatorPage() {
  return <Home initialMenu="vip" />;
}
