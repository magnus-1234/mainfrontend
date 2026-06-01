"use client";
/* eslint-disable @next/next/no-img-element */
import Image from "next/image";
import type { CSSProperties, ChangeEvent, FormEvent, PointerEvent as ReactPointerEvent, ReactNode, WheelEvent as ReactWheelEvent } from "react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

type Island = {
  id: string;
  title: string;
  creatorName: string;
  creatorUserId?: string;
  canManage?: boolean;
  description: string;
  playerId: string;
  coordinates: {
    x: number;
    y: number;
  };
  player: {
    playerId: string;
    nickname: string;
    stateId?: string;
    furnaceLevel?: number;
    furnaceLevelFormatted?: string;
    furnaceIcon?: string;
    avatarImage?: string;
  };
  server?: string;
  alliance?: string;
  tags: string[];
  imageUrl: string;
  likes: number;
  shares: number;
  commentsCount: number;
  createdAt: string;
};

type IslandComment = {
  id: string;
  islandId: string;
  authorName: string;
  message: string;
  createdAt: string;
};

type PlayerProfile = Island["player"];
type DaybreakView = "gallery" | "uploads" | "favorites";
type ActiveMenu = "home" | "gift" | "redeem" | "planner" | "sneak" | "daybreak" | "bot";
type SiteLanguage = {
  code: string;
  name: string;
  shortCode: string;
};

type GoogleTranslateConstructor = new (
  options: {
    pageLanguage: string;
    includedLanguages: string;
    autoDisplay: boolean;
  },
  elementId: string,
) => unknown;

type TranslateWindow = Window & {
  googleTranslateElementInit?: () => void;
  google?: {
    translate?: {
      TranslateElement?: GoogleTranslateConstructor;
    };
  };
};

type LinkedPlayerAccount = PlayerProfile & {
  linkedAt: string;
};

type AuthUser = {
  id: string;
  email?: string;
  displayName: string;
  avatarUrl?: string;
  providers: ("google" | "discord")[];
  playerAccounts: LinkedPlayerAccount[];
  createdAt: string;
};

type PlannerTool = "select" | "pan" | "erase";
type PlannerMode = "base" | "castle";
type PlannerAlliance = "main" | "farm";
type PlannerBuildingId = "flag" | "city" | "trap" | "hq" | "node" | "obstacle" | "enemy";

type PlannerBuilding = {
  id: PlannerBuildingId;
  label: string;
  shortcut: string;
  width: number;
  height: number;
  color: string;
  castleOnly?: boolean;
};

type PlannerObject = {
  id: string;
  type: PlannerBuildingId;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  alliance: PlannerAlliance;
};

type PlannerDragState =
  | {
      kind: "pan";
      pointerId: number;
      startX: number;
      startY: number;
      scrollLeft: number;
      scrollTop: number;
      moved: boolean;
    }
  | {
      kind: "object";
      pointerId: number;
      objectId: string;
      offsetX: number;
      offsetY: number;
      moved: boolean;
    };

type PlannerDragPreview = {
  id: string;
  x: number;
  y: number;
  valid: boolean;
};

type PlannerHoverCell = {
  x: number;
  y: number;
};

type PlannerLayoutPayload = {
  version?: number;
  mode: PlannerMode;
  alliance: PlannerAlliance;
  objects: PlannerObject[];
};

const localApiHost = () => {
  if (typeof window === "undefined" || !["localhost", "127.0.0.1", "::1"].includes(window.location.hostname)) {
    return "";
  }

  const hostname = window.location.hostname === "::1" ? "[::1]" : window.location.hostname;
  return `${window.location.protocol}//${hostname}:3001`;
};

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || localApiHost();

const botFrontendUrl =
  process.env.NEXT_PUBLIC_BOT_FRONTEND_URL || "https://bot.whiteoutsurvival.dev/";

type BotMetrics = {
  servers: string;
  members: string;
  monitors: string;
  redeemServers: string;
  giftCodes: string;
};

type GiftCode = {
  code: string;
  rewards: string;
  expiry: string;
  description?: string;
  dateAdded?: string;
  status?: string;
  isActive?: boolean;
};

type GiftCodePayload = {
  codes: GiftCode[];
  lastUpdated?: string;
  refreshAfterSeconds?: number;
};

const giftCodesStorageKey = "whiteoutsurvival-gift-codes-cache-v1";

const readStoredGiftCodes = (): GiftCodePayload | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = JSON.parse(localStorage.getItem(giftCodesStorageKey) || "null") as GiftCodePayload | null;
    if (!stored || !Array.isArray(stored.codes)) {
      return null;
    }
    return stored;
  } catch {
    localStorage.removeItem(giftCodesStorageKey);
    return null;
  }
};

type RedeemResult = {
  state: string;
  message: string;
  checkedAt?: string;
  player?: PlayerProfile;
  results?: {
    code: string;
    state: string;
    message: string;
  }[];
};

const fallbackBotMetrics: BotMetrics = {
  servers: "48",
  members: "1.5K",
  monitors: "13",
  redeemServers: "19",
  giftCodes: "4",
};

const botFeatureCards = [
  {
    title: "Alliance monitor",
    body: "Tracks FC level changes, nickname changes, and profile image changes from monitored alliance members.",
    image: "/showcase-furnace-up.png",
    alt: "Furnace level change notification preview",
  },
  {
    title: "Identity change alerts",
    body: "Keeps player records readable with clear notifications when names or avatars change.",
    image: "/showcase-name-change.png",
    alt: "Nickname change notification preview",
  },
  {
    title: "Auto gift code redeem",
    body: "Announces new Whiteout Survival codes in Discord and redeems them for configured servers.",
    image: "/showcase-auto-redeem.png",
    alt: "Auto gift code redeem preview",
  },
];

const botPreviewScreens = [
  { label: "Auto Redeem", image: "/showcase-auto-redeem.png", alt: "Auto-redeem complete notification screenshot" },
  { label: "Gift Alerts", image: "/showcase-gift-alert.png", alt: "New gift code notification screenshot" },
  { label: "FC Tracking", image: "/showcase-furnace-up.png", alt: "Furnace level up notification screenshot" },
  { label: "PFP Changes", image: "/showcase-avatar-change.png", alt: "Avatar change detected notification screenshot" },
  { label: "Name Tracking", image: "/showcase-name-change.png", alt: "Name change detected notification screenshot" },
  { label: "Translation", image: "/showcase-auto-translation.png", alt: "Auto translation notification screenshot" },
  { label: "State Age", image: "/showcase-state-age.png", alt: "State age notification screenshot" },
  { label: "Music", image: "/showcase-music-system.png", alt: "Music system now playing screenshot" },
  { label: "Dice", image: "/showcase-dice-game.png", alt: "Dice game notification screenshot" },
];

const botWebDashboardScreens = [
  { label: "Server Overview", image: "/dashboard-overview.png", alt: "Whiteout Survival bot server overview dashboard screenshot" },
  { label: "Auto Translation", image: "/dashboard-translation.png", alt: "Whiteout Survival bot auto-translation dashboard screenshot" },
  { label: "Auto Redeem", image: "/dashboard-auto-redeem.png", alt: "Whiteout Survival bot auto-redeem settings dashboard screenshot" },
  { label: "Reminders", image: "/dashboard-reminders.png", alt: "Whiteout Survival bot reminders dashboard screenshot" },
];

const FOOTER_IDLE_DELAY_MS = 5 * 60 * 1000;
const FOOTER_INTENT_DELAY_MS = 450;
const FOOTER_HIDE_DELAY_MS = 900;

const menuItems = [
  { label: "Browse", icon: "grid", status: "Soon" },
  { label: "Calculators", icon: "calculator", status: "Soon" },
  { label: "Tools", icon: "wrench", status: "Soon" },
  { label: "Database", icon: "database", status: "Soon" },
  { label: "More", icon: "book", status: "Soon" },
];

const pageLanguage = "en";
const languageStorageKey = "whiteoutsurvival-dev-language";
const translateCookieName = "googtrans";
const siteLanguages: SiteLanguage[] = [
  { code: "en", name: "English", shortCode: "EN" },
  { code: "hi", name: "Hindi", shortCode: "HI" },
  { code: "es", name: "Spanish", shortCode: "ES" },
  { code: "fr", name: "French", shortCode: "FR" },
  { code: "de", name: "German", shortCode: "DE" },
  { code: "it", name: "Italian", shortCode: "IT" },
  { code: "pt", name: "Portuguese", shortCode: "PT" },
  { code: "ru", name: "Russian", shortCode: "RU" },
  { code: "ar", name: "Arabic", shortCode: "AR" },
  { code: "tr", name: "Turkish", shortCode: "TR" },
  { code: "id", name: "Indonesian", shortCode: "ID" },
  { code: "vi", name: "Vietnamese", shortCode: "VI" },
  { code: "th", name: "Thai", shortCode: "TH" },
  { code: "ja", name: "Japanese", shortCode: "JA" },
  { code: "ko", name: "Korean", shortCode: "KO" },
  { code: "zh-CN", name: "Chinese Simplified", shortCode: "ZH" },
  { code: "zh-TW", name: "Chinese Traditional", shortCode: "ZT" },
  { code: "pl", name: "Polish", shortCode: "PL" },
  { code: "nl", name: "Dutch", shortCode: "NL" },
  { code: "sv", name: "Swedish", shortCode: "SV" },
];

const sidebarItems: {
  label: string;
  mobileLabel: string;
  icon: string;
  menu: ActiveMenu;
  href: string;
  beta?: boolean;
  mobilePrimary?: boolean;
}[] = [
  { label: "Home", mobileLabel: "Home", icon: "home", menu: "home", href: "/", mobilePrimary: true },
  { label: "Gift Codes", mobileLabel: "Codes", icon: "gift", menu: "gift", href: "/gift-codes", mobilePrimary: true },
  { label: "City Layout Planner", mobileLabel: "Planner", icon: "grid", menu: "planner", href: "/#city-layout-planner", beta: true },
  { label: "Sneak Peek", mobileLabel: "Sneak", icon: "book", menu: "sneak", href: "/#sneak-peek" },
  { label: "Daybreak Island", mobileLabel: "Island", icon: "island", menu: "daybreak", href: "/#daybreak", mobilePrimary: true },
  { label: "Discord Bot", mobileLabel: "Bot", icon: "bot", menu: "bot", href: "/#discord-bot", mobilePrimary: true },
];

const hashMenuAliases: Record<string, ActiveMenu> = {
  "#home": "home",
  "#gift-codes": "gift",
  "#giftcodes": "gift",
  "#gift": "gift",
  "#redeem": "redeem",
  "#gift-code-redeem": "redeem",
  "#city-layout-planner": "planner",
  "#layout-planner": "planner",
  "#planner": "planner",
  "#sneak-peek": "sneak",
  "#sneak": "sneak",
  "#chief-concierge": "sneak",
  "#daybreak": "daybreak",
  "#showcase": "daybreak",
  "#upload": "daybreak",
  "#discord-bot": "bot",
  "#bot": "bot",
};

const queryMenuAliases: Record<string, ActiveMenu> = {
  home: "home",
  "gift-codes": "gift",
  giftcodes: "gift",
  gift: "gift",
  redeem: "redeem",
  planner: "planner",
  sneak: "sneak",
  daybreak: "daybreak",
  bot: "bot",
};

const menuUrls: Record<ActiveMenu, string> = {
  home: "/",
  gift: "/gift-codes",
  redeem: "/redeem",
  planner: "/#city-layout-planner",
  sneak: "/#sneak-peek",
  daybreak: "/#daybreak",
  bot: "/#discord-bot",
};

const resolveActiveMenu = (location: Location): ActiveMenu => {
  const params = new URLSearchParams(location.search);
  const hashMenu = hashMenuAliases[location.hash];
  if (hashMenu || location.hash.startsWith("#island-")) {
    return hashMenu || "daybreak";
  }

  const queryMenu = queryMenuAliases[params.get("menu") || ""];
  if (queryMenu) {
    return queryMenu;
  }

  if (params.has("island") || location.pathname.startsWith("/daybreak/island/")) {
    return "daybreak";
  }

  if (location.pathname.startsWith("/gift-codes")) {
    return "gift";
  }

  if (location.pathname.startsWith("/redeem")) {
    return "redeem";
  }

  return "home";
};

const plannerFacilitiesRaw: [number, number][][] = [[[1068, 138], [537, 138], [138, 138], [138, 666], [138, 1038], [666, 1068], [1068, 567], [1068, 1068]], [[486, 327], [768, 867], [867, 567], [327, 666]], [[666, 138], [438, 267], [138, 537], [237, 768], [537, 1038], [738, 957], [1068, 666], [957, 438]], [[816, 717], [387, 717], [588, 327]], [[957, 237], [666, 267], [237, 237], [267, 537], [237, 957], [537, 936], [936, 537], [957, 957]], [[867, 327], [327, 327], [327, 867], [867, 867]], [[867, 138], [366, 138], [138, 438], [138, 867], [438, 1068], [1068, 327], [1068, 867], [867, 1068]], [[816, 486], [387, 486], [588, 867]], [[957, 138], [537, 87], [138, 237], [87, 666], [267, 1068], [636, 1137], [1137, 567], [1068, 936]], [[1068, 237], [768, 138], [237, 138], [138, 327], [138, 957], [327, 1038], [1068, 747], [957, 1068]], [[237, 486], [138, 747], [486, 957], [768, 1038], [957, 747], [1068, 486], [486, 138], [768, 237]], [[768, 327], [327, 567], [486, 867], [867, 666]]];
const plannerResourcesRaw: [number, number, string][] = [[312,635,"iron"],[313,314,"meat"],[314,308,"iron"],[318,634,"coal"],[318,643,"meat"],[319,318,"wood"],[319,624,"coal"],[324,630,"iron"],[324,648,"iron"],[326,602,"meat"],[326,622,"meat"],[327,591,"coal"],[329,308,"coal"],[329,613,"wood"],[330,21,"meat"],[330,649,"meat"],[331,57,"wood"],[332,597,"coal"],[332,622,"coal"],[333,675,"iron"],[334,51,"coal"],[335,7,"meat"],[338,37,"meat"],[339,125,"coal"],[339,663,"iron"],[340,116,"wood"],[340,605,"coal"],[341,53,"wood"],[341,669,"iron"],[342,90,"wood"],[342,649,"iron"],[344,322,"wood"],[344,577,"wood"],[345,63,"meat"],[345,82,"wood"],[346,617,"iron"],[346,659,"wood"],[347,679,"meat"],[349,666,"wood"],[350,154,"meat"],[350,581,"iron"],[352,136,"wood"],[352,177,"wood"],[353,315,"iron"],[353,564,"iron"],[354,161,"wood"],[354,622,"coal"],[355,123,"meat"],[355,666,"coal"],[355,685,"iron"],[356,609,"coal"],[356,632,"wood"],[357,598,"meat"],[358,309,"meat"],[359,301,"coal"],[360,560,"wood"],[360,652,"coal"],[361,661,"iron"],[362,610,"coal"],[363,161,"meat"],[363,572,"iron"],[365,273,"meat"],[365,633,"meat"],[366,280,"wood"],[367,678,"coal"],[370,305,"coal"],[370,610,"iron"],[371,603,"iron"],[371,716,"wood"],[372,630,"coal"],[372,666,"wood"],[376,654,"meat"],[376,676,"wood"],[380,697,"meat"],[385,676,"coal"],[387,686,"meat"],[388,699,"meat"],[391,661,"coal"],[396,688,"iron"],[408,397,"coal"],[409,379,"iron"],[411,681,"meat"],[413,672,"coal"],[413,694,"meat"],[414,387,"coal"],[415,355,"iron"],[416,376,"iron"],[422,374,"coal"],[422,380,"meat"],[423,684,"iron"],[425,368,"wood"],[425,402,"wood"],[425,674,"iron"],[427,390,"meat"],[428,425,"meat"],[429,435,"meat"],[431,686,"wood"],[433,399,"coal"],[435,428,"meat"],[435,680,"wood"],[437,606,"meat"],[438,387,"meat"],[438,577,"meat"],[438,697,"meat"],[440,399,"meat"],[440,664,"meat"],[441,653,"iron"],[442,362,"iron"],[442,571,"coal"],[442,597,"coal"],[446,342,"coal"],[447,401,"iron"],[448,568,"iron"],[449,649,"iron"],[450,394,"coal"],[450,585,"iron"],[451,603,"iron"],[451,612,"iron"],[452,561,"coal"],[452,629,"coal"],[453,434,"iron"],[455,650,"iron"],[456,339,"coal"],[456,709,"coal"],[457,410,"meat"],[457,592,"iron"],[457,622,"iron"],[457,680,"meat"],[458,564,"iron"],[458,606,"iron"],[458,607,"iron"],[458,757,"wood"],[459,390,"iron"],[459,643,"iron"],[459,788,"meat"],[462,690,"coal"],[463,578,"iron"],[464,601,"coal"],[464,765,"wood"],[465,419,"wood"],[465,592,"coal"],[465,745,"iron"],[465,788,"wood"],[467,629,"iron"],[467,648,"coal"],[467,680,"coal"],[468,614,"coal"],[468,659,"iron"],[469,348,"iron"],[469,717,"coal"],[471,425,"iron"],[471,667,"coal"],[472,674,"meat"],[473,782,"iron"],[473,788,"coal"],[474,772,"wood"],[475,350,"coal"],[475,432,"iron"],[475,651,"coal"],[476,638,"meat"],[476,702,"iron"],[476,765,"wood"],[479,750,"iron"],[480,378,"coal"],[480,714,"coal"],[481,346,"iron"],[482,426,"wood"],[483,643,"meat"],[484,391,"wood"],[485,359,"meat"],[485,439,"coal"],[487,369,"iron"],[487,748,"iron"],[492,460,"wood"],[494,373,"wood"],[495,471,"coal"],[497,396,"wood"],[497,437,"meat"],[498,647,"iron"],[499,880,"iron"],[500,358,"meat"],[500,774,"meat"],[501,389,"coal"],[501,780,"meat"],[502,447,"iron"],[503,459,"iron"],[504,757,"coal"],[505,763,"meat"],[506,473,"iron"],[507,396,"wood"],[508,384,"wood"],[509,448,"wood"],[509,772,"iron"],[512,483,"iron"],[512,489,"meat"],[513,378,"meat"],[514,459,"coal"],[514,881,"iron"],[516,395,"wood"],[517,451,"iron"],[518,757,"meat"],[520,490,"coal"],[521,893,"meat"],[522,471,"iron"],[523,456,"iron"],[523,462,"iron"],[524,398,"meat"],[524,431,"coal"],[524,443,"wood"],[524,758,"coal"],[525,722,"wood"],[527,487,"iron"],[527,734,"coal"],[528,883,"coal"],[528,899,"wood"],[530,770,"coal"],[531,724,"coal"],[532,428,"coal"],[532,877,"meat"],[533,758,"iron"],[534,475,"iron"],[534,747,"iron"],[536,441,"iron"],[536,484,"coal"],[536,714,"wood"],[538,731,"coal"],[539,450,"meat"],[540,786,"meat"],[541,708,"coal"],[541,759,"coal"],[541,771,"wood"],[541,780,"coal"],[541,905,"meat"],[542,420,"iron"],[542,877,"coal"],[544,744,"coal"],[546,702,"coal"],[547,753,"coal"],[548,673,"coal"],[548,895,"wood"],[549,590,"iron"],[549,781,"iron"],[552,438,"iron"],[552,729,"coal"],[552,737,"coal"],[553,704,"iron"],[555,780,"wood"],[555,867,"iron"],[555,883,"meat"],[556,457,"iron"],[556,490,"iron"],[556,712,"meat"],[557,683,"iron"],[558,720,"coal"],[560,676,"iron"],[560,690,"iron"],[560,752,"wood"],[560,762,"wood"],[560,874,"meat"],[561,449,"coal"],[562,459,"coal"],[562,743,"coal"],[563,433,"wood"],[563,506,"wood"],[563,737,"iron"],[565,778,"iron"],[566,708,"iron"],[566,766,"wood"],[568,476,"coal"],[568,676,"meat"],[568,699,"coal"],[568,718,"iron"],[570,739,"iron"],[572,684,"iron"],[572,732,"coal"],[573,706,"iron"],[573,860,"coal"],[575,470,"iron"],[575,877,"coal"],[577,464,"coal"],[577,675,"meat"],[577,753,"meat"],[580,721,"coal"],[581,771,"wood"],[582,747,"coal"],[584,679,"iron"],[584,690,"iron"],[585,731,"coal"],[585,877,"meat"],[586,757,"meat"],[587,737,"coal"],[591,726,"coal"],[592,691,"iron"],[592,707,"iron"],[592,745,"iron"],[592,770,"meat"],[595,675,"meat"],[595,701,"iron"],[599,689,"iron"],[600,764,"iron"],[601,433,"iron"],[601,698,"coal"],[601,711,"wood"],[601,733,"coal"],[602,745,"coal"],[602,756,"wood"],[603,476,"wood"],[604,679,"coal"],[606,442,"meat"],[607,456,"meat"],[607,700,"meat"],[611,433,"wood"],[611,732,"iron"],[611,765,"wood"],[613,454,"meat"],[613,691,"meat"],[614,481,"iron"],[614,754,"meat"],[615,683,"iron"],[616,676,"wood"],[616,711,"iron"],[617,433,"wood"],[618,770,"iron"],[619,734,"iron"],[620,452,"coal"],[621,478,"coal"],[622,360,"iron"],[622,443,"iron"],[622,465,"coal"],[622,471,"coal"],[624,369,"coal"],[626,725,"meat"],[626,736,"iron"],[627,673,"coal"],[627,754,"wood"],[629,696,"iron"],[630,431,"meat"],[630,468,"coal"],[630,800,"coal"],[631,439,"wood"],[631,762,"wood"],[632,393,"iron"],[632,808,"meat"],[632,823,"coal"],[633,706,"meat"],[633,780,"iron"],[634,456,"iron"],[634,680,"wood"],[635,413,"iron"],[635,755,"iron"],[636,432,"meat"],[637,375,"wood"],[638,717,"iron"],[639,727,"iron"],[639,767,"wood"],[640,447,"coal"],[640,482,"meat"],[640,743,"iron"],[642,392,"iron"],[642,827,"coal"],[643,435,"wood"],[643,476,"iron"],[644,385,"meat"],[645,752,"wood"],[645,817,"meat"],[646,443,"meat"],[647,704,"iron"],[648,459,"meat"],[648,495,"coal"],[648,733,"meat"],[648,743,"iron"],[650,416,"iron"],[650,451,"coal"],[650,791,"meat"],[651,382,"meat"],[651,429,"wood"],[651,776,"coal"],[652,750,"coal"],[653,409,"wood"],[653,435,"coal"],[653,468,"wood"],[653,723,"wood"],[653,770,"coal"],[654,492,"meat"],[655,484,"iron"],[655,759,"coal"],[657,381,"wood"],[658,402,"meat"],[658,417,"coal"],[658,748,"iron"],[658,806,"iron"],[658,822,"coal"],[658,828,"wood"],[662,372,"meat"],[662,437,"wood"],[662,486,"coal"],[662,775,"coal"],[663,391,"iron"],[663,459,"wood"],[664,417,"meat"],[664,747,"coal"],[664,784,"wood"],[664,817,"meat"],[666,805,"coal"],[668,731,"coal"],[669,398,"iron"],[670,720,"iron"],[671,439,"iron"],[671,766,"wood"],[671,811,"coal"],[673,464,"iron"],[673,772,"meat"],[676,402,"coal"],[676,745,"iron"],[677,723,"iron"],[677,797,"wood"],[679,812,"meat"],[679,820,"meat"],[680,715,"iron"],[682,782,"coal"],[683,749,"iron"],[685,405,"iron"],[687,789,"iron"],[689,730,"coal"],[689,738,"iron"],[690,705,"iron"],[690,767,"meat"],[690,812,"coal"],[691,749,"coal"],[693,782,"meat"],[695,791,"iron"],[695,801,"iron"],[696,711,"coal"],[698,760,"iron"],[699,705,"coal"],[701,746,"iron"],[705,674,"wood"],[705,809,"meat"],[707,695,"coal"],[707,777,"coal"],[713,747,"wood"],[713,774,"wood"],[714,711,"iron"],[715,723,"wood"],[715,788,"iron"],[715,794,"iron"],[715,807,"meat"],[716,693,"coal"],[717,737,"iron"],[720,744,"meat"],[721,683,"iron"],[721,785,"wood"],[721,810,"meat"],[722,651,"iron"],[723,733,"coal"],[724,721,"wood"],[726,670,"iron"],[728,759,"iron"],[729,715,"iron"],[729,734,"iron"],[730,579,"iron"],[730,681,"coal"],[731,694,"coal"],[731,721,"meat"],[731,771,"iron"],[732,640,"meat"],[732,741,"wood"],[733,475,"iron"],[733,786,"coal"],[734,468,"meat"],[734,491,"coal"],[734,752,"meat"],[735,654,"wood"],[735,809,"wood"],[736,499,"coal"],[736,816,"iron"],[737,461,"coal"],[737,686,"coal"],[739,704,"coal"],[739,721,"iron"],[740,693,"coal"],[742,599,"iron"],[742,741,"wood"],[742,763,"coal"],[743,802,"coal"],[744,452,"meat"],[744,498,"iron"],[744,784,"iron"],[745,670,"coal"],[745,721,"iron"],[745,731,"wood"],[747,693,"iron"],[747,749,"iron"],[748,764,"meat"],[749,681,"coal"],[749,702,"coal"],[749,712,"coal"],[749,794,"meat"],[750,455,"meat"],[750,466,"meat"],[750,775,"wood"],[752,664,"coal"],[752,721,"coal"],[753,785,"coal"],[754,801,"meat"],[755,500,"coal"],[755,587,"coal"],[755,601,"wood"],[755,753,"iron"],[756,688,"meat"],[757,777,"wood"],[758,737,"meat"],[759,578,"coal"],[762,452,"meat"],[763,799,"iron"],[764,678,"iron"],[764,750,"wood"],[766,688,"coal"],[766,792,"meat"],[767,494,"wood"],[767,713,"meat"],[767,742,"coal"],[768,433,"wood"],[768,707,"meat"],[768,735,"meat"],[769,451,"coal"],[769,501,"coal"],[769,660,"meat"],[769,756,"iron"],[771,477,"coal"],[773,467,"wood"],[773,714,"wood"],[774,685,"wood"],[775,656,"wood"],[777,450,"iron"],[782,793,"wood"],[784,662,"meat"],[784,806,"meat"],[785,472,"iron"],[787,726,"iron"],[788,746,"iron"],[790,756,"meat"],[792,463,"meat"],[792,478,"meat"],[793,665,"meat"],[793,736,"iron"],[795,470,"wood"],[797,719,"iron"],[798,750,"wood"],[799,660,"wood"],[799,757,"meat"],[800,667,"iron"],[800,733,"iron"],[806,665,"meat"],[807,757,"coal"],[808,751,"coal"],[812,660,"iron"],[816,755,"coal"],[820,656,"meat"],[824,663,"iron"],[828,541,"wood"],[830,753,"wood"],[834,655,"iron"],[835,546,"coal"],[835,649,"coal"],[840,533,"wood"],[851,679,"coal"],[853,754,"meat"],[854,546,"iron"],[855,745,"meat"],[859,656,"wood"],[860,683,"iron"],[862,576,"iron"],[862,689,"iron"],[863,749,"wood"],[866,558,"wood"],[866,703,"wood"],[868,603,"iron"],[869,731,"wood"],[870,682,"iron"],[871,711,"coal"],[871,725,"wood"],[874,675,"coal"],[874,738,"wood"],[876,684,"wood"],[876,691,"wood"],[880,587,"wood"],[881,555,"iron"],[881,702,"iron"],[883,655,"meat"],[883,661,"iron"],[884,760,"meat"],[885,743,"coal"],[886,579,"wood"],[886,610,"coal"],[887,561,"meat"],[888,708,"wood"],[888,777,"coal"],[889,672,"meat"],[890,758,"wood"],[892,660,"wood"],[893,723,"meat"],[894,682,"coal"],[894,694,"meat"],[894,715,"meat"],[895,671,"iron"],[896,756,"coal"],[896,763,"iron"],[898,688,"wood"],[898,706,"wood"],[904,658,"coal"],[906,537,"meat"],[906,656,"meat"],[926,557,"meat"],[929,520,"coal"],[951,503,"coal"],[1192,1194,"wood"]];
const plannerStrongholdsRaw: [number, number][] = [];
const plannerFortressesRaw: [number, number][] = [];
const plannerGridSize = 1200;
const plannerStorageKey = "city-layout-planner-v1";

