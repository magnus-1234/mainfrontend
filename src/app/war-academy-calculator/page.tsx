import type { Metadata } from "next";
import { HomeApp } from "../HomeApp";

const title = "Whiteout Survival War Academy Calculator";
const description =
  "Whiteout Survival War Academy calculator for T11 Helios research costs, Fire Crystal Shard shortfalls, steel exchange value, research time, and power gains.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "https://whiteoutsurvival.dev/war-academy-calculator" },
  openGraph: { type: "website", url: "https://whiteoutsurvival.dev/war-academy-calculator", siteName: "WhiteoutSurvival.dev", title, description, images: ["https://whiteoutsurvival.dev/social-preview-v2.png"] },
  twitter: { card: "summary_large_image", title, description, images: ["https://whiteoutsurvival.dev/social-preview-v2.png"] },
};

export default function WarAcademyCalculatorPage() {
  return <HomeApp initialMenu="warAcademy" />;
}
