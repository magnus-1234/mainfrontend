import { NextResponse } from "next/server";

type StateTimelineEvent = {
  title: string;
  dayLabel: string;
  day: number | null;
  status: "unlocked" | "upcoming" | "maybe";
  daysLeft?: number;
  note?: string;
  items: {
    name: string;
    image?: string;
  }[];
};

type RecentlyOpenedState = {
  state: string;
  openedAt: string;
  openedAtIso: string;
  activeFor: string;
  dayLabel: string;
};

const sourceUrl = "https://whiteoutsurvival.pl/state-timeline/";
const ajaxUrl = "https://whiteoutsurvival.pl/wp-admin/admin-ajax.php";
const dayMs = 24 * 60 * 60 * 1000;

let recentStateCache: {
  nonce: string;
  createdAt: number;
  states: RecentlyOpenedState[];
} | null = null;

const decodeHtml = (value: string) =>
  value
    .replace(/\\\//g, "/")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#8211;|&#8212;|\\u2013/g, "-")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");

const cleanText = (value: string) =>
  decodeHtml(value)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const firstMatch = (value: string, pattern: RegExp) => value.match(pattern)?.[1]?.trim() || "";

const absoluteImageUrl = (value: string) => {
  const image = decodeHtml(value);
  if (!image) {
    return "";
  }
  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }
  return new URL(image, sourceUrl).toString();
};

const parseEventItems = (chunk: string) => {
  const seen = new Set<string>();
  const items: StateTimelineEvent["items"] = [];
  const blocks = Array.from(chunk.matchAll(/<(?:a|div)[^>]*class=['"][^'"]*\bstp-hero\b(?!-)[^'"]*['"][^>]*>([\s\S]*?)<\/(?:a|div)>/gi));

  blocks.forEach((match, index) => {
    const block = match[1];
    const image = absoluteImageUrl(firstMatch(block, /<img[^>]+src=['"]([^'"]+)['"]/i));
    const caption = cleanText(firstMatch(block, /<figcaption[^>]*>([\s\S]*?)<\/figcaption>/i));
    const alt = cleanText(firstMatch(block, /<img[^>]+alt=['"]([^'"]*)['"]/i));
    const afterBreak = cleanText(firstMatch(block, /<br\s*\/?>\s*([^<]+)/i));
    const title = cleanText(firstMatch(chunk, /<h4>([\s\S]*?)<\/h4>/i));
    const name = caption || afterBreak || alt || (index ? `${title} ${index + 1}` : title);

    if (!image && !name) {
      return;
    }

    const key = `${name}-${image}`;
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    items.push({ name, image: image || undefined });
  });

  return items.slice(0, 12);
};

const parseEventDay = (dayLabel: string) => {
  const match = dayLabel.match(/day[s]?\s+(\d+)/i);
  return match ? Number(match[1]) : null;
};

const parseStateTimeline = (html: string): StateTimelineEvent[] => {
  const events: StateTimelineEvent[] = [];
  const chunks = html.match(/<div class='stp-event'[\s\S]*?(?=<div class='stp-event-separator'|<h3|<\/div>$)/g) || [];

  chunks.forEach((chunk) => {
    const title = cleanText(firstMatch(chunk, /<h4>([\s\S]*?)<\/h4>/i));
    const dayLabel = cleanText(firstMatch(chunk, /<span class='stp-day-badge[^']*'>([\s\S]*?)<\/span>/i));
    if (!title || !dayLabel) {
      return;
    }

    const badgeClass = firstMatch(chunk, /<span class='stp-day-badge([^']*)'>/i);
    const daysLeftText = cleanText(firstMatch(chunk, /<div class='stp-days-left'>([\s\S]*?)<\/div>/i));
    const note = cleanText(firstMatch(chunk, /<p class='stp-note'>([\s\S]*?)<\/p>/i));
    events.push({
      title,
      dayLabel,
      day: parseEventDay(dayLabel),
      status: badgeClass.includes("maybe") ? "maybe" : badgeClass.includes("upcoming") ? "upcoming" : "unlocked",
      daysLeft: Number(daysLeftText.replace(/\D/g, "")) || undefined,
      note,
      items: parseEventItems(chunk),
    });
  });

  return events;
};

const parseStateInfo = (html: string) => {
  const stateInfo = cleanText(firstMatch(html, /<div class="stp-alert stp-live-notice">([\s\S]*?)<\/div>/i));
  const startedAt = cleanText(firstMatch(stateInfo, /It started on\s+([^.]+UTC)/i));
  const activeFor = cleanText(firstMatch(stateInfo, /active for\s+(.+?)\s*\./i));
  return { stateInfo, startedAt, activeFor };
};

const parseUtcStartDate = (startedAt: string) => {
  const match = startedAt.match(/(\d{2})\/(\d{2})\/(\d{4})\s*-\s*(\d{2}):(\d{2}):(\d{2})\s*UTC/i);
  if (!match) {
    return null;
  }

  const [, day, month, year, hour, minute, second] = match;
  const timestamp = Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second));
  return Number.isFinite(timestamp) ? new Date(timestamp) : null;
};

const formatUtcTime = (date: Date) =>
  new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(date);

const formatUtcDate = (date: Date) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);

