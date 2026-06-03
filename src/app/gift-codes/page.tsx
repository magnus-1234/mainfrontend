import type { Metadata } from "next";
import Home from "../page";

const title = "Whiteout Survival Gift Codes";
const description =
  "Whiteout Survival gift codes updated for WOS players. Find active codes, copy rewards fast, and open the redeem tool for daily in-game gifts.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/gift-codes" },
  openGraph: { type: "website", url: "/gift-codes", siteName: "WhiteoutSurvival.dev", title, description },
  twitter: { card: "summary_large_image", title, description, images: ["/social-preview-v2.png"] },
};

export default function GiftCodesPage() {
  return <Home initialMenu="gift" />;
}
