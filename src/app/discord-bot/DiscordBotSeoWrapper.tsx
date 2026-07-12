"use client";

import { useEffect, useState } from "react";
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
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const checkPath = () => {
      setIsVisible(window.location.pathname.includes("/discord-bot"));
    };

    // Check immediately on mount
    checkPath();

    // Intercept SPA navigation to update visibility
    const originalPushState = window.history.pushState;
    window.history.pushState = function (...args) {
      const result = originalPushState.apply(this, args);
      checkPath();
      return result;
    };

    const originalReplaceState = window.history.replaceState;
    window.history.replaceState = function (...args) {
      const result = originalReplaceState.apply(this, args);
      checkPath();
      return result;
    };

    window.addEventListener("popstate", checkPath);

    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener("popstate", checkPath);
    };
  }, []);

  // Server-side: assume visible if Next.js pathname includes /discord-bot
  // Client-side: use the exact window.location visibility check
  const isServerMatch = pathname ? pathname.includes("/discord-bot") : true;

  if (!isServerMatch && !isVisible) return null;
  if (!isVisible) return null;

  return <DiscordBotSeoContent />;
}
