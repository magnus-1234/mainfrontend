import type { Metadata } from "next";
import Home from "../page";

const title = "Whiteout Survival Gift Codes";
const description =
  "Find active Whiteout Survival gift codes, copy rewards quickly, and open a focused WOS redeem flow for daily player rewards.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/gift-codes" },
  openGraph: { type: "website", url: "/gift-codes", siteName: "WhiteoutSurvival.dev", title, description },
  twitter: { card: "summary_large_image", title, description, images: ["/social-preview-v2.png"] },
};

export default Home;
