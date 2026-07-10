import type { Metadata } from "next";
import { HomeApp } from "../HomeApp";

export async function generateMetadata(): Promise<Metadata> {
  const date = new Date();
  const month = date.toLocaleString('default', { month: 'long' });
  const year = date.getFullYear();
  
  const title = `Whiteout Survival Gift Codes (${month} ${year}) - Active & Live`;
  const description =
    `Whiteout Survival gift codes updated for WOS players for ${month} ${year}. Find active codes, copy rewards fast, and open the redeem tool for daily in-game gifts.`;

  return {
    title,
    description,
    alternates: { canonical: "https://whiteoutsurvival.dev/gift-codes" },
    openGraph: { type: "website", url: "https://whiteoutsurvival.dev/gift-codes", siteName: "WhiteoutSurvival.dev", title, description, images: ["https://whiteoutsurvival.dev/social-preview-v2.png"] },
    twitter: { card: "summary_large_image", title, description, images: ["https://whiteoutsurvival.dev/social-preview-v2.png"] },
  };
}

export default function GiftCodesPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What are the latest Whiteout Survival gift codes?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "The latest active gift codes for Whiteout Survival can be found and redeemed directly on our live tracker. We monitor and update them constantly as new codes are released."
        }
      },
      {
        "@type": "Question",
        "name": "How do I redeem Whiteout Survival codes?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "You can redeem codes in-game by tapping your avatar, going to Settings, and selecting 'Gift Code'. Alternatively, use the automatic redeem tool on this page with your Player ID to instantly claim rewards."
        }
      },
      {
        "@type": "Question",
        "name": "Why is my Whiteout Survival gift code not working?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Gift codes in Whiteout Survival usually expire after a few days or have a usage limit. Ensure you typed the code correctly, or check our tracker to see if the code has been marked as expired."
        }
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeApp initialMenu="gift" />
    </>
  );
}
