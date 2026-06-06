"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function AdminVisitTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;

    const query = searchParams.toString();
    const page = `${pathname}${query ? `?${query}` : ""}`;
    const body = JSON.stringify({
      page,
      referrer: document.referrer,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screen: `${window.screen.width}x${window.screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/admin/track", new Blob([body], { type: "application/json" }));
      return;
    }

    fetch("/api/admin/track", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => undefined);
  }, [pathname, searchParams]);

  return null;
}
