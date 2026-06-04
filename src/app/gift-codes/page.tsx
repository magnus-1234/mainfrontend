import type { Metadata } from "next";
import { HomeApp } from "../HomeApp";

const title = "Whiteout Survival Gift Codes";
const description =
  "Whiteout Survival gift codes updated for WOS players. Find active codes, copy rewards fast, and open the redeem tool for daily in-game gifts.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "https://whiteoutsurvival.dev/gift-codes" },
  openGraph: { type: "website", url: "https://whiteoutsurvival.dev/gift-codes", siteName: "WhiteoutSurvival.dev", title, description, images: ["https://whiteoutsurvival.dev/social-preview-v2.png"] },
  twitter: { card: "summary_large_image", title, description, images: ["https://whiteoutsurvival.dev/social-preview-v2.png"] },
};

export default function GiftCodesPage() {
  return <HomeApp initialMenu="gift" />;
}