const plannerBuildings: PlannerBuilding[] = [
  { id: "flag", label: "Flag", shortcut: "1", width: 1, height: 1, color: "#f48120" },
  { id: "city", label: "City", shortcut: "2", width: 2, height: 2, color: "#59a6de" },
  { id: "trap", label: "Trap", shortcut: "3", width: 3, height: 3, color: "#dc2626" },
  { id: "hq", label: "HQ", shortcut: "4", width: 4, height: 4, color: "#9b5de5" },
  { id: "node", label: "Node", shortcut: "5", width: 2, height: 2, color: "#22c55e" },
  { id: "obstacle", label: "Obstacle", shortcut: "6", width: 1, height: 1, color: "#64748b" },
  { id: "enemy", label: "Enemy Zone", shortcut: "7", width: 3, height: 3, color: "#ef4444", castleOnly: true },
];

function encodePlannerLayoutPayload(payload: PlannerLayoutPayload) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
}

function decodePlannerLayoutPayload(value: string): PlannerLayoutPayload {
  const parsed = JSON.parse(decodeURIComponent(escape(atob(value.trim())))) as Partial<PlannerLayoutPayload>;

  if (!Array.isArray(parsed.objects)) {
    throw new Error("Layout code does not contain objects.");
  }

  return {
    version: parsed.version,
    mode: parsed.mode === "castle" ? "castle" : "base",
    alliance: parsed.alliance === "farm" ? "farm" : "main",
    objects: parsed.objects,
  };
}

function readStoredPlannerLayout(): PlannerLayoutPayload | null {
  if (typeof window === "undefined") {
    return null;
  }

  const saved = localStorage.getItem(plannerStorageKey);
  if (!saved) {
    return null;
  }

  try {
    return decodePlannerLayoutPayload(saved);
  } catch {
    localStorage.removeItem(plannerStorageKey);
    return null;
  }
}

const defaultDaybreakTags = [
  "TreeOfLife",
  "Symmetry",
  "Plaza",
  "Compact",
  "Decor",
  "Resource",
  "Pathing",
  "Defense",
  "Showcase",
  "Minimal",
];

function Icon({ name }: { name: string }) {
  const paths: Record<string, ReactNode> = {
    home: (
      <>
        <path d="m3 11 9-8 9 8" />
        <path d="M5 10v10h14V10" />
        <path d="M9 20v-6h6v6" />
      </>
    ),
    grid: (
      <>
        <rect width="7" height="7" x="3" y="3" rx="1" />
        <rect width="7" height="7" x="14" y="3" rx="1" />
        <rect width="7" height="7" x="14" y="14" rx="1" />
        <rect width="7" height="7" x="3" y="14" rx="1" />
      </>
    ),
    island: (
      <>
        <path d="M4 19c2.2-1.8 4.8-2.6 8-2.6s5.8.8 8 2.6" />
        <path d="M6 15c1.9-1 3.9-1.5 6-1.5s4.1.5 6 1.5" />
        <path d="M12 13V4" />
        <path d="M12 4c-2.5.5-4.2 1.8-5 4 2.5.2 4.2-1.1 5-4Z" />
        <path d="M12 4c2.5.5 4.2 1.8 5 4-2.5.2-4.2-1.1-5-4Z" />
      </>
    ),
    bot: (
      <>
        <rect width="16" height="12" x="4" y="8" rx="3" />
        <path d="M12 8V4" />
        <path d="M8 4h8" />
        <circle cx="9" cy="14" r="1" />
        <circle cx="15" cy="14" r="1" />
        <path d="M8 20v2" />
        <path d="M16 20v2" />
      </>
    ),
    external: (
      <>
        <path d="M15 3h6v6" />
        <path d="M10 14 21 3" />
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      </>
    ),
    upload: (
      <>
        <path d="M12 16V4" />
        <path d="m7 9 5-5 5 5" />
        <path d="M20 16v4H4v-4" />
      </>
    ),
    heart: (
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
    ),
    star: (
      <path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.2L5.8 21 7 14.2 2 9.3l6.9-1L12 2Z" />
    ),
    share: (
      <>
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <path d="m8.6 13.5 6.8 4" />
        <path d="m15.4 6.5-6.8 4" />
      </>
    ),
    message: (
      <>
        <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
      </>
    ),
    trash: (
      <>
        <path d="M3 6h18" />
        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <path d="M19 6 18 20a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        <path d="M10 11v6" />
        <path d="M14 11v6" />
      </>
    ),
    edit: (
      <>
        <path d="M11 4H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-6" />
        <path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z" />
      </>
    ),
    copy: (
      <>
        <rect width="14" height="14" x="8" y="8" rx="2" />
        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
      </>
    ),
    image: (
      <>
        <rect width="18" height="18" x="3" y="3" rx="2" />
        <circle cx="9" cy="9" r="2" />
        <path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" />
      </>
    ),
    zoomIn: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.3-4.3" />
        <path d="M11 8v6" />
        <path d="M8 11h6" />
      </>
    ),
    zoomOut: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.3-4.3" />
        <path d="M8 11h6" />
      </>
    ),
    expand: (
      <>
        <path d="M15 3h6v6" />
        <path d="M9 21H3v-6" />
        <path d="M21 3l-7 7" />
        <path d="M3 21l7-7" />
      </>
    ),
    download: (
      <>
        <path d="M12 3v12" />
        <path d="m7 10 5 5 5-5" />
        <path d="M5 21h14" />
      </>
    ),
    flame: (
      <>
        <path d="M8.5 14.5A4.5 4.5 0 0 0 17 12c0-4-5-6-3.5-10-4 2-7 5-7 9a6 6 0 0 0 12 0" />
      </>
    ),
    mapPin: (
      <>
        <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 0 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
      </>
    ),
    barChart: (
      <>
        <path d="M4 19V5" />
        <path d="M4 19h16" />
        <path d="M8 16V9" />
        <path d="M12 16V6" />
        <path d="M16 16v-4" />
      </>
    ),
    calculator: (
      <>
        <rect width="16" height="20" x="4" y="2" rx="2" />
        <line x1="8" x2="16" y1="6" y2="6" />
        <path d="M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" />
      </>
    ),
    wrench: <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.1-3.1c.3-.3.9-.2 1 .2a6 6 0 0 1-8.3 7.1l-7.9 7.9a1 1 0 0 1-3-3l7.9-7.9a6 6 0 0 1 7.1-8.3c.4.1.5.7.2 1z" />,
    database: (
      <>
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M3 5v14a9 3 0 0 0 18 0V5" />
        <path d="M3 12a9 3 0 0 0 18 0" />
      </>
    ),
    globe: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20" />
        <path d="M12 2a15.3 15.3 0 0 1 0 20" />
        <path d="M12 2a15.3 15.3 0 0 0 0 20" />
      </>
    ),
    book: (
      <>
        <path d="M12 7v14" />
        <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
      </>
    ),
    user: (
      <>
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </>
    ),
    gamepad: (
      <>
        <line x1="6" x2="10" y1="12" y2="12" />
        <line x1="8" x2="8" y1="10" y2="14" />
        <line x1="15" x2="15.01" y1="13" y2="13" />
        <line x1="18" x2="18.01" y1="11" y2="11" />
        <rect width="20" height="12" x="2" y="6" rx="4" />
      </>
    ),
    crown: (
      <>
        <path d="m2 6 5 5 5-8 5 8 5-5-3 13H5L2 6Z" />
        <path d="M5 19h14" />
      </>
    ),
    calendar: (
      <>
        <path d="M8 2v4M16 2v4" />
        <rect width="18" height="18" x="3" y="4" rx="2" />
        <path d="M3 10h18" />
      </>
    ),
    gift: (
      <>
        <rect width="18" height="14" x="3" y="8" rx="2" />
        <path d="M12 8v14" />
        <path d="M3 13h18" />
        <path d="M7.5 8a2.5 2.5 0 1 1 2.2-3.7L12 8" />
        <path d="M16.5 8a2.5 2.5 0 1 0-2.2-3.7L12 8" />
      </>
    ),
    shield: (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        <path d="M12 8v4" />
      </>
    ),
    plus: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </>
    ),
    logout: (
      <>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <path d="m16 17 5-5-5-5" />
        <path d="M21 12H9" />
      </>
    ),
    panel: (
      <>
        <rect width="18" height="16" x="3" y="4" rx="2" />
        <path d="M9 4v16" />
      </>
    ),
    sliders: (
      <>
        <line x1="4" x2="14" y1="6" y2="6" />
        <line x1="4" x2="10" y1="18" y2="18" />
        <line x1="14" x2="20" y1="18" y2="18" />
        <line x1="18" x2="20" y1="6" y2="6" />
        <circle cx="16" cy="6" r="2" />
        <circle cx="12" cy="18" r="2" />
      </>
    ),
    menu: (
      <>
        <path d="M4 6h16" />
        <path d="M4 12h16" />
        <path d="M4 18h16" />
      </>
    ),
    x: (
      <>
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </>
    ),
    sun: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M2 12h2M20 12h2m-15.07-7.07 1.41 1.41m9.32 9.32 1.41 1.41m-12.73 0-1.41 1.41m14.14-14.14-1.41 1.41" />
      </>
    ),
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {paths[name] || <path d="m6 9 6 6 6-6" />}
    </svg>
  );
}

