import type { Metadata } from "next";
import Home from "../page";

const title = "Whiteout Survival Tools & WOS Discord Bot";
const description =
  "The ultimate toolkit for Whiteout Survival. Access powerful tools, detailed guides, and an advanced Discord bot. Plan smarter, grow faster, and stay ahead of the competition.";

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
