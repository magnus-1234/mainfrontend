import type { Metadata } from "next";
import Home from "../page";

const title = "Whiteout Survival Tools & WOS Discord Bot";
const description =
  "Whiteout Survival tools and WOS Discord bot resources for gift codes, calculators, state tracking, planners, wiki data, and alliance automation.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/share",
  },
  openGraph: {
    type: "website",
    url: "/share",
    siteName: "WhiteoutSurvival.dev",
    title,
    description,
    images: [
      {
        url: "/social-preview-v2.png",
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
    images: ["/social-preview-v2.png"],
  },
};

export default Home;
