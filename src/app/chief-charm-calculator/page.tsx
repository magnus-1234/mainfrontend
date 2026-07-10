import type { Metadata } from "next";
import { HomeApp } from "../HomeApp";

export async function generateMetadata(): Promise<Metadata> {
  const date = new Date();
  const month = date.toLocaleString('default', { month: 'long' });
  const year = date.getFullYear();

  const title = `Whiteout Survival Charm Calculator (${month} ${year})`;
  const description =
    `Whiteout Survival chief charm calculator for material totals, charm slot costs, power gains, and troop stat upgrades for Infantry, Lancer, and Marksman (${month} ${year}).`;

  return {
    title,
    description,
    alternates: { canonical: "https://whiteoutsurvival.dev/chief-charm-calculator" },
    openGraph: { type: "website", url: "https://whiteoutsurvival.dev/chief-charm-calculator", siteName: "WhiteoutSurvival.dev", title, description, images: ["https://whiteoutsurvival.dev/social-preview-v2.png"] },
    twitter: { card: "summary_large_image", title, description, images: ["https://whiteoutsurvival.dev/social-preview-v2.png"] },
  };
}

export default function ChiefCharmCalculatorPage() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Whiteout Survival Chief Charm Calculator",
      "applicationCategory": "GameApplication",
      "operatingSystem": "Web",
      "description": "Calculate material totals, charm slot costs, and stat gains for Chief Charms in Whiteout Survival.",
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
          "name": "How do I unlock Chief Charms?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Chief Charms unlock when your Furnace reaches Level 25. Unlike Chief Gear which provides Attack and Defense, Charms provide essential Lethality and Health stats to your troops."
          }
        },
        {
          "@type": "Question",
          "name": "Which Chief Charms should I prioritize?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Always prioritize Marksman charms first. They boost Lethality, which is crucial for maximizing your damage output in events like the Bear Trap. Infantry charms are the second priority for F2P players."
          }
        },
        {
          "@type": "Question",
          "name": "How do I unlock the Charm Material Exchange?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Once you upgrade at least one Chief Charm to Level 11, the Chief Charm Material Exchange unlocks. This F2P-friendly feature allows you to trade common materials for rarer ones like Charm Guides."
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
      <HomeApp initialMenu="chiefCharm" />
    </>
  );
}
