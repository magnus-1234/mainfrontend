import { NextRequest, NextResponse } from "next/server";

const previewCrawlerPattern =
  /discordbot|whatsapp|facebookexternalhit|twitterbot|telegrambot|slackbot|linkedinbot|embedly|pinterest/i;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname !== "/") {
    return NextResponse.next();
  }

  const userAgent = request.headers.get("user-agent") || "";

  if (!previewCrawlerPattern.test(userAgent)) {
    return NextResponse.next();
  }

  const shareUrl = request.nextUrl.clone();
  shareUrl.pathname = "/share";

  return NextResponse.rewrite(shareUrl);
}

export const config = {
  matcher: "/",
};
