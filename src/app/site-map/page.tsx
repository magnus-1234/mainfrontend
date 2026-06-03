import type { Metadata } from "next";
import Link from "next/link";

const title = "Whiteout Survival Website Site Map";
const description =
  "Whiteout Survival site map with direct links to gift codes, calculators, wiki pages, planners, Discord bot tools, API docs, legal pages, and guides.";

const pages = [
  ["Home", "/"],
  ["Gift Codes", "/gift-codes"],
  ["Redeem Codes", "/redeem"],
  ["State Age Tracker", "/state-age"],
  ["VIP Calculator", "/vip-calculator"],
  ["Chief Gear Calculator", "/chief-gear-calculator"],
  ["Chief Charm Calculator", "/chief-charm-calculator"],
  ["Foundry Team Planner", "/foundry-team-planner"],
  ["Message Templates", "/message-templates"],
  ["Heroes Wiki", "/wiki/heroes"],
  ["Buildings Wiki", "/wiki/buildings"],
  ["Daybreak Island Layouts", "/daybreak-island"],
  ["Dreamscape Memory", "/dreamscape-memory"],
  ["Sneak Peek", "/sneak-peek"],
  ["Discord Bot", "/discord-bot"],
  ["API Documentation", "/api-docs"],
  ["Share Tools", "/share"],
  ["Privacy Policy", "/privacy-policy"],
  ["Terms of Service", "/terms-of-service"],
] as const;

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "https://whiteoutsurvival.dev/site-map",
  },
  openGraph: { type: "website", url: "https://whiteoutsurvival.dev/site-map", siteName: "WhiteoutSurvival.dev", title, description, images: ["https://whiteoutsurvival.dev/social-preview-v2.png"] },
  twitter: { card: "summary_large_image", title, description, images: ["https://whiteoutsurvival.dev/social-preview-v2.png"] },
};

export default function SiteMapPage() {
  return (
    <main className="legal-page">
      <section className="legal-hero">
        <Link className="legal-back-link" href="/">WhiteoutSurvival.dev</Link>
        <p className="legal-kicker">Indexable page directory</p>
        <h1>Whiteout Survival Website Site Map</h1>
        <p>Use this page to find every public WhiteoutSurvival.dev tool, guide, calculator, wiki page, and policy page.</p>
      </section>

      <section className="legal-card">
        <h2>All Public Pages</h2>
        <ul>
          {pages.map(([label, href]) => (
            <li key={href}>
              <Link href={href}>{label}</Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
