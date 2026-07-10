import type { Metadata } from "next";
import { HomeApp } from "../HomeApp";

export async function generateMetadata(): Promise<Metadata> {
  const date = new Date();
  const month = date.toLocaleString('default', { month: 'long' });
  const year = date.getFullYear();

  const title = `Whiteout Survival Fire Crystal Calculator (${month} ${year})`;
  const description =
    `Whiteout Survival Fire Crystal calculator for FC1 to FC10 Furnace costs, Refined Fire Crystals, resource shortfalls, prerequisites, and upgrade time (${month} ${year}).`;

  return {
    title,
    description,
    alternates: { canonical: "https://whiteoutsurvival.dev/fire-crystals" },
    openGraph: {
      type: "website",
      url: "https://whiteoutsurvival.dev/fire-crystals",
      siteName: "WhiteoutSurvival.dev",
      title,
      description,
      images: ["https://whiteoutsurvival.dev/social-preview-v2.png"],
    },
    twitter: { card: "summary_large_image", title, description, images: ["https://whiteoutsurvival.dev/social-preview-v2.png"] },
  };
}

export default function FireCrystalsPage() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Whiteout Survival Fire Crystal Calculator",
      "applicationCategory": "GameApplication",
      "operatingSystem": "Web",
      "description": "Calculate Fire Crystal requirements, resource costs, and prerequisites for FC1 to FC10 upgrades in Whiteout Survival.",
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
          "name": "How do I unlock Fire Crystals?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "The Fire Crystal system unlocks on your server around Day 60. To use them, your Furnace, Embassy, and Research Center must all be upgraded to Level 30."
          }
        },
        {
          "@type": "Question",
          "name": "How do I get more Fire Crystals?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "The best F2P methods for obtaining Fire Crystals are completing your Daily Missions, Intel Missions, and participating in major events like State vs. State (SvS) and Flame and Fangs."
          }
        },
        {
          "@type": "Question",
          "name": "What are Refined Fire Crystals?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Refined Fire Crystals are an advanced material needed for upgrades starting at Furnace FC6. You can obtain them by converting standard Fire Crystals and other resources in the Crystal Laboratory building."
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
      <HomeApp initialMenu="fireCrystals" />
    </>
  );
}
