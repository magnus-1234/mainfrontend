import type { Metadata } from "next";
import { HomeApp } from "../HomeApp";

const title = "Whiteout Survival Shared Tools";
const description =
  "Whiteout Survival tools and WOS Discord bot resources for gift codes, calculators, state tracking, planners, wiki data, and alliance automation.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "https://whiteoutsurvival.dev/share",
  },
  openGraph: {
    type: "website",
    url: "https://whiteoutsurvival.dev/share",
    siteName: "WhiteoutSurvival.dev",
    title,
    description,
    images: [
      {
        url: "https://whiteoutsurvival.dev/social-preview-v2.png",
        width: 1200,
        height: 630,
        alt: "Whiteout Survival tools, guides, calculators, planners, and Discord bot preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["https://whiteoutsurvival.dev/social-preview-v2.png"],
  },
};

export default HomeApp;
