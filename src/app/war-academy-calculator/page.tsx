import type { Metadata } from "next";
import { HomeApp } from "../HomeApp";

export async function generateMetadata(): Promise<Metadata> {
  const date = new Date();
  const month = date.toLocaleString('default', { month: 'long' });
  const year = date.getFullYear();

  const title = `Whiteout Survival War Academy Calculator (${month} ${year})`;
  const description =
    `Whiteout Survival War Academy calculator for T11 Helios research costs, Fire Crystal Shard shortfalls, steel exchange value, research time, and power gains (${month} ${year}).`;

  return {
    title,
    description,
    alternates: { canonical: "https://whiteoutsurvival.dev/war-academy-calculator" },
    openGraph: { type: "website", url: "https://whiteoutsurvival.dev/war-academy-calculator", siteName: "WhiteoutSurvival.dev", title, description, images: ["https://whiteoutsurvival.dev/social-preview-v2.png"] },
    twitter: { card: "summary_large_image", title, description, images: ["https://whiteoutsurvival.dev/social-preview-v2.png"] },
  };
}

export default function WarAcademyCalculatorPage() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Whiteout Survival War Academy Calculator",
      "applicationCategory": "GameApplication",
      "operatingSystem": "Web",
      "description": "Calculate War Academy research costs, Fire Crystal Shard requirements, and time for T11 Helios in Whiteout Survival.",
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
          "name": "When does the War Academy unlock?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "The War Academy building unlocks roughly 220 days after your server starts, requiring your Furnace to reach FC5 (Fire Crystal Level 5)."
          }
        },
        {
          "@type": "Question",
          "name": "Which T11 troops should I research first?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Most top players recommend rushing Infantry Helios first, as they are your frontline defenders and absorb the bulk of damage. Marksman should be your secondary focus."
          }
        },
        {
          "@type": "Question",
          "name": "How do I get Fire Crystal Shards?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Fire Crystal Shards are exchanged daily for Steel (5,000 Steel = 1 Shard) or Fire Crystals (10 Crystals = 13 Shards) inside the War Academy. It's crucial to manage your shards carefully."
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
      <HomeApp initialMenu="warAcademy" />
    </>
  );
}
