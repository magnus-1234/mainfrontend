import { NextRequest, NextResponse } from "next/server";

const blockedUserAgentPatterns = [
  /ahrefs/i,
  /archive\.org/i,
  /baiduspider/i,
  /bot\b/i,
  /crawler/i,
  /curl/i,
  /facebookexternalhit/i,
  /go-http-client/i,
  /headless/i,
  /httpclient/i,
  /libwww-perl/i,
  /lighthouse/i,
  /masscan/i,
  /nikto/i,
  /nmap/i,
  /petalbot/i,
  /python-requests/i,
  /scrapy/i,
  /semrush/i,
  /slurp/i,
  /spider/i,
  /wget/i,
  /yandex/i,
  /zgrab/i,
];

const blockedPathPatterns = [
  /^\/\.env(?:$|[/?#])/i,
  /^\/\.git(?:$|\/)/i,
  /^\/\.svn(?:$|\/)/i,
  /^\/\.hg(?:$|\/)/i,
  /^\/(?:wp-admin|wp-login\.php|xmlrpc\.php)(?:$|[/?#])/i,
  /^\/(?:phpmyadmin|pma|adminer)(?:$|[/?#])/i,
  /^\/(?:config|backup|dump|database|db)(?:\.|\/|$)/i,
  /\.(?:bak|backup|conf|config|env|ini|log|old|orig|sql|sqlite|swp|tar|tgz|zip)(?:$|[?#])/i,
];

const guardedApiPrefixes = [
  "/api/gift-codes/redeem",
  "/api/gift-codes/captcha",
  "/api/daybreak",
  "/api/message-templates",
  "/api/profile",
  "/api/auth",
];

const blockedResponseHeaders = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet, noimageindex",
};

const isLikelyAutomated = (request: NextRequest) => {
  const userAgent = request.headers.get("user-agent") || "";
  const accept = request.headers.get("accept") || "";
  const secFetchMode = request.headers.get("sec-fetch-mode");
  const path = request.nextUrl.pathname;

  if (blockedUserAgentPatterns.some((pattern) => pattern.test(userAgent))) {
    return true;
  }

  if (blockedPathPatterns.some((pattern) => pattern.test(path))) {
    return true;
  }

  if (guardedApiPrefixes.some((prefix) => path.startsWith(prefix))) {
    const acceptsJson = accept.includes("application/json") || accept.includes("*/*");
    const browserNavigation = secFetchMode === "navigate";
    return !acceptsJson && !browserNavigation;
  }

  return false;
};

export function middleware(request: NextRequest) {
  if (isLikelyAutomated(request)) {
    return new NextResponse("Forbidden", {
      status: 403,
      headers: blockedResponseHeaders,
    });
  }

  const response = NextResponse.next();
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet, noimageindex");
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:avif|gif|ico|jpg|jpeg|png|svg|webp|woff|woff2)$).*)",
  ],
};
