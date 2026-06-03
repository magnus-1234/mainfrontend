import type { Metadata } from "next";
import Home from "../page";

const title = "Whiteout Survival Redeem Codes";
const description =
  "Redeem Whiteout Survival gift codes by player ID. Claim active WOS rewards quickly with a simple redeem flow built for daily gift code checks.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "https://whiteoutsurvival.dev/redeem" },
  openGraph: { type: "website", url: "https://whiteoutsurvival.dev/redeem", siteName: "WhiteoutSurvival.dev", title, description, images: ["https://whiteoutsurvival.dev/social-preview-v2.png"] },
  twitter: { card: "summary_large_image", title, description, images: ["https://whiteoutsurvival.dev/social-preview-v2.png"] },
};

export default function RedeemPage() {
  return <Home initialMenu="redeem" />;
}
