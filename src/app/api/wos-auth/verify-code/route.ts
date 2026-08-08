import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { playerId, code } = await request.json();

    if (!playerId || !code) {
      return NextResponse.json({ error: "Player ID and Verification Code are required" }, { status: 400 });
    }

    const backendUrl = process.env.BACKEND_URL || "http://localhost:3001";
    
    const response = await fetch(`${backendUrl}/api/wos-auth/verify-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ playerId, code }),
      signal: AbortSignal.timeout(60000) // The headless browser automation can take up to 60s
    });

    const payload = await response.json().catch(() => null);

    if (response.ok && payload) {
      return NextResponse.json(payload);
    }
    
    if (payload?.error) {
      return NextResponse.json({ error: payload.error }, { status: response.status });
    }

    return NextResponse.json(
      { error: "Authentication service is temporarily unavailable." },
      { status: response.status || 503 }
    );
  } catch (error: any) {
    console.error("[verify-code route] Error:", error.message);
    return NextResponse.json({ error: error.message || "Invalid request payload" }, { status: 500 });
  }
}
