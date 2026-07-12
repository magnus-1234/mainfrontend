"use client";

import { useEffect } from "react";

export function AdBanner() {
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error("AdSense error:", err);
    }
  }, []);

  return (
    <div className="w-full overflow-hidden my-4 text-center">
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-1888612264852389"
        data-ad-slot="1350394625"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
