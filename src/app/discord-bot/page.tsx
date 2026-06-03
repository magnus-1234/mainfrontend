import type { Metadata } from "next";
import Home from "../page";

const title = "Whiteout Survival Discord Bot";
const description =
  "Whiteout Survival Discord bot for WOS alliances. Get gift code alerts, auto redeem support, player tracking, translations, reminders, and server tools.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/discord-bot" },
  openGraph: { type: "website", url: "/discord-bot", siteName: "WhiteoutSurvival.dev", title, description },
  twitter: { card: "summary_large_image", title, description, images: ["/bot-preview-dashboard-reference.png"] },
};

export default function DiscordBotPage() {
  return <Home initialMenu="bot" />;
}
