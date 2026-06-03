import type { Metadata } from "next";
import Home from "../page";

const title = "Whiteout Survival Game Map";
const description =
  "Clickable Whiteout Survival 1199 x 1199 game map with coordinate selection and 3D rotation controls.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "https://whiteoutsurvival.dev/game-map" },
  openGraph: {
    type: "website",
    url: "https://whiteoutsurvival.dev/game-map",
    siteName: "WhiteoutSurvival.dev",
    title,
    description,
    images: ["https://whiteoutsurvival.dev/social-preview-v2.png"],
  },
  twitter: { card: "summary_large_image", title, description, images: ["https://whiteoutsurvival.dev/social-preview-v2.png"] },
};

export default function GameMapPage() {
  return <Home initialMenu="gameMap" />;
}