function LanguageSwitcher() {
  const [open, setOpen] = useState(false);
  const [language, setLanguage] = useState(pageLanguage);

  const activeLanguage = siteLanguages.find((item) => item.code === language) || siteLanguages[0];

  const applyGoogleLanguage = useCallback((nextLanguage: string) => {
    const combo = document.querySelector<HTMLSelectElement>(".goog-te-combo");
    if (!combo) {
      return false;
    }

    combo.value = nextLanguage === pageLanguage ? "" : nextLanguage;
    combo.dispatchEvent(new Event("change"));
    return true;
  }, []);

  const applyLanguageWhenReady = useCallback(function retryApplyLanguage(nextLanguage: string, attempt = 0) {
    if (nextLanguage === pageLanguage || applyGoogleLanguage(nextLanguage)) {
      return;
    }

    if (attempt < 24) {
      window.setTimeout(() => retryApplyLanguage(nextLanguage, attempt + 1), 250);
    }
  }, [applyGoogleLanguage]);

  const setTranslateCookie = useCallback((nextLanguage: string) => {
    const value = nextLanguage === pageLanguage ? "" : `/${pageLanguage}/${nextLanguage}`;
    const expires = nextLanguage === pageLanguage ? "Thu, 01 Jan 1970 00:00:00 GMT" : "Fri, 31 Dec 9999 23:59:59 GMT";
    const hostParts = window.location.hostname.split(".");
    const domains = [window.location.hostname];

    if (hostParts.length > 2) {
      domains.push(`.${hostParts.slice(-2).join(".")}`);
    }

    domains.forEach((domain) => {
      document.cookie = `${translateCookieName}=${value}; expires=${expires}; path=/; domain=${domain}; SameSite=Lax`;
    });
    document.cookie = `${translateCookieName}=${value}; expires=${expires}; path=/; SameSite=Lax`;
  }, []);

  const chooseLanguage = useCallback((nextLanguage: string) => {
    setLanguage(nextLanguage);
    setOpen(false);
    localStorage.setItem(languageStorageKey, nextLanguage);
    document.documentElement.lang = nextLanguage;
    setTranslateCookie(nextLanguage);

    if (nextLanguage === pageLanguage) {
      window.location.reload();
      return;
    }

    applyLanguageWhenReady(nextLanguage);
  }, [applyLanguageWhenReady, setTranslateCookie]);

  useEffect(() => {
    const savedLanguage = localStorage.getItem(languageStorageKey);
    const validLanguage = siteLanguages.some((item) => item.code === savedLanguage) ? savedLanguage || pageLanguage : pageLanguage;
    window.setTimeout(() => setLanguage(validLanguage), 0);
    document.documentElement.lang = validLanguage;

    const translateWindow = window as TranslateWindow;
    translateWindow.googleTranslateElementInit = () => {
      const TranslateElement = translateWindow.google?.translate?.TranslateElement;
      if (!TranslateElement) {
        return;
      }

      new TranslateElement({
        pageLanguage,
        includedLanguages: siteLanguages.map((item) => item.code).join(","),
        autoDisplay: false,
      }, "google_translate_element");

      if (validLanguage !== pageLanguage) {
        window.setTimeout(() => applyLanguageWhenReady(validLanguage), 350);
      }
    };

    if (!document.querySelector('script[src*="translate_a/element.js"]')) {
      const script = document.createElement("script");
      script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      script.onload = () => translateWindow.googleTranslateElementInit?.();
      document.head.appendChild(script);
    } else if (translateWindow.google?.translate?.TranslateElement) {
      translateWindow.googleTranslateElementInit();
    }
  }, [applyLanguageWhenReady]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const closeOnOutside = (event: MouseEvent) => {
      if (!(event.target instanceof Element) || !event.target.closest(".language-switcher")) {
        setOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("click", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("click", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div className="language-switcher notranslate" translate="no">
      <div id="google_translate_element" aria-hidden="true" />
      <button
        className="language-button"
        type="button"
        aria-label="Select website language"
        aria-haspopup="listbox"
        aria-expanded={open}
        title="Select website language"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
      >
        <Icon name="globe" />
        <span>{activeLanguage.shortCode}</span>
      </button>
      {open && (
        <div className="language-menu" role="listbox" aria-label="Website language">
          <div className="language-menu-head">
            <span>Website language</span>
            <span>Translate</span>
          </div>
          <div className="language-options">
            {siteLanguages.map((item) => (
              <button
                className={`language-option ${item.code === language ? "active" : ""}`}
                type="button"
                role="option"
                aria-selected={item.code === language}
                key={item.code}
                onClick={() => chooseLanguage(item.code)}
              >
                <span>{item.name}</span>
                <small>{item.shortCode}</small>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("dark");
  const [layoutOpen, setLayoutOpen] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [collapsedSidebar, setCollapsedSidebar] = useState(false);
  const [hideTopNav, setHideTopNav] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [resizingSidebar, setResizingSidebar] = useState(false);
  const [contentWidth, setContentWidth] = useState<"centered" | "full">("full");
  const [loginOpen, setLoginOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [botMetrics, setBotMetrics] = useState<BotMetrics>(fallbackBotMetrics);
  const [authStatus, setAuthStatus] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return new URLSearchParams(window.location.search).get("auth_error") || "";
  });
  const [linkingPlayer, setLinkingPlayer] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadPlayerMode, setUploadPlayerMode] = useState<"linked" | "manual">("manual");
  const [selectedUploadPlayerId, setSelectedUploadPlayerId] = useState("");
  const [uploadImageLabel, setUploadImageLabel] = useState("No image selected");
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState("");
  const [uploadTagsInput, setUploadTagsInput] = useState("");
  const [editingIsland, setEditingIsland] = useState<Island | null>(null);
  const [editTagsInput, setEditTagsInput] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [viewerImage, setViewerImage] = useState<Island | null>(null);
  const [imageZoom, setImageZoom] = useState(100);
  const [shareIslandTarget, setShareIslandTarget] = useState<Island | null>(null);
  const [comments, setComments] = useState<IslandComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentSaving, setCommentSaving] = useState(false);
  const [deletingIslandId, setDeletingIslandId] = useState("");
  const [playerLookup, setPlayerLookup] = useState<PlayerProfile | null>(null);
  const [playerLookupStatus, setPlayerLookupStatus] = useState("");
  const [fetchingPlayer, setFetchingPlayer] = useState(false);
  const [likedIslands, setLikedIslands] = useState<Record<string, boolean>>({});
  const [activeMenu, setActiveMenu] = useState<ActiveMenu>("home");
  const [giftCodes, setGiftCodes] = useState<GiftCode[]>(() => readStoredGiftCodes()?.codes.filter((item) => item.isActive !== false) || []);
  const [giftCodeUpdatedAt, setGiftCodeUpdatedAt] = useState(() => readStoredGiftCodes()?.lastUpdated || "");
  const [giftCodeLoading, setGiftCodeLoading] = useState(false);
  const [giftCodeStatus, setGiftCodeStatus] = useState("");
  const [copiedGiftCode, setCopiedGiftCode] = useState("");
  const [redeemPlayerId, setRedeemPlayerId] = useState("");
  const [redeemCode, setRedeemCode] = useState("");
  const [redeemPlayer, setRedeemPlayer] = useState<PlayerProfile | null>(null);
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemResult, setRedeemResult] = useState<RedeemResult | null>(null);
  const [islands, setIslands] = useState<Island[]>([]);
  const [linkedIslandId, setLinkedIslandId] = useState("");
  const [footerVisible, setFooterVisible] = useState(false);
  const [sort, setSort] = useState<"recent" | "popular">("popular");
  const [daybreakView, setDaybreakView] = useState<DaybreakView>("gallery");
  const [selectedTag, setSelectedTag] = useState("");
  const [status, setStatus] = useState("");
  const [uploading, setUploading] = useState(false);
  const [plannerTool, setPlannerTool] = useState<PlannerTool>("select");
  const [plannerMode, setPlannerMode] = useState<PlannerMode>(() => readStoredPlannerLayout()?.mode || "base");
  const [plannerAlliance, setPlannerAlliance] = useState<PlannerAlliance>(() => readStoredPlannerLayout()?.alliance || "main");
  const [selectedPlannerBuilding, setSelectedPlannerBuilding] = useState<PlannerBuildingId>("city");
  const [plannerObstacleSize, setPlannerObstacleSize] = useState(1);
  const [plannerObjects, setPlannerObjects] = useState<PlannerObject[]>(() => readStoredPlannerLayout()?.objects || []);
  const [selectedPlannerObjectId, setSelectedPlannerObjectId] = useState("");
  const [plannerHistory, setPlannerHistory] = useState<PlannerObject[][]>([]);
  const [plannerFuture, setPlannerFuture] = useState<PlannerObject[][]>([]);
  const [plannerZoom, setPlannerZoom] = useState(100);
  const [plannerImportCode, setPlannerImportCode] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return localStorage.getItem(plannerStorageKey) || "";
  });
  const [plannerStatus, setPlannerStatus] = useState("");
  const [plannerDragPreview, setPlannerDragPreview] = useState<PlannerDragPreview | null>(null);
  const [plannerHoverCell, setPlannerHoverCell] = useState<PlannerHoverCell | null>(null);
  const openedSharedIslandRef = useRef("");
  const footerIntentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const footerHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const footerIdleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const plannerBoardRef = useRef<HTMLElement | null>(null);
  const plannerGridRef = useRef<HTMLDivElement | null>(null);
  const plannerDragRef = useRef<PlannerDragState | null>(null);
  const plannerSuppressClickRef = useRef(false);
  const giftCodeRefreshRef = useRef(false);
  const [viewerId] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }

    const stored = localStorage.getItem("daybreak-viewer-id") || crypto.randomUUID();
    localStorage.setItem("daybreak-viewer-id", stored);
    return stored;
  });
  const effectiveSidebarWidth = collapsedSidebar ? 48 : sidebarWidth;
  const linkedUploadPlayerIds = authUser?.playerAccounts.map((player) => player.playerId) || [];
  const defaultUploadPlayerId = authUser?.playerAccounts[0]?.playerId || "";
  const effectiveUploadPlayerId =
    uploadPlayerMode === "linked" && linkedUploadPlayerIds.includes(selectedUploadPlayerId)
      ? selectedUploadPlayerId
      : defaultUploadPlayerId;
  const tagSuggestions = useMemo(() => {
    const tags = new Map<string, string>();
    [...defaultDaybreakTags, ...islands.flatMap((island) => island.tags)].forEach((tag) => {
      const cleanTag = tag.trim().replace(/^#/, "").replace(/\s+/g, "");
      if (cleanTag) {
        tags.set(cleanTag.toLowerCase(), cleanTag);
      }
    });
    return Array.from(tags.values()).slice(0, 18);
  }, [islands]);
  const activeTagQuery = uploadTagsInput.match(/(?:^|\s)#?([\w-]*)$/)?.[1].toLowerCase() || "";
  const selectedUploadTags = uploadTagsInput.toLowerCase().split(/[\s,]+/).map((tag) => tag.replace(/^#/, ""));
  const visibleTagSuggestions = tagSuggestions
    .filter((tag) => tag.toLowerCase().includes(activeTagQuery))
    .filter((tag) => !selectedUploadTags.includes(tag.toLowerCase()))
    .slice(0, 6);
  const activeEditTagQuery = editTagsInput.match(/(?:^|\s)#?([\w-]*)$/)?.[1].toLowerCase() || "";
  const selectedEditTags = editTagsInput.toLowerCase().split(/[\s,]+/).map((tag) => tag.replace(/^#/, ""));
  const visibleEditTagSuggestions = tagSuggestions
    .filter((tag) => tag.toLowerCase().includes(activeEditTagQuery))
    .filter((tag) => !selectedEditTags.includes(tag.toLowerCase()))
    .slice(0, 6);

  const clearFooterIntentTimer = useCallback(() => {
    if (footerIntentTimerRef.current) {
      clearTimeout(footerIntentTimerRef.current);
      footerIntentTimerRef.current = null;
    }
  }, []);

  const clearFooterHideTimer = useCallback(() => {
    if (footerHideTimerRef.current) {
      clearTimeout(footerHideTimerRef.current);
      footerHideTimerRef.current = null;
    }
  }, []);

  const scheduleIdleFooter = useCallback(() => {
    if (footerIdleTimerRef.current) {
      clearTimeout(footerIdleTimerRef.current);
    }
    footerIdleTimerRef.current = setTimeout(() => setFooterVisible(true), FOOTER_IDLE_DELAY_MS);
  }, []);

  const showFooterWithIntent = useCallback(() => {
    clearFooterHideTimer();
    if (footerVisible || footerIntentTimerRef.current) {
      return;
    }

    footerIntentTimerRef.current = setTimeout(() => {
      setFooterVisible(true);
      footerIntentTimerRef.current = null;
    }, FOOTER_INTENT_DELAY_MS);
  }, [clearFooterHideTimer, footerVisible]);

  const hideFooterAfterInteraction = useCallback(() => {
    clearFooterIntentTimer();
    clearFooterHideTimer();
    footerHideTimerRef.current = setTimeout(() => {
      setFooterVisible(false);
      footerHideTimerRef.current = null;
    }, FOOTER_HIDE_DELAY_MS);
    scheduleIdleFooter();
  }, [clearFooterHideTimer, clearFooterIntentTimer, scheduleIdleFooter]);

  useEffect(() => {
    const syncMenuFromLocation = () => {
      const params = new URLSearchParams(window.location.search);
      const redeemCodeParam = params.get("code") || "";
      if (redeemCodeParam) {
        const cleanRedeemCode = redeemCodeParam.toUpperCase() === "ALL" ? "ALL" : redeemCodeParam.replace(/[^A-Za-z0-9]/g, "");
        setRedeemCode(cleanRedeemCode);
      }
      setActiveMenu(resolveActiveMenu(window.location));
    };

    syncMenuFromLocation();
    window.addEventListener("hashchange", syncMenuFromLocation);
    window.addEventListener("popstate", syncMenuFromLocation);

    return () => {
      window.removeEventListener("hashchange", syncMenuFromLocation);
      window.removeEventListener("popstate", syncMenuFromLocation);
    };
  }, []);

  useLayoutEffect(() => {
    if (typeof window === "undefined" || window.location.hash.startsWith("#island-")) {
      return;
    }

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [activeMenu]);

  useEffect(() => {
    const formatMetric = (value: unknown) => {
      const number = Number(value || 0);
      if (!Number.isFinite(number)) {
        return "0";
      }
      return new Intl.NumberFormat("en-US", {
        notation: number >= 1000 ? "compact" : "standard",
        maximumFractionDigits: number >= 1000 ? 1 : 0,
      }).format(number);
    };

    const loadBotMetrics = async () => {
      try {
        const [statusResponse, feedResponse] = await Promise.all([
          fetch("/api/bot-status", { headers: { Accept: "application/json" } }),
          fetch("/api/bot-feed?limit=10", { headers: { Accept: "application/json" } }),
        ]);
        const status = statusResponse.ok ? await statusResponse.json() : {};
        const feed = feedResponse.ok ? await feedResponse.json() : {};
        const summary = feed.summary || {};

        setBotMetrics({
          servers: formatMetric(summary.servers ?? status.servers_count ?? status.guilds_count),
          members: formatMetric(summary.members ?? status.total_members ?? status.members_count),
          monitors: formatMetric(summary.active_monitors),
          redeemServers: formatMetric(summary.auto_redeem_servers),
          giftCodes: formatMetric(summary.active_gift_codes),
        });
      } catch {
        setBotMetrics(fallbackBotMetrics);
      }
    };

    void loadBotMetrics();
  }, []);

  const loadGiftCodes = useCallback(async () => {
    if (giftCodeRefreshRef.current) {
      return;
    }

    giftCodeRefreshRef.current = true;
    setGiftCodeLoading(true);
    setGiftCodeStatus(giftCodes.length ? "Refreshing active codes in the background." : "");

    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 10000);
      const response = await fetch("/api/gift-codes", {
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: controller.signal,
      });
      window.clearTimeout(timeout);
      if (!response.ok) {
        throw new Error("Unable to load gift codes.");
      }

      const payload = (await response.json()) as GiftCodePayload;
      const activeCodes = (payload.codes || []).filter((item) => item.isActive !== false);
      if (activeCodes.length) {
        const nextPayload = {
          codes: activeCodes,
          lastUpdated: payload.lastUpdated || new Date().toISOString(),
          refreshAfterSeconds: payload.refreshAfterSeconds,
        };
        setGiftCodes(activeCodes);
        setGiftCodeUpdatedAt(nextPayload.lastUpdated);
        localStorage.setItem(giftCodesStorageKey, JSON.stringify(nextPayload));
        setGiftCodeStatus("");
      } else {
        setGiftCodeStatus(giftCodes.length ? "No new active codes found. Showing the last active list." : "No active gift codes are available right now.");
      }
    } catch {
      setGiftCodeStatus(giftCodes.length ? "Refresh is taking longer than expected. Showing the last active list." : "Gift codes are temporarily unavailable. Try refreshing in a moment.");
    } finally {
      giftCodeRefreshRef.current = false;
      setGiftCodeLoading(false);
    }
  }, [giftCodes.length]);

  useEffect(() => {
    if ((activeMenu === "gift" || activeMenu === "redeem") && !giftCodes.length && !giftCodeLoading) {
      const timer = window.setTimeout(() => void loadGiftCodes(), 0);
      return () => window.clearTimeout(timer);
    }
  }, [activeMenu, giftCodes.length, giftCodeLoading, loadGiftCodes]);

  useEffect(() => {
    if (activeMenu !== "gift" && activeMenu !== "redeem") {
      return;
    }

    const interval = window.setInterval(() => {
      void loadGiftCodes();
    }, 30000);

    return () => window.clearInterval(interval);
  }, [activeMenu, loadGiftCodes]);

  useEffect(() => {
    const updateFooterForActivity = (event: Event) => {
      const target = event.target instanceof Element ? event.target : null;
      const isSidebarActivity = Boolean(target?.closest(".sidebar, .settings-panel"));

      if (isSidebarActivity) {
        showFooterWithIntent();
      } else {
        hideFooterAfterInteraction();
      }
    };
    const events = ["pointermove", "mousemove", "pointerdown", "keydown", "wheel", "touchstart", "scroll"];

    scheduleIdleFooter();
    events.forEach((eventName) => window.addEventListener(eventName, updateFooterForActivity, { passive: true }));

    return () => {
      clearFooterIntentTimer();
      clearFooterHideTimer();
      if (footerIdleTimerRef.current) {
        clearTimeout(footerIdleTimerRef.current);
      }
      events.forEach((eventName) => window.removeEventListener(eventName, updateFooterForActivity));
    };
  }, [clearFooterHideTimer, clearFooterIntentTimer, footerVisible, hideFooterAfterInteraction, scheduleIdleFooter, showFooterWithIntent]);

  useEffect(() => {
    const endpoint =
      daybreakView === "uploads"
        ? `${apiBase}/api/daybreak/me/uploads`
        : daybreakView === "favorites"
          ? `${apiBase}/api/daybreak/me/favorites`
          : `${apiBase}/api/daybreak/islands?sort=${sort}${selectedTag ? `&tag=${encodeURIComponent(selectedTag)}` : ""}`;

    if (daybreakView !== "gallery" && !authUser) {
      return;
    }

    fetch(endpoint, { credentials: "include" })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: { islands: Island[]; favoriteIds?: string[] }) => {
        setIslands(data.islands);
        const favoriteIds = data.favoriteIds;
        if (favoriteIds) {
          setLikedIslands((current) => ({ ...current, ...Object.fromEntries(favoriteIds.map((id) => [id, true])) }));
        }
        setStatus("");
      })
      .catch(() => setStatus(""));
  }, [sort, daybreakView, authUser, selectedTag]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authError = params.get("auth_error");
    if (authError) {
      params.delete("auth_error");
      const nextUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}${window.location.hash}`;
      window.history.replaceState(null, "", nextUrl);
    }

    fetch(`${apiBase}/api/auth/session`, { credentials: "include" })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: { user: AuthUser | null }) => setAuthUser(data.user))
      .catch(() => setAuthStatus(""))
      .finally(() => setAuthLoading(false));
  }, []);

  useEffect(() => {
    if (!authUser) {
      return;
    }

    fetch(`${apiBase}/api/daybreak/me/favorites?limit=60`, { credentials: "include" })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: { favoriteIds?: string[] }) => {
        const favoriteIds = data.favoriteIds || [];
        setLikedIslands((current) => ({ ...current, ...Object.fromEntries(favoriteIds.map((id) => [id, true])) }));
      })
      .catch(() => null);
  }, [authUser]);

  useEffect(() => {
    if (!resizingSidebar || collapsedSidebar) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      setSidebarWidth(Math.min(380, Math.max(176, event.clientX)));
    };
    const stopResizing = () => setResizingSidebar(false);

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopResizing, { once: true });
    document.body.classList.add("is-resizing-sidebar");

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopResizing);
      document.body.classList.remove("is-resizing-sidebar");
    };
  }, [collapsedSidebar, resizingSidebar]);

  const shellStyle = {
    "--sidebar-width": `${effectiveSidebarWidth}px`,
  } as CSSProperties;

  const refreshIslands = async () => {
    const endpoint =
      daybreakView === "uploads"
        ? `${apiBase}/api/daybreak/me/uploads`
        : daybreakView === "favorites"
          ? `${apiBase}/api/daybreak/me/favorites`
          : `${apiBase}/api/daybreak/islands?sort=${sort}${selectedTag ? `&tag=${encodeURIComponent(selectedTag)}` : ""}`;
    const response = await fetch(endpoint, { credentials: "include" });
    if (!response.ok) {
      throw new Error("Unable to refresh islands");
    }

    const data = (await response.json()) as { islands: Island[]; favoriteIds?: string[] };
    setIslands(data.islands);
    const favoriteIds = data.favoriteIds;
    if (favoriteIds) {
      setLikedIslands((current) => ({ ...current, ...Object.fromEntries(favoriteIds.map((id) => [id, true])) }));
    }
  };

  const loadComments = async (island: Island) => {
    setViewerImage(island);
    setImageZoom(100);
    setComments([]);

    setCommentsLoading(true);
    try {
      const response = await fetch(`${apiBase}/api/daybreak/islands/${island.id}/comments`);
      if (!response.ok) {
        throw new Error("Unable to load comments");
      }

      const data = (await response.json()) as { comments: IslandComment[] };
      setComments(data.comments);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to load comments");
    } finally {
      setCommentsLoading(false);
    }
  };

  const sharedIslandIdFromLocation = () => {
    if (typeof window === "undefined") {
      return "";
    }

    const pathMatch = window.location.pathname.match(/^\/daybreak\/island\/([^/]+)\/?$/);
    if (pathMatch?.[1]) {
      return decodeURIComponent(pathMatch[1]);
    }

    const islandParam = new URLSearchParams(window.location.search).get("island");
    if (islandParam) {
      return islandParam;
    }

    return window.location.hash.startsWith("#island-") ? window.location.hash.replace("#island-", "") : "";
  };

  useEffect(() => {
    const targetId = sharedIslandIdFromLocation();
    if (!targetId) {
      return;
    }

    const targetIsland = islands.find((island) => island.id === targetId);
    if (!targetIsland) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      setLinkedIslandId(targetId);
      setActiveMenu("daybreak");
      document.getElementById(`island-${targetId}`)?.scrollIntoView({ block: "center", behavior: "smooth" });

      if (openedSharedIslandRef.current !== targetId) {
        openedSharedIslandRef.current = targetId;
        void loadComments(targetIsland);
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [islands]);

  const fetchPlayerDetails = async (playerId: string) => {
    const cleanedPlayerId = playerId.replace(/\D/g, "");
    if (!/^\d{8,9}$/.test(cleanedPlayerId)) {
      setPlayerLookup(null);
      setPlayerLookupStatus("Enter an 8 or 9 digit player ID first.");
      return;
    }

    setFetchingPlayer(true);
    setPlayerLookupStatus("");
    try {
      const response = await fetch(`${apiBase}/api/daybreak/players/${cleanedPlayerId}`);
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || "Player details could not be fetched.");
      }

      setPlayerLookup(data.player);
      setPlayerLookupStatus("Player details loaded.");
    } catch (error) {
      setPlayerLookup(null);
      setPlayerLookupStatus(error instanceof Error ? error.message : "Player details could not be fetched.");
    } finally {
      setFetchingPlayer(false);
    }
  };

  const handleUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!authUser) {
      setUploadOpen(false);
      setLoginOpen(true);
      setAuthStatus("Sign in before uploading a Daybreak Island showcase.");
      return;
    }

    setUploading(true);
    setStatus("");

    try {
      const form = event.currentTarget;
      const body = new FormData(form);
      const hasFile = body.get("image") instanceof File && (body.get("image") as File).size > 0;
      const hasImageUrl = String(body.get("imageUrl") || "").trim().length > 0;

      if (!hasFile && !hasImageUrl) {
        throw new Error("Upload a screenshot or paste an image link.");
      }

      const response = await fetch(`${apiBase}/api/daybreak/islands`, {
        method: "POST",
        credentials: "include",
        body,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.detail || data?.error || "Upload failed");
      }

      form.reset();
      setUploadImageLabel("No image selected");
      setUploadPreviewUrl("");
      setUploadTagsInput("");
      await refreshIslands();
      setStatus("Island uploaded to the community showcase.");
      setUploadOpen(false);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleUploadImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    if (!file) {
      setUploadImageLabel("No image selected");
      setUploadPreviewUrl("");
      return;
    }

    setUploadImageLabel(file.name);
    setUploadPreviewUrl(URL.createObjectURL(file));
  };

  const handleUploadImageUrlChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.currentTarget.value.trim();
    if (!value) {
      setUploadImageLabel("No image selected");
      setUploadPreviewUrl("");
      return;
    }

    setUploadImageLabel("Image link ready");
    setUploadPreviewUrl(value);
  };

  const closeUploadModal = () => {
    setUploadOpen(false);
    setPlayerLookup(null);
    setPlayerLookupStatus("");
  };

  const closeEditModal = () => {
    setEditingIsland(null);
    setEditTagsInput("");
  };

  const openUploadModal = () => {
    if (!authUser) {
      setAuthStatus("Sign in before uploading a Daybreak Island showcase.");
      setLoginOpen(true);
      return;
    }

    const firstLinkedAccount = authUser.playerAccounts[0]?.playerId || "";
    if (firstLinkedAccount && (!selectedUploadPlayerId || !authUser.playerAccounts.some((player) => player.playerId === selectedUploadPlayerId))) {
      setSelectedUploadPlayerId(firstLinkedAccount);
      setUploadPlayerMode("linked");
    }
    setUploadOpen(true);
  };

  const updateIsland = (next: Island) => {
    setIslands((current) => current.map((island) => (island.id === next.id ? next : island)));
    setViewerImage((current) => (current?.id === next.id ? next : current));
    setShareIslandTarget((current) => (current?.id === next.id ? next : current));
    setEditingIsland((current) => (current?.id === next.id ? next : current));
  };

  const canManageIsland = (island: Island) =>
    Boolean(
      island.canManage ||
      (authUser &&
        (island.creatorUserId === authUser.id ||
          (!island.creatorUserId && authUser.playerAccounts.some((player) => player.playerId === island.playerId || player.nickname === island.creatorName)))),
    );

  const deleteIsland = async (island: Island) => {
    if (!authUser) {
      requireDaybreakSignIn("Sign in to delete your Daybreak Island uploads.");
      return;
    }
    if (!canManageIsland(island)) {
      setStatus("You can only delete islands you uploaded.");
      return;
    }
    if (!window.confirm(`Delete "${island.title}" from the community showcase? This cannot be undone.`)) {
      return;
    }

    setDeletingIslandId(island.id);
    setStatus("");
    try {
      const deleteUrl = `${apiBase}/api/daybreak/islands/${island.id}`;
      let response = await fetch(deleteUrl, {
        method: "DELETE",
        credentials: "include",
      });
      if (response.status === 404 && typeof window !== "undefined" && ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname)) {
        response = await fetch(`${localApiHost()}/api/daybreak/islands/${island.id}`, {
          method: "DELETE",
          credentials: "include",
        });
      }
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.detail || data?.error || `Unable to delete island (${response.status})`);
      }

      setIslands((current) => current.filter((item) => item.id !== island.id));
      setLikedIslands((current) => {
        const next = { ...current };
        delete next[island.id];
        return next;
      });
      setViewerImage((current) => (current?.id === island.id ? null : current));
      setShareIslandTarget((current) => (current?.id === island.id ? null : current));
      setStatus("Island deleted.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to delete island");
    } finally {
      setDeletingIslandId("");
    }
  };

  const likeIsland = async (island: Island) => {
    if (likedIslands[island.id]) {
      return;
    }

    const response = await fetch(`${apiBase}/api/daybreak/islands/${island.id}/like`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ viewerId }),
    });
    const data = (await response.json()) as { island?: Island };
    if (data.island) {
      setLikedIslands((current) => ({ ...current, [island.id]: true }));
      updateIsland(data.island);
    }
  };

  const requireDaybreakSignIn = (message: string) => {
    setAuthStatus(message);
    setLoginOpen(true);
  };

  const setSignedInDaybreakView = (view: DaybreakView) => {
    if (view !== "gallery" && !authUser) {
      requireDaybreakSignIn("Sign in to use My Uploads and Favorites.");
      return;
    }

    setDaybreakView(view);
  };

  const selectIslandTag = (tag: string) => {
    setSelectedTag(tag.replace(/^#/, ""));
    setDaybreakView("gallery");
    setViewerImage(null);
    document.getElementById("showcase")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const addUploadTagSuggestion = (tag: string) => {
    const cleanTag = tag.trim().replace(/^#/, "").replace(/\s+/g, "");
    if (!cleanTag) {
      return;
    }
    setUploadTagsInput((current) => {
      const withoutActiveToken = current.replace(/(?:^|\s)#?[\w-]*$/, "").trim();
      const next = `${withoutActiveToken ? `${withoutActiveToken} ` : ""}#${cleanTag} `;
      return next;
    });
  };

  const addEditTagSuggestion = (tag: string) => {
    const cleanTag = tag.trim().replace(/^#/, "").replace(/\s+/g, "");
    if (!cleanTag) {
      return;
    }
    setEditTagsInput((current) => {
      const withoutActiveToken = current.replace(/(?:^|\s)#?[\w-]*$/, "").trim();
      return `${withoutActiveToken ? `${withoutActiveToken} ` : ""}#${cleanTag} `;
    });
  };

  const openEditIslandModal = (island: Island) => {
    if (!canManageIsland(island)) {
      setStatus("You can only edit islands you uploaded.");
      return;
    }
    setEditingIsland(island);
    setEditTagsInput(island.tags.map((tag) => `#${tag.replace(/^#/, "")}`).join(" "));
  };

  const handleEditIsland = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingIsland) {
      return;
    }
    if (!authUser) {
      closeEditModal();
      requireDaybreakSignIn("Sign in to edit your Daybreak Island uploads.");
      return;
    }

    setEditSaving(true);
    setStatus("");
    try {
      const form = event.currentTarget;
      const body = Object.fromEntries(new FormData(form).entries());
      const response = await fetch(`${apiBase}/api/daybreak/islands/${editingIsland.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.detail || data?.error || `Unable to update island (${response.status})`);
      }
      if (data?.island) {
        updateIsland(data.island);
      }
      setStatus("Island details updated.");
      closeEditModal();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to update island");
    } finally {
      setEditSaving(false);
    }
  };

  const shareIsland = async (island: Island) => {
    const shareUrl = shareUrlFor(island);
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(shareUrl);
    } else {
      window.prompt("Copy island link", shareUrl);
    }

    const response = await fetch(`${apiBase}/api/daybreak/islands/${island.id}/share`, { method: "POST" });
    const data = (await response.json()) as { island?: Island };
    if (data.island) {
      updateIsland(data.island);
    }

    setStatus("Share link copied.");
  };

  const copyGiftCode = async (code: string) => {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard unavailable");
      }
      await navigator.clipboard.writeText(code);
    } catch {
      window.prompt("Copy gift code", code);
    }
    setCopiedGiftCode(code);
    window.setTimeout(() => setCopiedGiftCode((current) => (current === code ? "" : current)), 1600);
  };

  const copyAllGiftCodes = async () => {
    const allCodes = giftCodes.map((item) => item.code).join("\n");
    if (!allCodes) {
      return;
    }

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard unavailable");
      }
      await navigator.clipboard.writeText(allCodes);
    } catch {
      window.prompt("Copy active gift codes", allCodes);
    }
    setGiftCodeStatus("All active codes copied.");
  };

  const openRedeemPage = (code = "ALL") => {
    const cleanCode = code.toUpperCase() === "ALL" ? "ALL" : code.replace(/[^A-Za-z0-9]/g, "");
    setRedeemCode(cleanCode);
    setRedeemResult(null);
    setActiveMenu("redeem");
    window.history.pushState(null, "", `/redeem?code=${encodeURIComponent(cleanCode)}`);
  };

  const formatGiftDate = (value?: string) => {
    if (!value) {
      return "Unknown";
    }

    const parsed = new Date(value);
    if (!Number.isFinite(parsed.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
      timeZoneName: "short",
    }).format(parsed);
  };

  const submitRedeem = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRedeemLoading(true);
    setRedeemResult(null);

    try {
      const selectedRedeemCode = redeemCode || "ALL";
      const codesToRedeem = selectedRedeemCode === "ALL" ? giftCodes.map((item) => item.code) : [selectedRedeemCode];
      if (!codesToRedeem.length) {
        throw new Error("No active codes are loaded yet.");
      }

      const results = await Promise.all(
        codesToRedeem.map(async (code) => {
          const response = await fetch("/api/gift-codes/redeem", {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({
              playerId: redeemPlayerId,
              code,
            }),
          });
          const payload = await response.json().catch(() => null);
          if (!response.ok) {
            return {
              code,
              state: "error",
              message: payload?.message || payload?.error || "Unable to redeem.",
              player: payload?.player as PlayerProfile | undefined,
            };
          }

          const result = payload as RedeemResult;
          return {
            code,
            state: result.state,
            message: result.message,
            player: result.player,
          };
        }),
      );

      const firstPlayer = results.find((item) => item.player)?.player;
      if (firstPlayer) {
        setRedeemPlayer(firstPlayer);
      }

      if (selectedRedeemCode === "ALL") {
        const failedCount = results.filter((item) => ["error", "invalid", "expired", "rate_limited", "unknown"].includes(item.state)).length;
        setRedeemResult({
          state: failedCount ? "partial" : "success",
          message: failedCount
            ? `${results.length - failedCount} of ${results.length} active codes redeemed or already claimed.`
            : `Submitted all ${results.length} active codes successfully.`,
          checkedAt: new Date().toISOString(),
          player: firstPlayer,
          results: results.map(({ code, state, message }) => ({ code, state, message })),
        });
      } else {
        const [singleResult] = results;
        setRedeemResult({
          state: singleResult.state,
          message: singleResult.message,
          checkedAt: new Date().toISOString(),
          player: singleResult.player,
        });
      }
    } catch (error) {
      setRedeemResult({ state: "error", message: error instanceof Error ? error.message : "Unable to redeem." });
    } finally {
      setRedeemLoading(false);
    }
  };

  const addComment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!authUser) {
      setLoginOpen(true);
      setAuthStatus("Sign in before commenting on a Daybreak Island.");
      return;
    }

    if (!viewerImage) {
      setStatus("Open an island before commenting.");
      return;
    }

    setCommentSaving(true);
    try {
      const form = event.currentTarget;
      const body = Object.fromEntries(new FormData(form).entries());
      const response = await fetch(`${apiBase}/api/daybreak/islands/${viewerImage.id}/comments`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.detail || data?.error || `Unable to add comment (${response.status})`);
      }

      if (data.island) {
        updateIsland(data.island);
      }
      setComments(data.comments || []);
      setStatus("");
      form.reset();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to add comment");
    } finally {
      setCommentSaving(false);
    }
  };

  const signInWith = (provider: "google" | "discord") => {
    const returnTo = typeof window === "undefined" ? "" : window.location.href;
    window.location.href = `${apiBase}/api/auth/${provider}?returnTo=${encodeURIComponent(returnTo)}`;
  };

  const signOut = async () => {
    await fetch(`${apiBase}/api/auth/logout`, { method: "POST", credentials: "include" }).catch(() => null);
    setAuthUser(null);
    setLikedIslands({});
    setDaybreakView("gallery");
    setAccountMenuOpen(false);
    setProfileOpen(false);
  };

  const linkPlayerAccount = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLinkingPlayer(true);
    setAuthStatus("");

    try {
      const form = event.currentTarget;
      const body = Object.fromEntries(new FormData(form).entries());
      const response = await fetch(`${apiBase}/api/profile/player-accounts`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || "Unable to link player account");
      }

      setAuthUser(data.user);
      setPlayerLookup(null);
      setPlayerLookupStatus("");
      form.reset();
    } catch (error) {
      setAuthStatus(error instanceof Error ? error.message : "Unable to link player account");
    } finally {
      setLinkingPlayer(false);
    }
  };

  const memberSince = (value?: string) =>
    value
      ? new Intl.DateTimeFormat(undefined, { month: "numeric", day: "numeric", year: "numeric" }).format(new Date(value))
      : "Today";

  const shareUrlFor = (island: Island) => `${window.location.origin}/daybreak/island/${encodeURIComponent(island.id)}`;

  const downloadImage = async (island: Island) => {
    const fileName = `${island.title.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "daybreak-island"}.jpg`;
    try {
      const response = await fetch(island.imageUrl);
      if (!response.ok) {
        throw new Error("download blocked");
      }
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch {
      const link = document.createElement("a");
      link.href = island.imageUrl;
      link.download = fileName;
      link.target = "_blank";
      link.rel = "noreferrer";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setStatus("Image opened in a new tab because the host blocked direct download.");
    }
  };

  const socialShareUrl = (platform: "discord" | "whatsapp" | "x", island: Island) => {
    const shareUrl = shareUrlFor(island);
    const text = `${island.title} by ${island.player.nickname} at X:${island.coordinates.x} Y:${island.coordinates.y}`;

    if (platform === "discord") {
      return `https://discord.com/channels/@me?message=${encodeURIComponent(`${text} ${shareUrl}`)}`;
    }
    if (platform === "whatsapp") {
      return `https://wa.me/?text=${encodeURIComponent(`${text} ${shareUrl}`)}`;
    }
    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
  };

  const availablePlannerBuildings = useMemo(
    () => plannerBuildings.filter((building) => plannerMode === "castle" || !building.castleOnly),
    [plannerMode],
  );

  const selectedPlannerTemplate =
    plannerBuildings.find((building) => building.id === selectedPlannerBuilding) || plannerBuildings[1];

  const plannerStats = useMemo(
    () => {
      const usedCells = plannerObjects.reduce((total, item) => total + item.width * item.height, 0);
      return {
        flags: plannerObjects.filter((item) => item.type === "flag").length,
        cities: plannerObjects.filter((item) => item.type === "city").length,
        traps: plannerObjects.filter((item) => item.type === "trap" && item.alliance === "main").length,
        hq: plannerObjects.filter((item) => item.type === "hq").length,
        nodes: plannerObjects.filter((item) => item.type === "node").length,
        obstacles: plannerObjects.filter((item) => item.type === "obstacle").length,
        usedCells,
        utilization: Math.round((usedCells / (plannerGridSize * plannerGridSize)) * 100),
      };
    },
    [plannerObjects],
  );

  const plannerHealth = useMemo(() => {
    const warnings: string[] = [];
    if (plannerStats.hq === 0) warnings.push("Add an HQ anchor for alliance planning.");
    if (plannerStats.traps > 2) warnings.push("Main alliance has more than 2 Bear Traps.");
    if (plannerStats.flags < 4 && plannerObjects.length > 4) warnings.push("Consider more flags for territory lines.");
    if (plannerStats.utilization > 72) warnings.push("Layout is dense; leave room for future edits.");
    return warnings;
  }, [plannerObjects.length, plannerStats.flags, plannerStats.hq, plannerStats.traps, plannerStats.utilization]);

  

  const selectedPlannerObject = useMemo(
    () => plannerObjects.find((item) => item.id === selectedPlannerObjectId) || null,
    [plannerObjects, selectedPlannerObjectId],
  );

  const sortedPlannerObjects = useMemo(
    () => [...plannerObjects].sort((a, b) => a.type.localeCompare(b.type) || a.label.localeCompare(b.label)),
    [plannerObjects],
  );

  const encodePlannerLayout = (objects = plannerObjects) => {
    const payload: PlannerLayoutPayload = {
      version: 1,
      mode: plannerMode,
      alliance: plannerAlliance,
      objects,
    };

    return encodePlannerLayoutPayload(payload);
  };

  const objectAtPlannerCell = (x: number, y: number) =>
    [...plannerObjects]
      .reverse()
      .find((item) => x >= item.x && x < item.x + item.width && y >= item.y && y < item.y + item.height);

  const getPlannerCellFromPointer = (clientX: number, clientY: number) => {
    const grid = plannerGridRef.current;
    if (!grid) {
      return null;
    }

    const rect = grid.getBoundingClientRect();
    const innerLeft = rect.left + grid.clientLeft;
    const innerTop = rect.top + grid.clientTop;
    const innerWidth = Math.max(1, grid.clientWidth);
    const innerHeight = Math.max(1, grid.clientHeight);
    const cellWidth = innerWidth / plannerGridSize;
    const cellHeight = innerHeight / plannerGridSize;
    return {
      x: Math.min(plannerGridSize - 1, Math.max(0, Math.floor((clientX - innerLeft) / cellWidth))),
      y: Math.min(plannerGridSize - 1, Math.max(0, Math.floor((clientY - innerTop) / cellHeight))),
    };
  };

  const clampPlannerObjectPosition = (x: number, y: number, width: number, height: number) => ({
    x: Math.min(plannerGridSize - width, Math.max(0, x)),
    y: Math.min(plannerGridSize - height, Math.max(0, y)),
  });

  const plannerObjectSizeForTemplate = (template: PlannerBuilding = selectedPlannerTemplate) => ({
    width: template.id === "obstacle" ? plannerObstacleSize : template.width,
    height: template.id === "obstacle" ? plannerObstacleSize : template.height,
  });

  const anchoredPlannerPosition = (cellX: number, cellY: number, width: number, height: number) =>
    clampPlannerObjectPosition(cellX - Math.floor(width / 2), cellY - Math.floor(height / 2), width, height);

  const canPlacePlannerObject = (
    x: number,
    y: number,
    width: number,
    height: number,
    ignoreId = "",
    objects = plannerObjects,
  ) => {
    if (x < 0 || y < 0 || x + width > plannerGridSize || y + height > plannerGridSize) {
      return false;
    }

    return !objects.some((item) => {
      if (item.id === ignoreId) {
        return false;
      }

      return x < item.x + item.width && x + width > item.x && y < item.y + item.height && y + height > item.y;
    });
  };

  const plannerPlacementPreview = useMemo(() => {
    if (!plannerHoverCell || plannerDragPreview || plannerTool !== "select" || selectedPlannerObject) {
      return null;
    }

    const { width, height } = plannerObjectSizeForTemplate(selectedPlannerTemplate);
    const next = anchoredPlannerPosition(plannerHoverCell.x, plannerHoverCell.y, width, height);
    return {
      ...next,
      width,
      height,
      color: selectedPlannerTemplate.color,
      label: selectedPlannerTemplate.label,
      valid: canPlacePlannerObject(next.x, next.y, width, height),
    };
    // Preview validation needs the current planner snapshot; canPlacePlannerObject is recreated with that snapshot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plannerDragPreview, plannerHoverCell, plannerObstacleSize, plannerTool, selectedPlannerObject, selectedPlannerTemplate, plannerObjects]);

  const commitPlannerObjects = (nextObjects: PlannerObject[], message = "") => {
    setPlannerHistory((history) => [...history.slice(-39), plannerObjects]);
    setPlannerFuture([]);
    setPlannerObjects(nextObjects);
    setPlannerStatus(message);
  };

  const updatePlannerObject = (objectId: string, patch: Partial<PlannerObject>, message = "Planner updated.") => {
    const target = plannerObjects.find((item) => item.id === objectId);
    if (!target) {
      return;
    }

    const nextTarget = { ...target, ...patch };
    const nextPosition = clampPlannerObjectPosition(nextTarget.x, nextTarget.y, nextTarget.width, nextTarget.height);
    const normalizedTarget = { ...nextTarget, ...nextPosition };

    if (!canPlacePlannerObject(normalizedTarget.x, normalizedTarget.y, normalizedTarget.width, normalizedTarget.height, normalizedTarget.id)) {
      setPlannerStatus("That edit overlaps another building.");
      return;
    }

    commitPlannerObjects(plannerObjects.map((item) => (item.id === objectId ? normalizedTarget : item)), message);
  };

  const placePlannerObject = (x: number, y: number) => {
    const template = selectedPlannerTemplate;
    if (template.castleOnly && plannerMode !== "castle") {
      setPlannerStatus("Enemy Zone is available in Castle mode.");
      return;
    }

    const { width, height } = plannerObjectSizeForTemplate(template);
    const next = anchoredPlannerPosition(x, y, width, height);

    if (!canPlacePlannerObject(next.x, next.y, width, height)) {
      setPlannerStatus("That space is blocked or outside the planner grid.");
      return;
    }

    const sameTypeCount = plannerObjects.filter((item) => item.type === template.id).length + 1;
    const nextObject: PlannerObject = {
      id: crypto.randomUUID(),
      type: template.id,
      label: template.id === "city" ? `City ${sameTypeCount}` : template.label,
      x: next.x,
      y: next.y,
      width,
      height,
      alliance: plannerAlliance,
    };

    commitPlannerObjects([...plannerObjects, nextObject], `${template.label} placed.`);
    setSelectedPlannerObjectId(nextObject.id);
  };

  const handlePlannerCellClick = (x: number, y: number) => {
    if (plannerSuppressClickRef.current) {
      plannerSuppressClickRef.current = false;
      return;
    }

    const target = objectAtPlannerCell(x, y);

    if (plannerTool === "erase") {
      if (target) {
        commitPlannerObjects(plannerObjects.filter((item) => item.id !== target.id), `${target.label} removed.`);
        setSelectedPlannerObjectId("");
      }
      return;
    }

    if (plannerTool === "pan") {
      setPlannerStatus("Use the board scrollbars or mouse wheel to pan the planner.");
      return;
    }

    if (plannerTool === "select") {
      if (target) {
        setSelectedPlannerObjectId(target.id);
        setPlannerStatus(`${target.label} selected.`);
        return;
      }

      const selected = plannerObjects.find((item) => item.id === selectedPlannerObjectId);
      if (selected && canPlacePlannerObject(x, y, selected.width, selected.height, selected.id)) {
        commitPlannerObjects(
          plannerObjects.map((item) => (item.id === selected.id ? { ...item, x, y } : item)),
          `${selected.label} moved.`,
        );
        return;
      }
    }

    placePlannerObject(x, y);
  };

  const startPlannerObjectDrag = (event: ReactPointerEvent<HTMLButtonElement>, object: PlannerObject) => {
    if (plannerTool === "erase") {
      commitPlannerObjects(plannerObjects.filter((item) => item.id !== object.id), `${object.label} removed.`);
      setSelectedPlannerObjectId("");
      return;
    }

    if (plannerTool === "pan") {
      return;
    }

    const cell = getPlannerCellFromPointer(event.clientX, event.clientY);
    if (!cell) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    setSelectedPlannerObjectId(object.id);
    setPlannerStatus(`${object.label} selected.`);
    plannerDragRef.current = {
      kind: "object",
      pointerId: event.pointerId,
      objectId: object.id,
      offsetX: Math.max(0, Math.min(object.width - 1, cell.x - object.x)),
      offsetY: Math.max(0, Math.min(object.height - 1, cell.y - object.y)),
      moved: false,
    };
  };

  const startPlannerPan = (event: ReactPointerEvent<HTMLElement>) => {
    if (plannerTool !== "pan" || event.button !== 0) {
      return;
    }

    const board = plannerBoardRef.current;
    if (!board) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    plannerDragRef.current = {
      kind: "pan",
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      scrollLeft: board.scrollLeft,
      scrollTop: board.scrollTop,
      moved: false,
    };
    setPlannerStatus("Drag to pan the planner board.");
  };

  const handlePlannerWheel = (event: ReactWheelEvent<HTMLElement>) => {
    if (!event.ctrlKey && !event.metaKey) {
      return;
    }

    event.preventDefault();
    setPlannerZoom((value) => Math.min(160, Math.max(60, value + (event.deltaY < 0 ? 10 : -10))));
  };

  const fitPlannerToView = () => {
    const board = plannerBoardRef.current;
    if (!board) {
      return;
    }

    const available = Math.max(280, Math.min(board.clientWidth, board.clientHeight) - 42);
    const nextZoom = Math.min(140, Math.max(60, Math.floor((available / 672) * 100)));
    setPlannerZoom(nextZoom);
    window.requestAnimationFrame(() => {
      board.scrollLeft = Math.max(0, (board.scrollWidth - board.clientWidth) / 2);
      board.scrollTop = Math.max(0, (board.scrollHeight - board.clientHeight) / 2);
    });
    setPlannerStatus("Planner fitted to view.");
  };

  const centerSelectedPlannerObject = () => {
    const board = plannerBoardRef.current;
    const grid = plannerGridRef.current;
    if (!board || !grid || !selectedPlannerObject) {
      setPlannerStatus("Select a building to center.");
      return;
    }

    const cellSize = grid.getBoundingClientRect().width / plannerGridSize;
    const centerX = (selectedPlannerObject.x + selectedPlannerObject.width / 2) * cellSize;
    const centerY = (selectedPlannerObject.y + selectedPlannerObject.height / 2) * cellSize;
    board.scrollTo({
      left: Math.max(0, centerX - board.clientWidth / 2),
      top: Math.max(0, centerY - board.clientHeight / 2),
      behavior: "smooth",
    });
    setPlannerStatus(`${selectedPlannerObject.label} centered.`);
  };

  const nudgeSelectedPlannerObject = (deltaX: number, deltaY: number) => {
    if (!selectedPlannerObject) {
      return;
    }

    const next = clampPlannerObjectPosition(
      selectedPlannerObject.x + deltaX,
      selectedPlannerObject.y + deltaY,
      selectedPlannerObject.width,
      selectedPlannerObject.height,
    );

    if (next.x === selectedPlannerObject.x && next.y === selectedPlannerObject.y) {
      setPlannerStatus("Selected building is at the edge.");
      return;
    }

    updatePlannerObject(selectedPlannerObject.id, next, `${selectedPlannerObject.label} nudged.`);
  };

  const deleteSelectedPlannerObject = () => {
    const selected = plannerObjects.find((item) => item.id === selectedPlannerObjectId);
    if (!selected) {
      setPlannerTool("erase");
      setPlannerStatus("Erase mode enabled.");
      return;
    }

    commitPlannerObjects(plannerObjects.filter((item) => item.id !== selected.id), `${selected.label} removed.`);
    setSelectedPlannerObjectId("");
  };

  const undoPlanner = () => {
    setPlannerHistory((history) => {
      const previous = history.at(-1);
      if (!previous) {
        return history;
      }

      setPlannerFuture((future) => [plannerObjects, ...future.slice(0, 39)]);
      setPlannerObjects(previous);
      setSelectedPlannerObjectId("");
      setPlannerStatus("Undo applied.");
      return history.slice(0, -1);
    });
  };

  const redoPlanner = () => {
    setPlannerFuture((future) => {
      const next = future[0];
      if (!next) {
        return future;
      }

      setPlannerHistory((history) => [...history.slice(-39), plannerObjects]);
      setPlannerObjects(next);
      setSelectedPlannerObjectId("");
      setPlannerStatus("Redo applied.");
      return future.slice(1);
    });
  };

  const clearPlanner = () => {
    if (!plannerObjects.length) {
      return;
    }

    if (!window.confirm("Clear the current city layout?")) {
      return;
    }

    commitPlannerObjects([], "Planner cleared.");
    setSelectedPlannerObjectId("");
  };

  const duplicateSelectedPlannerObject = () => {
    if (!selectedPlannerObject) {
      setPlannerStatus("Select a building first.");
      return;
    }

    for (let radius = 1; radius < plannerGridSize; radius += 1) {
      for (let y = selectedPlannerObject.y - radius; y <= selectedPlannerObject.y + radius; y += 1) {
        for (let x = selectedPlannerObject.x - radius; x <= selectedPlannerObject.x + radius; x += 1) {
          const next = clampPlannerObjectPosition(x, y, selectedPlannerObject.width, selectedPlannerObject.height);
          if (canPlacePlannerObject(next.x, next.y, selectedPlannerObject.width, selectedPlannerObject.height)) {
            const duplicated = {
              ...selectedPlannerObject,
              ...next,
              id: crypto.randomUUID(),
              label: `${selectedPlannerObject.label} Copy`,
            };
            commitPlannerObjects([...plannerObjects, duplicated], `${selectedPlannerObject.label} duplicated.`);
            setSelectedPlannerObjectId(duplicated.id);
            return;
          }
        }
      }
    }

    setPlannerStatus("No open space is available for a duplicate.");
  };

  const loadPlannerCode = (value: string) => {
    if (plannerObjects.length && !window.confirm("Load this layout and replace the current planner?")) {
      return;
    }

    const decoded = decodePlannerLayoutPayload(value);
    const cleanedObjects = decoded.objects
      .filter((item) =>
        plannerBuildings.some((building) => building.id === item.type) &&
        canPlacePlannerObject(item.x, item.y, item.width, item.height, item.id, decoded.objects),
      )
      .map((item): PlannerObject => ({
        ...item,
        alliance: item.alliance === "farm" ? "farm" : "main",
      }));

    setPlannerMode(decoded.mode === "castle" ? "castle" : "base");
    setPlannerAlliance(decoded.alliance === "farm" ? "farm" : "main");
    commitPlannerObjects(cleanedObjects, "Layout loaded.");
    setSelectedPlannerObjectId("");
  };

  const applyPlannerShareCode = (value: string) => {
    const decoded = decodePlannerLayoutPayload(value);
    setPlannerMode(decoded.mode === "castle" ? "castle" : "base");
    setPlannerAlliance(decoded.alliance === "farm" ? "farm" : "main");
    setPlannerObjects(decoded.objects);
    setPlannerHistory([]);
    setPlannerFuture([]);
    setSelectedPlannerObjectId("");
    setPlannerImportCode(value);
    setPlannerStatus("Shared layout loaded.");
  };

  const copyPlannerCode = async () => {
    const code = encodePlannerLayout();
    setPlannerImportCode(code);
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(code);
    }
    setPlannerStatus("Layout code copied.");
  };

  const plannerShareUrl = () => {
    const url = new URL(window.location.href);
    url.pathname = "/";
    url.hash = "city-layout-planner";
    url.searchParams.set("planner", encodePlannerLayout());
    return url.toString();
  };

  const copyPlannerShareLink = async () => {
    const shareUrl = plannerShareUrl();
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(shareUrl);
    } else {
      window.prompt("Copy planner share link", shareUrl);
    }
    setPlannerStatus("Planner share link copied.");
  };

  const exportPlannerCsv = () => {
    const rows = ["type,label,alliance,x,y,width,height", ...plannerObjects.map((item) =>
      [item.type, item.label, item.alliance, item.x, item.y, item.width, item.height]
        .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
        .join(","),
    )];
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "city-layout-planner.csv";
    link.click();
    URL.revokeObjectURL(url);
    setPlannerStatus("CSV exported.");
  };

  const savePlannerPng = () => {
    try {
      const cellSize = 32;
      const canvas = document.createElement("canvas");
      canvas.width = plannerGridSize * cellSize;
      canvas.height = plannerGridSize * cellSize;
      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("PNG export is not available in this browser.");
      }

      context.fillStyle = theme === "dark" ? "#101314" : "#fbfaf7";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.strokeStyle = theme === "dark" ? "rgba(255,255,255,0.14)" : "rgba(25,23,20,0.16)";
      context.lineWidth = 1;
      for (let index = 0; index <= plannerGridSize; index += 1) {
        context.beginPath();
        context.moveTo(index * cellSize + 0.5, 0);
        context.lineTo(index * cellSize + 0.5, canvas.height);
        context.moveTo(0, index * cellSize + 0.5);
        context.lineTo(canvas.width, index * cellSize + 0.5);
        context.stroke();
      }

      plannerObjects.forEach((item) => {
        const template = plannerBuildings.find((building) => building.id === item.type);
        const x = item.x * cellSize + 3;
        const y = item.y * cellSize + 3;
        const width = item.width * cellSize - 6;
        const height = item.height * cellSize - 6;
        context.fillStyle = template?.color || "#64748b";
        context.globalAlpha = item.alliance === "farm" ? 0.72 : 0.94;
        context.fillRect(x, y, width, height);
        context.globalAlpha = 1;
        context.strokeStyle = "rgba(0,0,0,0.28)";
        context.strokeRect(x, y, width, height);
        context.fillStyle = "#ffffff";
        context.font = "700 12px Arial";
        context.textBaseline = "top";
        context.fillText(item.label.slice(0, 16), x + 5, y + 5, Math.max(18, width - 10));
        context.font = "700 10px Arial";
        context.fillText(`${item.x},${item.y}`, x + 5, y + Math.min(height - 14, 22), Math.max(18, width - 10));
      });

      canvas.toBlob((blob) => {
        if (!blob) {
          setPlannerStatus("PNG export failed.");
          return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "city-layout-planner.png";
        link.rel = "noopener";
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        setPlannerStatus("PNG exported.");
      }, "image/png");
    } catch (error) {
      setPlannerStatus(error instanceof Error ? error.message : "PNG export failed.");
    }
  };

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const drag = plannerDragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) {
        return;
      }

      if (drag.kind === "pan") {
        const board = plannerBoardRef.current;
        if (!board) {
          return;
        }

        const deltaX = event.clientX - drag.startX;
        const deltaY = event.clientY - drag.startY;
        if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
          drag.moved = true;
          plannerSuppressClickRef.current = true;
        }
        board.scrollLeft = drag.scrollLeft - deltaX;
        board.scrollTop = drag.scrollTop - deltaY;
        return;
      }

      const target = plannerObjects.find((item) => item.id === drag.objectId);
      const cell = getPlannerCellFromPointer(event.clientX, event.clientY);
      if (!target || !cell) {
        return;
      }

      const next = clampPlannerObjectPosition(cell.x - drag.offsetX, cell.y - drag.offsetY, target.width, target.height);
      if (next.x !== target.x || next.y !== target.y) {
        drag.moved = true;
        plannerSuppressClickRef.current = true;
      }

      setPlannerDragPreview({
        id: target.id,
        x: next.x,
        y: next.y,
        valid: canPlacePlannerObject(next.x, next.y, target.width, target.height, target.id),
      });
    };

    const handlePointerUp = (event: PointerEvent) => {
      const drag = plannerDragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) {
        return;
      }

      plannerDragRef.current = null;

      if (drag.kind === "pan") {
        if (drag.moved) {
          plannerSuppressClickRef.current = true;
          setPlannerStatus("Board panned.");
        }
        return;
      }

      const target = plannerObjects.find((item) => item.id === drag.objectId);
      const cell = getPlannerCellFromPointer(event.clientX, event.clientY);
      setPlannerDragPreview(null);

      if (!target || !cell || !drag.moved) {
        return;
      }

      const next = clampPlannerObjectPosition(cell.x - drag.offsetX, cell.y - drag.offsetY, target.width, target.height);
      const valid = canPlacePlannerObject(next.x, next.y, target.width, target.height, target.id);

      if (!valid) {
        setPlannerStatus("Move blocked by another building.");
        return;
      }

      commitPlannerObjects(
        plannerObjects.map((item) => (item.id === target.id ? { ...item, x: next.x, y: next.y } : item)),
        `${target.label} moved.`,
      );
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
    // Pointer handlers intentionally close over the current planner snapshot for drag validation and commit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plannerObjects]);

  useEffect(() => {
    localStorage.setItem(
      plannerStorageKey,
      encodePlannerLayoutPayload({
        version: 1,
        mode: plannerMode,
        alliance: plannerAlliance,
        objects: plannerObjects,
      }),
    );
  }, [plannerAlliance, plannerMode, plannerObjects]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const plannerCode = params.get("planner");
    if (!plannerCode) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      try {
        applyPlannerShareCode(plannerCode);
        params.delete("planner");
        const nextUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}#city-layout-planner`;
        window.history.replaceState(null, "", nextUrl);
        setActiveMenu("planner");
      } catch (error) {
        setPlannerStatus(error instanceof Error ? error.message : "Unable to load shared planner link.");
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const handlePlannerShortcut = (event: KeyboardEvent) => {
      const target = event.target instanceof HTMLElement ? event.target : null;
      if (target?.matches("input, textarea, select, [contenteditable='true']")) {
        return;
      }

      if (activeMenu !== "planner") {
        return;
      }

      if (event.ctrlKey || event.metaKey) {
        if (event.key.toLowerCase() === "z") {
          event.preventDefault();
          undoPlanner();
        }
        if (event.key.toLowerCase() === "y") {
          event.preventDefault();
          redoPlanner();
        }
        return;
      }

      const key = event.key.toLowerCase();
      if (key === "q") setPlannerTool("select");
      if (key === "w") setPlannerTool("pan");
      if (key === "e") deleteSelectedPlannerObject();
      if (key === "m") setPlannerMode((value) => (value === "base" ? "castle" : "base"));
      if (key === "a") setPlannerAlliance((value) => (value === "main" ? "farm" : "main"));
      if (key === "delete" || key === "backspace") deleteSelectedPlannerObject();
      if (event.key === "ArrowUp") {
        event.preventDefault();
        nudgeSelectedPlannerObject(0, -1);
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        nudgeSelectedPlannerObject(0, 1);
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        nudgeSelectedPlannerObject(-1, 0);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        nudgeSelectedPlannerObject(1, 0);
      }

      const building = plannerBuildings.find((item) => item.shortcut === event.key);
      if (building && (!building.castleOnly || plannerMode === "castle")) {
        setSelectedPlannerBuilding(building.id);
        setPlannerTool("select");
        setSelectedPlannerObjectId("");
        setPlannerStatus(`${building.label} ready to place.`);
      }
    };

    window.addEventListener("keydown", handlePlannerShortcut);
    return () => window.removeEventListener("keydown", handlePlannerShortcut);
    // The shortcut handler needs the latest planner snapshot; the action helpers are intentionally recreated with it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMenu, plannerMode, plannerObjects, selectedPlannerObjectId]);

  const formatFurnaceLevel = (value?: number | string) => {
    if (value === undefined || value === null || value === "") {
      return "N/A";
    }

    const level = Number(value);
    if (!Number.isFinite(level)) {
      return String(value);
    }

    const lv = Math.trunc(level);
    if (lv <= 30) return String(lv);
    if (lv >= 31 && lv <= 34) return `30-${lv - 30}`;
    if (lv >= 35 && lv <= 39) return lv === 35 ? "1" : `1-${lv - 35}`;
    if (lv === 40) return "2";
    if (lv >= 41 && lv <= 43) return "2-1";
    if (lv === 44) return "2-2";
    if (lv === 45) return "3";

    const relative = lv - 45;
    const tier = Math.floor(relative / 5) + 3;
    const stage = relative % 5;
    return stage === 0 ? String(tier) : `${tier}-${stage}`;
  };

  const furnaceDisplay = (player: PlayerProfile) => player.furnaceLevelFormatted || formatFurnaceLevel(player.furnaceLevel);
  const mobileMoreItems = sidebarItems.filter((item) => !item.mobilePrimary);
  const mobileMoreActive = mobileMoreItems.some((item) => activeMenu === item.menu);

  const navigateToMenu = (menu: ActiveMenu) => {
    setMobileMoreOpen(false);
    setActiveMenu(menu);
    const nextUrl = menuUrls[menu];
    if (`${window.location.pathname}${window.location.search}${window.location.hash}` !== nextUrl) {
      window.history.pushState(null, "", nextUrl);
    }
  };
  const openGiftCodesPage = () => navigateToMenu("gift");

  return (
    <main
      className={`app-shell ${theme === "dark" ? "dark" : "light"} ${collapsedSidebar ? "collapsed-sidebar" : ""} ${hideTopNav ? "hide-top-nav" : ""} width-${contentWidth} ${resizingSidebar ? "resizing-sidebar" : ""}`}
      style={shellStyle}
    >
      <header className="ks-header">
        <div className="ks-header-inner">
          <button
            className="brand"
            type="button"
            aria-label="WhiteoutSurvival.dev Home"
            onClick={() => {
              navigateToMenu("home");
            }}
          >
            <span className="brand-icon">
              <Image src="/wos-logo.png" alt="" width={24} height={24} />
            </span>
            <span className="brand-title">WhiteoutSurvival.dev</span>
          </button>

          <nav className="top-menu" aria-label="Top menu">
            {menuItems.map((item) => (
              <button type="button" className="menu-trigger" key={item.label}>
                <span className="menu-status">{item.status}</span>
                <span className="menu-main">
                  <Icon name={item.icon} />
                  <span>{item.label}</span>
                  <Icon name="chevron" />
                </span>
              </button>
            ))}
          </nav>

          <div className="actions">
            <button className="theme-toggle" type="button" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Toggle dark theme">
              <span className="theme-track">
                <span className="theme-cloud cloud-a" />
                <span className="theme-cloud cloud-b" />
                <span className="theme-star star-a" />
                <span className="theme-star star-b" />
                <span className="theme-star star-c" />
                <span className="theme-sun" />
                <span className="theme-moon" />
                <span className="theme-thumb" />
              </span>
            </button>
            <LanguageSwitcher />
            <div className="account-menu-wrap">
              <button
                className="sign-in"
                type="button"
                onClick={() => {
                  if (!authUser) {
                    setLoginOpen(true);
                    return;
                  }
                  setAccountMenuOpen((value) => !value);
                }}
                aria-expanded={authUser ? accountMenuOpen : undefined}
                aria-haspopup={authUser ? "menu" : undefined}
              >
                {authUser?.avatarUrl ? <img src={authUser.avatarUrl} alt="" /> : <Icon name="user" />}
                <span>{authLoading ? "Account" : authUser ? authUser.displayName : "Sign In"}</span>
              </button>
              {accountMenuOpen && authUser && (
                <div className="account-dropdown" role="menu" aria-label="Account menu">
                  <div className="account-dropdown-head">
                    <span className="account-dropdown-avatar">
                      {authUser.avatarUrl ? <img src={authUser.avatarUrl} alt="" /> : <Icon name="user" />}
                    </span>
                    <span>
                      <strong>{authUser.displayName}</strong>
                      {authUser.email && <small>{authUser.email}</small>}
                    </span>
                  </div>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setAccountMenuOpen(false);
                      setProfileOpen(true);
                    }}
                  >
                    <Icon name="user" />
                    Profile
                  </button>
                  <button className="danger" type="button" role="menuitem" onClick={() => void signOut()}>
                    <Icon name="logout" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="app-body">
        <aside
          className="sidebar"
          aria-label="Sidebar"
          onMouseEnter={showFooterWithIntent}
          onMouseLeave={hideFooterAfterInteraction}
          onMouseMove={showFooterWithIntent}
          onPointerEnter={showFooterWithIntent}
          onPointerLeave={hideFooterAfterInteraction}
          onPointerMove={showFooterWithIntent}
        >
          {mobileMoreOpen && (
            <button
              className="mobile-more-backdrop"
              type="button"
              aria-label="Close mobile menu"
              onClick={() => setMobileMoreOpen(false)}
            />
          )}
          {mobileMoreOpen && (
            <div className="mobile-more-panel" role="menu" aria-label="More navigation">
              <div className="mobile-more-head">
                <strong>More</strong>
                <button type="button" aria-label="Close menu" onClick={() => setMobileMoreOpen(false)}>
                  <Icon name="x" />
                </button>
              </div>
              <div className="mobile-more-list">
                {mobileMoreItems.map((item) => (
                  <a
                    className={`mobile-more-item ${activeMenu === item.menu ? "active" : ""}`}
                    href={item.href}
                    key={item.label}
                    role="menuitem"
                    onClick={(event) => {
                      event.preventDefault();
                      navigateToMenu(item.menu);
                    }}
                  >
                    <Icon name={item.icon} />
                    <span>{item.label}</span>
                    {item.beta && <strong className="sidebar-beta-badge">Beta</strong>}
                  </a>
                ))}
              </div>
            </div>
          )}
          <div className="sidebar-content">
            {sidebarItems.map((item) => (
              <a
                className={`sidebar-item ${item.mobilePrimary ? "mobile-primary" : "mobile-secondary"} ${activeMenu === item.menu ? "active" : ""}`}
                href={item.href}
                key={item.label}
                onClick={(event) => {
                  event.preventDefault();
                  navigateToMenu(item.menu);
                }}
              >
                <Icon name={item.icon} />
                <span className="nav-label-desktop">{item.label}</span>
                <span className="nav-label-mobile">{item.mobileLabel}</span>
                {item.beta && <strong className="sidebar-beta-badge">Beta</strong>}
              </a>
            ))}
            {mobileMoreItems.length > 0 && (
              <button
                className={`sidebar-item mobile-more-trigger ${mobileMoreOpen || mobileMoreActive ? "active" : ""}`}
                type="button"
                aria-label="Open more menu"
                aria-expanded={mobileMoreOpen}
                onClick={() => setMobileMoreOpen((value) => !value)}
              >
                <Icon name="menu" />
                <span className="nav-label-mobile">More</span>
              </button>
            )}
          </div>
          <div className="sidebar-tools" aria-label="Sidebar controls">
            <button className="sidebar-tool-button" type="button" aria-label="Collapse sidebar" onMouseDown={() => setCollapsedSidebar((value) => !value)}>
              <Icon name="panel" />
            </button>
            <button className="sidebar-tool-button" type="button" aria-label="Layout settings" aria-expanded={layoutOpen} onClick={() => setLayoutOpen((value) => !value)}>
              <Icon name="sliders" />
            </button>
          </div>
          <button className="sidebar-resizer" type="button" aria-label="Resize sidebar" disabled={collapsedSidebar} onPointerDown={() => setResizingSidebar(true)} />
        </aside>

        <div className="content-column">
          {activeMenu === "home" ? (
            <section className="home-page empty-home" id="home" aria-label="Home" />
          ) : activeMenu === "gift" ? (
            <section className="home-page giftcodes-page" id="gift-codes" aria-label="Whiteout Survival gift codes">
              <section className="giftcodes-hero">
                <div>
                  <span className="section-kicker">Live Gift Code Tracker</span>
                  <h1>Whiteout Survival Gift Codes</h1>
                  <p>Fast active codes, refreshed automatically and ready for direct redemption on WhiteoutSurvival.dev.</p>
                </div>
                <div className="giftcodes-hero-actions">
                  <button className="giftcodes-redeem-link" type="button" onClick={() => openRedeemPage()}>
                    Redeem
                    <Icon name="external" />
                  </button>
                  <button className="giftcodes-refresh" type="button" onClick={() => void loadGiftCodes()} disabled={giftCodeLoading}>
                    {giftCodeLoading ? "Refreshing" : "Refresh"}
                  </button>
                </div>
              </section>

              <div className="giftcodes-live-strip" aria-label="Gift code refresh status">
                <span><Icon name="gift" /> {giftCodeLoading && !giftCodes.length ? "Checking active codes" : `${giftCodes.length} active code${giftCodes.length === 1 ? "" : "s"}`}</span>
                <span>Last checked {giftCodeUpdatedAt ? formatGiftDate(giftCodeUpdatedAt) : "soon"}</span>
                <span>Auto refresh every 30 seconds</span>
              </div>

              <section className="giftcodes-panel" aria-label="Active gift code list">
                <div className="giftcodes-panel-head">
                  <div>
                    <h2>Active Code Directory</h2>
                    <p>Compact list for quick copying and manual redeem checks.</p>
                  </div>
                  <button type="button" onClick={() => void copyAllGiftCodes()} disabled={!giftCodes.length}>
                    <Icon name="copy" />
                    Copy All
                  </button>
                </div>

                {giftCodeStatus && <p className="giftcodes-status">{giftCodeStatus}</p>}

                <div className="giftcodes-list">
                  {giftCodes.map((item) => (
                    <article className="giftcode-row" key={item.code}>
                      <div className="giftcode-main">
                        <div className="giftcode-code-line">
                          <strong>{item.code}</strong>
                          <span>Active</span>
                        </div>
                        <p>{item.rewards}</p>
                      </div>
                      <div className="giftcode-meta">
                        <span>Expires: {item.expiry || "Unknown"}</span>
                        {item.dateAdded && <span>Added: {formatGiftDate(item.dateAdded)}</span>}
                      </div>
                      <div className="giftcode-actions">
                        <button type="button" onClick={() => void copyGiftCode(item.code)} aria-label={`Copy ${item.code}`}>
                          <Icon name="copy" />
                          {copiedGiftCode === item.code ? "Copied" : "Copy"}
                        </button>
                        <button type="button" onClick={() => openRedeemPage(item.code)} aria-label={`Redeem ${item.code}`}>
                          <Icon name="external" />
                          Redeem
                        </button>
                      </div>
                    </article>
                  ))}
                  {giftCodeLoading && !giftCodes.length && (
                    <div className="giftcodes-empty">Checking active codes...</div>
                  )}
                  {!giftCodeLoading && !giftCodes.length && (
                    <div className="giftcodes-empty">No active codes found right now.</div>
                  )}
                </div>
              </section>

              <section className="giftcodes-guide" aria-label="Redeem guide">
                <article>
                  <span>1</span>
                  <strong>Select Code</strong>
                  <p>Choose any active code and open the WhiteoutSurvival.dev redeem page.</p>
                </article>
                <article>
                  <span>2</span>
                  <strong>Enter Player ID</strong>
                  <p>Paste your FID and confirm the matching account.</p>
                </article>
                <article>
                  <span>3</span>
                  <strong>Auto Redeem</strong>
                  <p>Submit once and our redeem system completes the secure check automatically.</p>
                </article>
              </section>
            </section>
          ) : activeMenu === "redeem" ? (
            <section className="home-page giftcodes-page redeem-page" id="redeem" aria-label="Whiteout Survival gift code redeem">
              <section className="giftcodes-hero redeem-hero">
                <div>
                  <span className="section-kicker">WhiteoutSurvival.dev Redeem</span>
                  <h1>Redeem Gift Code</h1>
                  <p>Enter your player ID and code. Our redeem system completes the secure check automatically.</p>
                </div>
                <div className="giftcodes-hero-actions">
                  <button className="giftcodes-refresh" type="button" onClick={openGiftCodesPage}>
                    Back to Codes
                  </button>
                </div>
              </section>

              <section className="redeem-shell">
                <form className="redeem-card redeem-card-wide" onSubmit={(event) => void submitRedeem(event)}>
                  <div className="redeem-card-head">
                    <span>Auto redeem</span>
                    <strong>Player and Active Codes</strong>
                  </div>
                  <label>
                    <span>Player ID</span>
                    <input value={redeemPlayerId} onChange={(event) => setRedeemPlayerId(event.currentTarget.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="Enter your FID" />
                  </label>
                  <label>
                    <span>Active Code</span>
                    <select
                      value={redeemCode || "ALL"}
                      onChange={(event) => setRedeemCode(event.currentTarget.value)}
                      disabled={giftCodeLoading && !giftCodes.length}
                    >
                      <option value="ALL">ALL active codes</option>
                      {giftCodes.map((item) => (
                        <option value={item.code} key={item.code}>
                          {item.code}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="redeem-code-strip" aria-live="polite">
                    <span>{giftCodeLoading ? "Refreshing active code list" : `${giftCodes.length} active code${giftCodes.length === 1 ? "" : "s"} loaded`}</span>
                    {giftCodeUpdatedAt && <span>Updated {formatGiftDate(giftCodeUpdatedAt)}</span>}
                  </div>
                  {redeemPlayer && (
                    <div className="redeem-player">
                      {redeemPlayer.avatarImage && <img src={redeemPlayer.avatarImage} alt="" />}
                      <span>
                        <strong>{redeemPlayer.nickname}</strong>
                        <small>State {redeemPlayer.stateId || "N/A"} · Furnace {furnaceDisplay(redeemPlayer)}</small>
                      </span>
                    </div>
                  )}
                  <div className="redeem-auto-note">
                    <Icon name="shield" />
                    <span>Secure verification is handled automatically by our auto-redeem system.</span>
                  </div>
                  <button type="submit" disabled={redeemLoading || !redeemPlayerId || ((redeemCode || "ALL") === "ALL" && !giftCodes.length)}>
                    {redeemLoading ? "Redeeming automatically" : (redeemCode || "ALL") === "ALL" ? "Auto Redeem All Active Codes" : "Auto Redeem Code"}
                  </button>
                </form>
              </section>

              {redeemResult && (
                <section className={`redeem-result redeem-result-${redeemResult.state}`} aria-live="polite">
                  <strong>{redeemResult.message}</strong>
                  {redeemResult.checkedAt && <span>Checked {formatGiftDate(redeemResult.checkedAt)} UTC</span>}
                  {redeemResult.results && (
                    <div className="redeem-result-list">
                      {redeemResult.results.map((item) => (
                        <span className={`redeem-result-pill redeem-result-pill-${item.state}`} key={item.code}>
                          <strong>{item.code}</strong>
                          {item.message}
                        </span>
                      ))}
                    </div>
                  )}
                </section>
              )}
            </section>
          ) : activeMenu === "planner" ? (
            <section className="home-page planner-page" id="city-layout-planner" aria-label="City Layout Planner">
              <section className="planner-toolbar" aria-label="Planner controls">
                <div className="planner-tool-group" aria-label="Tools">
                  {(["select", "pan", "erase"] as const).map((tool) => (
                    <button
                      className={plannerTool === tool ? "selected" : ""}
                      type="button"
                      key={tool}
                      onClick={() => setPlannerTool(tool)}
                    >
                      {tool === "select" ? "Select Q" : tool === "pan" ? "Pan W" : "Delete E"}
                    </button>
                  ))}
                </div>

                <div className="planner-tool-group" aria-label="Mode">
                  {(["base", "castle"] as const).map((mode) => (
                    <button className={plannerMode === mode ? "selected" : ""} type="button" key={mode} onClick={() => setPlannerMode(mode)}>
                      {mode === "base" ? "Base" : "Castle"}
                    </button>
                  ))}
                </div>

                <div className="planner-tool-group" aria-label="Alliance">
                  {(["main", "farm"] as const).map((alliance) => (
                    <button className={plannerAlliance === alliance ? "selected" : ""} type="button" key={alliance} onClick={() => setPlannerAlliance(alliance)}>
                      {alliance === "main" ? "Main" : "Farm"}
                    </button>
                  ))}
                </div>

                <div className="planner-zoom" aria-label="Planner zoom">
                  <button type="button" onClick={() => setPlannerZoom((value) => Math.max(70, value - 10))}>-</button>
                  <span>{plannerZoom}%</span>
                  <button type="button" onClick={() => setPlannerZoom((value) => Math.min(140, value + 10))}>+</button>
                  <button type="button" onClick={() => setPlannerZoom(100)}>Reset</button>
                  <button type="button" onClick={fitPlannerToView}>Fit</button>
                  <button type="button" onClick={centerSelectedPlannerObject}>Center</button>
                </div>
              </section>

              <section className="planner-workspace">
                <aside className="planner-panel" aria-label="Buildings">
                  <div className="planner-panel-head">
                    <span className="section-kicker">City Layout Planner</span>
                    <h2>Buildings</h2>
                  </div>
                  <div className="planner-building-list">
                    {availablePlannerBuildings.map((building) => (
                      <button
                        className={selectedPlannerBuilding === building.id ? "selected" : ""}
                        type="button"
                        key={building.id}
                        onClick={() => {
                          setSelectedPlannerBuilding(building.id);
                          setPlannerTool("select");
                          setSelectedPlannerObjectId("");
                          setPlannerStatus(`${building.label} ready to place.`);
                        }}
                      >
                        <span className="planner-building-swatch" style={{ background: building.color }} />
                        <span>{building.label}</span>
                        <small>{building.shortcut}</small>
                      </button>
                    ))}
                  </div>

                  {selectedPlannerBuilding === "obstacle" && (
                    <div className="planner-obstacle-size">
                      <strong>Obstacle Size</strong>
                      <div>
                        {[1, 2, 3, 4].map((size) => (
                          <button className={plannerObstacleSize === size ? "selected" : ""} type="button" key={size} onClick={() => setPlannerObstacleSize(size)}>
                            {size}x{size}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="planner-counts" aria-label="Planner counts">
                    <span>Flags: {plannerStats.flags}</span>
                    <span>Cities: {plannerStats.cities}</span>
                    <span>BT(active): {plannerStats.traps}/2</span>
                    <span>HQ: {plannerStats.hq}</span>
                    <span>Nodes: {plannerStats.nodes}</span>
                    <span>Obstacles: {plannerStats.obstacles}</span>
                    <span>Used: {plannerStats.utilization}%</span>
                  </div>
                  <div className={`planner-health ${plannerHealth.length ? "warning" : "good"}`}>
                    <strong>{plannerHealth.length ? "Layout Checks" : "Layout Healthy"}</strong>
                    {plannerHealth.length ? (
                      plannerHealth.map((item) => <span key={item}>{item}</span>)
                    ) : (
                      <span>No planning warnings for the current layout.</span>
                    )}
                  </div>
                  <div className="planner-object-list" aria-label="Placed buildings">
                    <strong>Placed Buildings</strong>
                    {sortedPlannerObjects.length ? (
                      sortedPlannerObjects.map((item) => {
                        const template = plannerBuildings.find((building) => building.id === item.type);
                        return (
                          <button
                            className={selectedPlannerObjectId === item.id ? "selected" : ""}
                            type="button"
                            key={item.id}
                            onClick={() => {
                              setSelectedPlannerObjectId(item.id);
                              setPlannerStatus(`${item.label} selected.`);
                            }}
                          >
                            <span className="planner-building-swatch" style={{ background: template?.color || "#64748b" }} />
                            <span>{item.label}</span>
                            <small>{item.x},{item.y}</small>
                          </button>
                        );
                      })
                    ) : (
                      <p>No buildings placed yet.</p>
                    )}
                  </div>
                </aside>

                <section
                  className="planner-board-wrap"
                  aria-label="Planner grid"
                  ref={plannerBoardRef}
                  onPointerDown={startPlannerPan}
                  onWheel={handlePlannerWheel}
                >
                  <div
                    className={`planner-board planner-tool-${plannerTool}`}
                    style={{
                      "--planner-zoom": `${plannerZoom / 100}`,
                    } as CSSProperties}
                  >
                    <div className="planner-grid" role="grid" aria-label="City planner grid" ref={plannerGridRef} onPointerLeave={() => setPlannerHoverCell(null)}
                      onPointerMove={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const cellX = Math.floor(((e.clientX - rect.left) / rect.width) * plannerGridSize);
                        const cellY = Math.floor(((e.clientY - rect.top) / rect.height) * plannerGridSize);
                        if (plannerHoverCell?.x !== cellX || plannerHoverCell?.y !== cellY) setPlannerHoverCell({x: cellX, y: cellY});
                      }}
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const cellX = Math.floor(((e.clientX - rect.left) / rect.width) * plannerGridSize);
                        const cellY = Math.floor(((e.clientY - rect.top) / rect.height) * plannerGridSize);
                        handlePlannerCellClick(cellX, cellY);
                      }}>
                                           {plannerPlacementPreview && (
                        <div
                          className={`planner-placement-preview ${plannerPlacementPreview.valid ? "valid" : "invalid"}`}
                          style={{
                            left: `${(plannerPlacementPreview.x / plannerGridSize) * 100}%`,
                            top: `${(plannerPlacementPreview.y / plannerGridSize) * 100}%`,
                            width: `${(plannerPlacementPreview.width / plannerGridSize) * 100}%`,
                            height: `${(plannerPlacementPreview.height / plannerGridSize) * 100}%`,
                            position: "absolute",
                            "--planner-object-color": plannerPlacementPreview.color,
                          } as CSSProperties}
                          aria-hidden="true"
                        >
                          <span>{plannerPlacementPreview.label}</span>
                        </div>
                      )}
                      
                      {plannerStrongholdsRaw.map((coord, i) => (
                        <div key={`sh-${i}`} className="planner-object planner-sh" style={{
                          left: `${(coord[0] / plannerGridSize) * 100}%`,
                          top: `${(coord[1] / plannerGridSize) * 100}%`,
                          width: `${(6 / plannerGridSize) * 100}%`,
                          height: `${(6 / plannerGridSize) * 100}%`,
                          position: "absolute",
                          background: "#b71c1c",
                          border: "2px solid #ff5252",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "white", fontSize: "0.5rem", borderRadius: "2px"
                        }}><span>SH</span></div>
                      ))}
                      {plannerFortressesRaw.map((coord, i) => (
                        <div key={`ft-${i}`} className="planner-object planner-ft" style={{
                          left: `${(coord[0] / plannerGridSize) * 100}%`,
                          top: `${(coord[1] / plannerGridSize) * 100}%`,
                          width: `${(4 / plannerGridSize) * 100}%`,
                          height: `${(4 / plannerGridSize) * 100}%`,
                          position: "absolute",
                          background: "#e65100",
                          border: "2px solid #ffb74d",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "white", fontSize: "0.4rem", borderRadius: "2px"
                        }}><span>FT</span></div>
                      ))}
                      {plannerFacilitiesRaw.flatMap((group, gIdx) => group.map((coord, i) => (
                        <div key={`fac-${gIdx}-${i}`} className="planner-object planner-fac" style={{
                          left: `${(coord[0] / plannerGridSize) * 100}%`,
                          top: `${(coord[1] / plannerGridSize) * 100}%`,
                          width: `${(2 / plannerGridSize) * 100}%`,
                          height: `${(2 / plannerGridSize) * 100}%`,
                          position: "absolute",
                          background: "#0d47a1",
                          border: "1px solid #64b5f6",
                          borderRadius: "2px"
                        }} />
                      )))}
                      {plannerResourcesRaw.map((res, i) => (
                        <div key={`res-${i}`} className="planner-object planner-res" style={{
                          left: `${(res[0] / plannerGridSize) * 100}%`,
                          top: `${(res[1] / plannerGridSize) * 100}%`,
                          width: `${(2 / plannerGridSize) * 100}%`,
                          height: `${(2 / plannerGridSize) * 100}%`,
                          position: "absolute",
                          background: res[2] === "wood" ? "#2e7d32" : res[2] === "iron" ? "#757575" : res[2] === "coal" ? "#212121" : "#fbc02d",
                          border: "1px solid rgba(255,255,255,0.2)",
                          borderRadius: "50%"
                        }} />
                      ))}
    
                      {plannerObjects.map((item) => {
                        const template = plannerBuildings.find((building) => building.id === item.type);
                        const preview = plannerDragPreview?.id === item.id ? plannerDragPreview : null;
                        return (
                          <button
                            className={`planner-object planner-${item.type} ${item.alliance === "farm" ? "farm" : "main"} ${selectedPlannerObjectId === item.id ? "selected" : ""} ${preview && !preview.valid ? "invalid" : ""} ${preview ? "dragging" : ""}`}
                            type="button"
                            key={item.id}
                            style={{
                              left: `${((preview?.x ?? item.x) / plannerGridSize) * 100}%`,
                              top: `${((preview?.y ?? item.y) / plannerGridSize) * 100}%`, width: `${(item.width / plannerGridSize) * 100}%`, height: `${(item.height / plannerGridSize) * 100}%`, position: "absolute",
                              "--planner-object-color": template?.color || "#64748b",
                            } as CSSProperties}
                            onPointerDown={(event) => startPlannerObjectDrag(event, item)}
                            onClick={(event) => {
                              event.stopPropagation();
                              if (plannerSuppressClickRef.current) {
                                plannerSuppressClickRef.current = false;
                                return;
                              }
                              if (plannerTool === "erase") {
                                commitPlannerObjects(plannerObjects.filter((object) => object.id !== item.id), `${item.label} removed.`);
                                setSelectedPlannerObjectId("");
                                return;
                              }
                              setSelectedPlannerObjectId(item.id);
                              setPlannerStatus(`${item.label} selected.`);
                            }}
                          >
                            <strong>{item.label}</strong>
                            <span>{preview?.x ?? item.x},{preview?.y ?? item.y}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </section>

                <aside className="planner-panel planner-actions" aria-label="Actions">
                  <div className="planner-panel-head">
                    <h2>Actions</h2>
                    <p>{plannerStatus || "Tap a cell to place the selected building."}</p>
                  </div>
                  {selectedPlannerObject && (
                    <div className="planner-selected-editor" aria-label="Selected building editor">
                      <strong>Selected</strong>
                      <label>
                        Name
                        <input
                          value={selectedPlannerObject.label}
                          maxLength={32}
                          onChange={(event) => updatePlannerObject(selectedPlannerObject.id, { label: event.currentTarget.value || selectedPlannerObject.label }, "Name updated.")}
                        />
                      </label>
                      <div className="planner-coordinate-grid">
                        <label>
                          X
                          <input
                            type="number"
                            min="0"
                            max={plannerGridSize - selectedPlannerObject.width}
                            value={selectedPlannerObject.x}
                            onChange={(event) => updatePlannerObject(selectedPlannerObject.id, { x: Number(event.currentTarget.value) || 0 }, "Coordinates updated.")}
                          />
                        </label>
                        <label>
                          Y
                          <input
                            type="number"
                            min="0"
                            max={plannerGridSize - selectedPlannerObject.height}
                            value={selectedPlannerObject.y}
                            onChange={(event) => updatePlannerObject(selectedPlannerObject.id, { y: Number(event.currentTarget.value) || 0 }, "Coordinates updated.")}
                          />
                        </label>
                      </div>
                      <div className="planner-tool-group planner-editor-toggle" aria-label="Selected alliance">
                        {(["main", "farm"] as const).map((alliance) => (
                          <button
                            className={selectedPlannerObject.alliance === alliance ? "selected" : ""}
                            type="button"
                            key={alliance}
                            onClick={() => updatePlannerObject(selectedPlannerObject.id, { alliance }, "Alliance updated.")}
                          >
                            {alliance === "main" ? "Main" : "Farm"}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="planner-action-grid">
                    <button type="button" onClick={undoPlanner} disabled={!plannerHistory.length}>Undo</button>
                    <button type="button" onClick={redoPlanner} disabled={!plannerFuture.length}>Redo</button>
                    <button type="button" onClick={deleteSelectedPlannerObject}>Delete</button>
                    <button type="button" onClick={duplicateSelectedPlannerObject} disabled={!selectedPlannerObject}>Duplicate</button>
                    <button type="button" onClick={clearPlanner} disabled={!plannerObjects.length}>Clear</button>
                    <button type="button" onClick={savePlannerPng}>Save PNG</button>
                    <button type="button" onClick={exportPlannerCsv}>Save CSV</button>
                    <button type="button" onClick={() => void copyPlannerShareLink()}>Share Link</button>
                  </div>
                  <label className="planner-code-box">
                    <span>Layout Code</span>
                    <textarea value={plannerImportCode} onChange={(event) => setPlannerImportCode(event.currentTarget.value)} placeholder="Paste a saved layout code" />
                  </label>
                  <div className="planner-action-grid">
                    <button type="button" onClick={() => void copyPlannerCode()}>Copy Code</button>
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          loadPlannerCode(plannerImportCode);
                        } catch (error) {
                          setPlannerStatus(error instanceof Error ? error.message : "Unable to load layout.");
                        }
                      }}
                    >
                      Load
                    </button>
                  </div>
                  <div className="planner-help">
                    <strong>Shortcuts</strong>
                    <span>Q Select, W Pan, E Delete/Erase</span>
                    <span>1-7 Buildings, A Alliance, M Mode</span>
                    <span>Arrow keys move the selected building</span>
                    <span>Ctrl/Cmd+Z Undo, Ctrl/Cmd+Y Redo</span>
                  </div>
                </aside>
              </section>
            </section>
          ) : activeMenu === "sneak" ? (
            <section className="home-page sneak-peek-page" id="sneak-peek" aria-label="Chief Concierge Sneak Peek">
              <section className="sneak-peek-hero">
                <span className="section-kicker">Chief Concierge</span>
                <h1>Chief Concierge: Sneak Peek</h1>
                <p>Childhood Memory Festival details, event schedule, Penguin Bounce rewards, skins, packs, and gift code information from the official sneak peek.</p>
              </section>

              <article className="sneak-peek-frame">
                <header className="sneak-peek-frame-title">
                  <h2>Chief Concierge: Sneak Peek</h2>
                </header>
                <div className="sneak-peek-content">
                  <figure className="sneak-peek-main-image">
                    <img src="/sneak-peek/sneak-01.png" alt="Childhood Memory Festival preview with penguins, toys, balloons, and a Whiteout Survival child character" />
                  </figure>
                  <figure className="sneak-peek-ornament">
                    <img src="/sneak-peek/sneak-02.png" alt="" />
                  </figure>

                  <div className="sneak-peek-copy">
                    <p>Dear Chief,</p>
                    <p>The gates to Penguin Playground are about to open! The penguins, carrying their sparkling Ice Orbs, invite you to join the [Childhood Memory Festival] event!</p>
                    <p><strong>Event Schedule:</strong> <mark>UTC 06/01/2026 00:00:00 to 06/07/2026 23:59:59</mark></p>
                    <p>During the event, Chiefs can use the event item &quot;Ice Orbs&quot; to participate in &quot;Penguin Bounce&quot;. Tap one of the three penguins above the field, and the Ice Orb will drop into the playground, bouncing between obstacles before finally landing in one of the seven exits below to earn &quot;Penguin Coins&quot; as rewards. You can then head to the &quot;Penguin Shop&quot; and spend &quot;Penguin Coins&quot; to exchange for valuable rewards, including exquisite skins.</p>
                    <p><strong>Events:</strong> &quot;Penguin Bounce&quot;, &quot;Ice Bomb Frenzy&quot;, &quot;Party Expert&quot;, &quot;Fantasia Symphony&quot;, &quot;Top-up Benefits&quot;, &quot;Colorful Greetings&quot;, &quot;Penguin Shop&quot;, &quot;Lost Loot&quot;.</p>
                    <p><strong>Reminder:</strong> &quot;Penguin Shop&quot; will be available from <mark>UTC 06/01/2026 00:00:00 to 06/08/2026 23:59:59</mark>, please remember to use the event items before it ends.</p>
                    <p>The &quot;Lost Loot&quot; will be available from <mark>UTC 06/02/2026 at 00:00:00 to 06/04/2025 at 23:59:59</mark>, don&apos;t miss it!</p>
                    <p>May every bounce of the Ice orbs bring you a pleasant surprise, and may you find even more fun in Penguin Playground!</p>
                    <p>If you have any questions or suggestions, please feel free to contact us.</p>
                    <p>Happy gaming!<br />Whiteout Survival Team</p>
                  </div>

                  <section className="sneak-peek-section">
                    <h3>Penguin Bounce</h3>
                    <div className="sneak-peek-two-column">
                      <figure><img src="/sneak-peek/sneak-03.png" alt="Penguin Bounce event screen" /></figure>
                      <div className="sneak-peek-copy">
                        <p>Happy penguins of the Penguin Park have invited you to join in their icy fun!</p>
                        <h4>Ice Orb</h4>
                        <img className="sneak-peek-item-icon" src="/sneak-peek/sneak-04.png" alt="Ice Orb item" />
                        <p>A clear ball of ice that can be used in the Penguin Bounce event. It will be converted into a 10K Secured Resource Supply Chest at the end of the event.</p>
                        <h4>Penguin Coin</h4>
                        <img className="sneak-peek-item-icon" src="/sneak-peek/sneak-05.png" alt="Penguin Coin item" />
                        <p>A glittering auroral coin exchanged for exquisite rewards in the Penguin Shop. It will be converted into a 1K Meat (Secured) upon expiration.</p>
                      </div>
                    </div>
                  </section>

                  <section className="sneak-peek-section">
                    <h3>Penguin Shop</h3>
                    <p>Exchange Penguin Coins for exquisite rewards in this shop.</p>
                    <p className="sneak-peek-note">Each unused Penguin Coin will be converted into a 1K Meat (Secured) at the end of the event, so be sure to exchange them in time.</p>
                    <div className="sneak-peek-media-grid">
                      <figure><img src="/sneak-peek/sneak-06.png" alt="Penguin Shop screen" /></figure>
                      <figure><img src="/sneak-peek/sneak-07.gif" alt="Penguin Shop animated reward preview" /></figure>
                      <figure><img src="/sneak-peek/sneak-08.png" alt="Penguin Shop reward list" /></figure>
                      <figure><img src="/sneak-peek/sneak-09.gif" alt="Penguin Shop animated item preview" /></figure>
                    </div>
                    <p className="sneak-peek-note">Certain items may be different based on server progress.</p>
                  </section>

                  <section className="sneak-peek-section">
                    <h3>Ice Bomb Frenzy</h3>
                    <div className="sneak-peek-two-column">
                      <figure><img src="/sneak-peek/sneak-10.png" alt="Ice Bomb Frenzy event screen" /></figure>
                      <div className="sneak-peek-copy">
                        <p>The penguins have brought fun in an icy round form to the festival!</p>
                        <ol>
                          <li>During the event, collect Magic Points through [Daily Missions] and claim rewards in [Ice Bomb Frenzy] when you have enough points.</li>
                          <li>[Daily Missions] reset daily at 00:00 UTC.</li>
                          <li>Purchase Dance of Dreams to unlock Epic rewards of the season and start claiming double Daily Mission rewards.</li>
                        </ol>
                      </div>
                    </div>
                    <figure className="sneak-peek-wide"><img src="/sneak-peek/sneak-11.png" alt="Ice Bomb Frenzy mission and rewards screen" /></figure>
                    <p className="sneak-peek-note">Certain items may be different based on server progress.</p>
                  </section>

                  <section className="sneak-peek-section">
                    <h3>Fantasia Symphony</h3>
                    <div className="sneak-peek-two-column">
                      <figure><img src="/sneak-peek/sneak-12.gif" alt="Fantasia Symphony animated preview" /></figure>
                      <div className="sneak-peek-copy">
                        <ol>
                          <li>Complete designated missions during the event to earn rewards.</li>
                          <li>Complete all missions on a vertical/horizontal axis to earn stage chest.</li>
                          <li>Complete all missions to obtain the [Treasure of Dreams].</li>
                          <li>Unclaimed rewards will be mailed at the end of the event.</li>
                        </ol>
                        <p className="sneak-peek-note">Certain items may be different based on server progress.</p>
                      </div>
                    </div>
                  </section>

                  <section className="sneak-peek-section">
                    <h3>Party Expert</h3>
                    <div className="sneak-peek-two-column">
                      <figure><img src="/sneak-peek/sneak-13.png" alt="Party Expert event screen" /></figure>
                      <div className="sneak-peek-copy">
                        <p>A festival for all Chiefs to embrace a youthful spirit, enjoy the celebration to the fullest, and contend to be the brightest star at the party.</p>
                        <ol>
                          <li>The event is divided into 7 stages: Power Boost, Beast Slay, Hero Development, Troop Training, Hero Gear, Gather Resources, and Chief Gear. Each stage will last for 1 day.</li>
                          <li>Chiefs may obtain points in every stage by meeting the designated requirements and claim rewards when enough points are collected.</li>
                          <li>At the end of every stage, Stage Ranking Rewards will be issued based on the stage ranking.</li>
                          <li>When the event is over, Total Ranking Rewards will be issued based on the total ranking.</li>
                        </ol>
                        <p>Chiefs with the same points will be ranked by the order of completion time. The actual rank is determined by the leaderboard.</p>
                      </div>
                    </div>
                    <figure className="sneak-peek-wide"><img src="/sneak-peek/sneak-14.png" alt="Party Expert rewards screen" /></figure>
                  </section>

                  <section className="sneak-peek-section">
                    <h3>Top-up Benefits</h3>
                    <div className="sneak-peek-media-grid">
                      <figure><img src="/sneak-peek/sneak-15.png" alt="Top-up Benefits banner" /></figure>
                      <figure><img src="/sneak-peek/sneak-16.png" alt="Top-up Benefits screen" /></figure>
                      <figure><img src="/sneak-peek/sneak-17.gif" alt="Woodland Jubilee Decoration Pack animated preview" /></figure>
                      <figure><img src="/sneak-peek/sneak-18.png" alt="Woodland Jubilee Decoration Pack" /></figure>
                    </div>
                    <h4>Woodland Jubilee Decoration Pack</h4>
                  </section>

                  <section className="sneak-peek-section">
                    <h3>Lost Loot</h3>
                    <div className="sneak-peek-two-column">
                      <figure><img src="/sneak-peek/sneak-19.gif" alt="Lost Loot animated preview" /></figure>
                      <p>Gina has found Joe&apos;s treasure stash! It&apos;s where her lackeys buried the treasures they looted from survivors. The raiders have been driven away, and now it&apos;s time to return these items to their rightful owners! Follow the list of lost items to dig up the hidden treasures.</p>
                    </div>
                  </section>

                  <section className="sneak-peek-section">
                    <h3>Colorful Greetings</h3>
                    <div className="sneak-peek-two-column">
                      <figure><img src="/sneak-peek/sneak-20.png" alt="Colorful Greetings event screen" /></figure>
                      <div className="sneak-peek-copy">
                        <p>Embrace a youthful spirit and enjoy the festival like a kid!</p>
                        <ol>
                          <li>Sign in daily during the event to claim Greeting Rewards.</li>
                          <li>More rewards are available with a [Childhood Wish] purchase.</li>
                          <li>Unclaimed rewards will be mailed after the event.</li>
                        </ol>
                      </div>
                    </div>
                    <figure className="sneak-peek-wide"><img src="/sneak-peek/sneak-21.png" alt="Colorful Greetings reward screen" /></figure>
                  </section>

                  <section className="sneak-peek-section sneak-peek-gift-code">
                    <figure className="sneak-peek-ornament gold"><img src="/sneak-peek/sneak-22.png" alt="" /></figure>
                    <h3>Gift Code</h3>
                    <p className="sneak-peek-code">A7K9Q2</p>
                    <img src="/sneak-peek/sneak-23.png" alt="Gift code reward preview" />
                    <p>Valid Until: 2026-06-01 23:59:00 (UTC)</p>
                    <p>Requirement: Furnace Level &ge; 9</p>
                    <p>Gift Code Center: <a href="https://wos-giftcode.centurygame.com/" target="_blank" rel="noreferrer">https://wos-giftcode.centurygame.com/</a></p>
                  </section>

                  <p className="sneak-peek-note">Some events and features require specific conditions to be met by the server for the first time, and they will not be enabled simultaneously across all servers.</p>
                  <p className="sneak-peek-source">Source: <a href="https://www.whiteoutsurvival.wiki/sneak-peek/0723948en/" target="_blank" rel="noreferrer">Whiteout Survival Wiki sneak peek</a>.</p>
                </div>
              </article>
            </section>
          ) : activeMenu === "bot" ? (
            <section className="home-page bot-page" id="discord-bot" aria-label="Discord bot">
              <div className="bot-commercial">
                <div className="bot-commercial-copy">
                  <div className="bot-brand-row">
                    <Image className="bot-brand-logo" src="/molly-logo.png" alt="Whiteout Survival bot logo" width={58} height={58} />
                    <div>
                      <span className="section-kicker">Whiteout Survival Discord Bot</span>
                      <h1>Alliance operations for Whiteout Survival Discord servers.</h1>
                    </div>
                  </div>
                  <p>
                    Run your Discord server with DeepL auto-translation, welcome messages, smart reminders, admin tools, gift-code alerts, auto redeem, and alliance activity monitoring.
                  </p>
                  <div className="bot-action-row">
                    <a className="bot-ad-action" href={botFrontendUrl} target="_blank" rel="noreferrer">
                      Open Bot Dashboard
                      <Icon name="external" />
                    </a>
                    <a className="bot-secondary-action" href="https://discord.com/oauth2/authorize?client_id=1399025185046134866&permissions=8&integration_type=0&scope=bot" target="_blank" rel="noreferrer">
                      Add to Discord
                    </a>
                  </div>
                  <div className="bot-proof-grid" aria-label="Bot highlights">
                    <span><strong>{botMetrics.servers}</strong> servers</span>
                    <span><strong>{botMetrics.monitors}</strong> active monitors</span>
                    <span><strong>{botMetrics.redeemServers}</strong> redeem servers</span>
                  </div>
                  <div className="bot-feature-list" aria-label="Core bot capabilities">
                    <span><Icon name="bot" /> AI chat</span>
                    <span><Icon name="image" /> Image generation</span>
                    <span><Icon name="calendar" /> Smart reminders</span>
                    <span><Icon name="wrench" /> Admin tools</span>
                  </div>
                </div>

                <div className="bot-layout-grid">
                  <div className="bot-dashboard-preview" aria-label="Live bot operations preview">
                    <div className="bot-preview-sidebar">
                      <div className="bot-preview-title">
                        <Image src="/molly-logo.png" alt="" width={34} height={34} />
                        <span>Whiteout Survival</span>
                      </div>
                      {["Overview", "Alliance Monitor", "Gift Codes", "Records", "Reminders"].map((item, index) => (
                        <span className={index === 0 ? "active" : ""} key={item}>{item}</span>
                      ))}
                    </div>
                    <div className="bot-preview-main">
                      <div className="bot-preview-topbar">
                        <span>Live Operations</span>
                        <strong>{botMetrics.servers} servers</strong>
                      </div>
                      <div className="bot-preview-stats">
                        {[
                          [botMetrics.members, "members"],
                          [botMetrics.monitors, "monitors"],
                          [botMetrics.giftCodes, "active codes"],
                        ].map(([value, label]) => (
                          <span key={label}><strong>{value}</strong>{label}</span>
                        ))}
                      </div>
                      <div className="bot-feature-stack">
                        {botFeatureCards.map((feature) => (
                          <article key={feature.title}>
                            <img src={feature.image} alt={feature.alt} />
                            <div>
                              <strong>{feature.title}</strong>
                            </div>
                          </article>
                        ))}
                      </div>
                    </div>
                  </div>

                  <aside className="bot-web-card" aria-label="Web dashboard preview">
                    <div className="bot-card-head">
                      <span>Web Dashboard</span>
                      <strong>Manage server overview, translation rules, auto-redeem channels, registered members, and reminders from the browser.</strong>
                    </div>
                    <div className="bot-web-shot-grid">
                      {botWebDashboardScreens.map((screen) => (
                        <figure key={screen.label}>
                          <img src={screen.image} alt={screen.alt} />
                          <figcaption>{screen.label}</figcaption>
                        </figure>
                      ))}
                    </div>
                  </aside>

                  <div className="bot-gallery-card" aria-label="Bot website preview screenshots">
                    <div className="bot-card-head">
                      <span>Feature Previews</span>
                    </div>
                    <div className="bot-preview-rail">
                      {botPreviewScreens.map((screen) => (
                        <figure key={screen.label}>
                          <img src={screen.image} alt={screen.alt} />
                          <figcaption>{screen.label}</figcaption>
                        </figure>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          ) : (
          <section className="home-page daybreak-page" id="daybreak" aria-label="Daybreak Island community showcase">
            <section className="daybreak-hero">
              <div className="daybreak-hero-copy">
                <span className="section-kicker">Community Showcase</span>
                <h1>Daybreak Island</h1>
                <p>Discover community island layouts, showcase your creations, and share your island with players across the Whiteout Survival community.</p>
                <div className="hero-actions">
                  <button className="primary-cta" type="button" onClick={openUploadModal}>Upload Island</button>
                  <a className="secondary-cta" href="#showcase">Explore Showcase</a>
                </div>
              </div>
              <div className="daybreak-hero-art">
                <Image src="/daybreak-island-tree-of-life.webp" alt="Daybreak Island Tree of Life showcase" width={1080} height={1042} priority />
              </div>
            </section>

            <section className="showcase-head" id="showcase">
              <div>
                <h2>{daybreakView === "uploads" ? "My Uploads" : daybreakView === "favorites" ? "Favorites" : "Island Gallery"}</h2>
              </div>
              <div className="daybreak-controls">
                <div className="daybreak-control-bar" aria-label="Daybreak showcase controls">
                  {authUser && (
                    <>
                      <button className={daybreakView === "uploads" ? "selected" : ""} type="button" onClick={() => setSignedInDaybreakView("uploads")}>My Uploads</button>
                      <button className={daybreakView === "favorites" ? "selected" : ""} type="button" onClick={() => setSignedInDaybreakView("favorites")}>Favorites</button>
                      <span aria-hidden="true" className="daybreak-control-divider" />
                    </>
                  )}
                  <button
                    className={daybreakView === "gallery" && sort === "popular" ? "selected" : ""}
                    type="button"
                    onClick={() => {
                      setSort("popular");
                      setDaybreakView("gallery");
                      setSelectedTag("");
                    }}
                  >
                    Popular
                  </button>
                  <button
                    className={daybreakView === "gallery" && sort === "recent" ? "selected" : ""}
                    type="button"
                    onClick={() => {
                      setSort("recent");
                      setDaybreakView("gallery");
                      setSelectedTag("");
                    }}
                  >
                    Recent
                  </button>
                </div>
              </div>
            </section>

            {selectedTag && daybreakView === "gallery" && (
              <div className="active-tag-filter">
                <span>#{selectedTag}</span>
                <button type="button" onClick={() => setSelectedTag("")} aria-label="Clear tag filter">Clear</button>
              </div>
            )}

            {status && <p className="daybreak-status">{status}</p>}

            <section className="island-grid">
              {islands.length ? islands.map((island) => (
                <article className={`island-card ${linkedIslandId === island.id ? "island-card-linked" : ""}`} id={`island-${island.id}`} key={island.id}>
                  <button className="island-image" type="button" onClick={() => loadComments(island)} aria-label={`Open ${island.title}`}>
                    <Image src={island.imageUrl} alt={island.title} width={720} height={520} />
                  </button>
                  {canManageIsland(island) && (
                    <button
                      className="island-edit-fab"
                      type="button"
                      onClick={() => openEditIslandModal(island)}
                      aria-label={`Edit ${island.title}`}
                      title="Edit island details"
                    >
                      <Icon name="edit" />
                    </button>
                  )}
                  <h3 className="compact-island-title">{island.title}</h3>
                  <div className="island-card-body">
                    <div className="player-strip card-player-strip">
                      <div className="player-avatar">
                        {island.player.avatarImage ? (
                          <img src={island.player.avatarImage} alt="" />
                        ) : (
                          <Icon name="user" />
                        )}
                      </div>
                      <div>
                        <strong>{island.player.nickname}</strong>
                        <span>ID {island.playerId}</span>
                      </div>
                    </div>
                    <div className="card-meta-row">
                      <div className="account-mini-meta">
                        <span>FC {furnaceDisplay(island.player)}</span>
                      </div>
                      <div className="card-right-meta">
                        <span className="state-pill">S{island.player.stateId || island.server || "N/A"}</span>
                        <div className="coordinate-pill" aria-label={`Coordinates X ${island.coordinates.x} Y ${island.coordinates.y}`}>
                          <span>X <strong>{island.coordinates.x}</strong></span>
                          <span>Y <strong>{island.coordinates.y}</strong></span>
                        </div>
                      </div>
                    </div>
                    {island.description && island.description !== "Shared Daybreak Island layout." && (
                      <p className="compact-island-description">{island.description}</p>
                    )}
                  </div>
                  <div className="island-card-footer">
                    <div className="island-actions">
                      <button className={`card-icon-action ${likedIslands[island.id] ? "liked" : ""}`} type="button" onClick={() => likeIsland(island)} aria-label="Like island">
                        <Icon name="heart" />
                        {island.likes}
                      </button>
                      <button className="card-icon-action" type="button" onClick={() => setShareIslandTarget(island)} aria-label="Share island">
                        <Icon name="share" />
                        {island.shares}
                      </button>
                      <button className="card-icon-action" type="button" onClick={() => loadComments(island)} aria-label="Open details and comments">
                        <Icon name="message" />
                        {island.commentsCount}
                      </button>
                      {canManageIsland(island) && (
                        <>
                          <button
                            className="card-icon-action"
                            type="button"
                            onClick={() => openEditIslandModal(island)}
                            aria-label="Edit island"
                          >
                            <Icon name="edit" />
                          </button>
                          <button
                            className="card-icon-action danger"
                            type="button"
                            onClick={() => void deleteIsland(island)}
                            aria-label="Delete island"
                            disabled={deletingIslandId === island.id}
                          >
                            <Icon name="trash" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </article>
              )) : (
                <div className="empty-island-state">
                  <Icon name={daybreakView === "favorites" ? "star" : "upload"} />
                  <strong>{daybreakView === "favorites" ? "No favorites yet" : "No uploads yet"}</strong>
                  <span>{daybreakView === "favorites" ? "Like islands from the gallery to save them here." : "Upload your first Daybreak Island to see it here."}</span>
                </div>
              )}
            </section>

          </section>
          )}

          <footer className={`site-footer ${footerVisible ? "footer-visible" : "footer-hidden"}`}>
            <p className="footer-credit">
              <span>Built for WOS community - By</span>
              <Image src="/magnus-logo-cropped.png" alt="Magnus" width={104} height={31} />
            </p>
          </footer>
        </div>
      </div>

      {layoutOpen && (
        <div className="settings-panel" role="dialog" aria-modal="false" aria-label="Layout Settings">
          <div className="settings-head">
            <div>
              <h2>Layout Settings</h2>
              <p>View controls</p>
            </div>
            <button className="settings-close" type="button" onClick={() => setLayoutOpen(false)} aria-label="Close layout settings">
              <Icon name="x" />
            </button>
          </div>
          <section className="settings-section">
            <h3>Theme</h3>
            <div className="theme-grid compact">
              {(["light", "dark", "system"] as const).map((item) => (
                <button className={theme === item ? "selected" : ""} key={item} type="button" onClick={() => setTheme(item)}>
                  <span>{item[0].toUpperCase() + item.slice(1)}</span>
                </button>
              ))}
            </div>
          </section>
          <section className="settings-section">
            <h3>Sidebar</h3>
            <div className="setting-row">
              <div>
                <strong>Collapse Sidebar</strong>
                <span>Icon-only sidebar mode</span>
              </div>
              <button className={`switch ${collapsedSidebar ? "on" : ""}`} type="button" aria-pressed={collapsedSidebar} onClick={() => setCollapsedSidebar((value) => !value)}>
                <span />
              </button>
            </div>
            <label className="range-setting">
              <span>Sidebar width</span>
              <input type="range" min="176" max="380" value={sidebarWidth} disabled={collapsedSidebar} onChange={(event) => setSidebarWidth(Number(event.target.value))} />
              <output>{sidebarWidth}px</output>
            </label>
            <div className="setting-row">
              <div>
                <strong>Hide Top Nav</strong>
                <span>Use sidebar only</span>
              </div>
              <button className={`switch ${hideTopNav ? "on" : ""}`} type="button" aria-pressed={hideTopNav} onClick={() => setHideTopNav(!hideTopNav)}>
                <span />
              </button>
            </div>
          </section>
          <section className="settings-section settings-section-last">
            <h3>Content</h3>
            <div className="width-options">
              <button className={contentWidth === "centered" ? "selected" : ""} type="button" onClick={() => setContentWidth("centered")}>
                <strong>Centered</strong>
                <span>Readable max width</span>
              </button>
              <button className={contentWidth === "full" ? "selected" : ""} type="button" onClick={() => setContentWidth("full")}>
                <strong>Full Width</strong>
                <span>Use all space</span>
              </button>
            </div>
          </section>
        </div>
      )}

      {loginOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Sign In" onClick={() => setLoginOpen(false)}>
          <section className="login-modal" onClick={(event) => event.stopPropagation()}>
            <button className="close-button" type="button" onClick={() => setLoginOpen(false)} aria-label="Close">x</button>
            <div className="login-hero-mark">
              <Image src="/wos-logo.png" alt="" width={46} height={46} />
            </div>
            <span className="section-kicker">Welcome back</span>
            <h2>Sign in to WhiteoutSurvival.dev</h2>
            <p>Use your community account to manage your profile and linked game accounts.</p>
            {authStatus && <div className="auth-status">{authStatus}</div>}
            <div className="social-login-stack">
              <button className="social-login google" type="button" onClick={() => signInWith("google")}>
                <span className="provider-mark">G</span>
                Continue with Google
              </button>
              <div className="login-divider"><span>Or continue with</span></div>
              <button className="social-login discord" type="button" onClick={() => signInWith("discord")}>
                <span className="provider-mark">D</span>
                Continue with Discord
              </button>
            </div>
          </section>
        </div>
      )}

      {profileOpen && authUser && (
        <div className="modal-backdrop profile-backdrop" role="dialog" aria-modal="true" aria-label="Profile" onClick={() => setProfileOpen(false)}>
          <section className="profile-modal" onClick={(event) => event.stopPropagation()}>
            <button className="close-button" type="button" onClick={() => setProfileOpen(false)} aria-label="Close">x</button>
            <div className="profile-head">
              <h2>Profile</h2>
              <p>Manage your account and linked game accounts</p>
            </div>
            <div className="profile-layout">
              <aside className="profile-card">
                <div className="profile-banner" />
                <div className="profile-avatar">
                  {authUser.avatarUrl ? <img src={authUser.avatarUrl} alt="" /> : <Icon name="user" />}
                </div>
                <h3>{authUser.displayName}</h3>
                {authUser.email && <p>{authUser.email}</p>}
                <div className="profile-stat">
                  <span className="stat-icon"><Icon name="calendar" /></span>
                  <span>Member Since<strong>{memberSince(authUser.createdAt)}</strong></span>
                </div>
                <button className="profile-signout" type="button" onClick={() => void signOut()}>
                  <Icon name="logout" />
                  Sign Out
                </button>
              </aside>

              <section className="game-accounts-panel">
                <div className="panel-title-row">
                  <div>
                    <h3><Icon name="gamepad" /> Game Accounts</h3>
                    <p>Link and manage your Whiteout Survival game accounts for quick access across all tools</p>
                  </div>
                  <span>{authUser.playerAccounts.length} accounts</span>
                </div>

                <form className="link-account-box" onSubmit={linkPlayerAccount}>
                  <h4><Icon name="plus" /> Link New Account</h4>
                  <div className="player-lookup-row">
                    <input
                      name="playerId"
                      aria-label="Player ID"
                      inputMode="numeric"
                      pattern="[0-9]{8,9}"
                      maxLength={9}
                      placeholder="Enter Player ID (e.g., 123456789)"
                      required
                      onChange={(event) => {
                        setPlayerLookup(null);
                        setPlayerLookupStatus("");
                        if (event.currentTarget.value.replace(/\D/g, "").length >= 8) {
                          void fetchPlayerDetails(event.currentTarget.value);
                        }
                      }}
                    />
                    <button type="submit" disabled={linkingPlayer}>
                      <Icon name="search" />
                      {linkingPlayer ? "Linking..." : "Link"}
                    </button>
                  </div>
                  {(playerLookup || playerLookupStatus || authStatus) && (
                    <div className={`player-lookup-card ${playerLookup ? "loaded" : ""}`}>
                      {playerLookup?.avatarImage && <img src={playerLookup.avatarImage} alt="" />}
                      <div>
                        <strong>{playerLookup?.nickname || playerLookupStatus || authStatus}</strong>
                        {playerLookup && (
                          <span>
                            ID {playerLookup.playerId} | State {playerLookup.stateId || "N/A"} | Furnace {furnaceDisplay(playerLookup)}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </form>

                <div className="linked-accounts">
                  <h4><Icon name="crown" /> Linked Accounts</h4>
                  {authUser.playerAccounts.length ? (
                    <div className="linked-account-list">
                      {authUser.playerAccounts.map((player) => (
                        <article className="linked-account-card" key={player.playerId}>
                          <div className="player-avatar">
                            {player.avatarImage ? <img src={player.avatarImage} alt="" /> : <Icon name="user" />}
                          </div>
                          <div>
                            <strong>{player.nickname}</strong>
                            <span>ID {player.playerId} | State {player.stateId || "N/A"} | Furnace {furnaceDisplay(player)}</span>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-linked-accounts">
                      <Icon name="gamepad" />
                      <span>No linked game accounts yet</span>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </section>
        </div>
      )}

      {uploadOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Upload Daybreak Island" onClick={closeUploadModal}>
          <section className="upload-modal" onClick={(event) => event.stopPropagation()}>
            <button className="close-button" type="button" onClick={closeUploadModal} aria-label="Close">x</button>
            <div className="upload-modal-head">
              <span className="section-kicker">Add Your Island</span>
              <h2>Upload a Daybreak Island build</h2>
            </div>
            <form className="upload-form" onSubmit={handleUpload}>
              <label>
                Island title
                <input name="title" maxLength={90} placeholder="Tree of Life Plaza" required />
              </label>
              <div className="form-field">
                <span>Whiteout Survival account</span>
                {authUser?.playerAccounts.length ? (
                  <div className="upload-account-picker" role="radiogroup" aria-label="Choose upload player account">
                    {authUser.playerAccounts.map((player) => (
                      <label className={`upload-account-option ${uploadPlayerMode === "linked" && effectiveUploadPlayerId === player.playerId ? "selected" : ""}`} key={player.playerId}>
                        <input
                          type="radio"
                          name="uploadPlayerChoice"
                          checked={uploadPlayerMode === "linked" && effectiveUploadPlayerId === player.playerId}
                          onChange={() => {
                            setUploadPlayerMode("linked");
                            setSelectedUploadPlayerId(player.playerId);
                            setPlayerLookup(player);
                            setPlayerLookupStatus("");
                          }}
                        />
                        <span className="player-avatar">
                          {player.avatarImage ? <img src={player.avatarImage} alt="" /> : <Icon name="user" />}
                        </span>
                        <span>
                          <strong>{player.nickname}</strong>
                          <small>ID {player.playerId} | State {player.stateId || "N/A"} | Furnace {furnaceDisplay(player)}</small>
                        </span>
                      </label>
                    ))}
                    <label className={`upload-account-option ${uploadPlayerMode === "manual" ? "selected" : ""}`}>
                      <input
                        type="radio"
                        name="uploadPlayerChoice"
                        checked={uploadPlayerMode === "manual"}
                        onChange={() => {
                          setUploadPlayerMode("manual");
                          setPlayerLookup(null);
                          setPlayerLookupStatus("");
                        }}
                      />
                      <span className="player-avatar"><Icon name="search" /></span>
                      <span>
                        <strong>Use another Player ID</strong>
                        <small>Type a different 8 or 9 digit account ID for this upload.</small>
                      </span>
                    </label>
                  </div>
                ) : (
                  <div className="upload-account-empty">Link a game account from Profile later, or enter a Player ID for this upload.</div>
                )}
                {uploadPlayerMode === "linked" && effectiveUploadPlayerId ? (
                  <input type="hidden" name="playerId" value={effectiveUploadPlayerId} />
                ) : (
                  <div className="player-lookup-row">
                    <input
                      name="playerId"
                      aria-label="Player ID"
                      inputMode="numeric"
                      pattern="[0-9]{8,9}"
                      maxLength={9}
                      placeholder="8 or 9 digit ID"
                      required
                      onChange={(event) => {
                        setPlayerLookup(null);
                        setPlayerLookupStatus("");
                        if (event.currentTarget.value.replace(/\D/g, "").length >= 8) {
                          void fetchPlayerDetails(event.currentTarget.value);
                        }
                      }}
                    />
                    <button
                      type="button"
                      disabled={fetchingPlayer}
                      onClick={(event) => {
                        const input = event.currentTarget.form?.elements.namedItem("playerId") as HTMLInputElement | null;
                        void fetchPlayerDetails(input?.value || "");
                      }}
                    >
                      {fetchingPlayer ? "Fetching..." : "Fetch Details"}
                    </button>
                  </div>
                )}
              </div>
              {(playerLookup || playerLookupStatus) && (
                <div className={`player-lookup-card ${playerLookup ? "loaded" : ""}`}>
                  {playerLookup?.avatarImage && <img src={playerLookup.avatarImage} alt="" />}
                  <div>
                    <strong>{playerLookup?.nickname || playerLookupStatus}</strong>
                    {playerLookup && (
                      <span>
                        ID {playerLookup.playerId} | State {playerLookup.stateId || "N/A"} | Furnace {furnaceDisplay(playerLookup)}
                      </span>
                    )}
                  </div>
                </div>
              )}
              <div className="form-grid">
                <label>
                  X Coordinate
                  <input name="coordinateX" type="number" min="0" step="1" required />
                </label>
                <label>
                  Y Coordinate
                  <input name="coordinateY" type="number" min="0" step="1" required />
                </label>
              </div>
              <label>
                Description optional
                <textarea name="description" maxLength={420} placeholder="What makes this island useful or beautiful?" />
              </label>
              <label className="hashtag-field">
                Tags
                <input
                  name="tags"
                  placeholder="#TreeOfLife #Plaza #Symmetry"
                  value={uploadTagsInput}
                  onChange={(event) => setUploadTagsInput(event.currentTarget.value)}
                />
                {uploadTagsInput && visibleTagSuggestions.length > 0 && (
                  <div className="tag-suggestion-row" aria-label="Tag suggestions">
                    {visibleTagSuggestions.map((tag) => (
                      <button type="button" key={tag} onClick={() => addUploadTagSuggestion(tag)}>#{tag}</button>
                    ))}
                  </div>
                )}
              </label>
              <section className="image-uploader" aria-label="Island image source">
                <div className="image-uploader-preview">
                  {uploadPreviewUrl ? (
                    <img src={uploadPreviewUrl} alt="Selected island preview" />
                  ) : (
                    <div className="preview-empty">
                      <Icon name="upload" />
                      <strong>Island screenshot</strong>
                      <span>Preview appears here</span>
                    </div>
                  )}
                </div>
                <div className="image-uploader-controls">
                  <div className="image-source-head">
                    <strong>Upload image</strong>
                    <span>Choose a file or paste a shared image URL.</span>
                  </div>
                  <label className="file-dropzone">
                    <Icon name="upload" />
                    <span>
                      <strong>{uploadImageLabel}</strong>
                      <small>Click to choose PNG, JPG, or WEBP up to 8 MB</small>
                    </span>
                    <input name="image" type="file" accept="image/*" onChange={handleUploadImageChange} />
                  </label>
                  <div className="upload-divider"><span>or</span></div>
                  <label className="image-url-field">
                    <span>Paste image link</span>
                    <input name="imageUrl" type="url" placeholder="Google Drive, Discord CDN, or direct image URL" onChange={handleUploadImageUrlChange} />
                  </label>
                </div>
              </section>
              <button className="submit-button" type="submit" disabled={uploading}>{uploading ? "Uploading..." : "Publish Island"}</button>
            </form>
          </section>
        </div>
      )}

      {editingIsland && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={`Edit ${editingIsland.title}`} onClick={closeEditModal}>
          <section className="upload-modal edit-island-modal" onClick={(event) => event.stopPropagation()}>
            <button className="close-button" type="button" onClick={closeEditModal} aria-label="Close">x</button>
            <div className="upload-modal-head">
              <span className="section-kicker">Edit Upload</span>
              <h2>Update island details</h2>
            </div>
            <form className="upload-form" onSubmit={handleEditIsland}>
              <label>
                Island title
                <input name="title" maxLength={90} defaultValue={editingIsland.title} placeholder="Tree of Life Plaza" required />
              </label>
              <div className="form-grid">
                <label>
                  X Coordinate
                  <input name="coordinateX" type="number" min="0" step="1" defaultValue={editingIsland.coordinates.x} required />
                </label>
                <label>
                  Y Coordinate
                  <input name="coordinateY" type="number" min="0" step="1" defaultValue={editingIsland.coordinates.y} required />
                </label>
              </div>
              <label className="hashtag-field">
                Tags
                <input
                  name="tags"
                  placeholder="#TreeOfLife #Plaza #Symmetry"
                  value={editTagsInput}
                  onChange={(event) => setEditTagsInput(event.currentTarget.value)}
                />
                {editTagsInput && visibleEditTagSuggestions.length > 0 && (
                  <div className="tag-suggestion-row" aria-label="Tag suggestions">
                    {visibleEditTagSuggestions.map((tag) => (
                      <button type="button" key={tag} onClick={() => addEditTagSuggestion(tag)}>#{tag}</button>
                    ))}
                  </div>
                )}
              </label>
              <div className="edit-island-actions">
                <button className="secondary-cta" type="button" onClick={closeEditModal}>Cancel</button>
                <button className="submit-button" type="submit" disabled={editSaving}>{editSaving ? "Saving..." : "Save Changes"}</button>
              </div>
            </form>
          </section>
        </div>
      )}

      {viewerImage && (
        <div className="modal-backdrop image-viewer-backdrop" role="dialog" aria-modal="true" aria-label={viewerImage.title} onClick={() => setViewerImage(null)}>
          <section className="island-detail-modal" onClick={(event) => event.stopPropagation()}>
            <button className="close-button" type="button" onClick={() => setViewerImage(null)} aria-label="Close">x</button>
            <div className="island-detail-media">
              <div className="image-viewer-toolbar" aria-label="Image controls">
                <button type="button" onClick={() => setImageZoom((value) => Math.min(240, value + 20))} aria-label="Zoom in">
                  <Icon name="zoomIn" />
                </button>
                <button type="button" onClick={() => setImageZoom((value) => Math.max(60, value - 20))} aria-label="Zoom out">
                  <Icon name="zoomOut" />
                </button>
                <button type="button" className="image-zoom-level" onClick={() => setImageZoom(100)} aria-label="Reset zoom">{imageZoom}%</button>
                <a href={viewerImage.imageUrl} target="_blank" rel="noreferrer" aria-label="Open full image">
                  <Icon name="expand" />
                </a>
                <button type="button" onClick={() => void downloadImage(viewerImage)} aria-label="Download image">
                  <Icon name="download" />
                </button>
              </div>
              <img src={viewerImage.imageUrl} alt={viewerImage.title} style={{ width: `${imageZoom}%` }} />
            </div>
            <div className="island-detail-panel">
              <div className="detail-head-block">
                <span className="section-kicker">Island Details</span>
                <h2>{viewerImage.title}</h2>
                <p>{viewerImage.description}</p>
              </div>
              <div className="player-strip detail-player">
                <div className="player-avatar">
                  {viewerImage.player.avatarImage ? <img src={viewerImage.player.avatarImage} alt="" /> : <Icon name="user" />}
                </div>
                <div>
                  <strong>{viewerImage.player.nickname}</strong>
                  <span>ID {viewerImage.playerId}</span>
                </div>
              </div>
              <div className="detail-meta-grid">
                <span><Icon name="mapPin" />State <strong>{viewerImage.player.stateId || viewerImage.server || "N/A"}</strong></span>
                <span><Icon name="flame" />Furnace <strong>{furnaceDisplay(viewerImage.player)}</strong></span>
                <span><Icon name="mapPin" />X:{viewerImage.coordinates.x} Y:{viewerImage.coordinates.y}</span>
                <span><Icon name="barChart" />{viewerImage.likes} likes | {viewerImage.shares} shares</span>
              </div>
              {viewerImage.tags.length > 0 && (
                <div className="tag-row">
                  {viewerImage.tags.map((tag) => (
                    <button type="button" key={tag} onClick={() => selectIslandTag(tag)}>#{tag.replace(/^#/, "")}</button>
                  ))}
                </div>
              )}
              <div className="detail-actions">
                <button className={likedIslands[viewerImage.id] ? "liked" : ""} type="button" onClick={() => likeIsland(viewerImage)}><Icon name="heart" />{likedIslands[viewerImage.id] ? "Liked" : "Like"}</button>
                <button type="button" onClick={() => setShareIslandTarget(viewerImage)}><Icon name="share" />Share</button>
              </div>
              <section className="comments-panel">
                <h3><Icon name="message" />Comments</h3>
                {commentsLoading ? (
                  <p>Loading comments...</p>
                ) : comments.length ? (
                  <div className="comment-list">
                    {comments.map((comment) => (
                      <article key={comment.id}>
                        <strong>{comment.authorName}</strong>
                        <p>{comment.message}</p>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p>No comments yet.</p>
                )}
                <form className="comment-form" onSubmit={addComment}>
                  <textarea name="message" maxLength={360} placeholder={authUser ? "Add a comment" : "Sign in to comment"} required disabled={!authUser} />
                  <button type="submit" disabled={commentSaving}>{commentSaving ? "Posting..." : authUser ? "Post Comment" : "Sign In to Comment"}</button>
                </form>
              </section>
            </div>
          </section>
        </div>
      )}

      {shareIslandTarget && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={`Share ${shareIslandTarget.title}`} onClick={() => setShareIslandTarget(null)}>
          <section className="share-modal" onClick={(event) => event.stopPropagation()}>
            <button className="close-button" type="button" onClick={() => setShareIslandTarget(null)} aria-label="Close">x</button>
            <h2>Share Island</h2>
            <p>{shareIslandTarget.title}</p>
            <div className="share-url-box">
              <span>{shareUrlFor(shareIslandTarget)}</span>
              <button type="button" onClick={() => shareIsland(shareIslandTarget)} aria-label="Copy island URL">
                <Icon name="copy" />
              </button>
            </div>
            <div className="share-icon-row">
              <button type="button" onClick={() => shareIsland(shareIslandTarget)}>Copy URL</button>
              <a href={socialShareUrl("discord", shareIslandTarget)} target="_blank" rel="noreferrer" onClick={() => void shareIsland(shareIslandTarget)}>Discord</a>
              <a href={socialShareUrl("whatsapp", shareIslandTarget)} target="_blank" rel="noreferrer" onClick={() => void shareIsland(shareIslandTarget)}>WhatsApp</a>
              <a href={socialShareUrl("x", shareIslandTarget)} target="_blank" rel="noreferrer" onClick={() => void shareIsland(shareIslandTarget)}>X</a>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
