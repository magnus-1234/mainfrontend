import type { Metadata } from "next";
import Home from "../page";

const title = "Whiteout Survival Gift Code Redeem";
const description =
  "Redeem Whiteout Survival gift codes with a clean player ID flow built for fast WOS reward claims and active code checks.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/redeem" },
  openGraph: { type: "website", url: "/redeem", siteName: "WhiteoutSurvival.dev", title, description },
  twitter: { card: "summary_large_image", title, description, images: ["/social-preview-v2.png"] },
};

export default Home;
