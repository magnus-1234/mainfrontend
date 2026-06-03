import type { Metadata } from "next";
import Home from "../page";

const title = "Whiteout Survival Daybreak Island Layouts";
const description =
  "Browse and share Whiteout Survival Daybreak Island layouts with tags, screenshots, likes, and practical city design ideas.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/daybreak-island" },
  openGraph: { type: "website", url: "/daybreak-island", siteName: "WhiteoutSurvival.dev", title, description },
  twitter: { card: "summary_large_image", title, description, images: ["/daybreak-island-tree-of-life.webp"] },
};

export default Home;
