"use client";

import { usePathname } from "next/navigation";
import { DiscordBotSeoContent } from "./DiscordBotSeoContent";

/**
 * Thin client wrapper that hides the SEO content section when the user
 * navigates away from /discord-bot via the SPA sidebar (without a full
 * page reload). Googlebot always sees the server-rendered HTML on the
 * /discord-bot route, so SEO is unaffected.
 */
export function DiscordBotSeoWrapper() {
  const pathname = usePathname();
  if (pathname !== "/discord-bot") return null;
  return <DiscordBotSeoContent />;
}
