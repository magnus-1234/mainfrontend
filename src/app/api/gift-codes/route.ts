import { NextResponse } from "next/server";

const backendCandidates = [
  process.env.BACKEND_URL,
  process.env.NEXT_PUBLIC_API_BASE_URL,
  "http://localhost:3001",
  "http://140.245.201.209:3001",
].filter(Boolean) as string[];

export async function GET() {
  for (const backendUrl of backendCandidates) {
    try {
      const response = await fetch(`${backendUrl.replace(/\/$/, "")}/api/gift-codes`, {
        headers: { Accept: "application/json" },
        next: { revalidate: 30 },
      });

      if (!response.ok) {
        continue;
      }

      const payload = await response.json();
      return NextResponse.json(payload, {
        headers: {
          "Cache-Control": "public, max-age=30, s-maxage=30, stale-while-revalidate=120",
        },
      });
    } catch {
      continue;
    }
  }

  return NextResponse.json(
    {
      codes: [],
      lastUpdated: new Date().toISOString(),
      error: "Gift codes are temporarily unavailable.",
    },
    { status: 503 },
  );
}
