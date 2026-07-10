import type { Metadata } from "next";
import { HomeApp } from "../HomeApp";

export async function generateMetadata(): Promise<Metadata> {
  const date = new Date();
  const month = date.toLocaleString('default', { month: 'long' });
  const year = date.getFullYear();

  const title = `Whiteout Survival VIP Calculator (${month} ${year})`;
  const description =
    `Whiteout Survival VIP calculator for VIP XP, gem value, VIP 12 progress, pack costs, and upgrade planning. Estimate your best upgrade path fast (${month} ${year}).`;

  return {
    title,
    description,
    alternates: { canonical: "https://whiteoutsurvival.dev/vip-calculator" },
    openGraph: { type: "website", url: "https://whiteoutsurvival.dev/vip-calculator", siteName: "WhiteoutSurvival.dev", title, description, images: ["https://whiteoutsurvival.dev/social-preview-v2.png"] },
    twitter: { card: "summary_large_image", title, description, images: ["https://whiteoutsurvival.dev/social-preview-v2.png"] },
  };
}

export default function VipCalculatorPage() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Whiteout Survival VIP Calculator",
      "applicationCategory": "GameApplication",
      "operatingSystem": "Web",
      "description": "Calculate VIP XP required, gem values, and pack costs to reach VIP levels in Whiteout Survival.",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "How do I get VIP points as a F2P player?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "The most reliable F2P method is logging in every day. Your daily login reward increases consecutively up to a maximum of 500 VIP points per day. You can also occasionally buy them in the Alliance Shop or earn them in events."
          }
        },
        {
          "@type": "Question",
          "name": "What is the difference between VIP Level and VIP Status?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Your VIP Level is permanent and increases as you earn VIP XP. However, the buffs associated with your level are dormant unless your VIP Status is 'active'. You can activate your status for 30 days using 10,000 Gems."
          }
        },
        {
          "@type": "Question",
          "name": "What is the best VIP level to aim for?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "For most players, reaching VIP 7 is the first major milestone because it unlocks daily Mythic General Hero Shards. Beyond that, VIP 9 is highly recommended as it unlocks weekly Frontier Supplies in the VIP shop."
          }
        }
      ]
    }
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeApp initialMenu="vip" />
    </>
  );
}
