import type { Metadata } from "next";
import Home from "../page";

const title = "Whiteout Survival Foundry Team Planner";
const description =
  "Whiteout Survival Foundry Team Planner for battle assignments. Build rally teams, choose building targets, add joiners, and share export-ready plans.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/foundry-team-planner" },
  openGraph: { type: "website", url: "/foundry-team-planner", siteName: "WhiteoutSurvival.dev", title, description },
  twitter: { card: "summary_large_image", title, description, images: ["/foundry-team-planner-map.webp"] },
};

export default function FoundryTeamPlannerPage() {
  return <Home initialMenu="planner" />;
}
