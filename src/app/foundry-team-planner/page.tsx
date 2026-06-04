import type { Metadata } from "next";
import { HomeApp } from "../HomeApp";

const title = "Whiteout Survival Foundry Planner";
const description =
  "Whiteout Survival Foundry Team Planner for battle assignments. Build rally teams, choose building targets, add joiners, and share export-ready plans.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "https://whiteoutsurvival.dev/foundry-team-planner" },
  openGraph: { type: "website", url: "https://whiteoutsurvival.dev/foundry-team-planner", siteName: "WhiteoutSurvival.dev", title, description, images: ["https://whiteoutsurvival.dev/foundry-team-planner-map.webp"] },
  twitter: { card: "summary_large_image", title, description, images: ["https://whiteoutsurvival.dev/foundry-team-planner-map.webp"] },
};

export default function FoundryTeamPlannerPage() {
  return <HomeApp initialMenu="planner" />;
}
