import type { Metadata } from "next";
import Home from "../page";

const title = "Whiteout Survival Island Layouts";
const description =
  "Whiteout Survival Daybreak Island layouts with screenshots, tags, likes, and WOS city design ideas for decorating and planning your island build.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "https://whiteoutsurvival.dev/daybreak-island" },
  openGraph: { type: "website", url: "https://whiteoutsurvival.dev/daybreak-island", siteName: "WhiteoutSurvival.dev", title, description, images: ["https://whiteoutsurvival.dev/daybreak-island-tree-of-life.webp"] },
  twitter: { card: "summary_large_image", title, description, images: ["https://whiteoutsurvival.dev/daybreak-island-tree-of-life.webp"] },
};

export default function DaybreakIslandPage() {
  return <Home initialMenu="daybreak" />;
}
