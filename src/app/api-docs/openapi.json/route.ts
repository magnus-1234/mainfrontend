import { NextResponse } from "next/server";
import { apiAttribution } from "../../api/attribution";

const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "WhiteoutSurvival.dev API",
    version: "1.0.0",
    description:
      `${apiAttribution.credit} Public API endpoints for Whiteout Survival state age data, gift codes, player lookup, and live bot metrics.`,
    contact: {
      name: "WhiteoutSurvival.dev",
      url: "https://whiteoutsurvival.dev",
    },
  },
  servers: [
    {
      url: "https://whiteoutsurvival.dev",
      description: "Production",
    },
    {
      url: "http://localhost:3000",
      description: "Local development",
    },
  ],
  tags: [
    { name: "State Age", description: "State creation and timeline data." },
    { name: "Gift Codes", description: "Active gift code data." },
    { name: "Player", description: "Whiteout Survival player lookup by ID." },
    { name: "System", description: "Live site and bot status data." },
  ],
  externalDocs: {
    description: "WhiteoutSurvival.dev",
    url: apiAttribution.website,
  },
  paths: {
    "/api/state-age": {
      get: {
        tags: ["State Age"],
        summary: "Get recently opened states or a state timeline",
        description:
          "Without a state query, returns recently opened states. With a state query, returns state age, start time, and unlock timeline events.",
        parameters: [
          {
            name: "state",
            in: "query",
            required: false,
            schema: { type: "integer", minimum: 1 },
            example: 2001,
            description: "Whiteout Survival state/server number.",
          },
        ],
        responses: {
          "200": {
            description: "State data loaded.",
            content: {
              "application/json": {
                examples: {
                  recentlyOpened: {
                    summary: "Recently opened states",
                    value: {
                      attribution: apiAttribution,
                      sourceUpdatedAt: "June 2026",
                      recentlyOpenedStates: [
                        {
                          state: "2142",
                          openedAt: "04:00 AM UTC",
                          openedAtIso: "2026-06-03T04:00:00.000Z",
                          activeFor: "12 hours",
                          dayLabel: "Today",
                        },
                      ],
                    },
                  },
                  stateTimeline: {
                    summary: "Specific state timeline",
                    value: {
                      attribution: apiAttribution,
                      state: "2001",
                      activeFor: "21 days",
                      startedAt: "13/05/2026 - 04:00:00 UTC",
                      events: [
                        {
                          title: "State Transfer",
                          dayLabel: "Day 30",
                          day: 30,
                          status: "upcoming",
                          daysLeft: 9,
                          items: [{ name: "Transfer Pass" }],
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
          "404": { description: "State was not found in the source timeline." },
          "502": { description: "Source data could not be loaded." },
        },
      },
    },
    "/api/gift-codes": {
      get: {
        tags: ["Gift Codes"],
        summary: "Get latest active gift codes",
        description:
          "Returns active Whiteout Survival gift codes with rewards, expiry, and refresh metadata. Responses are cached briefly.",
        responses: {
          "200": {
            description: "Active gift codes found.",
            content: {
              "application/json": {
                example: {
                  attribution: apiAttribution,
                  codes: [
                    {
                      code: "WOS2026",
                      rewards: "Gems and resources",
                      expiry: "Unknown",
                      description: "Current active code",
                      status: "active",
                      isActive: true,
                    },
                  ],
                  lastUpdated: "2026-06-03T10:30:00.000Z",
                  refreshAfterSeconds: 30,
                },
              },
            },
          },
          "503": { description: "No codes could be loaded from available sources." },
        },
      },
    },
    "/api/gift-codes/player-info": {
      post: {
        tags: ["Player"],
        summary: "Look up player information by ID",
        description:
          "Returns nickname, furnace level, formatted furnace level, and avatar image for a Whiteout Survival player ID.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  id: { type: "string", minLength: 8, maxLength: 9, example: "244886619" },
                  fid: { type: "string", minLength: 8, maxLength: 9, example: "244886619" },
                },
                oneOf: [{ required: ["id"] }, { required: ["fid"] }],
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Player found.",
            content: {
              "application/json": {
                example: {
                  attribution: apiAttribution,
                  status: "success",
                  data: {
                    id: "244886619",
                    nickname: "PlayerName",
                    furnace_lv: 31,
                    furnace_lv_formatted: "FC 1",
                    avatar_image: "https://example.com/avatar.png",
                  },
                },
              },
            },
          },
          "400": { description: "Missing or invalid player ID." },
          "404": { description: "Player not found." },
          "503": { description: "Player lookup backend is unavailable." },
        },
      },
    },
    "/api/bot-live": {
      get: {
        tags: ["System"],
        summary: "Get live Discord bot metrics",
        responses: {
          "200": {
            description: "Live metrics loaded.",
            content: {
              "application/json": {
                example: {
                  attribution: apiAttribution,
                  generatedAt: "2026-06-03T10:30:00.000Z",
                  servers: 12,
                  discordMembers: 25000,
                  monitoredMembers: 500,
                  activeMonitors: 8,
                  autoRedeemServers: 6,
                  activeGiftCodes: 4,
                  latencyMs: 75,
                  source: "bot-dashboard-live",
                },
              },
            },
          },
          "502": { description: "Live metrics source is unavailable." },
        },
      },
    },
  },
} as const;

export async function GET() {
  return NextResponse.json(openApiDocument, {
    headers: {
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}
