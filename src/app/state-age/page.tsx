import type { Metadata } from "next";
import Home from "../page";

const title = "Whiteout Survival State Age Tracker";
const description =
  "Check Whiteout Survival state age, transfer timing, unlock windows, and recently opened WOS states from one practical tracker.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/state-age" },
  openGraph: { type: "website", url: "/state-age", siteName: "WhiteoutSurvival.dev", title, description },
  twitter: { card: "summary_large_image", title, description, images: ["/social-preview-v2.png"] },
};

export default Home;
