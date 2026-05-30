import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  async rewrites() {
    return [
      {
        source: "/api/daybreak/:path*",
        destination: "http://140.245.201.209:3001/api/daybreak/:path*",
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
