import type { Metadata } from "next";
import DreamscapeMemory from "./DreamscapeMemory";
import "./dreamscape.css";

const title = "Dreamscape Memory Whiteout Survival Event Tool";
const description =
  "Play and plan Whiteout Survival Dreamscape Memory matches with a focused helper for tracking tiles, turns, and event progress.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/dreamscape-memory",
  },
  openGraph: {
    type: "website",
    url: "/dreamscape-memory",
    siteName: "WhiteoutSurvival.dev",
    title,
    description,
    images: [
      {
        url: "/images/dreamscape/ballroom.webp",
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
    images: ["/images/dreamscape/ballroom.webp"],
  },
};

export default function DreamscapeMemoryPage() {
  return <DreamscapeMemory />;
}
