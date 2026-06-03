import { NextResponse } from "next/server";

const allowedHostSuffixes = [
  "akamaized.net",
  "centurygame.com",
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get("url");
  if (!target) {
    return NextResponse.json({ error: "Missing avatar URL." }, { status: 400 });
  }

  let url: URL;
  try {
    url = new URL(target);
  } catch {
    return NextResponse.json({ error: "Invalid avatar URL." }, { status: 400 });
  }

  if (!["http:", "https:"].includes(url.protocol) || !allowedHostSuffixes.some((suffix) => url.hostname === suffix || url.hostname.endsWith(`.${suffix}`))) {
    return NextResponse.json({ error: "Avatar host is not allowed." }, { status: 400 });
  }

  const response = await fetch(url, {
    headers: {
      Referer: "https://whiteoutsurvival.centurygame.com/",
      "User-Agent": "Mozilla/5.0",
    },
  });

  if (!response.ok || !response.body) {
    return NextResponse.json({ error: "Avatar could not be loaded." }, { status: 502 });
  }

  return new NextResponse(response.body, {
    headers: {
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      "Content-Type": response.headers.get("content-type") || "image/png",
    },
  });
}