const recentDayLabel = (date: Date, now = new Date()) => {
  const today = Math.floor(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) / dayMs);
  const target = Math.floor(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / dayMs);
  const diff = today - target;
  if (diff === 0) {
    return "Today";
  }
  if (diff === 1) {
    return "Yesterday";
  }
  return formatUtcDate(date);
};

const fetchTimelineHtml = async (nonce: string, state: number) => {
  const response = await fetch(ajaxUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
    body: new URLSearchParams({
      action: "stp_get_timeline",
      nonce,
      server_id: String(state),
    }),
    cache: "no-store",
  });
  const payload = await response.json();
  const html = payload?.data?.html ? String(payload.data.html) : "";
  const { startedAt, activeFor } = parseStateInfo(html);
  const startedDate = parseUtcStartDate(startedAt);

  if (!payload?.success || !html || !startedDate) {
    return {
      error: payload?.data?.message || "State not found in the source timeline.",
      html: "",
      startedAt: "",
      activeFor: "",
      startedDate: null,
    };
  }

  return { html, startedAt, activeFor, startedDate, error: "" };
};

const findLatestOpenedState = async (nonce: string, startState: number) => {
  let low = Math.max(1, startState);
  let high = low;

  while ((await fetchTimelineHtml(nonce, high)).startedDate) {
    low = high;
    high += 256;
    if (high > 25000) {
      break;
    }
  }

  while (low + 1 < high) {
    const middle = Math.floor((low + high) / 2);
    if ((await fetchTimelineHtml(nonce, middle)).startedDate) {
      low = middle;
    } else {
      high = middle;
    }
  }

  return low;
};

const getRecentlyOpenedStates = async (nonce: string, requestedState: number): Promise<RecentlyOpenedState[]> => {
  if (recentStateCache?.nonce === nonce && Date.now() - recentStateCache.createdAt < 15 * 60 * 1000) {
    return recentStateCache.states;
  }

  const latestState = await findLatestOpenedState(nonce, Math.max(requestedState, 3000));
  const now = new Date();
  const cutoff = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - (2 * dayMs);
  const states: RecentlyOpenedState[] = [];

  for (let state = latestState; state > 0 && states.length < 24; state -= 1) {
    const timeline = await fetchTimelineHtml(nonce, state);
    if (!timeline.startedDate) {
      continue;
    }
    if (timeline.startedDate.getTime() < cutoff) {
      break;
    }

    states.push({
      state: String(state),
      openedAt: formatUtcTime(timeline.startedDate),
      openedAtIso: timeline.startedDate.toISOString(),
      activeFor: timeline.activeFor,
      dayLabel: recentDayLabel(timeline.startedDate),
    });
  }

  recentStateCache = { nonce, createdAt: Date.now(), states };
  return states;
};

export async function GET(request: Request) {
  const state = new URL(request.url).searchParams.get("state")?.replace(/\D/g, "") || "";
  if (!state) {
    return NextResponse.json({ error: "Enter a valid state number." }, { status: 400 });
  }

  try {
    const page = await fetch(sourceUrl, { cache: "no-store" }).then((response) => response.text());
    const nonce = firstMatch(page, /var STPAjax = \{"ajax_url":"[^"]+","nonce":"([^"]+)"/);
    const sourceUpdatedAt =
      firstMatch(page, /Updated\s+([^<]+?)\s*\(with all server open times\)/i) ||
      firstMatch(page, /property="article:modified_time" content="([^"]+)"/i);

    if (!nonce) {
      throw new Error("Source nonce not found.");
    }

    const timeline = await fetchTimelineHtml(nonce, Number(state));

    if (!timeline.html) {
      return NextResponse.json({ error: timeline.error }, { status: 404 });
    }

    return NextResponse.json({
      state,
      activeFor: timeline.activeFor,
      startedAt: timeline.startedAt,
      sourceUrl,
      sourceUpdatedAt: cleanText(sourceUpdatedAt),
      recentlyOpenedStates: await getRecentlyOpenedStates(nonce, Number(state)),
      events: parseStateTimeline(timeline.html),
    });
  } catch {
    return NextResponse.json({ error: "Unable to load state age data right now." }, { status: 502 });
  }
}
