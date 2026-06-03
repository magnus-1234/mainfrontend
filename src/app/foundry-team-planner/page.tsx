import type { Metadata } from "next";
import Home from "../page";

const title = "Whiteout Survival Foundry Team Planner";
const description =
  "Build and share Whiteout Survival Foundry Battle teams with rally leaders, joiners, building targets, and export-ready assignments.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/foundry-team-planner" },
  openGraph: { type: "website", url: "/foundry-team-planner", siteName: "WhiteoutSurvival.dev", title, description },
  twitter: { card: "summary_large_image", title, description, images: ["/foundry-team-planner-map.webp"] },
};

export default Home;
