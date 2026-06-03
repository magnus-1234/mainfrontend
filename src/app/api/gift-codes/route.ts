import { NextResponse } from "next/server";

type GiftCode = {
  code: string;
  rewards: string;
  expiry: string;
  description: string;
  dateAdded?: string;
  status: "active";
  isActive: true;
};

type RawCode = Record<string, unknown>;

type GiftCodeInput = {
  rewards?: unknown;
  expiry?: unknown;
  description?: unknown;
  dateAdded?: unknown;
};

const backendCandidates = [
  process.env.BACKEND_URL,
  process.env.NEXT_PUBLIC_API_BASE_URL,
].filter(Boolean) as string[];

const clean = (value: unknown, fallback = "") => {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text || fallback;
};

const toCode = (value: unknown) => clean(value).replace(/[^A-Za-z0-9]/g, "");

const fetchWithTimeout = (url: string, init: RequestInit = {}, timeoutMs = 5000) =>
  fetch(url, {
    ...init,
    signal: AbortSignal.timeout(timeoutMs),
  });

const normalizeCode = (code: unknown, values: GiftCodeInput = {}): GiftCode | null => {
  const cleanCode = toCode(code);
  if (!/^[A-Za-z0-9]{4,30}$/.test(cleanCode)) {
    return null;
  }
  const normalizedCode = cleanCode.toLowerCase();
  if (
    ["code", "codes", "giftcode", "giftcodes", "reward", "rewards", "expires", "expiry", "status"].includes(
      normalizedCode,
    )
  ) {
    return null;
  }

  return {
    code: cleanCode,
    rewards: clean(values.rewards, "Rewards not specified"),
    expiry: clean(values.expiry, "Unknown"),
    description: clean(values.description),
    dateAdded: clean(values.dateAdded),
    status: "active",
    isActive: true,
  };
};

const mergeCodes = (lists: GiftCode[][]) => {
  const merged = new Map<string, GiftCode>();

  lists.flat().forEach((item) => {
    const key = item.code.toUpperCase();
    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, item);
      return;
    }
    if (existing.rewards === "Rewards not specified" && item.rewards !== "Rewards not specified") {
      existing.rewards = item.rewards;
    }
    if (existing.expiry === "Unknown" && item.expiry !== "Unknown") {
      existing.expiry = item.expiry;
    }
    if (!existing.description && item.description) {
      existing.description = item.description;
    }
    if (!existing.dateAdded && item.dateAdded) {
      existing.dateAdded = item.dateAdded;
    }
  });

  return Array.from(merged.values()).sort((a, b) => {
    const aTime = Date.parse(a.dateAdded || a.expiry || "");
    const bTime = Date.parse(b.dateAdded || b.expiry || "");
    return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0);
  });
};

const fetchInternalCodes = async () => {
  for (const backendUrl of backendCandidates) {
    try {
      const response = await fetchWithTimeout(`${backendUrl.replace(/\/$/, "")}/api/gift-codes`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!response.ok) {
        continue;
      }
      const payload = await response.json();
      const codes = Array.isArray(payload?.codes) ? payload.codes : [];
      if (codes.length) {
        return codes
          .map((item: RawCode) =>
            normalizeCode(item.code, {
              rewards: item.rewards,
              expiry: item.expiry,
              description: item.description,
              dateAdded: item.dateAdded,
            }),
          )
          .filter((item: GiftCode | null): item is GiftCode => Boolean(item));
      }
    } catch {
      continue;
    }
  }

  return [];
};

const fetchFastCodes = async () => {
  try {
    const response = await fetchWithTimeout("https://wostools.net/api/gift-codes", {
      headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0 WhiteoutSurvival.dev/1.0" },
      cache: "no-store",
    });
    if (!response.ok) {
      return [];
    }
    const payload = await response.json().catch(() => null);
    const rawCodes = Array.isArray(payload?.codes) ? payload.codes : [];
    return rawCodes
      .filter((item: RawCode) => String(item.status || "").toLowerCase() === "active")
      .map((item: RawCode) =>
        normalizeCode(item.code, {
          rewards: item.rewards || item.reward || item.rewardText || item.description || item.label,
          expiry: item.expiry || item.expires || item.expiresAt || item.expiration || item.expirationDate,
          description: item.description || item.label,
          dateAdded: item.dateAdded || item.date_added || item.created_at || item.date,
        }),
      )
      .filter((item: GiftCode | null): item is GiftCode => Boolean(item));
  } catch {
    return [];
  }
};

const fetchTableCodes = async () => {
  try {
    const response = await fetchWithTimeout("https://wosgiftcodes.com/", {
      headers: { Accept: "text/html,application/xhtml+xml", "User-Agent": "Mozilla/5.0 WhiteoutSurvival.dev/1.0" },
      cache: "no-store",
    });
    if (!response.ok) {
      return [];
    }
    const html = await response.text();
    const activeSection = html.slice(0, Math.max(html.toLowerCase().indexOf("expired code"), 0) || html.length);
    const rows = activeSection.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];

    return rows
      .map((row) => {
        const cells = Array.from(row.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)).map((match) =>
          match[1].replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim(),
        );
        return normalizeCode(cells[0], {
          description: cells[1],
          rewards: cells[2] || cells[1],
          expiry: cells[3] || "Unknown",
        });
      })
      .filter((item: GiftCode | null): item is GiftCode => Boolean(item));
  } catch {
    return [];
  }
};

export async function GET() {
  const settled = await Promise.allSettled([
    fetchInternalCodes(),
    fetchFastCodes(),
    fetchTableCodes(),
  ]);
  const [internalCodes, fastCodes, tableCodes] = settled.map((result) =>
    result.status === "fulfilled" ? result.value : [],
  );
  const codes = mergeCodes([internalCodes, fastCodes, tableCodes]);

  return NextResponse.json(
    {
      codes,
      lastUpdated: new Date().toISOString(),
      refreshAfterSeconds: 30,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=30, s-maxage=30, stale-while-revalidate=120",
      },
      status: codes.length ? 200 : 503,
    },
  );
}
