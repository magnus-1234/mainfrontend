import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

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
  "The ultimate toolkit for Whiteout Survival. Access powerful tools, detailed guides, and an advanced Discord bot. Plan smarter, grow faster, and stay ahead of the competition.";

export const metadata: Metadata = {
  metadataBase: new URL("https://whiteoutsurvival.dev"),
  title: {
    default: siteTitle,
    template: "%s | WhiteoutSurvival.dev",
  },
  description: siteDescription,
  applicationName: "WhiteoutSurvival.dev",
  alternates: {
    canonical: "/",
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
        url: "/social-preview.png",
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
    images: ["/social-preview.png"],
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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
