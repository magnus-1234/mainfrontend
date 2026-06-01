import { NextResponse } from "next/server";

const backendCandidates = [
  process.env.BACKEND_URL,
  process.env.NEXT_PUBLIC_API_BASE_URL,
  "http://localhost:3001",
  "http://140.245.201.209:3001",
].filter(Boolean) as string[];

export async function POST(request: Request) {
  const body = await request.text();

  for (const backendUrl of backendCandidates) {
    try {
      const response = await fetch(`${backendUrl.replace(/\/$/, "")}/api/gift-codes/redeem`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body,
      });
      const payload = await response.json().catch(() => null);
      return NextResponse.json(payload, { status: response.status });
    } catch {
      continue;
    }
  }

  return NextResponse.json({ state: "error", message: "Redeem service is temporarily unavailable." }, { status: 503 });
}
