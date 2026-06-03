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

const siteTitle = "Whiteout Survival Tools & WOS Discord Bot";
const siteDescription =
  "Use Whiteout Survival tools for gift codes, state age tracking, chief gear and charm calculators, Foundry planning, WOS wiki data, and Discord bot automation.";

export const metadata: Metadata = {
  metadataBase: new URL("https://whiteoutsurvival.dev"),
  title: {
    default: siteTitle,
    template: "%s | WhiteoutSurvival.dev",
  },
  description: siteDescription,
  applicationName: "WhiteoutSurvival.dev",
  keywords: [
    "Whiteout Survival",
    "Whiteout Survival gift codes",
    "WOS gift codes",
    "Whiteout Survival tools",
    "Whiteout Survival chief gear calculator",
    "Whiteout Survival chief charm calculator",
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
    url: "/",
    siteName: "WhiteoutSurvival.dev",
    title: siteTitle,
    description: siteDescription,
    images: [
      {
        url: "/social-preview-v2.png",
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
    images: ["/social-preview-v2.png"],
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
        <SecurityDeterrents />
        {children}
      </body>
    </html>
  );
}
