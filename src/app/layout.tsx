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
const siteUrl = "https://whiteoutsurvival.dev";
const siteLogoUrl = `${siteUrl}/site-logo-512.png`;
const siteNavigationItems = [
  ["Home", `${siteUrl}/`],
  ["Gift Codes", `${siteUrl}/gift-codes`],
  ["Gift Code Redeem", `${siteUrl}/redeem`],
  ["State Age Tracker", `${siteUrl}/state-age`],
  ["VIP Calculator", `${siteUrl}/vip-calculator`],
  ["Chief Gear Calculator", `${siteUrl}/chief-gear-calculator`],
  ["Chief Charm Calculator", `${siteUrl}/chief-charm-calculator`],
  ["SvS Appointment Planner", `${siteUrl}/svs-appointment-planner`],
  ["WOS Game Map", `${siteUrl}/game-map`],
  ["Foundry Team Planner", `${siteUrl}/foundry-team-planner`],
  ["Message Templates", `${siteUrl}/message-templates`],
  ["Heroes Wiki", `${siteUrl}/wiki/heroes`],
  ["Buildings Wiki", `${siteUrl}/wiki/buildings`],
  ["Daybreak Island Layouts", `${siteUrl}/daybreak-island`],
  ["Dreamscape Memory", `${siteUrl}/dreamscape-memory`],
  ["Sneak Peek", `${siteUrl}/sneak-peek`],
  ["Discord Bot", `${siteUrl}/discord-bot`],
  ["Site Map", `${siteUrl}/site-map`],
  ["API Docs", `${siteUrl}/api-docs`],
  ["Privacy Policy", `${siteUrl}/privacy-policy`],
  ["Terms of Service", `${siteUrl}/terms-of-service`],
] as const;

const siteIdentityJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "WhiteoutSurvival.dev",
      url: `${siteUrl}/`,
      logo: {
        "@type": "ImageObject",
        url: siteLogoUrl,
        width: 512,
        height: 512,
      },
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      name: "WhiteoutSurvival.dev",
      url: `${siteUrl}/`,
      publisher: {
        "@id": `${siteUrl}/#organization`,
      },
    },
  ],
};

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
  metadataBase: new URL(siteUrl),
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
  manifest: "/site.webmanifest",
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
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-48x48.png", type: "image/png", sizes: "48x48" },
      { url: "/icon-192x192.png", type: "image/png", sizes: "192x192" },
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/icon-192x192.png", type: "image/png", sizes: "192x192" }],
  },
  openGraph: {
    type: "website",
    url: `${siteUrl}/`,
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
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteIdentityJsonLd) }}
        />
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
