import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SecurityDeterrents } from "./security-deterrents";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteTitle = "Whiteout Survival Tools & Discord Bot | WhiteoutSurvival.dev";
const siteDescription =
  "Whiteout Survival tools for gift codes, state age, chief gear and charm calculators, Foundry planning, WOS wiki data, and Discord bot automation.";
const siteNavigationItems = [
  ["Home", "https://whiteoutsurvival.dev/"],
  ["Gift Codes", "https://whiteoutsurvival.dev/gift-codes"],
  ["Gift Code Redeem", "https://whiteoutsurvival.dev/redeem"],
  ["State Age Tracker", "https://whiteoutsurvival.dev/state-age"],
  ["VIP Calculator", "https://whiteoutsurvival.dev/vip-calculator"],
  ["Chief Gear Calculator", "https://whiteoutsurvival.dev/chief-gear-calculator"],
  ["Chief Charm Calculator", "https://whiteoutsurvival.dev/chief-charm-calculator"],
  ["SvS Appointment Planner", "https://whiteoutsurvival.dev/svs-appointment-planner"],
  ["WOS Game Map", "https://whiteoutsurvival.dev/game-map"],
  ["Foundry Team Planner", "https://whiteoutsurvival.dev/foundry-team-planner"],
  ["Message Templates", "https://whiteoutsurvival.dev/message-templates"],
  ["Heroes Wiki", "https://whiteoutsurvival.dev/wiki/heroes"],
  ["Buildings Wiki", "https://whiteoutsurvival.dev/wiki/buildings"],
  ["Daybreak Island Layouts", "https://whiteoutsurvival.dev/daybreak-island"],
  ["Dreamscape Memory", "https://whiteoutsurvival.dev/dreamscape-memory"],
  ["Sneak Peek", "https://whiteoutsurvival.dev/sneak-peek"],
  ["Discord Bot", "https://whiteoutsurvival.dev/discord-bot"],
  ["Site Map", "https://whiteoutsurvival.dev/site-map"],
  ["API Docs", "https://whiteoutsurvival.dev/api-docs"],
  ["Privacy Policy", "https://whiteoutsurvival.dev/privacy-policy"],
  ["Terms of Service", "https://whiteoutsurvival.dev/terms-of-service"],
] as const;

const siteNavigationJsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "WhiteoutSurvival.dev menu pages",
  itemListElement: siteNavigationItems.map(([name, url], index) => ({
    "@type": "SiteNavigationElement",
    position: index + 1,
    name,
    url,
  })),
};

export const metadata: Metadata = {
  metadataBase: new URL("https://whiteoutsurvival.dev"),
  title: {
    default: siteTitle,
    template: "%s | WhiteoutSurvival.dev",
  },
  description: siteDescription,
  applicationName: "WhiteoutSurvival.dev",
  alternates: {
    canonical: "https://whiteoutsurvival.dev/",
  },
  keywords: [
    "Whiteout Survival",
    "Whiteout Survival gift codes",
    "WOS gift codes",
    "Whiteout Survival tools",
    "Whiteout Survival chief gear calculator",
    "Whiteout Survival chief charm calculator",
    "Whiteout Survival SvS appointment planner",
    "Whiteout Survival state age",
    "Whiteout Survival Discord bot",
    "WOS wiki",
  ],
  authors: [{ name: "WhiteoutSurvival.dev" }],
  creator: "WhiteoutSurvival.dev",
  publisher: "WhiteoutSurvival.dev",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/wos-logo.png",
  },
  openGraph: {
    type: "website",
    url: "https://whiteoutsurvival.dev/",
    siteName: "WhiteoutSurvival.dev",
    title: siteTitle,
    description: siteDescription,
    images: [
      {
        url: "https://whiteoutsurvival.dev/social-preview-v2.png",
        width: 1200,
        height: 630,
        alt: "Whiteout Survival tools, guides, calculators, planners, and Discord bot preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: ["https://whiteoutsurvival.dev/social-preview-v2.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteNavigationJsonLd) }}
        />
        <SecurityDeterrents />
        {children}
      </body>
    </html>
  );
}
