import type { Metadata } from "next";
import Home from "../page";

const title = "Whiteout Survival Message Templates";
const description =
  "Whiteout Survival message templates for alliance recruitment, unicode layouts, chat formats, and ready-to-copy WOS community announcements and posts.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "https://whiteoutsurvival.dev/message-templates" },
  openGraph: { type: "website", url: "https://whiteoutsurvival.dev/message-templates", siteName: "WhiteoutSurvival.dev", title, description, images: ["https://whiteoutsurvival.dev/social-preview-v2.png"] },
  twitter: { card: "summary_large_image", title, description, images: ["https://whiteoutsurvival.dev/social-preview-v2.png"] },
};

export default function MessageTemplatesPage() {
  return <Home initialMenu="templates" />;
}
