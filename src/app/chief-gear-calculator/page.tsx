import type { Metadata } from "next";
import { HomeApp } from "../HomeApp";

export async function generateMetadata(): Promise<Metadata> {
  const date = new Date();
  const month = date.toLocaleString('default', { month: 'long' });
  const year = date.getFullYear();

  const title = `Whiteout Survival Gear Calculator (${month} ${year})`;
  const description =
    `Whiteout Survival chief gear calculator for upgrade costs, material shortfalls, stat gains, and WOS gear planning across every chief slot and level (${month} ${year}).`;

  return {
    title,
    description,
    alternates: { canonical: "https://whiteoutsurvival.dev/chief-gear-calculator" },
    openGraph: { type: "website", url: "https://whiteoutsurvival.dev/chief-gear-calculator", siteName: "WhiteoutSurvival.dev", title, description, images: ["https://whiteoutsurvival.dev/social-preview-v2.png"] },
    twitter: { card: "summary_large_image", title, description, images: ["https://whiteoutsurvival.dev/social-preview-v2.png"] },
  };
}

export default function ChiefGearCalculatorPage() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Whiteout Survival Chief Gear Calculator",
      "applicationCategory": "GameApplication",
      "operatingSystem": "Web",
      "description": "Calculate upgrade costs, material shortfalls, and stat gains for Chief Gear in Whiteout Survival.",
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
          "name": "How do I unlock Chief Gear?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Chief Gear becomes available once your Furnace reaches Level 22. It provides permanent Attack and Defense buffs to all your troop marches."
          }
        },
        {
          "@type": "Question",
          "name": "Which Chief Gear should I upgrade first?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "It is highly recommended to prioritize your Infantry gear first because they act as your frontline tanks in battle. Marksman gear should be your secondary focus for damage, with Lancers being upgraded last."
          }
        },
        {
          "@type": "Question",
          "name": "Where do I get Hardened Alloy and Design Plans?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Hardened Alloy drops from Level 3+ Polar Terror rallies and Level 22+ Beasts. Design Plans can be purchased in the Alliance Championship Shop, Foundry Shop, and earned during events like Crazy Joe."
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
      <HomeApp initialMenu="chiefGear" />
    </>
  );
}
