import type { Metadata } from "next";
import { HomeApp } from "../HomeApp";

const title = "Whiteout Survival State Age Tracker";
const description =
  "Whiteout Survival state age tracker for WOS servers. Check state creation time, transfer timing, unlock windows, and recently opened states.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "https://whiteoutsurvival.dev/state-age" },
  openGraph: { type: "website", url: "https://whiteoutsurvival.dev/state-age", siteName: "WhiteoutSurvival.dev", title, description, images: ["https://whiteoutsurvival.dev/social-preview-v2.png"] },
  twitter: { card: "summary_large_image", title, description, images: ["https://whiteoutsurvival.dev/social-preview-v2.png"] },
};

export default function StateAgePage() {
  return <HomeApp initialMenu="stateAge" />;
}
