import { NextResponse } from "next/server";
import { apiAttribution } from "../attribution";

export const dynamic = "force-dynamic";

const botApiBase = (process.env.BOT_DASHBOARD_API_URL || "https://bot.whiteoutsurvival.dev").replace(/\/+$/, "");

const numberFrom = (...values: unknown[]) => {
  for (const value of values) {
    const number = Number(value);
    if (Number.isFinite(number)) {
      return number;
    }
  }
  return 0;
};

const countActiveGiftCodes = (feed: Record<string, unknown>, summary: Record<string, unknown>) => {
  const giftCodes = Array.isArray(feed.gift_codes) ? feed.gift_codes : null;
  if (giftCodes) {
    return giftCodes.filter((item) => {
      if (!item || typeof item !== "object") {
        return false;
      }
      return String((item as Record<string, unknown>).status || "").toLowerCase() === "active";
    }).length;
  }

  return numberFrom(summary.active_gift_codes);
};

export async function GET() {
  try {
    const [statusResponse, feedResponse] = await Promise.all([
      fetch(`${botApiBase}/api/status`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      }),
      fetch(`${botApiBase}/api/bot-feed?limit=10`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      }),
    ]);

    const status = statusResponse.ok ? await statusResponse.json() : {};
    const feed = feedResponse.ok ? await feedResponse.json() : {};
    const summary = feed.summary || {};

    return NextResponse.json({
      attribution: apiAttribution,
      generatedAt: feed.generated_at || new Date().toISOString(),
      servers: numberFrom(summary.servers, status.servers_count, status.guilds_count),
      discordMembers: numberFrom(summary.members, status.total_members, status.members_count),
      monitoredMembers: numberFrom(summary.monitored_members, summary.members),
      activeMonitors: numberFrom(summary.active_monitors),
      autoRedeemServers: numberFrom(summary.auto_redeem_servers),
      activeGiftCodes: countActiveGiftCodes(feed, summary),
      latencyMs: numberFrom(summary.latency_ms, status.latency_ms),
      source: "bot-dashboard-live",
    });
  } catch {
    return NextResponse.json(
      { attribution: apiAttribution, error: "Bot live metrics are temporarily unavailable." },
      { status: 502 },
    );
  }
}
