import { NextResponse } from "next/server";
import { apiAttribution } from "../../attribution";

const backendCandidates = [
  "https://bot.whiteoutsurvival.dev",
  process.env.BACKEND_URL,
  process.env.NEXT_PUBLIC_API_BASE_URL,
  "http://localhost:8080",
].filter(Boolean) as string[];

export async function POST(request: Request) {
  const body = await request.text();

  for (const backendUrl of backendCandidates) {
    try {
      const response = await fetch(`${backendUrl.replace(/\/$/, "")}/api/giftcodes/player-info`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body,
      });
      const payload = await response.json().catch(() => null);
      return NextResponse.json(
        payload && typeof payload === "object"
          ? { ...payload, attribution: apiAttribution }
          : { attribution: apiAttribution, data: payload },
        { status: response.status },
      );
    } catch {
      continue;
    }
  }

  return NextResponse.json(
    { attribution: apiAttribution, status: "error", message: "Player lookup service is temporarily unavailable." },
    { status: 503 },
  );
}
