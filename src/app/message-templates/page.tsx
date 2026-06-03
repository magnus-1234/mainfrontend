import type { Metadata } from "next";
import Home from "../page";

const title = "Whiteout Survival Message Templates";
const description =
  "Copy and share Whiteout Survival alliance recruitment messages, unicode layouts, chat templates, and community text formats.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/message-templates" },
  openGraph: { type: "website", url: "/message-templates", siteName: "WhiteoutSurvival.dev", title, description },
  twitter: { card: "summary_large_image", title, description, images: ["/social-preview-v2.png"] },
};

export default function MessageTemplatesPage() {
  return <Home initialMenu="templates" />;
}
