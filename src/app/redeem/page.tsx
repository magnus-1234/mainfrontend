import type { Metadata } from "next";
import Home from "../page";

const title = "Whiteout Survival Gift Code Redeem";
const description =
  "Redeem Whiteout Survival gift codes by player ID. Claim active WOS rewards quickly with a simple redeem flow built for daily gift code checks.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/redeem" },
  openGraph: { type: "website", url: "/redeem", siteName: "WhiteoutSurvival.dev", title, description },
  twitter: { card: "summary_large_image", title, description, images: ["/social-preview-v2.png"] },
};

export default function RedeemPage() {
  return <Home initialMenu="redeem" />;
}
