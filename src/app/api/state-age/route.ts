import { NextResponse } from "next/server";

type StateTimelineEvent = {
  title: string;
  dayLabel: string;
  day: number | null;
  status: "unlocked" | "upcoming" | "maybe";
  daysLeft?: number;
  note?: string;
  items: string[];
};

const sourceUrl = "https://whiteoutsurvival.pl/state-timeline/";
const ajaxUrl = "https://whiteoutsurvival.pl/wp-admin/admin-ajax.php";

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
    const captions = Array.from(chunk.matchAll(/(?:<figcaption[^>]*>|<br\s*\/?>)([^<]+)(?:<\/figcaption>)?/gi))
      .map((match) => cleanText(match[1]))
      .filter(Boolean)
      .filter((item, index, list) => list.indexOf(item) === index)
      .slice(0, 8);

    events.push({
      title,
      dayLabel,
      day: parseEventDay(dayLabel),
      status: badgeClass.includes("maybe") ? "maybe" : badgeClass.includes("upcoming") ? "upcoming" : "unlocked",
      daysLeft: Number(daysLeftText.replace(/\D/g, "")) || undefined,
      note,
      items: captions,
    });
  });

  return events;
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

    const response = await fetch(ajaxUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
      body: new URLSearchParams({
        action: "stp_get_timeline",
        nonce,
        server_id: state,
      }),
      cache: "no-store",
    });
    const payload = await response.json();

    if (!payload?.success || !payload?.data?.html) {
      return NextResponse.json({ error: payload?.data?.message || "State not found in the source timeline." }, { status: 404 });
    }

    const html = String(payload.data.html);
    const stateInfo = cleanText(firstMatch(html, /<div class="stp-alert stp-live-notice">([\s\S]*?)<\/div>/i));
    const startedAt = cleanText(firstMatch(stateInfo, /It started on\s+([^.]+UTC)/i));
    const activeFor = cleanText(firstMatch(stateInfo, /active for\s+(.+?)\s*\./i));

    return NextResponse.json({
      state,
      activeFor,
      startedAt,
      sourceUrl,
      sourceUpdatedAt: cleanText(sourceUpdatedAt),
      events: parseStateTimeline(html),
    });
  } catch {
    return NextResponse.json({ error: "Unable to load state age data right now." }, { status: 502 });
  }
}
