import type { NextConfig } from "next";

const backendUrl = process.env.BACKEND_URL || "http://140.245.201.209:3001";

const nextConfig: NextConfig = {
  devIndicators: false,
  async rewrites() {
    return [
      {
        source: "/daybreak/island/:id",
        destination: "/?menu=daybreak&island=:id",
      },
      {
        source: "/gift-codes",
        destination: "/?menu=gift-codes",
      },
      {
        source: "/redeem",
        destination: "/?menu=redeem",
      },
      {
        source: "/state-age",
        destination: "/?menu=state-age",
      },
      {
        source: "/chief-charm-calculator",
        destination: "/?menu=chief-charm-calculator",
      },
      {
        source: "/chief-charms",
        destination: "/?menu=chief-charms",
      },
      {
        source: "/chief-gear-calculator",
        destination: "/?menu=chief-gear-calculator",
      },
      {
        source: "/chief-gear",
        destination: "/?menu=chief-gear",
      },
      {
        source: "/message-templates",
        destination: "/?menu=message-templates",
      },
      {
        source: "/wiki/heroes",
        destination: "/?menu=heroes",
      },
      {
        source: "/wiki/buildings",
        destination: "/?menu=buildings",
      },
      {
        source: "/api/gift-codes",
        destination: `${backendUrl}/api/gift-codes`,
      },
      {
        source: "/api/gift-codes/:path*",
        destination: `${backendUrl}/api/gift-codes/:path*`,
      },
      {
        source: "/api/daybreak/:path*",
        destination: `${backendUrl}/api/daybreak/:path*`,
      },
      {
        source: "/api/auth/:path*",
        destination: `${backendUrl}/api/auth/:path*`,
      },
      {
        source: "/api/profile/:path*",
        destination: `${backendUrl}/api/profile/:path*`,
      },
      {
        source: "/api/bot-status",
        destination: "https://bot.whiteoutsurvival.dev/api/status",
      },
      {
        source: "/api/bot-feed",
        destination: "https://bot.whiteoutsurvival.dev/api/bot-feed",
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-6db6c60bc8b84abdb260b11065d4da41.r2.dev",
      },
    ],
  },
};

export default nextConfig;
