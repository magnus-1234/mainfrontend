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
