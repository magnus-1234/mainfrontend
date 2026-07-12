import { NextResponse } from "next/server";
import { apiAttribution } from "../../attribution";

const backendCandidates = [
  "https://bot.whiteoutsurvival.dev",
  process.env.BACKEND_URL,
  process.env.NEXT_PUBLIC_API_BASE_URL,
  "http://localhost:8080",
].filter(Boolean) as string[];

export async function POST(request: Request) {
  try {
    const { playerId } = await request.json();

    if (!playerId) {
      return NextResponse.json({ error: "Player ID is required" }, { status: 400 });
    }

    // Call the Python backend gift-codes player-info endpoint, since it fetches the player profile
    // using the bot's internal WOS game API.
    for (const backendUrl of backendCandidates) {
      try {
        const response = await fetch(`${backendUrl.replace(/\/$/, "")}/api/giftcodes/player-info`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ id: playerId }),
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
              // The backend API might not return stateId currently
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
