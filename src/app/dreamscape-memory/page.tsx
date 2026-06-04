import type { Metadata } from "next";
import DreamscapeMemory from "./DreamscapeMemory";
import "./dreamscape.css";

const title = "Whiteout Survival Dreamscape Memory Maps";
const description =
  "Browse every Whiteout Survival Dreamscape Memory map and stage image, search item checklists, and run a 60-second practice tracker for cleaner event clears.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "https://whiteoutsurvival.dev/dreamscape-memory",
  },
  openGraph: {
    type: "website",
    url: "https://whiteoutsurvival.dev/dreamscape-memory",
    siteName: "WhiteoutSurvival.dev",
    title,
    description,
    images: [
      {
        url: "https://whiteoutsurvival.dev/images/dreamscape/ballroom.webp",
        width: 1200,
        height: 630,
        alt: "Whiteout Survival Dreamscape Memory event helper",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["https://whiteoutsurvival.dev/images/dreamscape/ballroom.webp"],
  },
};

export default function DreamscapeMemoryPage() {
  return <DreamscapeMemory />;
}
