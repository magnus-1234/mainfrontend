import type { Metadata } from "next";
import { HomeApp } from "../HomeApp";
import { DiscordBotSeoContent } from "./DiscordBotSeoContent";

const title = "Whiteout Survival Discord Bot | WhiteoutSurvival.dev";
const description =
  "Free Whiteout Survival Discord bot for WOS alliances. Auto gift code redeem, alliance activity monitoring, DeepL translation, smart reminders, AI chat, and web dashboard. Add to your server instantly.";

const pageUrl = "https://whiteoutsurvival.dev/discord-bot";
const botImageUrl = "https://whiteoutsurvival.dev/bot-preview-dashboard-reference.png";

// ── Schema: SoftwareApplication ─────────────────────────────────────────────
const softwareAppSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Whiteout Survival Discord Bot",
  url: pageUrl,
  applicationCategory: "GameApplication",
  operatingSystem: "Discord",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  description:
    "A free Discord bot for Whiteout Survival (WOS) alliances. Features include: automatic gift code alerts and redemption, alliance activity monitoring (furnace level-ups, name changes, avatar changes), DeepL auto-translation, smart event reminders, AI chat, image generation, music system, admin tools, and a web dashboard at bot.whiteoutsurvival.dev.",
  image: botImageUrl,
  author: {
    "@type": "Organization",
    name: "WhiteoutSurvival.dev",
    url: "https://whiteoutsurvival.dev/",
  },
  featureList: [
    "Automatic WOS gift code detection and redemption",
    "Alliance activity monitoring (furnace level-ups, name changes, avatar changes)",
    "DeepL-powered auto-translation for Discord channels (/autotranslatecreate)",
    "Event information and server age tracking",
    "Minister appointment management",
    "AI web search with source citations (/websearch)",
    "Text-to-speech in voice channels (/tts)",
    "Welcome messages and admin tools",
    "Web dashboard at bot.whiteoutsurvival.dev",
    "Alliance member management via !Add and !Remove commands",
  ],
};

// ── Schema: FAQPage ──────────────────────────────────────────────────────────
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is the Whiteout Survival Discord bot?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The Whiteout Survival Discord bot is a free bot built for WOS alliance Discord servers. It provides automated gift code alerts and redemption, alliance activity monitoring (furnace level-ups, name changes, avatar changes), DeepL auto-translation, event information, AI web search, text-to-speech, admin tools, and a web dashboard at bot.whiteoutsurvival.dev — all designed for the Whiteout Survival game community.",
      },
    },
    {
      "@type": "Question",
      name: "How do I add the Whiteout Survival bot to my Discord server?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Click 'Add to Discord' on whiteoutsurvival.dev/discord-bot and authorize the bot for your server. You need Manage Server permissions. Once added, run /manage in any channel to register your alliance server with the bot and access all management operations.",
      },
    },
    {
      "@type": "Question",
      name: "Does the bot support auto gift code redeem for WOS?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. The bot detects new Whiteout Survival gift codes automatically and redeems them for all configured members in your server. Set up auto-redeem through the /settings menu or via the web dashboard at bot.whiteoutsurvival.dev.",
      },
    },
    {
      "@type": "Question",
      name: "Is the Whiteout Survival Discord bot free?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, the bot is completely free to add and use. There are no paywalls — all features including gift code auto-redeem, alliance monitoring, translation, and the web dashboard are available at no cost.",
      },
    },
    {
      "@type": "Question",
      name: "What commands does the WOS Discord bot have?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Key slash commands include /manage (register alliance server + manage all operations), /start (main menu), /alliancemonitor (alliance tracking dashboard), /autotranslatecreate (set up DeepL translation), /autotranslatelist, /autotranslatedelete, /autotranslatetoggle, /autotranslateedit (translation management), /welcome (welcome messages), /event (WOS event info), /server_age (state age check), /ministerappointment, /websearch (AI web search), /tts (text-to-speech), and /tictactoe. Alliance members are managed with prefix commands !Add and !Remove by FID.",
      },
    },
    {
      "@type": "Question",
      name: "What does the WOS alliance activity monitor track?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The alliance monitor (opened with /alliancemonitor) tracks furnace level-ups (FC tracking), player name changes, avatar changes, and alliance membership changes. Add members with the !Add [FID] prefix command, where FID is the player's WOS Furnace ID.",
      },
    },
    {
      "@type": "Question",
      name: "How do I set up automatic translation in my Discord server?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Use /autotranslatecreate to set up DeepL-powered translation between two channels. Manage existing setups with /autotranslatelist, /autotranslatetoggle to enable/disable, and /autotranslateedit to modify. Ideal for multilingual WOS alliance servers.",
      },
    },
    {
      "@type": "Question",
      name: "What is the WOS bot web dashboard?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The web dashboard at bot.whiteoutsurvival.dev lets you manage all bot settings from a browser — no Discord commands needed. Configure auto-redeem, alliance monitors, event reminders, and server settings from a clean web interface.",
      },
    },
  ],
};

// ── Schema: WebPage ──────────────────────────────────────────────────────────
const webPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": `${pageUrl}#webpage`,
  url: pageUrl,
  name: title,
  description,
  isPartOf: { "@id": "https://whiteoutsurvival.dev/#website" },
  primaryImageOfPage: {
    "@type": "ImageObject",
    url: botImageUrl,
    width: 1200,
    height: 630,
  },
  breadcrumb: {
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://whiteoutsurvival.dev/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Discord Bot",
        item: pageUrl,
      },
    ],
  },
};

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: pageUrl },
  keywords: [
    "Whiteout Survival Discord bot",
    "WOS Discord bot",
    "Whiteout Survival bot",
    "WOS bot",
    "Whiteout Survival gift code bot",
    "WOS auto redeem bot",
    "Whiteout Survival alliance monitor bot",
    "WOS alliance tracker Discord",
    "Whiteout Survival auto redeem Discord",
    "WOS gift code alert bot",
    "Whiteout Survival translation bot",
    "free WOS Discord bot",
    "Whiteout Survival reminder bot",
    "WOS bot commands",
    "Whiteout Survival Discord server bot",
  ],
  openGraph: {
    type: "website",
    url: pageUrl,
    siteName: "WhiteoutSurvival.dev",
    title,
    description,
    images: [
      {
        url: botImageUrl,
        width: 1200,
        height: 630,
        alt: "Whiteout Survival Discord bot dashboard preview — gift code alerts, alliance monitor, auto-redeem",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [botImageUrl],
  },
};

export default function DiscordBotPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />
      <HomeApp initialMenu="bot" />
      <DiscordBotSeoContent />
    </>
  );
}
