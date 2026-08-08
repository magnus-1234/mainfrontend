import { NextResponse } from "next/server";
import { apiAttribution } from "../../attribution";

const backendCandidates = [
  process.env.BACKEND_URL,
  "http://localhost:3001",
  "https://bot.whiteoutsurvival.dev",
  process.env.NEXT_PUBLIC_API_BASE_URL,
].filter(Boolean) as string[];

export async function POST(request: Request) {
  try {
    const { playerId } = await request.json();

    if (!playerId) {
      return NextResponse.json({ error: "Player ID is required" }, { status: 400 });
    }

    for (const backendUrl of backendCandidates) {
      try {
        // Try the Node.js backend Daybreak player info endpoint first (fastest locally)
        try {
          const daybreakResponse = await fetch(`${backendUrl.replace(/\/$/, "")}/api/daybreak/players/${playerId}`, {
            method: "GET",
            headers: { Accept: "application/json" },
            signal: AbortSignal.timeout(5000)
          });
          
          if (daybreakResponse.ok) {
            const payload = await daybreakResponse.json().catch(() => null);
            if (payload?.player) {
              return NextResponse.json({
                player: payload.player,
                attribution: apiAttribution
              });
            }
          }
        } catch (e) {
          // Fall back to Python endpoint
        }

        // Try the Python backend gift-codes player-info endpoint
        const response = await fetch(`${backendUrl.replace(/\/$/, "")}/api/giftcodes/player-info`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ id: playerId }),
          signal: AbortSignal.timeout(5000)
        });
        
        const payload = await response.json().catch(() => null);
        
        if (response.ok && payload?.data) {
          return NextResponse.json({
            player: {
              playerId: payload.data.id,
              nickname: payload.data.nickname,
              furnaceLevel: payload.data.furnace_lv,
              furnaceLevelFormatted: payload.data.furnace_lv_formatted,
              avatarImage: payload.data.avatar_image,
              stateId: payload.data.stateId,
            },
            attribution: apiAttribution
          });
        }
        
        if (payload?.detail) {
             return NextResponse.json({ error: payload.detail }, { status: response.status });
        }
      } catch (err) {
        continue;
      }
    }

    return NextResponse.json(
      { error: "Player lookup service is temporarily unavailable." },
      { status: 503 },
    );
  } catch (error) {
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }
}
