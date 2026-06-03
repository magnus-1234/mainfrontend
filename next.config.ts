import type { NextConfig } from "next";

const backendUrl = process.env.BACKEND_URL || "http://140.245.201.209:3001";
const isProduction = process.env.NODE_ENV === "production";

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net${isProduction ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://api.qrserver.com https://pub-6db6c60bc8b84abdb260b11065d4da41.r2.dev https://*.googleusercontent.com https://cdn.discordapp.com https://media.discordapp.net",
  "font-src 'self' data:",
  [
    "connect-src 'self'",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://[::1]:3001",
    "http://140.245.201.209:3001",
    "https://bot.whiteoutsurvival.dev",
    "https://wostools.net",
    "https://api.qrserver.com",
    "https://pub-6db6c60bc8b84abdb260b11065d4da41.r2.dev",
    "ws://localhost:*",
    "ws://127.0.0.1:*",
  ].join(" "),
  "frame-ancestors 'none'",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "manifest-src 'self'",
  "worker-src 'self' blob:",
].join("; ");

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: contentSecurityPolicy,
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), bluetooth=(), browsing-topics=()",
  },
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin",
  },
  {
    key: "Cross-Origin-Resource-Policy",
    value: "same-origin",
  },
  {
    key: "X-DNS-Prefetch-Control",
    value: "off",
  },
  {
    key: "X-Permitted-Cross-Domain-Policies",
    value: "none",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  devIndicators: false,
  productionBrowserSourceMaps: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/giftcodes",
        destination: "/gift-codes",
        permanent: true,
      },
      {
        source: "/stateage",
        destination: "/state-age",
        permanent: true,
      },
      {
        source: "/chief-gear",
        destination: "/chief-gear-calculator",
        permanent: true,
      },
      {
        source: "/chief-charms",
        destination: "/chief-charm-calculator",
        permanent: true,
      },
      {
        source: "/discordbot",
        destination: "/discord-bot",
        permanent: true,
      },
      {
        source: "/foundry",
        destination: "/foundry-team-planner",
        permanent: true,
      },
      {
        source: "/foundry-planner",
        destination: "/foundry-team-planner",
        permanent: true,
      },
      {
        source: "/svs-planner",
        destination: "/svs-appointment-planner",
        permanent: true,
      },
      {
        source: "/daybreak",
        destination: "/daybreak-island",
        permanent: true,
      },
      {
        source: "/dreamscape",
        destination: "/dreamscape-memory",
        permanent: true,
      },
    ];
  },
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
        source: "/foundry-team-planner",
        destination: "/?menu=planner",
      },
      {
        source: "/svs-appointment-planner",
        destination: "/?menu=svs-appointment-planner",
      },
      {
        source: "/chief-charm-calculator",
        destination: "/?menu=chief-charm-calculator",
      },
      {
        source: "/chief-gear-calculator",
        destination: "/?menu=chief-gear-calculator",
      },
      {
        source: "/message-templates",
        destination: "/?menu=message-templates",
      },
      {
        source: "/sneak-peek",
        destination: "/?menu=sneak",
      },
      {
        source: "/daybreak-island",
        destination: "/?menu=daybreak",
      },
      {
        source: "/discord-bot",
        destination: "/?menu=bot",
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
