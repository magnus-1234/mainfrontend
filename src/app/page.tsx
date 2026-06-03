"use client";
/* eslint-disable @next/next/no-img-element */
import Image from "next/image";
import type { CSSProperties, ChangeEvent, FormEvent, ReactNode } from "react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import DreamscapeMemory from "./dreamscape-memory/DreamscapeMemory";
import "./dreamscape-memory/dreamscape.css";
import wikiBuildingsData from "@/data/wiki/buildings.json";
import wikiHeroesData from "@/data/wiki/heroes.json";

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
    avatar_image?: string;
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
type TemplateView = "gallery" | "uploads" | "favorites";
type ActiveMenu = "home" | "gift" | "redeem" | "stateAge" | "chiefCharm" | "chiefGear" | "planner" | "templates" | "sneak" | "daybreak" | "dreamscape" | "bot" | "wikiHeroes" | "wikiBuildings";
type MessageTemplateCategory = "all" | "unicodes" | "emojis" | "funny" | "alliance-recruit";
type WosHeroFilter = "Rare" | "Epic" | `S${number}`;
type WosBuildingFilter = "Military" | "Inner City" | "Other" | "Fire Crystal";
type FoundryMemberRole = "leader" | "joiner";

type FoundryMember = {
  id: string;
  role: FoundryMemberRole;
  playerId: string;
  status: string;
  loading: boolean;
  profile?: PlayerProfile;
};

type FoundryTeam = {
  id: string;
  name: string;
  buildingId: string;
  rallyLeader: FoundryMember;
  joiners: FoundryMember[];
};

type FoundryBuilding = {
  id: string;
  name: string;
  shortName: string;
  x: number;
  y: number;
  phase: string;
};

type ChiefCharmLevel = {
  level: number;
  design: number;
  guide: number;
  secret: number;
  stat: number;
  power: number;
};

type ChiefCharmCost = {
  design: number;
  guide: number;
  secret: number;
  power: number;
  statGain: number;
};

type ChiefCharmSlotState = {
  from: number;
  to: number;
};

type ChiefCharmGearPiece = {
  id: string;
  name: string;
  troop: "Infantry" | "Marksman" | "Lancer";
  stat: string;
  charmImageTroop: "Infantry" | "Marksman" | "Lancer";
};

type ChiefCharmGearState = Record<string, ChiefCharmSlotState[]>;

type ChiefGearCost = {
  designPlans: number;
  hardenedAlloy: number;
  lunarAmber: number;
  polishingSolution: number;
};

type ChiefGearLevel = {
  id: string;
  label: string;
  tier: string;
  baseTier: "Uncommon" | "Rare" | "Epic" | "Legendary" | "Mythic";
  stars: number;
  index: number;
  attackDefense: number;
  squadCapacity: number;
  cost: ChiefGearCost;
};

type ChiefGearPiece = {
  id: string;
  name: string;
  troop: "Infantry" | "Marksman" | "Lancer";
  stat: string;
  asset: "helmet" | "chestplate" | "ring" | "watch" | "pants" | "staff";
};

type ChiefGearSelection = {
  from: string;
  to: string;
};

type ChiefGearState = Record<string, ChiefGearSelection>;
type SiteLanguage = {
  code: string;
  name: string;
  shortCode: string;
};

type WosWikiStat = {
  label: string;
  value: string;
};

type WosWikiItem = {
  name: string;
  slug: string;
  sourceUrl: string;
  thumbnail?: string;
  html: string;
  scrapedAt?: string;
};

type WosWikiHero = WosWikiItem & {
  rarity: string;
  heroClass: string;
  subClass: string;
  stats?: WosWikiStat[];
  skills?: string[];
};

type WosWikiBuilding = WosWikiItem & {
  category: string;
  description?: string;
  tableCount?: number;
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

const normalizeWosAvatarUrl = (value?: string) => {
  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }
  if (/^(data:|blob:|https?:\/\/)/i.test(raw)) {
    return raw;
  }
  if (raw.startsWith("//")) {
    return `https:${raw}`;
  }
  const cleaned = raw.replace(/^\/+/, "");
  if (/^(avatar|avatar-dev|profile|head|icon)\//i.test(cleaned) || /\.(png|jpe?g|webp)$/i.test(cleaned)) {
    return `https://gof-formal-avatar.akamaized.net/${cleaned}`;
  }
  try {
    return new URL(raw, apiBase || "https://whiteoutsurvival.dev").toString();
  } catch {
    return raw;
  }
};

const proxiedWosAvatarUrl = (value?: string) => {
  const normalized = normalizeWosAvatarUrl(value);
  if (!normalized || /^(data:|blob:)/i.test(normalized)) {
    return normalized;
  }
  return `/api/avatar-proxy?url=${encodeURIComponent(normalized)}`;
};

type BotMetrics = {
  servers: string;
  members: string;
  discordMembers: string;
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

type MessageTemplate = {
  id: string;
  title: string;
  category: Exclude<MessageTemplateCategory, "all">;
  description: string;
  text: string;
  previewText?: string;
  iconCode?: string;
  iconGlyph?: string;
  iconVisual?: string;
  imageUrl?: string;
  tags: string[];
  creatorName?: string;
  creatorUserId?: string;
  canManage?: boolean;
  likes?: number;
  shares?: number;
  createdAt?: string;
  updatedAt?: string;
  builtin?: boolean;
};

const giftCodesStorageKey = "whiteoutsurvival-gift-codes-cache-v1";
const feedbackBannerStorageKey = "whiteoutsurvival-feedback-banner-hidden-until";

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

type StateAgeResult = {
  state: string;
  activeFor: string;
  startedAt: string;
  sourceUrl: string;
  sourceUpdatedAt: string;
  recentlyOpenedStates?: RecentlyOpenedState[];
  events: StateTimelineEvent[];
};

type StateAgeRecentResult = {
  sourceUpdatedAt: string;
  recentlyOpenedStates: RecentlyOpenedState[];
};

const fallbackBotMetrics: BotMetrics = {
  servers: "48",
  members: "1.5K",
  discordMembers: "1.5K",
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

const foundryMapImage = "/foundry-team-planner-map.webp";
const foundryLogoImage = "/whiteout-survival-logo.png";
const foundryPlannerSaveKeyPrefix = "foundry-planner-save";

const foundryBuildings: FoundryBuilding[] = [
  { id: "blue-zone", name: "Blue Safe Zone", shortName: "Safe Zone", x: 8, y: 50, phase: "Spawn" },
  { id: "red-zone", name: "Red Safe Zone", shortName: "Safe Zone", x: 92, y: 50, phase: "Spawn" },
  { id: "boiler-room", name: "Boiler Room", shortName: "Boiler Room", x: 34, y: 19, phase: "Phase 1" },
  { id: "repair-facility-iii", name: "Repair Facility III", shortName: "Repair III", x: 61, y: 19, phase: "Phase 1" },
  { id: "workshop-north-west", name: "Workshop - North West", shortName: "Workshop", x: 27, y: 29, phase: "Phase 3" },
  { id: "mercenary-camp", name: "Mercenary Camp", shortName: "Mercenary", x: 45, y: 35, phase: "Phase 2" },
  { id: "workshop-north-east", name: "Workshop - North East", shortName: "Workshop", x: 65, y: 34, phase: "Phase 3" },
  { id: "prototype-site-i", name: "Prototype Site I", shortName: "Prototype I", x: 27, y: 48, phase: "Phase 1" },
  { id: "repair-facility-iv", name: "Repair Facility IV", shortName: "Repair IV", x: 78, y: 51, phase: "Phase 1" },
  { id: "repair-facility-i", name: "Repair Facility I", shortName: "Repair I", x: 18, y: 59, phase: "Phase 1" },
  { id: "imperial-foundry", name: "Imperial Foundry", shortName: "Imperial", x: 48, y: 58, phase: "Phase 2" },
  { id: "prototype-site-ii", name: "Prototype Site II", shortName: "Prototype II", x: 69, y: 63, phase: "Phase 1" },
  { id: "workshop-south-west", name: "Workshop - South West", shortName: "Workshop", x: 31, y: 70, phase: "Phase 3" },
  { id: "munition-warehouse", name: "Munition Warehouse", shortName: "Munition", x: 47, y: 81, phase: "Phase 2" },
  { id: "workshop-south-east", name: "Workshop - South East", shortName: "Workshop", x: 62, y: 72, phase: "Phase 3" },
  { id: "repair-facility-ii", name: "Repair Facility II", shortName: "Repair II", x: 34, y: 91, phase: "Phase 1" },
  { id: "transit-station", name: "Transit Station", shortName: "Transit Station", x: 62, y: 93, phase: "Phase 1" },
  { id: "arsenal-supplies", name: "Arsenal Supplies", shortName: "Supplies", x: 18, y: 75, phase: "Looter" },
];

const foundryTeamColors = ["#22d3ee", "#f97316", "#a78bfa", "#34d399", "#f43f5e", "#facc15", "#60a5fa", "#fb7185"];
const foundryLeaderColor = "#facc15";

const foundryMapCircleOffset = (memberIndex: number, memberCount: number, teamOffset = 0) => {
  const radius = 8.2 + teamOffset * 1.2;
  const angle = ((Math.PI * 2) / Math.max(memberCount, 1)) * memberIndex - Math.PI / 2 + teamOffset * 0.45;
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
  };
};

const foundryExportCircleOffset = (memberIndex: number, memberCount: number, teamOffset = 0) => {
  const radiusX = 172 + teamOffset * 22;
  const radiusY = 104 + teamOffset * 14;
  const angle = ((Math.PI * 2) / Math.max(memberCount, 1)) * memberIndex - Math.PI / 2 + teamOffset * 0.45;
  return {
    x: Math.cos(angle) * radiusX,
    y: Math.sin(angle) * radiusY,
  };
};

const chiefCharmLevels: ChiefCharmLevel[] = [
  { level: 1, design: 5, guide: 5, secret: 0, stat: 9, power: 205700 },
  { level: 2, design: 15, guide: 40, secret: 0, stat: 12, power: 288000 },
  { level: 3, design: 40, guide: 60, secret: 0, stat: 16, power: 370000 },
  { level: 4, design: 100, guide: 80, secret: 0, stat: 19, power: 452000 },
  { level: 5, design: 200, guide: 100, secret: 0, stat: 25, power: 576000 },
  { level: 6, design: 300, guide: 120, secret: 0, stat: 30, power: 700000 },
  { level: 7, design: 400, guide: 140, secret: 0, stat: 35, power: 824000 },
  { level: 8, design: 400, guide: 200, secret: 0, stat: 40, power: 948000 },
  { level: 9, design: 400, guide: 300, secret: 0, stat: 45, power: 1072000 },
  { level: 10, design: 420, guide: 420, secret: 0, stat: 50, power: 1196000 },
  { level: 11, design: 420, guide: 560, secret: 0, stat: 55, power: 1320000 },
  { level: 12, design: 450, guide: 580, secret: 15, stat: 64, power: 1444000 },
  { level: 13, design: 450, guide: 580, secret: 30, stat: 73, power: 1568000 },
  { level: 14, design: 500, guide: 600, secret: 45, stat: 82, power: 1692000 },
  { level: 15, design: 500, guide: 600, secret: 70, stat: 91, power: 1816000 },
  { level: 16, design: 550, guide: 650, secret: 100, stat: 100, power: 1940000 },
];

const chiefCharmSlotsPerGear = 3;
const chiefCharmGearPieces: ChiefCharmGearPiece[] = [
  { id: "helmet", name: "Helmet", troop: "Infantry", stat: "Infantry Health / Lethality", charmImageTroop: "Infantry" },
  { id: "armor", name: "Armor", troop: "Infantry", stat: "Infantry Health / Lethality", charmImageTroop: "Infantry" },
  { id: "weapon", name: "Weapon", troop: "Marksman", stat: "Marksman Health / Lethality", charmImageTroop: "Marksman" },
  { id: "belt", name: "Belt", troop: "Marksman", stat: "Marksman Health / Lethality", charmImageTroop: "Marksman" },
  { id: "watch", name: "Watch", troop: "Lancer", stat: "Lancer Health / Lethality", charmImageTroop: "Lancer" },
  { id: "boots", name: "Boots", troop: "Lancer", stat: "Lancer Health / Lethality", charmImageTroop: "Lancer" },
];
const chiefCharmTroops = ["Infantry", "Marksman", "Lancer"] as const;
const emptyChiefCharmCost: ChiefCharmCost = { design: 0, guide: 0, secret: 0, power: 0, statGain: 0 };

const levelDataFor = (level: number) => chiefCharmLevels.find((item) => item.level === level);

const charmTotalsBetween = (currentLevel: number, targetLevel: number) =>
  chiefCharmLevels
    .filter((item) => item.level > currentLevel && item.level <= targetLevel)
    .reduce(
      (total, item) => ({
        design: total.design + item.design,
        guide: total.guide + item.guide,
        secret: total.secret + item.secret,
        power: total.power + item.power,
        statGain: total.statGain + item.stat,
      }),
      emptyChiefCharmCost,
    );

const addCharmCost = (left: ChiefCharmCost, right: ChiefCharmCost): ChiefCharmCost => ({
  design: left.design + right.design,
  guide: left.guide + right.guide,
  secret: left.secret + right.secret,
  power: left.power + right.power,
  statGain: left.statGain + right.statGain,
});

const multiplyCharmCost = (cost: ChiefCharmCost, multiplier: number): ChiefCharmCost => ({
  design: cost.design * multiplier,
  guide: cost.guide * multiplier,
  secret: cost.secret * multiplier,
  power: cost.power * multiplier,
  statGain: cost.statGain * multiplier,
});

const createChiefCharmGearState = (from = 0, to = 0): ChiefCharmGearState =>
  chiefCharmGearPieces.reduce<ChiefCharmGearState>((state, gear) => {
    state[gear.id] = Array.from({ length: chiefCharmSlotsPerGear }, () => ({ from, to }));
    return state;
  }, {});

const chiefGearPieces: ChiefGearPiece[] = [
  { id: "cap", name: "Cap", troop: "Lancer", stat: "Lancer Attack / Defense", asset: "helmet" },
  { id: "coat", name: "Coat", troop: "Infantry", stat: "Infantry Attack / Defense", asset: "chestplate" },
  { id: "ring", name: "Ring", troop: "Marksman", stat: "Marksman Attack / Defense", asset: "ring" },
  { id: "watch", name: "Watch", troop: "Lancer", stat: "Lancer Attack / Defense", asset: "watch" },
  { id: "pants", name: "Pants", troop: "Infantry", stat: "Infantry Attack / Defense", asset: "pants" },
  { id: "weapon", name: "Weapon", troop: "Marksman", stat: "Marksman Attack / Defense", asset: "staff" },
];

const emptyChiefGearCost: ChiefGearCost = { designPlans: 0, hardenedAlloy: 0, lunarAmber: 0, polishingSolution: 0 };

const chiefGearLevels: ChiefGearLevel[] = [
  { id: "green_0", label: "Uncommon", tier: "Uncommon", baseTier: "Uncommon", stars: 0, index: 0, attackDefense: 9.35, squadCapacity: 0, cost: { designPlans: 0, hardenedAlloy: 1500, lunarAmber: 0, polishingSolution: 15 } },
  { id: "green_1", label: "Uncommon 1-Star", tier: "Uncommon", baseTier: "Uncommon", stars: 1, index: 1, attackDefense: 12.75, squadCapacity: 0, cost: { designPlans: 0, hardenedAlloy: 3800, lunarAmber: 0, polishingSolution: 40 } },
  { id: "blue_0", label: "Rare", tier: "Rare", baseTier: "Rare", stars: 0, index: 2, attackDefense: 17, squadCapacity: 0, cost: { designPlans: 0, hardenedAlloy: 7000, lunarAmber: 0, polishingSolution: 70 } },
  { id: "blue_1", label: "Rare 1-Star", tier: "Rare", baseTier: "Rare", stars: 1, index: 3, attackDefense: 21.25, squadCapacity: 0, cost: { designPlans: 0, hardenedAlloy: 9700, lunarAmber: 0, polishingSolution: 95 } },
  { id: "blue_2", label: "Rare 2-Star", tier: "Rare", baseTier: "Rare", stars: 2, index: 4, attackDefense: 25.5, squadCapacity: 0, cost: { designPlans: 45, hardenedAlloy: 0, lunarAmber: 0, polishingSolution: 0 } },
  { id: "blue_3", label: "Rare 3-Star", tier: "Rare", baseTier: "Rare", stars: 3, index: 5, attackDefense: 29.75, squadCapacity: 0, cost: { designPlans: 50, hardenedAlloy: 0, lunarAmber: 0, polishingSolution: 0 } },
  { id: "purple_0", label: "Epic", tier: "Epic", baseTier: "Epic", stars: 0, index: 6, attackDefense: 34, squadCapacity: 0, cost: { designPlans: 60, hardenedAlloy: 0, lunarAmber: 0, polishingSolution: 0 } },
  { id: "purple_1", label: "Epic 1-Star", tier: "Epic", baseTier: "Epic", stars: 1, index: 7, attackDefense: 36.89, squadCapacity: 0, cost: { designPlans: 70, hardenedAlloy: 0, lunarAmber: 0, polishingSolution: 0 } },
  { id: "purple_2", label: "Epic 2-Star", tier: "Epic", baseTier: "Epic", stars: 2, index: 8, attackDefense: 39.78, squadCapacity: 0, cost: { designPlans: 40, hardenedAlloy: 6500, lunarAmber: 0, polishingSolution: 65 } },
  { id: "purple_3", label: "Epic 3-Star", tier: "Epic", baseTier: "Epic", stars: 3, index: 9, attackDefense: 42.67, squadCapacity: 0, cost: { designPlans: 50, hardenedAlloy: 8000, lunarAmber: 0, polishingSolution: 80 } },
  { id: "purple_t1_0", label: "Epic T1", tier: "Epic T1", baseTier: "Epic", stars: 0, index: 10, attackDefense: 45.56, squadCapacity: 0, cost: { designPlans: 60, hardenedAlloy: 10000, lunarAmber: 0, polishingSolution: 95 } },
  { id: "purple_t1_1", label: "Epic T1 1-Star", tier: "Epic T1", baseTier: "Epic", stars: 1, index: 11, attackDefense: 48.45, squadCapacity: 0, cost: { designPlans: 70, hardenedAlloy: 11000, lunarAmber: 0, polishingSolution: 110 } },
  { id: "purple_t1_2", label: "Epic T1 2-Star", tier: "Epic T1", baseTier: "Epic", stars: 2, index: 12, attackDefense: 51.34, squadCapacity: 0, cost: { designPlans: 85, hardenedAlloy: 13000, lunarAmber: 0, polishingSolution: 130 } },
  { id: "purple_t1_3", label: "Epic T1 3-Star", tier: "Epic T1", baseTier: "Epic", stars: 3, index: 13, attackDefense: 54.23, squadCapacity: 0, cost: { designPlans: 100, hardenedAlloy: 15000, lunarAmber: 0, polishingSolution: 160 } },
  { id: "gold_0", label: "Legendary", tier: "Legendary", baseTier: "Legendary", stars: 0, index: 14, attackDefense: 56.78, squadCapacity: 0, cost: { designPlans: 40, hardenedAlloy: 22000, lunarAmber: 0, polishingSolution: 220 } },
  { id: "gold_1", label: "Legendary 1-Star", tier: "Legendary", baseTier: "Legendary", stars: 1, index: 15, attackDefense: 59.33, squadCapacity: 0, cost: { designPlans: 40, hardenedAlloy: 23000, lunarAmber: 0, polishingSolution: 230 } },
  { id: "gold_2", label: "Legendary 2-Star", tier: "Legendary", baseTier: "Legendary", stars: 2, index: 16, attackDefense: 61.88, squadCapacity: 0, cost: { designPlans: 45, hardenedAlloy: 25000, lunarAmber: 0, polishingSolution: 250 } },
  { id: "gold_3", label: "Legendary 3-Star", tier: "Legendary", baseTier: "Legendary", stars: 3, index: 17, attackDefense: 64.43, squadCapacity: 0, cost: { designPlans: 45, hardenedAlloy: 26000, lunarAmber: 0, polishingSolution: 260 } },
  { id: "gold_t1_0", label: "Legendary T1", tier: "Legendary T1", baseTier: "Legendary", stars: 0, index: 18, attackDefense: 66.98, squadCapacity: 0, cost: { designPlans: 45, hardenedAlloy: 28000, lunarAmber: 0, polishingSolution: 280 } },
  { id: "gold_t1_1", label: "Legendary T1 1-Star", tier: "Legendary T1", baseTier: "Legendary", stars: 1, index: 19, attackDefense: 69.53, squadCapacity: 0, cost: { designPlans: 55, hardenedAlloy: 30000, lunarAmber: 0, polishingSolution: 300 } },
  { id: "gold_t1_2", label: "Legendary T1 2-Star", tier: "Legendary T1", baseTier: "Legendary", stars: 2, index: 20, attackDefense: 72.08, squadCapacity: 0, cost: { designPlans: 55, hardenedAlloy: 32000, lunarAmber: 0, polishingSolution: 320 } },
  { id: "gold_t1_3", label: "Legendary T1 3-Star", tier: "Legendary T1", baseTier: "Legendary", stars: 3, index: 21, attackDefense: 74.63, squadCapacity: 0, cost: { designPlans: 55, hardenedAlloy: 35000, lunarAmber: 0, polishingSolution: 340 } },
  { id: "gold_t2_0", label: "Legendary T2", tier: "Legendary T2", baseTier: "Legendary", stars: 0, index: 22, attackDefense: 77.18, squadCapacity: 0, cost: { designPlans: 55, hardenedAlloy: 38000, lunarAmber: 0, polishingSolution: 360 } },
  { id: "gold_t2_1", label: "Legendary T2 1-Star", tier: "Legendary T2", baseTier: "Legendary", stars: 1, index: 23, attackDefense: 79.73, squadCapacity: 0, cost: { designPlans: 75, hardenedAlloy: 43000, lunarAmber: 0, polishingSolution: 430 } },
  { id: "gold_t2_2", label: "Legendary T2 2-Star", tier: "Legendary T2", baseTier: "Legendary", stars: 2, index: 24, attackDefense: 82.28, squadCapacity: 0, cost: { designPlans: 80, hardenedAlloy: 45000, lunarAmber: 0, polishingSolution: 460 } },
  { id: "gold_t2_3", label: "Legendary T2 3-Star", tier: "Legendary T2", baseTier: "Legendary", stars: 3, index: 25, attackDefense: 85, squadCapacity: 0, cost: { designPlans: 85, hardenedAlloy: 48000, lunarAmber: 0, polishingSolution: 500 } },
  { id: "red_0", label: "Mythic", tier: "Mythic", baseTier: "Mythic", stars: 0, index: 26, attackDefense: 89.25, squadCapacity: 30, cost: { designPlans: 85, hardenedAlloy: 50000, lunarAmber: 10, polishingSolution: 530 } },
  { id: "red_1", label: "Mythic 1-Star", tier: "Mythic", baseTier: "Mythic", stars: 1, index: 27, attackDefense: 93.5, squadCapacity: 80, cost: { designPlans: 90, hardenedAlloy: 52000, lunarAmber: 10, polishingSolution: 560 } },
  { id: "red_2", label: "Mythic 2-Star", tier: "Mythic", baseTier: "Mythic", stars: 2, index: 28, attackDefense: 97.75, squadCapacity: 120, cost: { designPlans: 95, hardenedAlloy: 54000, lunarAmber: 10, polishingSolution: 590 } },
  { id: "red_3", label: "Mythic 3-Star", tier: "Mythic", baseTier: "Mythic", stars: 3, index: 29, attackDefense: 102, squadCapacity: 160, cost: { designPlans: 100, hardenedAlloy: 56000, lunarAmber: 10, polishingSolution: 620 } },
  { id: "red_t1_0", label: "Mythic T1", tier: "Mythic T1", baseTier: "Mythic", stars: 0, index: 30, attackDefense: 106.25, squadCapacity: 290, cost: { designPlans: 110, hardenedAlloy: 59000, lunarAmber: 15, polishingSolution: 670 } },
  { id: "red_t1_1", label: "Mythic T1 1-Star", tier: "Mythic T1", baseTier: "Mythic", stars: 1, index: 31, attackDefense: 110.5, squadCapacity: 330, cost: { designPlans: 115, hardenedAlloy: 61000, lunarAmber: 15, polishingSolution: 700 } },
  { id: "red_t1_2", label: "Mythic T1 2-Star", tier: "Mythic T1", baseTier: "Mythic", stars: 2, index: 32, attackDefense: 114.75, squadCapacity: 370, cost: { designPlans: 120, hardenedAlloy: 63000, lunarAmber: 15, polishingSolution: 730 } },
  { id: "red_t1_3", label: "Mythic T1 3-Star", tier: "Mythic T1", baseTier: "Mythic", stars: 3, index: 33, attackDefense: 119, squadCapacity: 410, cost: { designPlans: 125, hardenedAlloy: 65000, lunarAmber: 15, polishingSolution: 760 } },
  { id: "red_t2_0", label: "Mythic T2", tier: "Mythic T2", baseTier: "Mythic", stars: 0, index: 34, attackDefense: 123.25, squadCapacity: 540, cost: { designPlans: 135, hardenedAlloy: 68000, lunarAmber: 20, polishingSolution: 810 } },
  { id: "red_t2_1", label: "Mythic T2 1-Star", tier: "Mythic T2", baseTier: "Mythic", stars: 1, index: 35, attackDefense: 127.5, squadCapacity: 580, cost: { designPlans: 140, hardenedAlloy: 70000, lunarAmber: 20, polishingSolution: 840 } },
  { id: "red_t2_2", label: "Mythic T2 2-Star", tier: "Mythic T2", baseTier: "Mythic", stars: 2, index: 36, attackDefense: 131.75, squadCapacity: 620, cost: { designPlans: 145, hardenedAlloy: 72000, lunarAmber: 20, polishingSolution: 870 } },
  { id: "red_t2_3", label: "Mythic T2 3-Star", tier: "Mythic T2", baseTier: "Mythic", stars: 3, index: 37, attackDefense: 136, squadCapacity: 660, cost: { designPlans: 150, hardenedAlloy: 74000, lunarAmber: 20, polishingSolution: 900 } },
  { id: "red_t3_0", label: "Mythic T3", tier: "Mythic T3", baseTier: "Mythic", stars: 0, index: 38, attackDefense: 140.25, squadCapacity: 790, cost: { designPlans: 160, hardenedAlloy: 77000, lunarAmber: 25, polishingSolution: 950 } },
  { id: "red_t3_1", label: "Mythic T3 1-Star", tier: "Mythic T3", baseTier: "Mythic", stars: 1, index: 39, attackDefense: 144.5, squadCapacity: 830, cost: { designPlans: 165, hardenedAlloy: 80000, lunarAmber: 25, polishingSolution: 990 } },
  { id: "red_t3_2", label: "Mythic T3 2-Star", tier: "Mythic T3", baseTier: "Mythic", stars: 2, index: 40, attackDefense: 148.75, squadCapacity: 870, cost: { designPlans: 170, hardenedAlloy: 83000, lunarAmber: 25, polishingSolution: 1030 } },
  { id: "red_t3_3", label: "Mythic T3 3-Star", tier: "Mythic T3", baseTier: "Mythic", stars: 3, index: 41, attackDefense: 153, squadCapacity: 910, cost: { designPlans: 180, hardenedAlloy: 86000, lunarAmber: 25, polishingSolution: 1070 } },
  { id: "red_t4_0", label: "Mythic T4", tier: "Mythic T4", baseTier: "Mythic", stars: 0, index: 42, attackDefense: 161.5, squadCapacity: 1050, cost: { designPlans: 250, hardenedAlloy: 120000, lunarAmber: 40, polishingSolution: 1500 } },
  { id: "red_t4_1", label: "Mythic T4 1-Star", tier: "Mythic T4", baseTier: "Mythic", stars: 1, index: 43, attackDefense: 170, squadCapacity: 1100, cost: { designPlans: 275, hardenedAlloy: 140000, lunarAmber: 40, polishingSolution: 1650 } },
  { id: "red_t4_2", label: "Mythic T4 2-Star", tier: "Mythic T4", baseTier: "Mythic", stars: 2, index: 44, attackDefense: 178.5, squadCapacity: 1150, cost: { designPlans: 300, hardenedAlloy: 160000, lunarAmber: 40, polishingSolution: 1800 } },
  { id: "red_t4_3", label: "Mythic T4 3-Star", tier: "Mythic T4", baseTier: "Mythic", stars: 3, index: 45, attackDefense: 187, squadCapacity: 1200, cost: { designPlans: 325, hardenedAlloy: 180000, lunarAmber: 40, polishingSolution: 1950 } },
];

const chiefGearLevelMap = new Map(chiefGearLevels.map((level) => [level.id, level]));
const chiefGearTierOrder = ["Uncommon", "Rare", "Epic", "Legendary", "Mythic"] as const;

const chiefGearColorForLevel = (level?: ChiefGearLevel) => {
  if (!level) {
    return "green";
  }

  if (level.id.startsWith("red_t4")) {
    return "t4-legendary";
  }

  if (level.id.startsWith("red")) {
    return "red";
  }

  if (level.id.startsWith("gold")) {
    return "gold";
  }

  if (level.id.startsWith("purple")) {
    return "purple";
  }

  if (level.id.startsWith("blue")) {
    return "blue";
  }

  return "green";
};

const chiefGearImageFor = (piece: ChiefGearPiece, level?: ChiefGearLevel) => `/woscalc/gear/${piece.asset}-${chiefGearColorForLevel(level)}.png`;
const chiefCharmImageFor = (troop: ChiefCharmGearPiece["charmImageTroop"], level: number) => `/woscalc/charms/${troop}_${Math.max(1, level)}.png`;
const chiefGearMaterialIcons = {
  hardenedAlloy: "/woscalc/materials/Hardened-Alloy.png",
  polishingSolution: "/woscalc/materials/Polishing-Solution.png",
  designPlans: "/woscalc/materials/Design-Plan.png",
  lunarAmber: "/woscalc/materials/lunar-amber.png",
};
const chiefCharmMaterialIcons = {
  design: "/woscalc/materials/charm-design.png",
  guide: "/woscalc/materials/charm-guide.png",
  secret: "/woscalc/materials/jewel-secret.png",
};
const createChiefGearState = (from = "", to = "gold_t2_3"): ChiefGearState =>
  chiefGearPieces.reduce<ChiefGearState>((state, gear) => {
    state[gear.id] = { from, to };
    return state;
  }, {});

const addChiefGearCost = (left: ChiefGearCost, right: ChiefGearCost): ChiefGearCost => ({
  designPlans: left.designPlans + right.designPlans,
  hardenedAlloy: left.hardenedAlloy + right.hardenedAlloy,
  lunarAmber: left.lunarAmber + right.lunarAmber,
  polishingSolution: left.polishingSolution + right.polishingSolution,
});

const calculateChiefGearCost = (fromId: string, toId: string) => {
  const fromIndex = fromId ? chiefGearLevelMap.get(fromId)?.index ?? -1 : -1;
  const toLevel = chiefGearLevelMap.get(toId);
  if (!toLevel || fromIndex >= toLevel.index) {
    return { steps: [] as ChiefGearLevel[], total: emptyChiefGearCost };
  }

  const steps = chiefGearLevels.filter((level) => level.index > fromIndex && level.index <= toLevel.index);
  return {
    steps,
    total: steps.reduce((sum, level) => addChiefGearCost(sum, level.cost), emptyChiefGearCost),
  };
};

const formatNumber = (value: number) => new Intl.NumberFormat("en-US").format(Math.round(value));

const formatPercent = (value: number) => `${value.toFixed(value % 1 === 0 ? 0 : 1)}%`;

const createFoundryMember = (role: FoundryMemberRole, seed: string): FoundryMember => ({
  id: `${role}-${seed}`,
  role,
  playerId: "",
  status: "",
  loading: false,
});

const createFoundryTeam = (index: number): FoundryTeam => ({
  id: `team-${index + 1}`,
  name: `Team ${index + 1}`,
  buildingId: foundryBuildings.filter((building) => building.phase !== "Spawn")[index % (foundryBuildings.length - 2)].id,
  rallyLeader: createFoundryMember("leader", `${index + 1}`),
  joiners: Array.from({ length: 4 }, (_, joinerIndex) => createFoundryMember("joiner", `${index + 1}-${joinerIndex + 1}`)),
});

const createFoundryTeams = (count: number) => Array.from({ length: count }, (_, index) => createFoundryTeam(index));

const createFoundryLooterTeam = (): FoundryTeam => ({
  id: "looter-team",
  name: "Looter Team",
  buildingId: "arsenal-supplies",
  rallyLeader: createFoundryMember("leader", "looter"),
  joiners: Array.from({ length: 4 }, (_, joinerIndex) => createFoundryMember("joiner", `looter-${joinerIndex + 1}`)),
});

const normalizeFoundryPlayerProfile = (
  player: PlayerProfile & {
    avatar?: string;
    avatar_url?: string;
    avatarUrl?: string;
    avatar_image?: string;
    avatar_image_url?: string;
    image?: string;
    picture?: string;
    profileImage?: string;
  },
): PlayerProfile => ({
  ...player,
  playerId: player.playerId || String((player as { fid?: string | number; id?: string | number }).fid || (player as { id?: string | number }).id || ""),
  nickname: player.nickname || (player as { name?: string }).name || "Unknown Player",
  stateId: player.stateId || String((player as { state_id?: string | number; kid?: string | number }).state_id || (player as { kid?: string | number }).kid || ""),
  furnaceLevel: player.furnaceLevel ?? (player as { furnace_lv?: number; furnace?: number }).furnace_lv ?? (player as { furnace?: number }).furnace,
  avatarImage: normalizeWosAvatarUrl(
    player.avatarImage ||
    player.avatarUrl ||
    player.avatar_url ||
    player.avatar ||
    player.avatar_image ||
    player.avatar_image_url ||
    player.profileImage ||
    player.picture ||
    player.image,
  ),
});

const foundryPlayerPayload = (data: unknown): PlayerProfile | undefined => {
  const payload = data as {
    player?: PlayerProfile;
    data?: PlayerProfile | { player?: PlayerProfile };
    profile?: PlayerProfile;
  } | null;
  if (!payload) {
    return undefined;
  }
  if (payload.player) {
    return payload.player;
  }
  if (payload.profile) {
    return payload.profile;
  }
  if (payload.data && typeof payload.data === "object" && "player" in payload.data && payload.data.player) {
    return payload.data.player;
  }
  if (payload.data && typeof payload.data === "object") {
    return payload.data as PlayerProfile;
  }
  return undefined;
};

const utcInputDate = (date = new Date()) => date.toISOString().slice(0, 10);
const utcInputDateTime = (date = new Date()) => date.toISOString().slice(0, 16);

const formatFoundryUtcTime = (value: string) => {
  if (!value) {
    return "UTC time not set";
  }
  if (!value.includes("T")) {
    return `${value} UTC`;
  }
  const parsed = new Date(`${value}:00Z`);
  if (Number.isNaN(parsed.getTime())) {
    return `${value} UTC`;
  }
  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  }).format(parsed) + " UTC";
};

const formatFoundrySavedAt = (value: string) => {
  if (!value) {
    return "";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }
  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "short",
    timeZone: "UTC",
  }).format(parsed) + " UTC";
};

const encodeFoundryShareState = (state: FoundryShareState) =>
  btoa(unescape(encodeURIComponent(JSON.stringify(state))))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

const decodeFoundryShareState = (value: string): FoundryShareState => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = `${normalized}${"=".repeat((4 - (normalized.length % 4)) % 4)}`;
  try {
    return JSON.parse(decodeURIComponent(escape(atob(padded)))) as FoundryShareState;
  } catch {
    return JSON.parse(decodeURIComponent(atob(value))) as FoundryShareState;
  }
};

type FoundryShareMember = Pick<FoundryMember, "playerId"> & {
  profile?: PlayerProfile;
};
type FoundryShareTeam = {
  buildingId: string;
  joiners: FoundryShareMember[];
  name: string;
  rallyLeader: FoundryShareMember;
};
type FoundryShareState = {
  includeLooter: boolean;
  legion: "1" | "2";
  looterTeam: FoundryShareTeam;
  teamCount: number;
  teams: FoundryShareTeam[];
  utcTime: string;
};

type FoundrySavedState = FoundryShareState & {
  savedAt: string;
};

const messageTemplateCategories: { label: string; value: MessageTemplateCategory }[] = [
  { label: "All", value: "all" },
  { label: "Unicodes", value: "unicodes" },
  { label: "Emojis", value: "emojis" },
  { label: "Funny", value: "funny" },
  { label: "Alliance Recruit", value: "alliance-recruit" },
];

const wosIconUnicodeTemplates: MessageTemplate[] = [
  ["item_icon_101", "One Gem", "\uE001", "💎"],
  ["item_icon_102", "Meat", "\uE002", "🥩"],
  ["item_icon_103", "Wood", "\uE003", "🪵"],
  ["item_icon_104", "Coal", "\uE004", "◼"],
  ["item_icon_105", "Iron", "\uE005", "▣"],
  ["item_icon_106", "Steel", "\uE006", "🔩"],
  ["item_icon_107", "XP", "\uE007", "⭐"],
  ["item_icon_109", "Wheel Coin", "\uE009", "🪙"],
  ["item_icon_100081", "Fire Crystal", "\uE010", "🔥"],
  ["item_icon_620116", "Thorn of Enigma", "\uE011", "✦"],
  ["item_icon_100004", "Bag of Gems", "\uE012", "💰"],
  ["item_icon_200201", "Building Speedup", "\uE013", "🏗️"],
  ["item_icon_200301", "Troop Speedup", "\uE014", "⚔️"],
  ["item_icon_200401", "Research Speedup", "\uE015", "🔬"],
  ["item_icon_500240", "Essence Stone", "\uE016", "🔷"],
  ["item_icon_200101", "Speedup", "\uE017", "⏩"],
  ["item_icon_620127", "Adventure Coin", "\uE018", "🎟️"],
  ["item_icon_500220", "SSR Shard", "\uE019", "🧩"],
  ["item_icon_620129", "Vase", "\uE020", "🏺"],
  ["item_icon_620163", "Other Meat", "\uE021", "🍖"],
  ["item_icon_620189", "Sandwich", "\uE022", "🥪"],
  ["resource_icon_744", "Blue Completed", "\uE024", "🔵"],
  ["resource_icon_745", "Red Completed", "\uE025", "🔴"],
  ["resource_icon_743", "Red Flag", "\uE026", "🚩"],
  ["resource_icon_742", "Blue Flag", "\uE027", "🏳️"],
  ["item_icon_620197", "Car Keys", "\uE029", "🔑"],
  ["item_icon_620203", "Small Bouquet", "\uE030", "💐"],
  ["item_icon_620204", "Medium Bouquet", "\uE031", "🌸"],
  ["item_icon_620205", "Large Bouquet", "\uE032", "🌺"],
  ["item_icon_620206", "Clover", "\uE033", "🍀"],
  ["item_icon_620208", "Coin", "\uE034", "🪙"],
  ["item_icon_620210", "ChocoGift", "\uE035", "🍫"],
  ["accumulative_icon_001", "Top Up Coin", "\uE037", "👑"],
  ["item_icon_620240", "Bread Loaf", "\uE039", "🍞"],
  ["item_icon_620261", "Recycle Token", "\uE040", "♻️"],
].map(([code, title, glyph, visual]) => ({
  id: `wos-icon-${code.replace(/_/g, "-")}`,
  title,
  category: "unicodes",
  description: `<${code}>`,
  builtin: true,
  creatorName: "WhiteoutSurvival.dev",
  likes: 0,
  shares: 0,
  tags: ["Unicode", "Emoji"],
  text: glyph,
  previewText: glyph,
  iconCode: `<${code}>`,
  iconGlyph: glyph,
  iconVisual: visual,
}));

const messageTemplates: MessageTemplate[] = [
  {
    id: "svs-prep-guide",
    title: "SVS Prep Guide",
    category: "emojis",
    description: "Compact SVS prep checklist for alliance chat.",
    builtin: true,
    creatorName: "WhiteoutSurvival.dev",
    likes: 0,
    shares: 0,
    tags: ["SVS", "Prep", "Checklist"],
    text: `👑 - SVS Prep Guide 🔎
 １   ２　３    ４    ５                   ✅｜🆗｜🚫｜🚫｜🆗｜FC 
🆗｜✅｜🚫｜🚫｜🆗｜FC Shards 🚫｜✅｜🆗｜🚫｜🚫｜Hero Shard ✅｜🆗｜🚫｜🚫｜🆗｜Construct       🚫｜🚫｜🚫｜✅｜🆗｜Troops 🆗｜✅｜🚫｜🚫｜🆗｜Research 🚫｜✅｜🆗｜🚫｜🚫｜Wheel💎 🚫｜✅｜🚫｜🚫｜🚫｜Gathering 🆗｜✅｜🚫｜🚫｜🆗｜Learn 🚫｜✅｜🆗｜🚫｜🚫｜Expert Sigils 🚫｜✅｜🆗｜🚫｜🚫｜📚 Knowledge 🚫｜🚫｜✅｜🚫｜🚫｜Beasts🐗 🚫｜🚫｜🆗｜🚫｜✅｜Pets🐒                 🆗｜🚫｜🆗｜✅｜🚫｜Chief Charm 🚫｜🚫｜🚫｜🚫｜✅｜Chief Gear 🚫｜🚫｜🚫｜🆗｜✅｜Widgets 🚫｜🚫｜🚫｜🆗｜✅｜Mithril🔮 🚫｜🚫｜🚫｜🆗｜✅｜Stones`,
    previewText: `👑 - SVS Prep Guide 🔎
  1    2    3    4    5
✅ | 🆗 | 🚫 | 🚫 | 🆗 | FC 🧪
🆗 | ✅ | 🚫 | 🚫 | 🆗 | FC Shards
🚫 | ✅ | 🆗 | 🚫 | 🚫 | Hero Shard🧩
✅ | 🆗 | 🚫 | 🚫 | 🆗 | Construct🛠️
🚫 | 🚫 | 🚫 | ✅ | 🆗 | Troops⚔️
🆗 | ✅ | 🚫 | 🚫 | 🆗 | Research🔬
🚫 | ✅ | 🆗 | 🚫 | 🚫 | Wheel💎
🚫 | ✅ | 🚫 | 🚫 | 🚫 | Gathering
🆗 | ✅ | 🚫 | 🚫 | 🆗 | Learn📖
🚫 | ✅ | 🆗 | 🚫 | 🚫 | Expert Sigils
🚫 | ✅ | 🆗 | 🚫 | 🚫 | 📚 Knowledge
🚫 | 🚫 | ✅ | 🚫 | 🚫 | Beasts🐗
🚫 | 🚫 | 🆗 | 🚫 | ✅ | Pets🐒
🆗 | 🚫 | 🆗 | ✅ | 🚫 | Chief Charm
🚫 | 🚫 | 🚫 | 🚫 | ✅ | Chief Gear
🚫 | 🚫 | 🚫 | 🆗 | ✅ | Widgets
🚫 | 🚫 | 🚫 | 🆗 | ✅ | Mithril🔮
🚫 | 🚫 | 🚫 | 🆗 | ✅ | Stones🧪`,
  },
  {
    id: "alliance-recruit-clean",
    title: "Alliance Recruit",
    category: "alliance-recruit",
    description: "Short recruitment message with clear requirements.",
    builtin: true,
    creatorName: "WhiteoutSurvival.dev",
    likes: 0,
    shares: 0,
    tags: ["Recruit", "Alliance", "Members"],
    text: `🔥 Join our alliance 🔥
Active players wanted.
Daily bear, forts, CJ and SVS.
Help each other grow fast.

Requirements:
✅ Be active
✅ Join events
✅ Respect the team

Message R4/R5 to apply.`,
  },
  {
    id: "unicode-border-announcement",
    title: "Unicode Notice",
    category: "unicodes",
    description: "Clean framed notice for rules and announcements.",
    builtin: true,
    creatorName: "WhiteoutSurvival.dev",
    likes: 0,
    shares: 0,
    tags: ["Unicode", "Notice", "Rules"],
    text: `╔══════════════════════╗
   Alliance Notice
╚══════════════════════╝

➤ Event:
➤ Time:
➤ Target:
➤ Notes:

Please be online 10 minutes early.`,
  },
  {
    id: "rally-ready",
    title: "Rally Ready",
    category: "emojis",
    description: "Fast rally coordination reminder.",
    builtin: true,
    creatorName: "WhiteoutSurvival.dev",
    likes: 0,
    shares: 0,
    tags: ["Rally", "War", "Prep"],
    text: `⚔️ RALLY READY ⚔️
Set formation before joining.
Use strongest heroes only.
Do not fill wrong troop type.

✅ Infantry front
✅ Marksman / Lancer ready
✅ Buffs active
✅ Speedups ready`,
  },
  {
    id: "bear-trap-ping",
    title: "Bear Trap Ping",
    category: "funny",
    description: "Friendly event ping for sleepy alliance members.",
    builtin: true,
    creatorName: "WhiteoutSurvival.dev",
    likes: 0,
    shares: 0,
    tags: ["Bear", "Funny", "Ping"],
    text: `🐻 Bear Trap alarm!
Wake up, grab coffee, send troops.
If you miss it, the bear wins.

Start:
Rally leads:
No solo marches please 😄`,
  },
  {
    id: "nap-reminder",
    title: "NAP Reminder",
    category: "unicodes",
    description: "Simple diplomacy reminder for alliance chat.",
    builtin: true,
    creatorName: "WhiteoutSurvival.dev",
    likes: 0,
    shares: 0,
    tags: ["NAP", "Rules", "Diplomacy"],
    text: `──── NAP Reminder ────
Do not attack allied NAP tags.
Scout before hitting cities.
Ask R4 if unsure.

Breaking NAP can cause war.
Keep farming clean.`,
  },
  ...wosIconUnicodeTemplates,
];

const wosPreviewIconMap: Record<string, string> = {
  "\uE013": "🛠️",
  "\uE014": "⚔️",
  "\uE015": "🔬",
  "\uE016": "🧪",
  "\uE017": "📖",
  "\uE019": "🧩",
};

const templatePreviewChar = (char: string) => wosPreviewIconMap[char] || char;

const templatePreviewWidth = (char: string) => {
  if (/[\uFE00-\uFE0F]/u.test(char)) {
    return 0;
  }
  if (/\s/u.test(char)) {
    return 1;
  }
  if (/[\u{1F000}-\u{1FAFF}]/u.test(char)) {
    return 2;
  }
  return 1;
};

const templatePreviewLines = (text: string, maxWidth = 28) => {
  const lines: string[] = [];
  text.split("\n").forEach((sourceLine) => {
    let current = "";
    let width = 0;
    Array.from(sourceLine).forEach((sourceChar) => {
      const char = templatePreviewChar(sourceChar);
      const charWidth = Math.max(1, templatePreviewWidth(char));
      if (width > 0 && width + charWidth > maxWidth) {
        lines.push(current.trimEnd() || " ");
        current = "";
        width = 0;
      }
      current += char;
      width += charWidth;
    });
    lines.push(current || " ");
  });
  return lines;
};

const FOOTER_IDLE_DELAY_MS = 5 * 60 * 1000;
const FOOTER_INTENT_DELAY_MS = 450;
const FOOTER_HIDE_DELAY_MS = 900;
const SITE_TOAST_DISMISS_MS = 4000;
const DISCORD_COMMUNITY_URL = "https://discord.gg/bP5JQFH2M5";

const menuItems: { label: string; icon: string; status: string; menu?: ActiveMenu }[] = [
  { label: "Browse", icon: "grid", status: "Soon" },
  { label: "Tools", icon: "wrench", status: "Soon" },
  { label: "Database", icon: "database", status: "Soon" },
  { label: "More", icon: "book", status: "Soon" },
];

const calculatorMenuItems: { label: string; icon: string; menu: "chiefGear" | "chiefCharm"; href: string }[] = [
  { label: "Chief Gear", icon: "shield", menu: "chiefGear", href: "/chief-gear-calculator" },
  { label: "Chief Charm", icon: "calculator", menu: "chiefCharm", href: "/chief-charm-calculator" },
];

const wosWikiMenuItems: { label: string; icon: string; menu?: ActiveMenu; href?: string; status?: string; disabled?: boolean }[] = [
  { label: "Heroes", icon: "user", menu: "wikiHeroes", href: "/wiki/heroes" },
  { label: "Buildings", icon: "database", menu: "wikiBuildings", href: "/wiki/buildings" },
  { label: "Research", icon: "book", status: "Next", disabled: true },
  { label: "Events", icon: "star", status: "Next", disabled: true },
  { label: "Items", icon: "gift", status: "Next", disabled: true },
];

const scrapedWosHeroes = wikiHeroesData as unknown as WosWikiHero[];
const scrapedWosBuildings = wikiBuildingsData as unknown as WosWikiBuilding[];

const legendaryHeroSeasons: Record<string, WosHeroFilter> = {
  Natalia: "S1",
  Jeronimo: "S1",
  Molly: "S1",
  Zinman: "S1",
  Flint: "S2",
  Philly: "S2",
  Alonso: "S2",
  Logan: "S3",
  Mia: "S3",
  Greg: "S3",
  Ahmose: "S4",
  Reina: "S4",
  Lynn: "S4",
  Hector: "S5",
  Norah: "S5",
  Gwen: "S5",
  "Wu Ming": "S6",
  Renee: "S6",
  Wayne: "S6",
  Edith: "S7",
  Gordon: "S7",
  Bradley: "S7",
  Gatot: "S8",
  Sonya: "S8",
  Hendrik: "S8",
  Magnus: "S9",
  Fred: "S9",
  Xura: "S9",
  Gregory: "S10",
  Freya: "S10",
  Blanchette: "S10",
  Eleonora: "S11",
  Lloyd: "S11",
  Rufus: "S11",
  Hervor: "S12",
  Karol: "S12",
  Ligeia: "S12",
  Gisela: "S13",
  Flora: "S13",
  Vulcanus: "S13",
  Elif: "S14",
  Dominic: "S14",
  Cara: "S14",
  Hank: "S15",
  Estrella: "S15",
  Viveca: "S15",
  Seigel: "S15",
  Ursar: "S15",
  Aisling: "S15",
};

const heroFilterOrder: WosHeroFilter[] = ["Rare", "Epic", "S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8", "S9", "S10", "S11", "S12", "S13", "S14", "S15"];
const buildingFilters: { label: string; value: WosBuildingFilter }[] = [
  { label: "Military Buildings", value: "Military" },
  { label: "Inner City", value: "Inner City" },
  { label: "Others", value: "Other" },
  { label: "Fire Crystal Buildings", value: "Fire Crystal" },
];

const heroFilterFor = (hero: WosWikiHero): WosHeroFilter =>
  hero.rarity === "Rare" || hero.rarity === "Epic" ? hero.rarity : legendaryHeroSeasons[hero.name] || "S1";

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
    { label: "Discord Bot", mobileLabel: "Bot", icon: "bot", menu: "bot", href: "/discord-bot", mobilePrimary: true },
    { label: "State Age Tracker", mobileLabel: "Age", icon: "calendar", menu: "stateAge", href: "/state-age", mobilePrimary: true },
    { label: "Foundry Team Planner", mobileLabel: "Foundry", icon: "grid", menu: "planner", href: "/foundry-team-planner", beta: true },
    { label: "Message Templates", mobileLabel: "Texts", icon: "message", menu: "templates", href: "/message-templates" },
    { label: "Sneak Peek", mobileLabel: "Sneak", icon: "book", menu: "sneak", href: "/sneak-peek" },
    { label: "Daybreak Island", mobileLabel: "Island", icon: "island", menu: "daybreak", href: "/daybreak-island" },
    { label: "Dreamscape Memory", mobileLabel: "Dream", icon: "image", menu: "dreamscape", href: "/dreamscape-memory", beta: true },
  ];

const sidebarWikiItems: { label: string; mobileLabel: string; icon: string; menu: "wikiBuildings" | "wikiHeroes"; href: string }[] = [
  { label: "Buildings", mobileLabel: "Build", icon: "database", menu: "wikiBuildings", href: "/wiki/buildings" },
  { label: "Heroes", mobileLabel: "Heroes", icon: "user", menu: "wikiHeroes", href: "/wiki/heroes" },
];

const sidebarCalculatorItems: { label: string; mobileLabel: string; icon: string; menu: "chiefGear" | "chiefCharm"; href: string }[] = [
  { label: "Chief Gear", mobileLabel: "Gear", icon: "shield", menu: "chiefGear", href: "/chief-gear-calculator" },
  { label: "Chief Charm", mobileLabel: "Charm", icon: "calculator", menu: "chiefCharm", href: "/chief-charm-calculator" },
];

const hashMenuAliases: Record<string, ActiveMenu> = {
  "#home": "home",
  "#gift-codes": "gift",
  "#giftcodes": "gift",
  "#gift": "gift",
  "#redeem": "redeem",
  "#gift-code-redeem": "redeem",
  "#state-age": "stateAge",
  "#state-age-tracker": "stateAge",
  "#state-timeline": "stateAge",
  "#chief-charm-calculator": "chiefCharm",
  "#chief-charms": "chiefCharm",
  "#charm-calculator": "chiefCharm",
  "#chief-gear-calculator": "chiefGear",
  "#chief-gear": "chiefGear",
  "#gear-calculator": "chiefGear",
  "#foundry-team-planner": "planner",
  "#foundry-planner": "planner",
  "#city-layout-planner": "planner",
  "#layout-planner": "planner",
  "#planner": "planner",
  "#message-templates": "templates",
  "#templates": "templates",
  "#sneak-peek": "sneak",
  "#sneak": "sneak",
  "#chief-concierge": "sneak",
  "#daybreak": "daybreak",
  "#dreamscape": "dreamscape",
  "#dreamscape-memory": "dreamscape",
  "#showcase": "daybreak",
  "#upload": "daybreak",
  "#discord-bot": "bot",
  "#bot": "bot",
  "#wiki": "wikiHeroes",
  "#wiki-heroes": "wikiHeroes",
  "#wiki-buildings": "wikiBuildings",
};

const queryMenuAliases: Record<string, ActiveMenu> = {
  home: "home",
  "gift-codes": "gift",
  giftcodes: "gift",
  gift: "gift",
  redeem: "redeem",
  "state-age": "stateAge",
  stateage: "stateAge",
  timeline: "stateAge",
  "chief-charm-calculator": "chiefCharm",
  "chief-charms": "chiefCharm",
  charms: "chiefCharm",
  "chief-gear-calculator": "chiefGear",
  "chief-gear": "chiefGear",
  gear: "chiefGear",
  planner: "planner",
  templates: "templates",
  "message-templates": "templates",
  sneak: "sneak",
  daybreak: "daybreak",
  dreamscape: "dreamscape",
  "dreamscape-memory": "dreamscape",
  bot: "bot",
  wiki: "wikiHeroes",
  heroes: "wikiHeroes",
  buildings: "wikiBuildings",
};

const menuUrls: Record<ActiveMenu, string> = {
  home: "/",
  gift: "/gift-codes",
  redeem: "/redeem",
  stateAge: "/state-age",
  chiefCharm: "/chief-charm-calculator",
  chiefGear: "/chief-gear-calculator",
  planner: "/foundry-team-planner",
  templates: "/message-templates",
  sneak: "/sneak-peek",
  daybreak: "/daybreak-island",
  dreamscape: "/dreamscape-memory",
  bot: "/discord-bot",
  wikiHeroes: "/wiki/heroes",
  wikiBuildings: "/wiki/buildings",
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
  if (params.get("foundry")) {
    return "planner";
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

  if (location.pathname.startsWith("/state-age")) {
    return "stateAge";
  }

  if (location.pathname.startsWith("/chief-charm-calculator") || location.pathname.startsWith("/chief-charms")) {
    return "chiefCharm";
  }

  if (location.pathname.startsWith("/chief-gear-calculator") || location.pathname.startsWith("/chief-gear")) {
    return "chiefGear";
  }

  if (location.pathname.startsWith("/message-templates")) {
    return "templates";
  }

  if (location.pathname.startsWith("/foundry-team-planner")) {
    return "planner";
  }

  if (location.pathname.startsWith("/sneak-peek")) {
    return "sneak";
  }

  if (location.pathname.startsWith("/daybreak-island")) {
    return "daybreak";
  }

  if (location.pathname.startsWith("/dreamscape-memory")) {
    return "dreamscape";
  }

  if (location.pathname.startsWith("/discord-bot")) {
    return "bot";
  }

  if (location.pathname.startsWith("/wiki/buildings")) {
    return "wikiBuildings";
  }

  if (location.pathname.startsWith("/wiki/heroes") || location.pathname.startsWith("/wiki")) {
    return "wikiHeroes";
  }

  return "home";
};

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

const stateTransferStartUtc = Date.UTC(2026, 5, 21, 0, 0, 0);
const stateTransferEndUtc = Date.UTC(2026, 5, 28, 0, 0, 0);
const stateTransferPhases = [
  { label: "Phase 1", dates: "June 21-23 UTC", body: "Presidents set caps and Chiefs review eligible destination states." },
  { label: "Phase 2", dates: "June 24-25 UTC", body: "Invites are reviewed and sent before transfers open wider." },
  { label: "Phase 3", dates: "June 26-27 UTC", body: "Eligible Chiefs can move while available state slots remain." },
];

const formatCountdownParts = (milliseconds: number) => {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds };
};

const formatDetailedCountdown = ({ days, hours, minutes, seconds }: ReturnType<typeof formatCountdownParts>) =>
  `${days}d ${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;

const countdownUnits = [
  ["d", "days"],
  ["h", "hours"],
  ["m", "minutes"],
  ["s", "seconds"],
] as const;

function SocialProviderLogo({ provider }: { provider: "google" | "discord" }) {
  if (provider === "google") {
    return (
      <svg className="provider-logo google-logo" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.223 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
        <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
        <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
        <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
      </svg>
    );
  }

  return (
    <svg className="provider-logo discord-logo" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="#5865F2" d="M20.317 4.369a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.211.375-.445.865-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.371-.291a.074.074 0 0 1 .077-.01c3.927 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.009c.12.099.245.198.372.292a.077.077 0 0 1-.007.128 12.299 12.299 0 0 1-1.873.891.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.332c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.419 0 1.334-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.419 0 1.334-.946 2.419-2.157 2.419z" />
    </svg>
  );
}

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
    refresh: (
      <>
        <path d="M21 12a9 9 0 0 1-15.4 6.4" />
        <path d="M3 12A9 9 0 0 1 18.4 5.6" />
        <path d="M18 2v4h-4" />
        <path d="M6 22v-4h4" />
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

function AccountAvatar({ src }: { src?: string }) {
  const [failedSrc, setFailedSrc] = useState("");

  if (!src || failedSrc === src) {
    return <Icon name="user" />;
  }

  return <img src={src} alt="" referrerPolicy="no-referrer" onError={() => setFailedSrc(src)} />;
}

function WosPlayerAvatar({ src, fallback = <Icon name="user" /> }: { src?: string; fallback?: ReactNode }) {
  const avatarSrc = proxiedWosAvatarUrl(src);
  const [failedSrc, setFailedSrc] = useState("");

  if (!avatarSrc || failedSrc === avatarSrc) {
    return fallback;
  }

  return <img src={avatarSrc} alt="" referrerPolicy="no-referrer" onError={() => setFailedSrc(avatarSrc)} />;
}

type ShareBrand = "whatsapp" | "discord" | "x" | "facebook" | "linkedin" | "telegram" | "email";

function BrandLogo({ brand }: { brand: ShareBrand }) {
  const logos: Record<ShareBrand, string> = {
    whatsapp: "https://cdn.simpleicons.org/whatsapp/white",
    discord: "https://cdn.simpleicons.org/discord/white",
    x: "https://cdn.simpleicons.org/x/white",
    facebook: "https://cdn.simpleicons.org/facebook/white",
    linkedin: "https://cdn.simpleicons.org/linkedin/white",
    telegram: "https://cdn.simpleicons.org/telegram/white",
    email: "https://cdn.simpleicons.org/gmail/white",
  };
  const logo = logos[brand];
  if (brand === "whatsapp") {
    return <span className="brand-logo whatsapp" aria-hidden="true"><img src={logo} alt="" /></span>;
  }
  if (brand === "discord") {
    return <span className="brand-logo discord" aria-hidden="true"><img src={logo} alt="" /></span>;
  }
  if (brand === "x") {
    return <span className="brand-logo x" aria-hidden="true"><img src={logo} alt="" /></span>;
  }
  if (brand === "facebook") {
    return <span className="brand-logo facebook" aria-hidden="true"><img src={logo} alt="" /></span>;
  }
  if (brand === "linkedin") {
    return <span className="brand-logo linkedin" aria-hidden="true"><img src={logo} alt="" /></span>;
  }
  if (brand === "telegram") {
    return <span className="brand-logo telegram" aria-hidden="true"><img src={logo} alt="" /></span>;
  }
  return <span className="brand-logo email" aria-hidden="true"><img src={logo} alt="" /></span>;
}

function StateTransferCountdown() {
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState<number | null>(null);
  const remainingToStart = now === null ? 0 : stateTransferStartUtc - now;
  const remainingToEnd = now === null ? 0 : stateTransferEndUtc - now;
  const isLive = now !== null && remainingToStart <= 0 && remainingToEnd > 0;
  const hasEnded = now !== null && remainingToEnd <= 0;
  const countdown = formatCountdownParts(isLive ? remainingToEnd : remainingToStart);
  const navStatus = hasEnded ? "June window closed" : isLive ? "Transfer live" : "Starts in";

  useEffect(() => {
    const updateNow = () => setNow(Date.now());
    updateNow();
    const interval = window.setInterval(updateNow, 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleOutside = (event: MouseEvent) => {
      if (!(event.target instanceof Element) || !event.target.closest(".state-transfer-widget")) {
        setOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("click", handleOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("click", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div className="state-transfer-widget">
      <button
        className={`state-transfer-button ${isLive ? "live" : ""}`}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <img src="/state-transfer.png" alt="" />
        <span className="state-transfer-copy">
          <span>State transfer</span>
          <strong className={hasEnded ? "ended" : ""} aria-label={hasEnded ? "Window ended" : formatDetailedCountdown(countdown)}>
            {hasEnded
              ? "Window ended"
              : countdownUnits.map(([suffix, key]) => {
                const value = now === null ? "--" : key === "days" ? String(countdown[key]) : String(countdown[key]).padStart(2, "0");

                return (
                  <span className="state-transfer-time-unit" key={suffix}>
                    <span>{value}</span>
                    <small>{suffix}</small>
                  </span>
                );
              })}
          </strong>
        </span>
        <small>{navStatus}</small>
      </button>

      {open && (
        <section className="state-transfer-popover" role="dialog" aria-label="State transfer event details">
          <div className="state-transfer-hero">
            <img src="/state-transfer.png" alt="State Transfer event artwork" />
            <div>
              <span className="section-kicker">Whiteout Survival</span>
              <h2>Next state transfer</h2>
              <p>Starts June 21, 2026 at 00:00 UTC and runs through June 27, 2026.</p>
            </div>
          </div>
          <div className="state-transfer-count-grid" aria-label="Countdown">
            {[
              ["Days", countdown.days],
              ["Hours", countdown.hours],
              ["Minutes", countdown.minutes],
              ["Seconds", countdown.seconds],
            ].map(([label, value]) => (
              <span key={label}>
                <strong>{now === null ? "--" : value}</strong>
                <small>{label}</small>
              </span>
            ))}
          </div>
          <div className="state-transfer-status">
            <Icon name="calendar" />
            <span>{hasEnded ? "This transfer window has ended." : isLive ? "Transfer window is live. Countdown shows time remaining." : "Countdown is locked to 00:00 UTC on June 21."}</span>
          </div>
          <div className="state-transfer-phase-list">
            {stateTransferPhases.map((phase) => (
              <article key={phase.label}>
                <strong>{phase.label}</strong>
                <span>{phase.dates}</span>
                <p>{phase.body}</p>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
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

export default function Home({ initialMenu = "home" }: { initialMenu?: ActiveMenu } = {}) {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("dark");
  const [layoutOpen, setLayoutOpen] = useState(false);
  const [feedbackBannerVisible, setFeedbackBannerVisible] = useState(() => {
    if (typeof window === "undefined") {
      return true;
    }

    const hiddenUntil = Number(localStorage.getItem(feedbackBannerStorageKey) || "0");
    return !hiddenUntil || hiddenUntil <= Date.now();
  });
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
  const [activeMenu, setActiveMenu] = useState<ActiveMenu>(initialMenu);
  const [activeWikiSlug, setActiveWikiSlug] = useState("");
  const [sidebarWikiOpen, setSidebarWikiOpen] = useState(false);
  const [sidebarCalculatorOpen, setSidebarCalculatorOpen] = useState(false);
  const [activeHeroFilter, setActiveHeroFilter] = useState<WosHeroFilter>("Rare");
  const [activeBuildingFilter, setActiveBuildingFilter] = useState<WosBuildingFilter>("Military");
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
  const [stateAgeInput, setStateAgeInput] = useState("");
  const [stateAgeResult, setStateAgeResult] = useState<StateAgeResult | null>(null);
  const [stateAgeLoading, setStateAgeLoading] = useState(false);
  const [stateAgeStatus, setStateAgeStatus] = useState("");
  const [stateAgeRecentStates, setStateAgeRecentStates] = useState<RecentlyOpenedState[]>([]);
  const [stateAgeRecentUpdatedAt, setStateAgeRecentUpdatedAt] = useState("");
  const [stateAgeRecentLoading, setStateAgeRecentLoading] = useState(false);
  const [stateAgeRecentStatus, setStateAgeRecentStatus] = useState("");
  const [charmGearState, setCharmGearState] = useState<ChiefCharmGearState>(() => createChiefCharmGearState(0, 11));
  const [ownedCharmDesign, setOwnedCharmDesign] = useState(0);
  const [ownedCharmGuide, setOwnedCharmGuide] = useState(0);
  const [ownedCharmSecret, setOwnedCharmSecret] = useState(0);
  const [chiefGearState, setChiefGearState] = useState<ChiefGearState>(() => createChiefGearState());
  const [ownedChiefGearAlloy, setOwnedChiefGearAlloy] = useState(0);
  const [ownedChiefGearPolish, setOwnedChiefGearPolish] = useState(0);
  const [ownedChiefGearPlans, setOwnedChiefGearPlans] = useState(0);
  const [ownedChiefGearAmber, setOwnedChiefGearAmber] = useState(0);
  const [foundryLegion, setFoundryLegion] = useState<"1" | "2">("1");
  const [foundryUtcTime, setFoundryUtcTime] = useState("");
  const [foundryTeamCount, setFoundryTeamCount] = useState(4);
  const [foundryTeams, setFoundryTeams] = useState<FoundryTeam[]>(() => createFoundryTeams(4));
  const [foundryIncludeLooter, setFoundryIncludeLooter] = useState(false);
  const [foundryLooterTeam, setFoundryLooterTeam] = useState<FoundryTeam>(() => createFoundryLooterTeam());
  const [foundryExportStatus, setFoundryExportStatus] = useState("");
  const [foundryShowBuildingLabels, setFoundryShowBuildingLabels] = useState(true);
  const [foundryShowTeamRoster, setFoundryShowTeamRoster] = useState(true);
  const [foundryShareOpen, setFoundryShareOpen] = useState(false);
  const [foundrySavedAt, setFoundrySavedAt] = useState("");
  const [activeTemplateCategory, setActiveTemplateCategory] = useState<MessageTemplateCategory>("all");
  const [copiedTemplateId, setCopiedTemplateId] = useState("");
  const [communityTemplates, setCommunityTemplates] = useState<MessageTemplate[]>([]);
  const [templateView] = useState<TemplateView>("gallery");
  const [templateSort] = useState<"popular" | "recent">("popular");
  const [selectedTemplateTag, setSelectedTemplateTag] = useState("");
  const [likedTemplates, setLikedTemplates] = useState<Record<string, boolean>>({});
  const [templateLikeDeltas, setTemplateLikeDeltas] = useState<Record<string, number>>({});
  const [templateLikeBursts, setTemplateLikeBursts] = useState<Record<string, number>>({});
  const [templateStatus, setTemplateStatus] = useState("");
  const [templateComposerOpen, setTemplateComposerOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [templateImageLabel, setTemplateImageLabel] = useState("No image attached");
  const [templateImagePreviewUrl, setTemplateImagePreviewUrl] = useState("");
  const [templateViewer, setTemplateViewer] = useState<MessageTemplate | null>(null);
  const [templateImageViewer, setTemplateImageViewer] = useState<MessageTemplate | null>(null);
  const [shareTemplateTarget, setShareTemplateTarget] = useState<MessageTemplate | null>(null);
  const [shareSneakPeekOpen, setShareSneakPeekOpen] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [deletingTemplateId, setDeletingTemplateId] = useState("");
  const [islands, setIslands] = useState<Island[]>([]);
  const [linkedIslandId, setLinkedIslandId] = useState("");
  const [footerVisible, setFooterVisible] = useState(false);
  const [sort, setSort] = useState<"recent" | "popular">("popular");
  const [daybreakView, setDaybreakView] = useState<DaybreakView>("gallery");
  const [selectedTag, setSelectedTag] = useState("");
  const [status, setStatus] = useState("");
  const [uploading, setUploading] = useState(false);
  const openedSharedIslandRef = useRef("");
  const openedSharedTemplateRef = useRef("");
  const foundryShareLoadedRef = useRef(false);
  const foundrySavedLoadedRef = useRef(false);
  const footerIntentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const footerHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const footerIdleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const giftCodeRefreshRef = useRef(false);
  const [viewerId] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }

    const stored = localStorage.getItem("daybreak-viewer-id") || crypto.randomUUID();
    localStorage.setItem("daybreak-viewer-id", stored);
    return stored;
  });
  const hideFeedbackBanner = () => {
    const hiddenUntil = Date.now() + 14 * 24 * 60 * 60 * 1000;
    localStorage.setItem(feedbackBannerStorageKey, String(hiddenUntil));
    setFeedbackBannerVisible(false);
  };

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
  const foundryStatusTone = foundryExportStatus.match(/unable|could not|sign in|not available/i)
    ? "error"
    : foundryExportStatus.match(/preparing|loading/i)
      ? "loading"
      : "success";
  const siteToasts = [
    { id: "foundry", message: foundryExportStatus, onDismiss: () => setFoundryExportStatus(""), tone: foundryStatusTone },
    { id: "daybreak", message: status, onDismiss: () => setStatus(""), tone: status.match(/unable|failed|blocked|only|sign in|error/i) ? "error" : "success" },
    { id: "template", message: templateStatus, onDismiss: () => setTemplateStatus(""), tone: templateStatus.match(/unable|failed|sign in|only|try again|error/i) ? "error" : "success" },
    { id: "gift", message: giftCodeStatus, onDismiss: () => setGiftCodeStatus(""), tone: giftCodeStatus.match(/unavailable|longer|no active/i) ? "error" : "success" },
    { id: "state-age", message: stateAgeStatus, onDismiss: () => setStateAgeStatus(""), tone: stateAgeStatus.match(/unable|valid|error/i) ? "error" : "success" },
    { id: "state-recent", message: stateAgeRecentStatus, onDismiss: () => setStateAgeRecentStatus(""), tone: "error" },
    { id: "auth", message: authStatus, onDismiss: () => setAuthStatus(""), tone: authStatus.match(/linked|success/i) ? "success" : "error" },
    { id: "player-lookup", message: playerLookupStatus, onDismiss: () => setPlayerLookupStatus(""), tone: playerLookupStatus.match(/loaded/i) ? "success" : "error" },
  ].filter((toast) => toast.message);

  useEffect(() => {
    const hasDismissibleToast =
      (foundryExportStatus && foundryStatusTone !== "loading") ||
      status ||
      templateStatus ||
      giftCodeStatus ||
      stateAgeStatus ||
      stateAgeRecentStatus ||
      authStatus ||
      playerLookupStatus;

    if (!hasDismissibleToast) {
      return;
    }

    const timer = setTimeout(() => {
      if (foundryExportStatus && foundryStatusTone !== "loading") {
        setFoundryExportStatus("");
      }
      if (status) {
        setStatus("");
      }
      if (templateStatus) {
        setTemplateStatus("");
      }
      if (giftCodeStatus) {
        setGiftCodeStatus("");
      }
      if (stateAgeStatus) {
        setStateAgeStatus("");
      }
      if (stateAgeRecentStatus) {
        setStateAgeRecentStatus("");
      }
      if (authStatus) {
        setAuthStatus("");
      }
      if (playerLookupStatus) {
        setPlayerLookupStatus("");
      }
    }, SITE_TOAST_DISMISS_MS);

    return () => clearTimeout(timer);
  }, [
    authStatus,
    foundryExportStatus,
    foundryStatusTone,
    giftCodeStatus,
    playerLookupStatus,
    stateAgeRecentStatus,
    stateAgeStatus,
    status,
    templateStatus,
  ]);

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
      const stateParam = params.get("state")?.replace(/\D/g, "") || "";
      if (stateParam) {
        setStateAgeInput(stateParam);
      }
      setActiveWikiSlug(params.get("item") || "");
      setActiveMenu(params.get("foundry") ? "planner" : resolveActiveMenu(window.location));
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
        const response = await fetch("/api/bot-live", {
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error("Bot live metrics unavailable.");
        }
        const metrics = await response.json();

        setBotMetrics({
          servers: formatMetric(metrics.servers),
          members: formatMetric(metrics.monitoredMembers),
          discordMembers: formatMetric(metrics.discordMembers),
          monitors: formatMetric(metrics.activeMonitors),
          redeemServers: formatMetric(metrics.autoRedeemServers),
          giftCodes: formatMetric(metrics.activeGiftCodes),
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
    if (activeMenu !== "stateAge" || !stateAgeInput || stateAgeLoading || stateAgeStatus || stateAgeResult?.state === stateAgeInput) {
      return;
    }

    const timer = window.setTimeout(() => {
      const form = document.querySelector<HTMLFormElement>(".state-age-search");
      form?.requestSubmit();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [activeMenu, stateAgeInput, stateAgeLoading, stateAgeResult?.state, stateAgeStatus]);

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
    if (activeMenu !== "templates") {
      return;
    }
    if (templateView !== "gallery" && !authUser) {
      return;
    }

    const categoryParam = activeTemplateCategory !== "all" ? `&category=${encodeURIComponent(activeTemplateCategory)}` : "";
    const tagParam = selectedTemplateTag ? `&tag=${encodeURIComponent(selectedTemplateTag)}` : "";
    const endpoint =
      templateView === "uploads"
        ? `${apiBase}/api/message-templates/me/uploads?limit=80`
        : templateView === "favorites"
          ? `${apiBase}/api/message-templates/me/favorites?limit=80`
          : `${apiBase}/api/message-templates?sort=${templateSort}${categoryParam}${tagParam}&limit=80`;

    fetch(endpoint, { credentials: "include" })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: { templates: MessageTemplate[]; favoriteIds?: string[] }) => {
        setCommunityTemplates(data.templates || []);
        if (data.favoriteIds) {
          setLikedTemplates((current) => ({ ...current, ...Object.fromEntries((data.favoriteIds || []).map((id) => [id, true])) }));
        }
        setTemplateStatus("");
      })
      .catch(() => {
        if (templateView !== "gallery") {
          setTemplateStatus("Sign in or try again to load your templates.");
        }
      });
  }, [activeMenu, activeTemplateCategory, authUser, selectedTemplateTag, templateSort, templateView]);

  useEffect(() => {
    if (!authUser || activeMenu !== "templates") {
      return;
    }

    fetch(`${apiBase}/api/message-templates/me/favorites?limit=100`, { credentials: "include" })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: { favoriteIds?: string[] }) => {
        const favoriteIds = data.favoriteIds || [];
        setLikedTemplates((current) => ({ ...current, ...Object.fromEntries(favoriteIds.map((id) => [id, true])) }));
      })
      .catch(() => null);
  }, [activeMenu, authUser]);

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

      const player = foundryPlayerPayload(data);
      setPlayerLookup(player ? normalizeFoundryPlayerProfile(player) : data.player);
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

  const copyTextToClipboard = async (value: string, promptLabel: string) => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
    } else {
      window.prompt(promptLabel, value);
    }
  };

  const qrCodeUrlFor = (value: string) =>
    `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=12&data=${encodeURIComponent(value)}`;

  const nativeShare = async (title: string, url: string, text?: string) => {
    if (navigator.share) {
      await navigator.share({ title, text, url });
      return true;
    }
    await copyTextToClipboard(url, "Copy share link");
    return false;
  };

  const shareIsland = async (island: Island, mode: "copy" | "native" = "copy") => {
    const shareUrl = shareUrlFor(island);
    if (mode === "native") {
      await nativeShare(island.title, shareUrl, `${island.title} by ${island.player.nickname}`);
    } else {
      await copyTextToClipboard(shareUrl, "Copy island link");
    }

    const response = await fetch(`${apiBase}/api/daybreak/islands/${island.id}/share`, { method: "POST" });
    const data = (await response.json()) as { island?: Island };
    if (data.island) {
      updateIsland(data.island);
    }

    setStatus(mode === "native" ? "Share opened." : "Share link copied.");
  };

  const refreshTemplates = async () => {
    const endpoint =
      templateView === "uploads"
        ? `${apiBase}/api/message-templates/me/uploads?limit=80`
        : templateView === "favorites"
          ? `${apiBase}/api/message-templates/me/favorites?limit=80`
          : `${apiBase}/api/message-templates?sort=${templateSort}${activeTemplateCategory !== "all" ? `&category=${encodeURIComponent(activeTemplateCategory)}` : ""}${selectedTemplateTag ? `&tag=${encodeURIComponent(selectedTemplateTag)}` : ""}&limit=80`;
    const response = await fetch(endpoint, { credentials: "include" });
    if (!response.ok) {
      throw new Error("Unable to refresh templates");
    }
    const data = (await response.json()) as { templates: MessageTemplate[]; favoriteIds?: string[] };
    setCommunityTemplates(data.templates || []);
    if (data.favoriteIds) {
      setLikedTemplates((current) => ({ ...current, ...Object.fromEntries(data.favoriteIds!.map((id) => [id, true])) }));
    }
  };

  const requireTemplateSignIn = (message: string) => {
    setAuthStatus(message);
    setLoginOpen(true);
  };

  const templateLikeCount = (template: MessageTemplate) =>
    Math.max(0, (template.likes || 0) + (templateLikeDeltas[template.id] || 0));

  const markTemplateLikeBurst = (templateId: string) => {
    setTemplateLikeBursts((current) => ({ ...current, [templateId]: Date.now() }));
    window.setTimeout(() => {
      setTemplateLikeBursts((current) => {
        const next = { ...current };
        delete next[templateId];
        return next;
      });
    }, 620);
  };

  const syncTemplateCopies = (template: MessageTemplate) => {
    setCommunityTemplates((current) => current.map((item) => (item.id === template.id ? template : item)));
    setTemplateViewer((current) => (current?.id === template.id ? template : current));
    setTemplateImageViewer((current) => (current?.id === template.id ? template : current));
    setShareTemplateTarget((current) => (current?.id === template.id ? template : current));
  };

  const openTemplateComposer = () => {
    if (!authUser) {
      requireTemplateSignIn("Sign in before creating a message template.");
      return;
    }
    setEditingTemplate(null);
    setTemplateImageLabel("No image attached");
    setTemplateImagePreviewUrl("");
    setTemplateComposerOpen(true);
  };

  const closeTemplateComposer = () => {
    setTemplateComposerOpen(false);
    setEditingTemplate(null);
    setTemplateImageLabel("No image attached");
    setTemplateImagePreviewUrl("");
  };

  const openEditTemplateComposer = (template: MessageTemplate) => {
    setEditingTemplate(template);
    setTemplateImageLabel(template.imageUrl ? "Current image attached" : "No image attached");
    setTemplateImagePreviewUrl(template.imageUrl || "");
    setTemplateComposerOpen(true);
  };

  const handleTemplateImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    if (!file) {
      setTemplateImageLabel(editingTemplate?.imageUrl ? "Current image attached" : "No image attached");
      setTemplateImagePreviewUrl(editingTemplate?.imageUrl || "");
      return;
    }

    setTemplateImageLabel(file.name);
    setTemplateImagePreviewUrl(URL.createObjectURL(file));
  };

  const handleTemplateImageUrlChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.currentTarget.value.trim();
    if (!value) {
      setTemplateImageLabel(editingTemplate?.imageUrl ? "Current image attached" : "No image attached");
      setTemplateImagePreviewUrl(editingTemplate?.imageUrl || "");
      return;
    }

    setTemplateImageLabel("Image link ready");
    setTemplateImagePreviewUrl(value);
  };

  const handleTemplateSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!authUser) {
      closeTemplateComposer();
      requireTemplateSignIn("Sign in before saving message templates.");
      return;
    }

    setSavingTemplate(true);
    setTemplateStatus("");
    try {
      const form = event.currentTarget;
      const body = new FormData(form);
      const imageFile = body.get("image");
      if (!(imageFile instanceof File) || imageFile.size === 0) {
        body.delete("image");
      }
      const endpoint = editingTemplate ? `${apiBase}/api/message-templates/${editingTemplate.id}` : `${apiBase}/api/message-templates`;
      const response = await fetch(endpoint, {
        method: editingTemplate ? "PATCH" : "POST",
        credentials: "include",
        body,
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.detail || data?.error || "Template save failed");
      }

      if (data?.template) {
        setCommunityTemplates((current) => {
          const exists = current.some((template) => template.id === data.template.id);
          return exists ? current.map((template) => (template.id === data.template.id ? data.template : template)) : [data.template, ...current];
        });
      }
      await refreshTemplates().catch(() => null);
      setTemplateStatus(editingTemplate ? "Template updated." : "Template published.");
      closeTemplateComposer();
    } catch (error) {
      setTemplateStatus(error instanceof Error ? error.message : "Template save failed");
    } finally {
      setSavingTemplate(false);
    }
  };

  const likeTemplate = async (template: MessageTemplate) => {
    if (!authUser) {
      requireTemplateSignIn("Sign in to like message templates.");
      return;
    }

    const wasLiked = Boolean(likedTemplates[template.id]);
    const delta = wasLiked ? -1 : 1;
    const nextLiked = !wasLiked;

    setLikedTemplates((current) => {
      const next = { ...current };
      if (nextLiked) {
        next[template.id] = true;
      } else {
        delete next[template.id];
      }
      return next;
    });
    setTemplateLikeDeltas((current) => ({ ...current, [template.id]: (current[template.id] || 0) + delta }));
    markTemplateLikeBurst(template.id);
    setTemplateStatus(template.builtin ? (nextLiked ? "Template liked." : "Template unliked.") : "");

    if (template.builtin) {
      return;
    }

    try {
      const response = await fetch(`${apiBase}/api/message-templates/${template.id}/like`, {
        method: nextLiked ? "POST" : "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const data = (await response.json().catch(() => null)) as { template?: MessageTemplate; error?: string } | null;
      if (!response.ok) {
        throw new Error(data?.error || (nextLiked ? "Unable to like template" : "Unable to unlike template"));
      }
      if (data?.template) {
        syncTemplateCopies(data.template);
        setTemplateLikeDeltas((current) => {
          const next = { ...current };
          delete next[template.id];
          return next;
        });
      }
      setTemplateStatus(nextLiked ? "Template liked." : "Template unliked.");
    } catch (error) {
      setLikedTemplates((current) => {
        const next = { ...current };
        if (wasLiked) {
          next[template.id] = true;
        } else {
          delete next[template.id];
        }
        return next;
      });
      setTemplateLikeDeltas((current) => {
        const next = { ...current };
        const value = (next[template.id] || 0) - delta;
        if (value !== 0) {
          next[template.id] = value;
        } else {
          delete next[template.id];
        }
        return next;
      });
      setTemplateStatus(error instanceof Error ? error.message : (nextLiked ? "Unable to like template" : "Unable to unlike template"));
    }
  };

  const deleteTemplate = async (template: MessageTemplate) => {
    if (!authUser) {
      requireTemplateSignIn("Sign in to delete your message templates.");
      return;
    }
    if (!template.canManage || template.builtin) {
      setTemplateStatus("You can only delete templates you created.");
      return;
    }
    if (!window.confirm(`Delete "${template.title}"? This cannot be undone.`)) {
      return;
    }

    setDeletingTemplateId(template.id);
    setTemplateStatus("");
    try {
      const response = await fetch(`${apiBase}/api/message-templates/${template.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || "Unable to delete template");
      }
      setCommunityTemplates((current) => current.filter((item) => item.id !== template.id));
      setTemplateStatus("Template deleted.");
    } catch (error) {
      setTemplateStatus(error instanceof Error ? error.message : "Unable to delete template");
    } finally {
      setDeletingTemplateId("");
    }
  };

  const templateShareUrlFor = (template: MessageTemplate) =>
    `${window.location.origin}/message-templates?template=${encodeURIComponent(template.id)}&view=dialog`;

  const shareMessageTemplate = async (template: MessageTemplate, mode: "copy" | "native" = "copy") => {
    const shareUrl = templateShareUrlFor(template);
    try {
      if (mode === "native") {
        await nativeShare(template.title, shareUrl, `${template.title} message template`);
      } else {
        await copyTextToClipboard(shareUrl, "Copy template link");
      }
    } catch {
      window.prompt("Copy template link", shareUrl);
    }

    if (!template.builtin) {
      const response = await fetch(`${apiBase}/api/message-templates/${template.id}/share`, { method: "POST", credentials: "include" });
      const data = (await response.json().catch(() => null)) as { template?: MessageTemplate } | null;
      if (data?.template) {
        setCommunityTemplates((current) => current.map((item) => (item.id === template.id ? data.template! : item)));
        setShareTemplateTarget(data.template);
      }
    }
    setTemplateStatus(mode === "native" ? "Template share opened." : "Template link copied.");
  };

  const sneakPeekTitle = "Chief Concierge: Sneak Peek";
  const sneakPeekShareText = "Whiteout Survival Childhood Memory Festival sneak peek";
  const sneakPeekShareUrl = () => `${window.location.origin}/sneak-peek`;

  const shareSneakPeek = async (mode: "copy" | "native" = "copy") => {
    const shareUrl = sneakPeekShareUrl();
    try {
      if (mode === "native") {
        await nativeShare(sneakPeekTitle, shareUrl, sneakPeekShareText);
      } else {
        await copyTextToClipboard(shareUrl, "Copy sneak peek link");
      }
    } catch {
      window.prompt("Copy sneak peek link", shareUrl);
    }
    setStatus(mode === "native" ? "Sneak peek share opened." : "Sneak peek link copied.");
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

  const copyMessageTemplate = async (template: MessageTemplate) => {
    setCopiedTemplateId(template.id);
    window.setTimeout(() => setCopiedTemplateId((current) => (current === template.id ? "" : current)), 1600);
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard unavailable");
      }
      await navigator.clipboard.writeText(template.text);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = template.text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      const copied = document.execCommand("copy");
      document.body.removeChild(textarea);
      if (!copied) {
        window.setTimeout(() => window.prompt("Copy message template", template.text), 0);
      }
    }
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

  const loadRecentlyOpenedStates = useCallback(async () => {
    if (stateAgeRecentLoading) {
      return;
    }

    setStateAgeRecentLoading(true);
    setStateAgeRecentStatus("");
    try {
      const response = await fetch("/api/state-age", {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to load recent state openings.");
      }
      const recentPayload = payload as StateAgeRecentResult;
      setStateAgeRecentStates(recentPayload.recentlyOpenedStates || []);
      setStateAgeRecentUpdatedAt(recentPayload.sourceUpdatedAt || "");
    } catch (error) {
      setStateAgeRecentStatus(error instanceof Error ? error.message : "Unable to load recent state openings.");
    } finally {
      setStateAgeRecentLoading(false);
    }
  }, [stateAgeRecentLoading]);

  useEffect(() => {
    if (activeMenu !== "stateAge" || stateAgeRecentStates.length || stateAgeRecentLoading) {
      return;
    }

    const timer = window.setTimeout(() => void loadRecentlyOpenedStates(), 0);
    return () => window.clearTimeout(timer);
  }, [activeMenu, loadRecentlyOpenedStates, stateAgeRecentLoading, stateAgeRecentStates.length]);

  const submitStateAge = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const state = stateAgeInput.replace(/\D/g, "");
    if (!state) {
      setStateAgeStatus("Enter a valid state number.");
      return;
    }

    setStateAgeLoading(true);
    setStateAgeStatus("");

    try {
      const response = await fetch(`/api/state-age?state=${encodeURIComponent(state)}`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "State not found.");
      }
      const nextResult = payload as StateAgeResult;
      setStateAgeResult(nextResult);
      setStateAgeRecentStates(nextResult.recentlyOpenedStates || []);
      setStateAgeRecentUpdatedAt(nextResult.sourceUpdatedAt || "");
      window.history.pushState(null, "", `/state-age?state=${encodeURIComponent(state)}`);
    } catch (error) {
      setStateAgeResult(null);
      setStateAgeStatus(error instanceof Error ? error.message : "Unable to load state age data.");
    } finally {
      setStateAgeLoading(false);
    }
  };

  const stateAgeEvents = stateAgeResult?.events.length ? stateAgeResult.events : [];
  const latestStateAgeEvent = [...stateAgeEvents].reverse().find((event) => event.status === "unlocked") || stateAgeEvents[0];
  const currentStateDay = stateAgeResult?.events.reduce((maxDay, event) => (
    event.status === "unlocked" && event.day !== null ? Math.max(maxDay, event.day) : maxDay
  ), 0) || 0;
  const nextStateAgeEvent = stateAgeResult?.events.find((event) => event.status !== "unlocked");
  const unlockedStateAgeEvents = stateAgeResult?.events.filter((event) => event.status === "unlocked").length || 0;
  const upcomingStateAgeEvents = stateAgeEvents.filter((event) => event.status === "upcoming").length;
  const maybeStateAgeEvents = stateAgeEvents.filter((event) => event.status === "maybe").length;
  const stateAgeImageCount = stateAgeEvents.reduce((count, event) => count + event.items.filter((item) => item.image).length, 0);
  const recentlyOpenedStateGroups = stateAgeRecentStates.reduce<{
    dayLabel: string;
    states: RecentlyOpenedState[];
  }[]>((groups, item) => {
    const group = groups.find((entry) => entry.dayLabel === item.dayLabel);
    if (group) {
      group.states.push(item);
    } else {
      groups.push({ dayLabel: item.dayLabel, states: [item] });
    }
    return groups;
  }, []);

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
      ? new Intl.DateTimeFormat(undefined, { month: "numeric", day: "numeric", timeZone: "UTC", year: "numeric" }).format(new Date(value))
      : "Today";

  const shareUrlFor = (island: Island) => `${window.location.origin}/daybreak/island/${encodeURIComponent(island.id)}`;

  const downloadUrl = async (url: string, fileName: string, onFallback?: () => void) => {
    try {
      const response = await fetch(url);
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
      link.href = url;
      link.download = fileName;
      link.target = "_blank";
      link.rel = "noreferrer";
      document.body.appendChild(link);
      link.click();
      link.remove();
      onFallback?.();
    }
  };

  const downloadImage = async (island: Island) => {
    const fileName = `${island.title.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "daybreak-island"}.jpg`;
    await downloadUrl(island.imageUrl, fileName, () => setStatus("Image opened in a new tab because the host blocked direct download."));
  };

  const downloadTemplateImage = async (template: MessageTemplate) => {
    if (!template.imageUrl) {
      return;
    }
    const fileName = `${template.title.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "message-template"}.jpg`;
    await downloadUrl(template.imageUrl, fileName, () => setTemplateStatus("Image opened in a new tab because the host blocked direct download."));
  };

  const socialShareUrl = (platform: "whatsapp" | "discord" | "x" | "facebook" | "linkedin" | "telegram" | "email", url: string, title: string, text = title) => {
    if (platform === "whatsapp") {
      return `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;
    }
    if (platform === "discord") {
      return "https://discord.com/channels/@me";
    }
    if (platform === "x") {
      return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    }
    if (platform === "facebook") {
      return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    }
    if (platform === "linkedin") {
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
    }
    if (platform === "telegram") {
      return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
    }
    return `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${text}\n${url}`)}`;
  };

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
  const wikiMenuActive = activeMenu === "wikiHeroes" || activeMenu === "wikiBuildings";
  const calculatorMenuActive = activeMenu === "chiefGear" || activeMenu === "chiefCharm";
  const mobileMoreActive = mobileMoreItems.some((item) => activeMenu === item.menu) || wikiMenuActive || calculatorMenuActive;
  const updateCharmSlot = useCallback((gearId: string, slotIndex: number, field: keyof ChiefCharmSlotState, value: number) => {
    setCharmGearState((current) => {
      const gearSlots = current[gearId] || Array.from({ length: chiefCharmSlotsPerGear }, () => ({ from: 0, to: 0 }));
      const nextSlots = gearSlots.map((slot, index) => {
        if (index !== slotIndex) {
          return slot;
        }

        const nextSlot = { ...slot, [field]: value };
        if (field === "from" && nextSlot.to < value) {
          nextSlot.to = value;
        }
        if (field === "to" && nextSlot.from > value) {
          nextSlot.from = value;
        }
        return nextSlot;
      });

      return { ...current, [gearId]: nextSlots };
    });
  }, []);
  const applyCharmPreset = useCallback((from: number, to: number) => {
    setCharmGearState(createChiefCharmGearState(from, to));
  }, []);
  const charmSlotRows = chiefCharmGearPieces.flatMap((gear) => {
    const slots = charmGearState[gear.id] || [];
    return Array.from({ length: chiefCharmSlotsPerGear }, (_, slotIndex) => {
      const slot = slots[slotIndex] || { from: 0, to: 0 };
      const from = Math.max(0, Math.min(16, slot.from));
      const to = Math.max(from, Math.min(16, slot.to));
      const cost = to > from ? charmTotalsBetween(from, to) : emptyChiefCharmCost;
      return { gear, slotIndex, from, to, cost };
    });
  });
  const charmHeroGroups = chiefCharmGearPieces.map((gear) => ({
    gear,
    slots: charmSlotRows.filter((slot) => slot.gear.id === gear.id),
  }));
  const charmAllSlotCost = charmSlotRows.reduce((total, slot) => addCharmCost(total, slot.cost), emptyChiefCharmCost);
  const charmPlannedSlots = charmSlotRows.filter((slot) => slot.to > slot.from).length;
  const charmGearCosts = chiefCharmGearPieces.map((gear) => {
    const slots = charmSlotRows.filter((slot) => slot.gear.id === gear.id);
    const total = slots.reduce((sum, slot) => addCharmCost(sum, slot.cost), emptyChiefCharmCost);
    const targetAverage = slots.reduce((sum, slot) => sum + slot.to, 0) / chiefCharmSlotsPerGear;
    return { gear, slots, total, targetAverage };
  });
  const charmTroopCosts = chiefCharmTroops.map((troop) => {
    const gearCosts = charmGearCosts.filter((item) => item.gear.troop === troop);
    const total = gearCosts.reduce((sum, item) => addCharmCost(sum, item.total), emptyChiefCharmCost);
    return { troop, total, gearCosts };
  });
  const charmSingleCost = charmPlannedSlots > 0 ? multiplyCharmCost(charmAllSlotCost, 1 / charmPlannedSlots) : emptyChiefCharmCost;
  const charmTargetData = levelDataFor(Math.max(...charmSlotRows.map((slot) => slot.to), 0));
  const charmShortfall = {
    design: Math.max(0, charmAllSlotCost.design - ownedCharmDesign),
    guide: Math.max(0, charmAllSlotCost.guide - ownedCharmGuide),
    secret: Math.max(0, charmAllSlotCost.secret - ownedCharmSecret),
  };
  const charmCoverage = {
    design: charmAllSlotCost.design > 0 ? Math.min(100, (ownedCharmDesign / charmAllSlotCost.design) * 100) : 100,
    guide: charmAllSlotCost.guide > 0 ? Math.min(100, (ownedCharmGuide / charmAllSlotCost.guide) * 100) : 100,
    secret: charmAllSlotCost.secret > 0 ? Math.min(100, (ownedCharmSecret / charmAllSlotCost.secret) * 100) : 100,
  };
  const charmExchangeToSecret = Math.floor(ownedCharmDesign / 40) + Math.floor(ownedCharmGuide / 40);
  const charmCanFinish = charmShortfall.design === 0 && charmShortfall.guide === 0 && charmShortfall.secret === 0;
  const charmEfficiencyRows = chiefCharmLevels.map((level) => {
    const previous = levelDataFor(level.level - 1);
    const powerGain = previous ? level.power - previous.power : level.power;
    const materialCost = level.design + level.guide + level.secret * 40;
    return { ...level, powerGain, efficiency: materialCost > 0 ? powerGain / materialCost : 0 };
  });
  const charmBestEfficiency = [...charmEfficiencyRows].sort((a, b) => b.efficiency - a.efficiency)[0];
  const charmRecommendation =
    charmAllSlotCost.secret > 0
      ? "Jewel Secret pressure starts at Lv.12. Check that material before pushing late charm levels."
      : "Early WOS charm value usually comes from leveling all 18 slots evenly before deep pushes.";
  const chiefGearLevelGroups = chiefGearTierOrder.map((tier) => ({
    levels: chiefGearLevels.filter((level) => level.baseTier === tier),
    tier,
  }));
  const updateChiefGearPiece = useCallback((gearId: string, field: keyof ChiefGearSelection, value: string) => {
    setChiefGearState((current) => {
      const currentPiece = current[gearId] || { from: "", to: "" };
      const nextPiece = { ...currentPiece, [field]: value };
      const fromIndex = nextPiece.from ? chiefGearLevelMap.get(nextPiece.from)?.index ?? -1 : -1;
      const toIndex = nextPiece.to ? chiefGearLevelMap.get(nextPiece.to)?.index ?? -1 : -1;

      if (nextPiece.to && fromIndex >= toIndex) {
        if (field === "from") {
          nextPiece.to = chiefGearLevels.find((level) => level.index > fromIndex)?.id || "";
        } else {
          nextPiece.from = "";
        }
      }

      return { ...current, [gearId]: nextPiece };
    });
  }, []);
  const applyChiefGearPreset = useCallback((from: string, to: string) => {
    setChiefGearState(createChiefGearState(from, to));
  }, []);
  const chiefGearRows = chiefGearPieces.map((gear) => {
    const selection = chiefGearState[gear.id] || { from: "", to: "" };
    const calculation = calculateChiefGearCost(selection.from, selection.to);
    const fromLevel = selection.from ? chiefGearLevelMap.get(selection.from) : undefined;
    const toLevel = selection.to ? chiefGearLevelMap.get(selection.to) : undefined;
    return { calculation, fromLevel, gear, selection, toLevel };
  });
  const chiefGearTotalCost = chiefGearRows.reduce((sum, row) => addChiefGearCost(sum, row.calculation.total), emptyChiefGearCost);
  const chiefGearPlannedPieces = chiefGearRows.filter((row) => row.calculation.steps.length > 0).length;
  const chiefGearHighestTarget = chiefGearRows
    .map((row) => row.toLevel)
    .filter((level): level is ChiefGearLevel => Boolean(level))
    .sort((a, b) => b.index - a.index)[0];
  const chiefGearAttackGain = chiefGearRows.reduce((sum, row) => sum + ((row.toLevel?.attackDefense || 0) - (row.fromLevel?.attackDefense || 0)), 0);
  const chiefGearCapacityGain = chiefGearRows.reduce((sum, row) => sum + ((row.toLevel?.squadCapacity || 0) - (row.fromLevel?.squadCapacity || 0)), 0);
  const chiefGearPowerTrend = chiefGearAttackGain > 0 ? "positive" : chiefGearAttackGain < 0 ? "negative" : "neutral";
  const chiefGearShortfall = {
    designPlans: Math.max(0, chiefGearTotalCost.designPlans - ownedChiefGearPlans),
    hardenedAlloy: Math.max(0, chiefGearTotalCost.hardenedAlloy - ownedChiefGearAlloy),
    lunarAmber: Math.max(0, chiefGearTotalCost.lunarAmber - ownedChiefGearAmber),
    polishingSolution: Math.max(0, chiefGearTotalCost.polishingSolution - ownedChiefGearPolish),
  };
  const chiefGearCoverage = {
    designPlans: chiefGearTotalCost.designPlans > 0 ? Math.min(100, (ownedChiefGearPlans / chiefGearTotalCost.designPlans) * 100) : 100,
    hardenedAlloy: chiefGearTotalCost.hardenedAlloy > 0 ? Math.min(100, (ownedChiefGearAlloy / chiefGearTotalCost.hardenedAlloy) * 100) : 100,
    lunarAmber: chiefGearTotalCost.lunarAmber > 0 ? Math.min(100, (ownedChiefGearAmber / chiefGearTotalCost.lunarAmber) * 100) : 100,
    polishingSolution: chiefGearTotalCost.polishingSolution > 0 ? Math.min(100, (ownedChiefGearPolish / chiefGearTotalCost.polishingSolution) * 100) : 100,
  };
  const chiefGearCanFinish = Object.values(chiefGearShortfall).every((value) => value === 0);
  const chiefGearExchangeRows = [
    "10 Design Plans -> 1 Lunar Amber",
    "1 Design Plan -> 3 Polishing Solution",
    "1 Design Plan -> 300 Hardened Alloy",
    "10 Polishing Solution -> 1 Design Plan",
    "50 Hardened Alloy -> 1 Polishing Solution",
    "1,000 Hardened Alloy -> 1 Design Plan",
  ];
  const chiefGearTroopTotals = chiefCharmTroops.map((troop) => {
    const rows = chiefGearRows.filter((row) => row.gear.troop === troop);
    return {
      attack: rows.reduce((sum, row) => sum + Math.max(0, (row.toLevel?.attackDefense || 0) - (row.fromLevel?.attackDefense || 0)), 0),
      cost: rows.reduce((sum, row) => addChiefGearCost(sum, row.calculation.total), emptyChiefGearCost),
      troop,
    };
  });
  const heroFilterCounts = scrapedWosHeroes.reduce<Record<string, number>>((counts, hero) => {
    const group = heroFilterFor(hero);
    counts[group] = (counts[group] || 0) + 1;
    return counts;
  }, {});
  const buildingCategoryCounts = scrapedWosBuildings.reduce<Record<string, number>>((counts, building) => {
    counts[building.category] = (counts[building.category] || 0) + 1;
    return counts;
  }, {});
  const visibleHeroFilters = heroFilterOrder.filter((filter) => heroFilterCounts[filter]);
  const filteredWosHeroes = scrapedWosHeroes.filter((hero) => heroFilterFor(hero) === activeHeroFilter);
  const filteredWosBuildings = scrapedWosBuildings.filter((building) => building.category === activeBuildingFilter);
  const activeWikiHero = scrapedWosHeroes.find((hero) => hero.slug === activeWikiSlug);
  const activeWikiBuilding = scrapedWosBuildings.find((building) => building.slug === activeWikiSlug);
  const allMessageTemplates = useMemo(
    () => (templateView === "gallery" ? [...messageTemplates, ...communityTemplates] : communityTemplates),
    [communityTemplates, templateView],
  );
  const filteredMessageTemplates = useMemo(() => allMessageTemplates.filter((template) => {
    if (activeTemplateCategory !== "all" && template.category !== activeTemplateCategory) {
      return false;
    }
    if (selectedTemplateTag && !template.tags.some((tag) => tag.toLowerCase() === selectedTemplateTag.toLowerCase())) {
      return false;
    }
    return true;
  }), [activeTemplateCategory, allMessageTemplates, selectedTemplateTag]);
  const templateTagSuggestions = useMemo(
    () => Array.from(new Set(allMessageTemplates.flatMap((template) => template.tags))).slice(0, 18),
    [allMessageTemplates],
  );
  const allFoundryTeams = useMemo(
    () => (foundryIncludeLooter ? [...foundryTeams, foundryLooterTeam] : foundryTeams),
    [foundryIncludeLooter, foundryLooterTeam, foundryTeams],
  );
  const foundrySelectableBuildings = useMemo(
    () => foundryBuildings.filter((building) => building.phase !== "Spawn"),
    [],
  );

  const foundryTeamToShare = (team: FoundryTeam): FoundryShareTeam => ({
    buildingId: team.buildingId,
    joiners: team.joiners.map((member) => ({ playerId: member.playerId, profile: member.profile })),
    name: team.name,
    rallyLeader: { playerId: team.rallyLeader.playerId, profile: team.rallyLeader.profile },
  });

  const foundryTeamFromShare = useCallback((team: FoundryShareTeam, index: number): FoundryTeam => {
    const fallback = createFoundryTeam(index);
    return {
      ...fallback,
      buildingId: foundryBuildings.some((building) => building.id === team.buildingId) ? team.buildingId : fallback.buildingId,
      joiners: (team.joiners?.length ? team.joiners : fallback.joiners).map((member, joinerIndex) => ({
        ...createFoundryMember("joiner", `${index + 1}-${joinerIndex + 1}`),
        playerId: member.playerId?.replace(/\D/g, "") || "",
        profile: member.profile ? normalizeFoundryPlayerProfile(member.profile) : undefined,
      })),
      name: team.name || fallback.name,
      rallyLeader: {
        ...fallback.rallyLeader,
        playerId: team.rallyLeader?.playerId?.replace(/\D/g, "") || "",
        profile: team.rallyLeader?.profile ? normalizeFoundryPlayerProfile(team.rallyLeader.profile) : undefined,
      },
    };
  }, []);

  const foundrySharePayload = (): FoundryShareState => ({
    includeLooter: foundryIncludeLooter,
    legion: foundryLegion,
    looterTeam: foundryTeamToShare(foundryLooterTeam),
    teamCount: foundryTeamCount,
    teams: foundryTeams.map(foundryTeamToShare),
    utcTime: foundryUtcTime,
  });

  const foundryShareUrl = () => {
    const payload = encodeFoundryShareState(foundrySharePayload());
    const url = new URL(window.location.href);
    url.pathname = "/";
    url.hash = "foundry-team-planner";
    url.searchParams.set("foundry", payload);
    return url.toString();
  };

  const foundryUtcDatePart = foundryUtcTime.includes("T") ? foundryUtcTime.split("T")[0] : "";
  const foundryUtcClockPart = foundryUtcTime.includes("T") ? foundryUtcTime.split("T")[1]?.slice(0, 5) || "" : foundryUtcTime.slice(0, 5);
  const setFoundryBattleTimeParts = (datePart: string, timePart: string) => {
    if (!datePart && !timePart) {
      setFoundryUtcTime("");
      return;
    }
    setFoundryUtcTime(`${datePart || utcInputDate()}T${timePart || "00:00"}`);
  };
  const adjustFoundryBattleTime = (minutes: number) => {
    const base = foundryUtcTime ? new Date(`${foundryUtcTime}:00Z`) : new Date();
    const safeBase = Number.isNaN(base.getTime()) ? new Date() : base;
    setFoundryUtcTime(utcInputDateTime(new Date(safeBase.getTime() + minutes * 60_000)));
  };

  const shareFoundryPlanner = async () => {
    if (!authUser) {
      setFoundryExportStatus("Sign in to create and edit shared Foundry plans.");
      setLoginOpen(true);
      return;
    }
    setFoundryShareOpen(true);
  };

  const copyFoundryShareLink = async () => {
    await copyTextToClipboard(foundryShareUrl(), "Copy Foundry plan link");
    setFoundryExportStatus("Editable Foundry plan link copied.");
  };

  const nativeShareFoundryPlanner = async () => {
    await nativeShare("Foundry Battle Plan", foundryShareUrl(), `Legion ${foundryLegion} Foundry battle plan`);
    setFoundryExportStatus("Foundry plan share opened.");
  };

  const fetchFoundryPlayerProfile = useCallback(async (playerId: string) => {
    const cleanedPlayerId = playerId.replace(/\D/g, "");
    if (!/^\d{8,9}$/.test(cleanedPlayerId)) {
      return undefined;
    }
    const response = await fetch(`${apiBase}/api/daybreak/players/${cleanedPlayerId}`);
    const data = await response.json().catch(() => null);
    const player = foundryPlayerPayload(data);
    if (!response.ok || !player) {
      return undefined;
    }
    return normalizeFoundryPlayerProfile(player);
  }, []);

  const hydrateFoundryTeamProfiles = useCallback(async (teams: FoundryTeam[]) => {
    const playerIds = Array.from(new Set(
      teams.flatMap((team) => [team.rallyLeader, ...team.joiners])
        .filter((member) => member.playerId && !member.profile)
        .map((member) => member.playerId),
    ));
    if (!playerIds.length) {
      return teams;
    }
    const profiles = new Map(await Promise.all(playerIds.map(async (playerId) => [
      playerId,
      await fetchFoundryPlayerProfile(playerId),
    ] as const)));
    const hydrateMember = (member: FoundryMember): FoundryMember => {
      const profile = member.profile || profiles.get(member.playerId);
      return profile ? { ...member, profile, status: "Loaded" } : member;
    };
    return teams.map((team) => ({
      ...team,
      joiners: team.joiners.map(hydrateMember),
      rallyLeader: hydrateMember(team.rallyLeader),
    }));
  }, [fetchFoundryPlayerProfile]);

  const applyFoundryPlanState = useCallback(async (parsed: FoundryShareState, options?: { savedAt?: string; status?: string }) => {
    const teams = (parsed.teams || []).map(foundryTeamFromShare);
    const looterTeam = parsed.looterTeam
      ? {
          ...foundryTeamFromShare(parsed.looterTeam, 99),
          id: "looter-team",
          name: parsed.looterTeam.name || "Looter Team",
        }
      : undefined;
    const [hydratedTeams, hydratedLooterTeams] = await Promise.all([
      hydrateFoundryTeamProfiles(teams),
      looterTeam ? hydrateFoundryTeamProfiles([looterTeam]) : Promise.resolve([]),
    ]);
    if (hydratedTeams.length) {
      setFoundryTeams(hydratedTeams);
      setFoundryTeamCount(hydratedTeams.length);
    }
    setFoundryLegion(parsed.legion === "2" ? "2" : "1");
    setFoundryUtcTime(parsed.utcTime || "");
    setFoundryIncludeLooter(Boolean(parsed.includeLooter));
    if (hydratedLooterTeams[0]) {
      setFoundryLooterTeam(hydratedLooterTeams[0]);
    }
    setFoundrySavedAt(options?.savedAt || "");
    if (options?.status) {
      setFoundryExportStatus(options.status);
    }
  }, [foundryTeamFromShare, hydrateFoundryTeamProfiles]);

  const saveFoundryPlanner = () => {
    if (!authUser) {
      setFoundryExportStatus("Sign in to save your Foundry planner progress.");
      setLoginOpen(true);
      return;
    }
    const savedAt = new Date().toISOString();
    const payload: FoundrySavedState = {
      ...foundrySharePayload(),
      savedAt,
    };
    localStorage.setItem(`${foundryPlannerSaveKeyPrefix}:${authUser.id}`, JSON.stringify(payload));
    setFoundrySavedAt(savedAt);
    setFoundryExportStatus("Foundry planner progress saved.");
  };

  useEffect(() => {
    if (foundryShareLoadedRef.current || typeof window === "undefined") {
      return;
    }
    const encoded = new URLSearchParams(window.location.search).get("foundry");
    if (!encoded) {
      foundryShareLoadedRef.current = true;
      return;
    }
    try {
      const parsed = decodeFoundryShareState(encoded);
      window.setTimeout(() => {
        void (async () => {
          await applyFoundryPlanState(parsed, { status: "Editable shared Foundry plan loaded." });
        })();
      }, 0);
    } catch {
      window.setTimeout(() => {
        setFoundryExportStatus("Shared Foundry plan link could not be loaded.");
      }, 0);
    } finally {
      foundryShareLoadedRef.current = true;
    }
  }, [applyFoundryPlanState]);

  useEffect(() => {
    if (foundrySavedLoadedRef.current || !authUser || typeof window === "undefined") {
      return;
    }
    foundrySavedLoadedRef.current = true;
    if (new URLSearchParams(window.location.search).get("foundry")) {
      return;
    }
    const saved = localStorage.getItem(`${foundryPlannerSaveKeyPrefix}:${authUser.id}`);
    if (!saved) {
      return;
    }
    try {
      const parsed = JSON.parse(saved) as FoundrySavedState;
      window.setTimeout(() => {
        void applyFoundryPlanState(parsed, {
          savedAt: parsed.savedAt,
        });
      }, 0);
    } catch {
      localStorage.removeItem(`${foundryPlannerSaveKeyPrefix}:${authUser.id}`);
      window.setTimeout(() => {
        setFoundryExportStatus("Saved Foundry planner progress could not be loaded.");
      }, 0);
    }
  }, [applyFoundryPlanState, authUser]);

  useEffect(() => {
    if (activeMenu !== "templates") {
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const targetId = params.get("template");
    if (!targetId || openedSharedTemplateRef.current === `${targetId}:${params.get("view") || "card"}`) {
      return;
    }

    const targetTemplate = allMessageTemplates.find((template) => template.id === targetId);
    if (!targetTemplate) {
      return;
    }

    const view = params.get("view") || "card";
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(`message-template-${targetId}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
      openedSharedTemplateRef.current = `${targetId}:${view}`;
      setTemplateViewer(targetTemplate);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [activeMenu, allMessageTemplates]);

  const updateFoundryTeamCount = (count: number) => {
    setFoundryTeamCount(count);
    setFoundryTeams((currentTeams) => {
      if (currentTeams.length === count) {
        return currentTeams;
      }
      if (currentTeams.length > count) {
        return currentTeams.slice(0, count);
      }
      return [
        ...currentTeams,
        ...Array.from({ length: count - currentTeams.length }, (_, index) => createFoundryTeam(currentTeams.length + index)),
      ];
    });
  };

  const updateFoundryTeam = (teamId: string, updates: Partial<Pick<FoundryTeam, "name" | "buildingId">>) => {
    if (teamId === foundryLooterTeam.id) {
      setFoundryLooterTeam((team) => ({ ...team, ...updates }));
      return;
    }
    setFoundryTeams((teams) => teams.map((team) => (team.id === teamId ? { ...team, ...updates } : team)));
  };

  const updateFoundryMember = (teamId: string, memberId: string, updates: Partial<FoundryMember>) => {
    if (teamId === foundryLooterTeam.id) {
      setFoundryLooterTeam((team) => {
        if (team.rallyLeader.id === memberId) {
          return { ...team, rallyLeader: { ...team.rallyLeader, ...updates } };
        }
        return {
          ...team,
          joiners: team.joiners.map((joiner) => (joiner.id === memberId ? { ...joiner, ...updates } : joiner)),
        };
      });
      return;
    }
    setFoundryTeams((teams) => teams.map((team) => {
      if (team.id !== teamId) {
        return team;
      }

      if (team.rallyLeader.id === memberId) {
        return { ...team, rallyLeader: { ...team.rallyLeader, ...updates } };
      }

      return {
        ...team,
        joiners: team.joiners.map((joiner) => (joiner.id === memberId ? { ...joiner, ...updates } : joiner)),
      };
    }));
  };

  const addFoundryJoiner = (teamId: string) => {
    if (teamId === foundryLooterTeam.id) {
      setFoundryLooterTeam((team) => ({
        ...team,
        joiners: [...team.joiners, createFoundryMember("joiner", `${team.id}-${team.joiners.length + 1}-${Date.now()}`)],
      }));
      return;
    }
    setFoundryTeams((teams) => teams.map((team) => (
      team.id === teamId
        ? { ...team, joiners: [...team.joiners, createFoundryMember("joiner", `${team.id}-${team.joiners.length + 1}-${Date.now()}`)] }
        : team
    )));
  };

  const removeFoundryJoiner = (teamId: string, memberId: string) => {
    if (teamId === foundryLooterTeam.id) {
      setFoundryLooterTeam((team) => ({ ...team, joiners: team.joiners.filter((joiner) => joiner.id !== memberId) }));
      return;
    }
    setFoundryTeams((teams) => teams.map((team) => (
      team.id === teamId
        ? { ...team, joiners: team.joiners.filter((joiner) => joiner.id !== memberId) }
        : team
    )));
  };

  const lookupFoundryPlayer = async (teamId: string, member: FoundryMember) => {
    const cleanedPlayerId = member.playerId.replace(/\D/g, "");
    if (!/^\d{8,9}$/.test(cleanedPlayerId)) {
      updateFoundryMember(teamId, member.id, { profile: undefined, status: "Enter an 8 or 9 digit ID." });
      return;
    }

    updateFoundryMember(teamId, member.id, { loading: true, status: "Fetching player..." });
    try {
      const profile = await fetchFoundryPlayerProfile(cleanedPlayerId);
      if (!profile) {
        throw new Error("Unable to fetch player.");
      }
      updateFoundryMember(teamId, member.id, {
        playerId: cleanedPlayerId,
        profile,
        status: "Loaded",
        loading: false,
      });
    } catch (error) {
      updateFoundryMember(teamId, member.id, {
        profile: undefined,
        status: error instanceof Error ? error.message : "Unable to fetch player.",
        loading: false,
      });
    }
  };

  const downloadCanvas = (canvas: HTMLCanvasElement, filename: string) => {
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = filename;
    link.click();
  };

  const foundryMemberName = (member: FoundryMember) => member.profile?.nickname || member.playerId || "Open Slot";

  const drawFoundryMemberChip = (
    context: CanvasRenderingContext2D,
    member: FoundryMember,
    x: number,
    y: number,
    width: number,
    color: string,
    avatar?: HTMLImageElement | null,
  ) => {
    const role = member.role === "leader" ? "RALLY" : "JOINER";
    const label = foundryMemberName(member);
    const trimText = (text: string, maxWidth: number) => {
      if (context.measureText(text).width <= maxWidth) {
        return text;
      }
      let next = text;
      while (next.length > 1 && context.measureText(`${next}...`).width > maxWidth) {
        next = next.slice(0, -1);
      }
      return `${next}...`;
    };

    context.fillStyle = "rgba(10, 14, 16, 0.9)";
    context.strokeStyle = color;
    context.lineWidth = member.role === "leader" ? 3 : 2;
    context.beginPath();
    context.roundRect(x, y, width, 48, 12);
    context.fill();
    context.stroke();

    context.fillStyle = avatar ? "#111719" : color;
    context.beginPath();
    context.arc(x + 28, y + 24, 16, 0, Math.PI * 2);
    context.fill();
    if (avatar) {
      context.save();
      context.beginPath();
      context.arc(x + 28, y + 24, 15, 0, Math.PI * 2);
      context.clip();
      context.drawImage(avatar, x + 13, y + 9, 30, 30);
      context.restore();
    } else {
      context.fillStyle = "#101314";
      context.font = "900 13px Arial";
      context.textAlign = "center";
      context.fillText(label.slice(0, 1).toUpperCase(), x + 28, y + 29);
    }
    context.strokeStyle = color;
    context.lineWidth = 2;
    context.beginPath();
    context.arc(x + 28, y + 24, 16, 0, Math.PI * 2);
    context.stroke();

    context.textAlign = "left";
    context.fillStyle = color;
    context.font = "900 9px Arial";
    context.fillText(role, x + 52, y + 15);
    context.fillStyle = "#fff";
    context.font = "900 14px Arial";
    context.fillText(trimText(label, width - 62), x + 52, y + 30);
    if (member.profile) {
      context.fillStyle = "#cbd5e1";
      context.font = "800 9px Arial";
      context.fillText(trimText(`Furnace ${furnaceDisplay(member.profile)}`, width - 62), x + 52, y + 42);
    }
  };

  const drawFoundryLogo = (
    context: CanvasRenderingContext2D,
    logo: HTMLImageElement,
    right: number,
    top: number,
    maxWidth: number,
    maxHeight: number,
  ) => {
    const ratio = logo.naturalWidth && logo.naturalHeight ? logo.naturalWidth / logo.naturalHeight : 4.6;
    const width = Math.min(maxWidth, maxHeight * ratio);
    const height = width / ratio;
    context.drawImage(logo, right - width, top, width, height);
  };

  const loadFoundryMapForExport = () => new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = foundryMapImage;
  });

  const loadFoundryLogoForExport = () => new Promise<HTMLImageElement | null>((resolve) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = foundryLogoImage;
  });

  const loadFoundryAvatarForExport = (url?: string) => new Promise<HTMLImageElement | null>((resolve) => {
    if (!url) {
      resolve(null);
      return;
    }
    const image = new window.Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = url;
  });

  const exportFoundryMapImage = async () => {
    setFoundryExportStatus("Preparing map image...");
    try {
      const [image, logo] = await Promise.all([loadFoundryMapForExport(), loadFoundryLogoForExport()]);
      const canvas = document.createElement("canvas");
      canvas.width = 1800;
      canvas.height = 1452;
      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Canvas export is not available.");
      }

      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      context.fillStyle = "rgba(8, 10, 11, 0.14)";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "rgba(8, 10, 11, 0.82)";
      context.fillRect(0, 0, canvas.width, 108);
      context.fillStyle = "rgba(255, 255, 255, 0.08)";
      context.fillRect(0, 106, canvas.width, 2);
      context.fillStyle = "#fff";
      context.textAlign = "left";
      context.font = "900 38px Arial";
      context.fillText("Foundry Battle Plan", 36, 44);
      context.fillStyle = "#f7b267";
      context.font = "800 20px Arial";
      context.fillText(`Legion ${foundryLegion}  |  ${formatFoundryUtcTime(foundryUtcTime)}`, 38, 78);
      if (logo) {
        drawFoundryLogo(context, logo, canvas.width - 40, 18, 314, 72);
      }

      const avatarEntries = await Promise.all(
        allFoundryTeams.flatMap((team) => [team.rallyLeader, ...team.joiners]).map(async (member) => [
          member.id,
          await loadFoundryAvatarForExport(proxiedWosAvatarUrl(member.profile?.avatarImage)),
        ] as const),
      );
      const avatarImages = new Map<string, HTMLImageElement | null>(avatarEntries);

      foundryBuildings.forEach((building) => {
        const x = (building.x / 100) * canvas.width;
        const y = (building.y / 100) * canvas.height;
        const labelWidth = building.name.length > 16 ? 190 : 132;
        context.fillStyle = "rgba(12, 18, 20, 0.82)";
        context.strokeStyle = building.phase === "Spawn" ? "#38bdf8" : building.id.includes("workshop") ? "#22c55e" : "#fbbf24";
        context.lineWidth = 2;
        context.beginPath();
        context.roundRect(x - labelWidth / 2, y - 16, labelWidth, 32, 8);
        context.fill();
        context.stroke();
        context.fillStyle = "#fff";
        context.font = "900 13px Arial";
        context.textAlign = "center";
        context.fillText(building.name.slice(0, 24), x, y + 5);
      });

      allFoundryTeams.forEach((team, teamIndex) => {
        const building = foundryBuildings.find((item) => item.id === team.buildingId) || foundryBuildings[2];
        const teamColor = foundryTeamColors[teamIndex % foundryTeamColors.length];
        const centerX = (building.x / 100) * canvas.width;
        const centerY = (building.y / 100) * canvas.height;
        const members = [team.rallyLeader, ...team.joiners].filter((member) => member.playerId || member.profile);
        if (!members.length) {
          return;
        }
        const teamsAtBuilding = allFoundryTeams.filter((item) => item.buildingId === team.buildingId);
        const buildingTeamIndex = teamsAtBuilding.findIndex((item) => item.id === team.id);
        const teamOffset = Math.max(0, buildingTeamIndex);
        const labelY = Math.max(130, centerY - 162 - teamOffset * 22);

        context.save();
        context.shadowColor = "rgba(0, 0, 0, 0.36)";
        context.shadowBlur = 18;
        context.shadowOffsetY = 8;
        context.fillStyle = "rgba(6, 10, 12, 0.92)";
        context.strokeStyle = teamColor;
        context.lineWidth = 2;
        context.beginPath();
        context.roundRect(centerX - 154, labelY - 22, 308, 44, 14);
        context.fill();
        context.stroke();
        context.restore();
        context.fillStyle = "rgba(255, 255, 255, 0.1)";
        context.beginPath();
        context.roundRect(centerX - 148, labelY - 16, 296, 12, 8);
        context.fill();
        context.textAlign = "center";
        context.fillStyle = teamColor;
        context.font = "900 14px Arial";
        context.fillText(team.name.slice(0, 22), centerX, labelY - 1);
        context.fillStyle = "#fff";
        context.font = "900 16px Arial";
        context.fillText(building.name.slice(0, 28), centerX, labelY + 16);

        context.strokeStyle = teamColor;
        context.lineWidth = 2;
        context.setLineDash([8, 10]);
        context.beginPath();
        context.ellipse(centerX, centerY, 172 + teamOffset * 22, 104 + teamOffset * 14, 0, 0, Math.PI * 2);
        context.stroke();
        context.setLineDash([]);

        members.forEach((member, memberIndex) => {
          const offset = foundryExportCircleOffset(memberIndex, members.length, teamOffset);
          const chipWidth = member.role === "leader" ? 172 : 158;
          const rawX = centerX + offset.x;
          const rawY = centerY + offset.y;
          const x = Math.max(24, Math.min(canvas.width - chipWidth - 24, rawX - chipWidth / 2));
          const y = Math.max(126, Math.min(canvas.height - 64, rawY - 24));
          drawFoundryMemberChip(context, member, x, y, chipWidth, member.role === "leader" ? foundryLeaderColor : teamColor, avatarImages.get(member.id));
        });
      });

      downloadCanvas(canvas, `foundry-legion-${foundryLegion}-map-plan.png`);
      setFoundryExportStatus("Map image downloaded.");
    } catch (error) {
      setFoundryExportStatus(error instanceof Error ? error.message : "Unable to export map image.");
    }
  };

  const exportFoundryTableImage = async () => {
    setFoundryExportStatus("Preparing team table...");
    const teamCards = allFoundryTeams.map((team) => ({
      team,
      building: foundryBuildings.find((item) => item.id === team.buildingId),
      members: [team.rallyLeader, ...team.joiners],
    }));
    const cardColumns = Math.min(3, Math.max(1, teamCards.length));
    const cardWidth = 520;
    const cardGap = 24;
    const cardPadding = 22;
    const rowHeight = 42;
    const cardHeights = teamCards.map((card) => 116 + Math.max(card.members.length, 1) * rowHeight);
    const cardRows = Math.ceil(teamCards.length / cardColumns);
    const rowHeights = Array.from({ length: cardRows }, (_, rowIndex) => {
      const rowCards = cardHeights.slice(rowIndex * cardColumns, rowIndex * cardColumns + cardColumns);
      return Math.max(...rowCards, 180);
    });
    const canvas = document.createElement("canvas");
    canvas.width = cardPadding * 2 + cardColumns * cardWidth + (cardColumns - 1) * cardGap;
    canvas.height = 150 + rowHeights.reduce((total, height) => total + height, 0) + Math.max(0, cardRows - 1) * cardGap + cardPadding;
    const context = canvas.getContext("2d");
    if (!context) {
      setFoundryExportStatus("Canvas export is not available.");
      return;
    }

    context.fillStyle = "#0d1113";
    context.fillRect(0, 0, canvas.width, canvas.height);
    const logo = await loadFoundryLogoForExport();
    context.fillStyle = "#151b1f";
    context.fillRect(0, 0, canvas.width, 126);
    context.fillStyle = "#f48120";
    context.font = "900 38px Arial";
    context.textAlign = "left";
    context.fillText("Foundry Team Plan", 34, 50);
    context.fillStyle = "#f0ede6";
    context.font = "800 21px Arial";
    context.fillText(`Legion ${foundryLegion}  |  ${formatFoundryUtcTime(foundryUtcTime)}`, 36, 84);
    if (logo) {
      drawFoundryLogo(context, logo, canvas.width - 40, 20, 286, 66);
    }

    const yOffset = 150;
    teamCards.forEach((card, index) => {
      const rowIndex = Math.floor(index / cardColumns);
      const columnIndex = index % cardColumns;
      const x = cardPadding + columnIndex * (cardWidth + cardGap);
      const y = yOffset + rowHeights.slice(0, rowIndex).reduce((total, height) => total + height + cardGap, 0);
      const cardHeight = rowHeights[rowIndex];
      const color = foundryTeamColors[index % foundryTeamColors.length];

      context.fillStyle = "#121719";
      context.strokeStyle = "rgba(255, 255, 255, 0.12)";
      context.lineWidth = 1;
      context.beginPath();
      context.roundRect(x, y, cardWidth, cardHeight, 16);
      context.fill();
      context.stroke();

      context.fillStyle = color;
      context.beginPath();
      context.roundRect(x, y, cardWidth, 56, 16);
      context.fill();
      context.fillStyle = "rgba(255, 255, 255, 0.18)";
      context.fillRect(x, y + 52, cardWidth, 2);
      context.fillStyle = "#101314";
      context.font = "900 22px Arial";
      context.textAlign = "left";
      context.fillText(card.team.name.slice(0, 28), x + 18, y + 34);
      context.font = "900 13px Arial";
      context.textAlign = "right";
      context.fillText((card.building?.name || "Unassigned").slice(0, 28), x + cardWidth - 18, y + 34);

      const headerY = y + 78;
      context.fillStyle = "rgba(255, 255, 255, 0.08)";
      context.beginPath();
      context.roundRect(x + 14, headerY - 24, cardWidth - 28, 32, 9);
      context.fill();
      context.fillStyle = "#f7b267";
      context.font = "900 12px Arial";
      context.textAlign = "left";
      context.fillText("ROLE", x + 26, headerY - 3);
      context.fillText("PLAYER", x + 132, headerY - 3);
      context.fillText("NAME", x + 250, headerY - 3);
      context.fillText("FURNACE", x + 425, headerY - 3);

      card.members.forEach((member, memberIndex) => {
        const rowY = y + 104 + memberIndex * rowHeight;
        context.fillStyle = memberIndex % 2 ? "#171d20" : "#101416";
        context.beginPath();
        context.roundRect(x + 14, rowY - 24, cardWidth - 28, 34, 9);
        context.fill();
        context.fillStyle = member.role === "leader" ? color : "#94a3b8";
        context.font = "900 12px Arial";
        context.fillText(member.role === "leader" ? "LEADER" : "JOINER", x + 26, rowY - 2);
        context.fillStyle = "#e5e7eb";
        context.font = "800 13px Arial";
        context.fillText(member.playerId || "-", x + 132, rowY - 2);
        context.fillText(foundryMemberName(member).slice(0, 20), x + 250, rowY - 2);
        context.fillText(member.profile ? furnaceDisplay(member.profile) : "-", x + 425, rowY - 2);
      });
    });

    downloadCanvas(canvas, `foundry-legion-${foundryLegion}-team-table.png`);
    setFoundryExportStatus("Team table image downloaded.");
  };

  const exportFoundryPlanImages = async () => {
    if (!authUser) {
      setFoundryExportStatus("Sign in to download Foundry plans.");
      setLoginOpen(true);
      return;
    }
    await exportFoundryMapImage();
    await exportFoundryTableImage();
  };

  const navigateToMenu = (menu: ActiveMenu) => {
    setMobileMoreOpen(false);
    if (menu !== "wikiHeroes" && menu !== "wikiBuildings") {
      setSidebarWikiOpen(false);
    }
    if (menu !== "chiefGear" && menu !== "chiefCharm") {
      setSidebarCalculatorOpen(false);
    }
    setActiveMenu(menu);
    setActiveWikiSlug("");
    const nextUrl = menuUrls[menu];
    if (`${window.location.pathname}${window.location.search}${window.location.hash}` !== nextUrl) {
      window.history.pushState(null, "", nextUrl);
    }
  };
  const openWikiItem = (menu: "wikiHeroes" | "wikiBuildings", slug: string) => {
    setMobileMoreOpen(false);
    setSidebarWikiOpen(true);
    setActiveMenu(menu);
    setActiveWikiSlug(slug);
    const baseUrl = menuUrls[menu];
    const nextUrl = `${baseUrl}?item=${encodeURIComponent(slug)}`;
    if (`${window.location.pathname}${window.location.search}${window.location.hash}` !== nextUrl) {
      window.history.pushState(null, "", nextUrl);
    }
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  };
  const openGiftCodesPage = () => navigateToMenu("gift");

  return (
    <main
      className={`app-shell ${theme === "dark" ? "dark" : "light"} ${collapsedSidebar ? "collapsed-sidebar" : ""} ${hideTopNav ? "hide-top-nav" : ""} width-${contentWidth} ${resizingSidebar ? "resizing-sidebar" : ""}`}
      style={shellStyle}
    >
      {siteToasts.length > 0 && (
        <div className="site-toast-stack" aria-live="polite" aria-label="Site notifications">
          {siteToasts.slice(0, 3).map((toast) => (
            <div className={`site-toast ${toast.tone}`} role="status" key={toast.id}>
              <span className="site-toast-dot" aria-hidden="true" />
              <strong>{toast.message}</strong>
              <button type="button" onClick={toast.onDismiss} aria-label="Dismiss notification">
                <Icon name="x" />
              </button>
            </div>
          ))}
        </div>
      )}
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
            <div className="menu-trigger-wrap">
              <button type="button" className="menu-trigger wiki-trigger" onClick={() => navigateToMenu("wikiHeroes")} aria-haspopup="true">
                <span className="menu-status">Live</span>
                <span className="menu-main">
                  <Icon name="book" />
                  <span>Wos Wiki</span>
                  <Icon name="chevron" />
                </span>
              </button>
              <div className="wiki-dropdown" role="menu" aria-label="Wos wiki menu">
                {wosWikiMenuItems.map((item) => (
                  item.disabled ? (
                    <span className="disabled" key={item.label} role="menuitem" aria-disabled="true">
                      <Icon name={item.icon} />
                      <span>{item.label}</span>
                      {item.status && <small>{item.status}</small>}
                    </span>
                  ) : item.menu ? (
                    <a
                      className={activeMenu === item.menu ? "active" : ""}
                      href={item.href}
                      key={item.label}
                      role="menuitem"
                      onClick={(event) => {
                        event.preventDefault();
                        navigateToMenu(item.menu as ActiveMenu);
                      }}
                    >
                      <Icon name={item.icon} />
                      <span>{item.label}</span>
                    </a>
                  ) : (
                    <a href={item.href} key={item.label} role="menuitem" target="_blank" rel="noreferrer">
                      <Icon name={item.icon} />
                      <span>{item.label}</span>
                      {item.status && <small>{item.status}</small>}
                    </a>
                  )
                ))}
              </div>
            </div>
            <div className="menu-trigger-wrap">
              <button type="button" className={`menu-trigger wiki-trigger ${calculatorMenuActive ? "active" : ""}`} onClick={() => navigateToMenu("chiefGear")} aria-haspopup="true">
                <span className="menu-status">Live</span>
                <span className="menu-main">
                  <Icon name="calculator" />
                  <span>Calculators</span>
                  <Icon name="chevron" />
                </span>
              </button>
              <div className="wiki-dropdown" role="menu" aria-label="Calculators menu">
                {calculatorMenuItems.map((item) => (
                  <a
                    className={activeMenu === item.menu ? "active" : ""}
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
                  </a>
                ))}
              </div>
            </div>
            {menuItems.map((item) => (
              <button
                type="button"
                className={`menu-trigger ${item.menu && activeMenu === item.menu ? "active" : ""}`}
                key={item.label}
                onClick={() => {
                  if (item.menu) {
                    navigateToMenu(item.menu);
                  }
                }}
              >
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
            <StateTransferCountdown />
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
                <AccountAvatar src={authUser?.avatarUrl} />
                <span>{authLoading ? "Account" : authUser ? authUser.displayName : "Sign In"}</span>
              </button>
              {accountMenuOpen && authUser && (
                <div className="account-dropdown" role="menu" aria-label="Account menu">
                  <div className="account-dropdown-head">
                    <span className="account-dropdown-avatar">
                      <AccountAvatar src={authUser.avatarUrl} />
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
                    <span>
                      <strong>{item.label}</strong>
                      <small>{item.mobileLabel}</small>
                    </span>
                    {item.beta && <strong className="sidebar-beta-badge">Beta</strong>}
                  </a>
                ))}
                <div className={`mobile-more-wiki ${sidebarCalculatorOpen || calculatorMenuActive ? "open" : ""}`}>
                  <button
                    className={`mobile-more-item mobile-more-wiki-trigger ${calculatorMenuActive ? "active" : ""}`}
                    type="button"
                    role="menuitem"
                    aria-expanded={sidebarCalculatorOpen || calculatorMenuActive}
                    onClick={() => setSidebarCalculatorOpen((value) => !value)}
                  >
                    <Icon name="calculator" />
                    <span>
                      <strong>Calculators</strong>
                      <small>Chief gear and charm</small>
                    </span>
                    <Icon name="chevron" />
                  </button>
                  <div className="mobile-more-wiki-submenu" aria-label="Calculators submenu">
                    {sidebarCalculatorItems.map((item) => (
                      <a
                        className={`mobile-more-wiki-subitem ${activeMenu === item.menu ? "active" : ""}`}
                        href={item.href}
                        key={item.menu}
                        role="menuitem"
                        onClick={(event) => {
                          event.preventDefault();
                          setSidebarCalculatorOpen(true);
                          navigateToMenu(item.menu);
                        }}
                      >
                        <Icon name={item.icon} />
                        <span>{item.label}</span>
                      </a>
                    ))}
                  </div>
                </div>
                <div className={`mobile-more-wiki ${sidebarWikiOpen || wikiMenuActive ? "open" : ""}`}>
                  <button
                    className={`mobile-more-item mobile-more-wiki-trigger ${wikiMenuActive ? "active" : ""}`}
                    type="button"
                    role="menuitem"
                    aria-expanded={sidebarWikiOpen || wikiMenuActive}
                    onClick={() => setSidebarWikiOpen((value) => !value)}
                  >
                    <Icon name="book" />
                    <span>
                      <strong>WOS Wiki</strong>
                      <small>Heroes and buildings</small>
                    </span>
                    <Icon name="chevron" />
                  </button>
                  <div className="mobile-more-wiki-submenu" aria-label="WOS Wiki submenu">
                    {sidebarWikiItems.map((item) => (
                      <a
                        className={`mobile-more-wiki-subitem ${activeMenu === item.menu ? "active" : ""}`}
                        href={item.href}
                        key={item.menu}
                        role="menuitem"
                        onClick={(event) => {
                          event.preventDefault();
                          setSidebarWikiOpen(true);
                          navigateToMenu(item.menu);
                        }}
                      >
                        <Icon name={item.icon} />
                        <span>{item.label}</span>
                      </a>
                    ))}
                  </div>
                </div>
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
            <div className={`sidebar-wiki-group mobile-primary ${sidebarCalculatorOpen || calculatorMenuActive ? "open" : ""}`}>
              <button
                className={`sidebar-item sidebar-wiki-trigger ${calculatorMenuActive ? "active" : ""}`}
                type="button"
                aria-expanded={sidebarCalculatorOpen || calculatorMenuActive}
                aria-controls="sidebar-calculators-submenu"
                onClick={() => setSidebarCalculatorOpen((value) => !value)}
              >
                <Icon name="calculator" />
                <span className="nav-label-desktop">Calculators</span>
                <span className="nav-label-mobile">Calc</span>
                <Icon name="chevron" />
              </button>
              <div className="sidebar-wiki-submenu" id="sidebar-calculators-submenu" aria-label="Calculators submenu">
                {sidebarCalculatorItems.map((item) => (
                  <a
                    className={`sidebar-wiki-subitem ${activeMenu === item.menu ? "active" : ""}`}
                    href={item.href}
                    key={item.menu}
                    onClick={(event) => {
                      event.preventDefault();
                      setSidebarCalculatorOpen(true);
                      navigateToMenu(item.menu);
                    }}
                  >
                    <Icon name={item.icon} />
                    <span className="nav-label-desktop">{item.label}</span>
                    <span className="nav-label-mobile">{item.mobileLabel}</span>
                  </a>
                ))}
              </div>
            </div>
            <div className={`sidebar-wiki-group mobile-primary ${sidebarWikiOpen || wikiMenuActive ? "open" : ""}`}>
              <button
                className={`sidebar-item sidebar-wiki-trigger ${wikiMenuActive ? "active" : ""}`}
                type="button"
                aria-expanded={sidebarWikiOpen || wikiMenuActive}
                aria-controls="sidebar-wos-wiki-submenu"
                onClick={() => setSidebarWikiOpen((value) => !value)}
              >
                <Icon name="book" />
                <span className="nav-label-desktop">WOS Wiki</span>
                <span className="nav-label-mobile">Wiki</span>
                <Icon name="chevron" />
              </button>
              <div className="sidebar-wiki-submenu" id="sidebar-wos-wiki-submenu" aria-label="WOS Wiki submenu">
                {sidebarWikiItems.map((item) => (
                  <a
                    className={`sidebar-wiki-subitem ${activeMenu === item.menu ? "active" : ""}`}
                    href={item.href}
                    key={item.menu}
                    onClick={(event) => {
                      event.preventDefault();
                      setSidebarWikiOpen(true);
                      navigateToMenu(item.menu);
                    }}
                  >
                    <Icon name={item.icon} />
                    <span className="nav-label-desktop">{item.label}</span>
                    <span className="nav-label-mobile">{item.mobileLabel}</span>
                  </a>
                ))}
              </div>
            </div>
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
          {feedbackBannerVisible && (
            <section className="feedback-banner" aria-label="Website feedback notice">
              <span className="feedback-banner-icon"><Icon name="shield" /></span>
              <p>
                This site is still in development. Please give us feedback on our{" "}
                <a href="https://discord.gg/bP5JQFH2M5" target="_blank" rel="noreferrer">Discord community</a>.
              </p>
              <button className="feedback-banner-close" type="button" onClick={hideFeedbackBanner} aria-label="Hide feedback banner">
                <Icon name="x" />
              </button>
              <button className="feedback-banner-hide" type="button" onClick={hideFeedbackBanner}>
                Hide for 14 days
              </button>
              <a className="feedback-banner-discord" href="https://discord.gg/bP5JQFH2M5" target="_blank" rel="noreferrer">
                <img src="/discord-logo.png" alt="" />
                Join our Discord community
              </a>
            </section>
          )}

          {activeMenu === "home" ? (
            <section className="home-page landing-page" id="home" aria-label="Whiteout Survival home">
              <section className="landing-hero">
                <div className="landing-hero-copy">
                  <div className="landing-hero-art">
                    <img src="/whiteout-survival-logo.png" alt="" />
                  </div>
                  <span className="section-kicker">WhiteoutSurvival.dev Tools & Guides</span>
                  <span className="landing-subtitle">Unofficial Community Resource</span>
                  <h1>Whiteout Survival Tools & Discord Bot</h1>
                  <p>
                    Enhance your Whiteout Survival experience with gift codes, planners, calculators,
                    message templates, wiki data, event tools, and alliance automation built for active players.
                  </p>
                  <div className="landing-actions">
                    <button className="primary-cta" type="button" onClick={() => navigateToMenu("gift")}>
                      Explore Tools
                    </button>
                    <button className="secondary-cta" type="button" onClick={() => navigateToMenu("redeem")}>
                      Gift Codes
                    </button>
                  </div>
                </div>
              </section>

              <section className="landing-section" aria-label="Featured tools">
                <div className="landing-section-head">
                  <h2>Featured Tools</h2>
                  <p>Essential tools to enhance your Whiteout Survival experience</p>
                </div>
                <div className="landing-card-grid featured">
                  {[
                    ["gift" as const, "gift", "Popular", "Gift Codes", "View and redeem active Whiteout Survival gift codes."],
                    ["planner" as const, "grid", "Featured", "Foundry Team Planner", "Build rally teams, assign targets, and share plans."],
                    ["bot" as const, "bot", "Automation", "Discord Bot", "Track codes, players, reminders, translation, and alliance changes."],
                    ["templates" as const, "message", "Community", "Message Templates", "Copy-ready alliance chat templates for rallies and events."],
                  ].map(([menu, icon, meta, title, body]) => (
                    <button className="landing-tool-card" key={title} type="button" onClick={() => navigateToMenu(menu as ActiveMenu)}>
                      <span className="landing-tool-icon"><Icon name={icon} /></span>
                      <span className="landing-tool-copy">
                        <small>{meta}</small>
                        <strong>{title}</strong>
                        <span>{body}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </section>

              {[
                {
                  title: "Game Calculators",
                  body: "Optimize your gameplay with focused calculation tools",
                  items: [
                    ["chiefGear" as const, "calculator", "Chief Gear", "Calculate gear upgrade requirements, stats, and material shortfalls."],
                    ["chiefCharm" as const, "star", "Chief Charms", "Plan charm upgrades across all 18 slots with troop totals."],
                    ["stateAge" as const, "calendar", "State Age Tracker", "Check unlock timing and state progression milestones."],
                  ],
                },
                {
                  title: "Planning Tools",
                  body: "Organize alliance events, designs, and communication",
                  items: [
                    ["planner" as const, "mapPin", "Foundry Planner", "Coordinate rally leaders, joiners, and building targets."],
                    ["daybreak" as const, "island", "Daybreak Island", "Browse and share Daybreak Island layouts from the community."],
                    ["dreamscape" as const, "gamepad", "Dreamscape Memory", "Play the memory puzzle experience inside the WOS toolkit."],
                  ],
                },
                {
                  title: "Game Database",
                  body: "Browse reference data and community resources",
                  items: [
                    ["wikiHeroes" as const, "book", "Heroes", "Read hero details from the local WOS wiki database."],
                    ["wikiBuildings" as const, "database", "Buildings", "Browse building pages and scraped upgrade information."],
                    ["sneak" as const, "image", "Sneak Peek", "Preview upcoming captures and community discoveries."],
                  ],
                },
              ].map((section) => (
                <section className="landing-section compact" key={section.title} aria-label={section.title}>
                  <div className="landing-section-head">
                    <h2>{section.title}</h2>
                    <p>{section.body}</p>
                  </div>
                  <div className="landing-card-grid">
                    {section.items.map(([menu, icon, title, body]) => (
                      <button className="landing-tool-card compact" key={title} type="button" onClick={() => navigateToMenu(menu as ActiveMenu)}>
                        <span className="landing-tool-icon"><Icon name={icon} /></span>
                        <span className="landing-tool-copy">
                          <strong>{title}</strong>
                          <span>{body}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </section>
              ))}

              <section className="landing-build-more" aria-label="More tools">
                <img src="/state-transfer.png" alt="" />
                <div>
                  <span className="section-kicker">We&apos;re building more tools for you</span>
                  <h2>New Whiteout Survival tools keep landing here.</h2>
                  <p>Follow updates, send feedback, and use the Discord bot when your alliance needs automation beyond the website.</p>
                </div>
                <button className="primary-cta" type="button" onClick={() => navigateToMenu("bot")}>Open Discord Bot</button>
              </section>
            </section>
          ) : activeMenu === "dreamscape" ? (
            <DreamscapeMemory embedded />
          ) : activeMenu === "gift" ? (
            <section className="home-page giftcodes-page" id="gift-codes" aria-label="Whiteout Survival gift codes">
              <section className="giftcodes-hero">
                <div>
                  <span className="section-kicker">Live Gift Code Tracker</span>
                  <h1>Whiteout Survival Gift Codes</h1>
                  <p>Fastest active giftcodes detector on Internet.</p>
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
              </div>

              <section className="giftcodes-panel" aria-label="Active gift code list">
                <div className="giftcodes-panel-head">
                  <div>
                    <h2>Active Code Directory</h2>
                  </div>
                  <button type="button" onClick={() => void copyAllGiftCodes()} disabled={!giftCodes.length}>
                    <Icon name="copy" />
                    Copy All
                  </button>
                </div>


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
                  <h1>Whiteout Survival Redeem Codes</h1>
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
                      <WosPlayerAvatar src={redeemPlayer.avatarImage} />
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
          ) : activeMenu === "stateAge" ? (
            <section className="home-page state-age-page" id="state-age" aria-label="Whiteout Survival state age tracker">
              <section className="state-age-hero">
                <div className="state-age-hero-copy">
                  <span className="section-kicker">State Timeline Tool</span>
                  <h1>Whiteout Survival State Age Tracker</h1>
                  <p>Type a state number to see when it opened, how old it is, what content is already live, and what is coming next.</p>
                  <div className="state-age-hero-chips" aria-label="Tracker capabilities">
                    <span><Icon name="calendar" /> Creation time</span>
                    <span><Icon name="shield" /> Live unlocks</span>
                    <span><Icon name="image" /> Visual timeline</span>
                  </div>
                </div>
                <form className="state-age-search" onSubmit={(event) => void submitStateAge(event)}>
                  <label>
                    <span>State Number</span>
                    <input
                      value={stateAgeInput}
                      onChange={(event) => setStateAgeInput(event.currentTarget.value.replace(/\D/g, ""))}
                      inputMode="numeric"
                      placeholder="Example: 1604"
                    />
                  </label>
                  <button type="submit" disabled={stateAgeLoading || !stateAgeInput}>
                    <Icon name="search" />
                    {stateAgeLoading ? "Checking" : "Check State"}
                  </button>
                  <small>{stateAgeResult ? `Showing State #${stateAgeResult.state}` : "Live state lookup"}</small>
                </form>
              </section>


              <section className="state-age-creation-panel" aria-label="State creation time">
                <div className="state-age-creation-node">
                  <Icon name="calendar" />
                </div>
                <div>
                  <span>State Creation Date & Time</span>
                  <strong>{stateAgeResult?.startedAt || "Search a state to reveal the exact UTC opening time"}</strong>
                  <small>{stateAgeResult ? `State #${stateAgeResult.state} has been active for ${stateAgeResult.activeFor}.` : "Creation time is shown in UTC when the source provides the state open timestamp."}</small>
                </div>
                <div className="state-age-creation-pulse" aria-hidden="true" />
              </section>
              <section className="state-age-recent-panel" aria-label="Recently opened servers">
                <div className="state-age-recent-head">
                  <div>
                    <span>Recently Opened Servers</span>
                    <strong>Last 3 Days</strong>
                    <small>{stateAgeRecentUpdatedAt ? `Source updated ${stateAgeRecentUpdatedAt}` : "Live opening feed from the state timeline source"}</small>
                  </div>
                  <div className="state-age-recent-actions">
                    <span>{stateAgeRecentLoading ? "Refreshing" : `${stateAgeRecentStates.length} states`}</span>
                    <button type="button" onClick={() => void loadRecentlyOpenedStates()} disabled={stateAgeRecentLoading}>
                      <Icon name="refresh" />
                      Refresh
                    </button>
                  </div>
                </div>
                {recentlyOpenedStateGroups.length > 0 ? (
                  <div className="state-age-recent-groups">
                    {recentlyOpenedStateGroups.map((group, groupIndex) => (
                      <article className={`state-age-recent-group ${groupIndex === 0 ? "is-latest" : ""}`} key={group.dayLabel}>
                        <div className="state-age-recent-day">
                          <Icon name="calendar" />
                          <span>
                            <strong>{group.dayLabel}</strong>
                            <small>{group.states.length} opened</small>
                          </span>
                        </div>
                        <div className="state-age-recent-states">
                          {group.states.map((item, itemIndex) => (
                            <span className="state-age-recent-chip" key={item.state} title={`Opened ${item.openedAt}`}>
                              {groupIndex === 0 && itemIndex === 0 && <em>Newest</em>}
                              <strong>State #{item.state}</strong>
                              <small>Opened {item.openedAt}</small>
                            </span>
                          ))}
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="state-age-recent-empty">{stateAgeRecentStatus || (stateAgeRecentLoading ? "Loading recent state openings..." : "Recent state openings will appear here automatically.")}</p>
                )}
              </section>


              <section className="state-age-focus-grid" aria-label="State age highlights">
                <article className="state-age-focus-card current">
                  <span>Latest Live Unlock</span>
                  <strong>{latestStateAgeEvent?.title || "Waiting for state"}</strong>
                  <small>{latestStateAgeEvent?.dayLabel || "Search any state number"}</small>
                  {latestStateAgeEvent?.items.some((item) => item.image) && (
                    <div className="state-age-focus-images">
                      {latestStateAgeEvent.items.filter((item) => item.image).slice(0, 4).map((item) => (
                        <img src={item.image} alt={item.name} key={`${latestStateAgeEvent.title}-${item.name}`} />
                      ))}
                    </div>
                  )}
                </article>
                <article className="state-age-focus-card next">
                  <span>Next Major Unlock</span>
                  <strong>{nextStateAgeEvent?.title || (stateAgeResult ? "Timeline complete" : "Waiting for state")}</strong>
                  <small>{nextStateAgeEvent ? `${nextStateAgeEvent.dayLabel}${nextStateAgeEvent.daysLeft ? ` - ${nextStateAgeEvent.daysLeft} days left` : ""}` : stateAgeResult ? "All listed milestones are unlocked." : "Search any state number"}</small>
                  {nextStateAgeEvent?.items.length ? (
                    <div className="state-age-focus-tags">
                      {nextStateAgeEvent.items.slice(0, 5).map((item) => (
                        <span key={`${nextStateAgeEvent.title}-${item.name}`}>{item.name}</span>
                      ))}
                    </div>
                  ) : null}
                </article>
              </section>

              <section className="state-age-board">
                <div className="state-age-board-head">
                  <div>
                    <h2>{stateAgeResult ? `Timeline for State #${stateAgeResult.state}` : "State Unlock Timeline Preview"}</h2>
                    <p>{stateAgeResult ? "Unlocked milestones stay at the top, upcoming milestones show how many days remain." : "Search a state to replace this preview with live server timing."}</p>
                  </div>
                  {stateAgeResult && (
                    <div className="state-age-board-stats" aria-label="Timeline totals">
                      <span>{stateAgeEvents.length} milestones</span>
                      <span>Day {currentStateDay}+</span>
                      <span>{unlockedStateAgeEvents} unlocked</span>
                      <span>{upcomingStateAgeEvents} upcoming</span>
                      <span>{stateAgeImageCount} images</span>
                      {maybeStateAgeEvents > 0 && <span>{maybeStateAgeEvents} unconfirmed</span>}
                    </div>
                  )}
                </div>
                {stateAgeResult && (
                  <div className="state-age-timeline">
                    {stateAgeEvents.map((event, index) => (
                      <article className={`state-age-event event-${event.status} ${event.items.some((item) => item.image) ? "has-images" : ""}`} key={`${event.title}-${event.dayLabel}-${index}`}>
                        <div className="state-age-rail">
                          <span />
                        </div>
                        <div className="state-age-event-card">
                          <div className="state-age-event-top">
                            <span className="state-age-sequence">{String(index + 1).padStart(2, "0")}</span>
                            <span className="state-age-day">{event.dayLabel}</span>
                            <span className={`state-age-badge badge-${event.status}`}>
                              {event.status === "maybe" ? "Unconfirmed" : event.status === "upcoming" ? (event.daysLeft ? `${event.daysLeft} days left` : "Upcoming") : "Unlocked"}
                            </span>
                          </div>
                          <h3>{event.title}</h3>
                          {event.note && <p>{event.note}</p>}
                          {event.items.length > 0 && (
                            <div className="state-age-items">
                              {event.items.map((item) => (
                                <span className={item.image ? "with-image" : ""} key={`${event.title}-${item.name}`}>
                                  {item.image && <img src={item.image} alt="" />}
                                  <strong>{item.name}</strong>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </section>
          ) : activeMenu === "chiefGear" ? (
            <section className="home-page chief-gear-page" id="chief-gear-calculator" aria-label="Whiteout Survival Chief Gear calculator">
              <section className="chief-gear-hero">
                <div>
                  <span className="section-kicker">Chief Gear Calculator</span>
                  <h1>Whiteout Survival Chief Gear Calculator</h1>
                  <p>Plan all six WOS Chief Gear pieces from Uncommon to Mythic T4 with material totals, inventory shortfalls, troop buffs, and exchange context.</p>
                  <div className="chief-gear-hero-chips" aria-label="Chief Gear facts">
                    <span><Icon name="flame" /> Furnace Lv.22 unlock</span>
                    <span><Icon name="shield" /> 6 gear pieces</span>
                    <span><Icon name="database" /> T4 data included</span>
                    <span><Icon name="star" /> Amber from Mythic</span>
                  </div>
                </div>
                <div className="chief-gear-visual" aria-hidden="true">
                  {chiefGearRows.map((row) => (
                    <span className={`gear-node gear-pos-${row.gear.id} troop-${row.gear.troop.toLowerCase()}`} key={row.gear.id}>
                      <img src={chiefGearImageFor(row.gear, row.toLevel)} alt="" />
                      <b>{row.gear.name}</b>
                      <small>{row.toLevel?.tier || "Gear"}</small>
                    </span>
                  ))}
                </div>
              </section>

              <section className="chief-gear-summary" aria-label="Chief Gear result summary">
                <article className={`primary power-increase-card ${chiefGearPowerTrend}`}>
                  <span>Power Increase</span>
                  <strong>{chiefGearAttackGain > 0 ? "+" : ""}{formatPercent(chiefGearAttackGain)}</strong>
                  <small>
                    <b>{chiefGearPowerTrend === "negative" ? "Decrease" : chiefGearPowerTrend === "positive" ? "Increase" : "No change"}</b>
                    {chiefGearCapacityGain > 0 ? "+" : ""}{formatNumber(chiefGearCapacityGain)} squad capacity
                  </small>
                </article>
                <article>
                  <span>Highest Target</span>
                  <strong>{chiefGearHighestTarget?.label || "None"}</strong>
                  <small>{chiefGearHighestTarget ? `${formatPercent(chiefGearHighestTarget.attackDefense)} attack / defense` : "No upgrades selected"}</small>
                </article>
                <article>
                  <span>Buff Gain</span>
                  <strong>{formatPercent(chiefGearAttackGain)}</strong>
                  <small>Total attack / defense gain, plus {formatNumber(chiefGearCapacityGain)} squad capacity</small>
                </article>
                <article className={chiefGearCanFinish ? "ready" : "short"}>
                  <span>Inventory Status</span>
                  <strong>{chiefGearCanFinish ? "Ready" : "Short"}</strong>
                  <small>{chiefGearCanFinish ? "Owned materials cover this plan" : "Shortfalls listed below"}</small>
                </article>
              </section>

              <section className="chief-gear-workbench" aria-label="Chief Gear calculator controls">
                <div className="chief-gear-panel">
                  <div className="chief-charm-panel-head">
                    <span>Gear Planner</span>
                    <strong>Configure current and target level for every Chief Gear piece</strong>
                  </div>
                  <div className="chief-gear-actions">
                    <button type="button" onClick={() => applyChiefGearPreset("", "gold_t2_3")}>New to Legendary T2 3-Star</button>
                    <button type="button" onClick={() => applyChiefGearPreset("gold_t2_3", "red_t3_3")}>Legendary T2 to Mythic T3</button>
                    <button type="button" onClick={() => applyChiefGearPreset("red_t3_3", "red_t4_3")}>Mythic T3 to T4</button>
                    <button type="button" onClick={() => applyChiefGearPreset("", "")}>Clear plan</button>
                  </div>
                  <div className="chief-gear-grid">
                    {chiefGearRows.map((row) => (
                      <article className={`chief-gear-card troop-${row.gear.troop.toLowerCase()}`} key={row.gear.id}>
                        <div className="chief-gear-card-head">
                          <div>
                            <span>{row.gear.troop}</span>
                            <strong>{row.gear.name}</strong>
                            <small>{row.gear.stat}</small>
                          </div>
                          <b>{row.toLevel?.label || "Unset"}</b>
                        </div>
                        <div className="chief-gear-visual-select">
                          <div className="chief-gear-compare">
                            <span>
                              <small>Current</small>
                              <img src={chiefGearImageFor(row.gear, row.fromLevel)} alt={`${row.gear.name} current gear`} />
                              <b>{row.fromLevel?.label || "None"}</b>
                            </span>
                            <em>to</em>
                            <span className="target">
                              <small>Target</small>
                              <img src={chiefGearImageFor(row.gear, row.toLevel)} alt={`${row.gear.name} target gear`} />
                              <b>{row.toLevel?.label || "Unset"}</b>
                            </span>
                          </div>
                        </div>
                        <div className="chief-gear-selects">
                          <label>
                            <span>From</span>
                            <select value={row.selection.from} onChange={(event) => updateChiefGearPiece(row.gear.id, "from", event.currentTarget.value)}>
                              <option value="">Unactivated</option>
                              {chiefGearLevelGroups.map((group) => (
                                <optgroup label={group.tier} key={`${row.gear.id}-from-${group.tier}`}>
                                  {group.levels.map((level) => (
                                    <option value={level.id} key={level.id}>{level.label}</option>
                                  ))}
                                </optgroup>
                              ))}
                            </select>
                          </label>
                          <label>
                            <span>To</span>
                            <select value={row.selection.to} onChange={(event) => updateChiefGearPiece(row.gear.id, "to", event.currentTarget.value)}>
                              <option value="">No target</option>
                              {chiefGearLevelGroups.map((group) => (
                                <optgroup label={group.tier} key={`${row.gear.id}-to-${group.tier}`}>
                                  {group.levels.map((level) => (
                                    <option value={level.id} key={level.id}>{level.label}</option>
                                  ))}
                                </optgroup>
                              ))}
                            </select>
                          </label>
                        </div>
                        <div className="chief-gear-card-total">
                          <span><img src={chiefGearMaterialIcons.hardenedAlloy} alt="" />{formatNumber(row.calculation.total.hardenedAlloy)} Alloy</span>
                          <span><img src={chiefGearMaterialIcons.polishingSolution} alt="" />{formatNumber(row.calculation.total.polishingSolution)} Polish</span>
                          <span><img src={chiefGearMaterialIcons.designPlans} alt="" />{formatNumber(row.calculation.total.designPlans)} Plans</span>
                          <span><img src={chiefGearMaterialIcons.lunarAmber} alt="" />{formatNumber(row.calculation.total.lunarAmber)} Amber</span>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>

                <aside className="chief-gear-panel">
                  <div className="chief-charm-panel-head">
                    <span>Owned Inventory</span>
                    <strong>Material shortfall check</strong>
                  </div>
                  <div className="chief-gear-inventory">
                    <label><span><img src={chiefGearMaterialIcons.hardenedAlloy} alt="" />Hardened Alloy</span><input value={ownedChiefGearAlloy} onChange={(event) => setOwnedChiefGearAlloy(Number(event.currentTarget.value.replace(/\D/g, "")) || 0)} inputMode="numeric" /></label>
                    <label><span><img src={chiefGearMaterialIcons.polishingSolution} alt="" />Polishing Solution</span><input value={ownedChiefGearPolish} onChange={(event) => setOwnedChiefGearPolish(Number(event.currentTarget.value.replace(/\D/g, "")) || 0)} inputMode="numeric" /></label>
                    <label><span><img src={chiefGearMaterialIcons.designPlans} alt="" />Design Plans</span><input value={ownedChiefGearPlans} onChange={(event) => setOwnedChiefGearPlans(Number(event.currentTarget.value.replace(/\D/g, "")) || 0)} inputMode="numeric" /></label>
                    <label><span><img src={chiefGearMaterialIcons.lunarAmber} alt="" />Lunar Amber</span><input value={ownedChiefGearAmber} onChange={(event) => setOwnedChiefGearAmber(Number(event.currentTarget.value.replace(/\D/g, "")) || 0)} inputMode="numeric" /></label>
                  </div>
                  <div className="charm-shortfall-list">
                    {[
                      { label: "Alloy", needed: chiefGearTotalCost.hardenedAlloy, owned: ownedChiefGearAlloy, missing: chiefGearShortfall.hardenedAlloy, coverage: chiefGearCoverage.hardenedAlloy },
                      { label: "Polish", needed: chiefGearTotalCost.polishingSolution, owned: ownedChiefGearPolish, missing: chiefGearShortfall.polishingSolution, coverage: chiefGearCoverage.polishingSolution },
                      { label: "Plans", needed: chiefGearTotalCost.designPlans, owned: ownedChiefGearPlans, missing: chiefGearShortfall.designPlans, coverage: chiefGearCoverage.designPlans },
                      { label: "Amber", needed: chiefGearTotalCost.lunarAmber, owned: ownedChiefGearAmber, missing: chiefGearShortfall.lunarAmber, coverage: chiefGearCoverage.lunarAmber },
                    ].map((item) => (
                      <div className="charm-shortfall-row" key={item.label}>
                        <div><strong>{item.label}</strong><span>{formatNumber(item.owned)} / {formatNumber(item.needed)}</span></div>
                        <div className="charm-progress" style={{ ["--coverage" as string]: `${item.coverage}%` }}><span /></div>
                        <small>{item.missing > 0 ? `${formatNumber(item.missing)} short` : "Covered"}</small>
                      </div>
                    ))}
                  </div>
                </aside>
              </section>

              <section className="chief-gear-results" aria-label="Chief Gear material totals">
                {[
                  { label: "Hardened Alloy", value: chiefGearTotalCost.hardenedAlloy, className: "alloy", icon: chiefGearMaterialIcons.hardenedAlloy },
                  { label: "Polishing Solution", value: chiefGearTotalCost.polishingSolution, className: "polish", icon: chiefGearMaterialIcons.polishingSolution },
                  { label: "Design Plans", value: chiefGearTotalCost.designPlans, className: "plans", icon: chiefGearMaterialIcons.designPlans },
                  { label: "Lunar Amber", value: chiefGearTotalCost.lunarAmber, className: "amber", icon: chiefGearMaterialIcons.lunarAmber },
                ].map((item) => (
                  <article className={`chief-gear-result ${item.className}`} key={item.label}>
                    <span><img src={item.icon} alt="" />{item.label}</span>
                    <strong>{formatNumber(item.value)}</strong>
                    <small>{chiefGearPlannedPieces ? `${formatNumber(item.value / chiefGearPlannedPieces)} average per planned piece` : "No pieces selected"}</small>
                  </article>
                ))}
              </section>

              <section className="chief-gear-deep-grid">
                <article className="chief-gear-panel">
                  <div className="chief-charm-panel-head">
                    <span>Troop Breakdown</span>
                    <strong>Chief Gear buffs attack and defense by troop type</strong>
                  </div>
                  <div className="chief-gear-troops">
                    {chiefGearTroopTotals.map((item) => (
                      <span key={item.troop}>
                        <small>{item.troop}</small>
                        <strong>{formatPercent(item.attack)}</strong>
                        <em>{formatNumber(item.cost.hardenedAlloy + item.cost.polishingSolution + item.cost.designPlans + item.cost.lunarAmber)} materials</em>
                      </span>
                    ))}
                  </div>
                </article>

                <article className="chief-gear-panel">
                  <div className="chief-charm-panel-head">
                    <span>Exchange System</span>
                    <strong>Unlocks after one Chief Gear reaches Legendary T2 3-Star</strong>
                  </div>
                  <div className="chief-gear-exchange">
                    {chiefGearExchangeRows.map((row) => <span key={row}>{row}</span>)}
                  </div>
                </article>
              </section>

              <section className="chief-gear-chart" aria-label="Chief Gear upgrade chart">
                <div className="chief-charm-chart-head">
                  <div>
                    <span className="section-kicker">Reference Chart</span>
                    <h2>Chief Gear Upgrade Cost by Level</h2>
                  </div>
                </div>
                <div className="chief-charm-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Level</th>
                        <th>Alloy</th>
                        <th>Polish</th>
                        <th>Plans</th>
                        <th>Amber</th>
                        <th>Atk/Def</th>
                        <th>Capacity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chiefGearLevels.map((level) => (
                        <tr className={chiefGearRows.some((row) => row.calculation.steps.some((step) => step.id === level.id)) ? "selected" : ""} key={level.id}>
                          <td>{level.label}</td>
                          <td>{level.cost.hardenedAlloy ? formatNumber(level.cost.hardenedAlloy) : "-"}</td>
                          <td>{level.cost.polishingSolution ? formatNumber(level.cost.polishingSolution) : "-"}</td>
                          <td>{level.cost.designPlans ? formatNumber(level.cost.designPlans) : "-"}</td>
                          <td>{level.cost.lunarAmber ? formatNumber(level.cost.lunarAmber) : "-"}</td>
                          <td>{formatPercent(level.attackDefense)}</td>
                          <td>{level.squadCapacity ? `+${formatNumber(level.squadCapacity)}` : "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </section>
          ) : activeMenu === "chiefCharm" ? (
            <section className="home-page chief-charm-page" id="chief-charm-calculator" aria-label="Whiteout Survival Chief Charm calculator">
              <section className="chief-charm-hero">
                <div className="chief-charm-hero-copy">
                  <span className="section-kicker">Chief Gear Calculator</span>
                  <h1>Whiteout Survival Chief Charm Calculator</h1>
                  <p>
                    <span>Plan Charm Design, Charm Guide, and Jewel Secret costs across every WOS charm slot.</span>
                    <span>Configure all 18 slots: 3 charms on each chief gear piece, grouped by troop type.</span>
                  </p>
                  <div className="chief-charm-hero-chips" aria-label="Calculator facts">
                    <span><Icon name="flame" /> Furnace Lv.25 unlock</span>
                    <span><Icon name="calculator" /> 6 gear pieces</span>
                    <span><Icon name="database" /> 18 independent slots</span>
                    <span><Icon name="star" /> Jewel Secret from Lv.12</span>
                  </div>
                </div>
                <div className="chief-charm-art" aria-hidden="true">
                  <div className="charm-gear-ring">
                    {charmHeroGroups.map((group, groupIndex) => (
                      <div
                        className="charm-gear-group"
                        key={group.gear.id}
                        style={{ ["--group-angle" as string]: `${groupIndex * 60 - 90}deg` }}
                      >
                        {group.slots.map((slot) => (
                          <span key={`${slot.gear.id}-${slot.slotIndex}`}>
                            <img src={chiefCharmImageFor(slot.gear.charmImageTroop, slot.to)} alt="" />
                            <b>{slot.to ? `Lv.${slot.to}` : "New"}</b>
                          </span>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section className="chief-charm-summary" aria-label="Chief Charm result summary">
                <article className="primary">
                  <span>Plan Power Gain</span>
                  <strong>{formatNumber(charmAllSlotCost.power)}</strong>
                  <small>{charmPlannedSlots} slot{charmPlannedSlots === 1 ? "" : "s"} with pending upgrades</small>
                </article>
                <article>
                  <span>Highest Target</span>
                  <strong>{charmTargetData ? `Lv.${charmTargetData.level}` : "None"}</strong>
                  <small>{charmTargetData ? `${formatPercent(charmTargetData.stat)} stat table level` : "No upgrades selected"}</small>
                </article>
                <article>
                  <span>Average Cost</span>
                  <strong>{formatNumber(charmSingleCost.design + charmSingleCost.guide + charmSingleCost.secret)}</strong>
                  <small>Per upgraded slot in this plan</small>
                </article>
                <article className={charmCanFinish ? "ready" : "short"}>
                  <span>Inventory Status</span>
                  <strong>{charmCanFinish ? "Ready" : "Short"}</strong>
                  <small>{charmCanFinish ? "Owned materials cover this plan" : "Shortfalls listed below"}</small>
                </article>
              </section>

              <section className="chief-charm-workbench" aria-label="Chief Charm calculator controls">
                <div className="chief-charm-panel charm-controls charm-gear-planner">
                  <div className="chief-charm-panel-head">
                    <span>Slot Planner</span>
                    <strong>Set current and target level for each WOS chief charm slot</strong>
                  </div>
                  <div className="charm-quick-actions" aria-label="Chief charm presets">
                    <button type="button" onClick={() => applyCharmPreset(0, 11)}>All new to Lv.11</button>
                    <button type="button" onClick={() => applyCharmPreset(11, 16)}>All Lv.11 to Lv.16</button>
                    <button type="button" onClick={() => applyCharmPreset(0, 16)}>Full max plan</button>
                    <button type="button" onClick={() => applyCharmPreset(0, 0)}>Clear plan</button>
                  </div>
                  <div className="charm-gear-grid">
                    {charmGearCosts.map(({ gear, slots, total, targetAverage }) => (
                      <article className={`charm-gear-card troop-${gear.troop.toLowerCase()}`} key={gear.id}>
                        <div className="charm-gear-card-head">
                          <div>
                            <span>{gear.troop}</span>
                            <strong>{gear.name}</strong>
                            <small>{gear.stat}</small>
                          </div>
                          <b>Avg Lv.{targetAverage.toFixed(1)}</b>
                        </div>
                        <div className="charm-visual-select" aria-label={`${gear.name} visual charm targets`}>
                          <div className="charm-visual-current">
                            {slots.map((slot) => (
                              <span key={`${gear.id}-preview-${slot.slotIndex}`}>
                                <img src={chiefCharmImageFor(gear.charmImageTroop, slot.to)} alt={`${gear.name} charm ${slot.slotIndex + 1} level ${slot.to || 1}`} />
                                <small>Slot {slot.slotIndex + 1}</small>
                                <b>Lv.{slot.to}</b>
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="charm-slot-list">
                          {slots.map((slot) => (
                            <div className="charm-slot-row" key={`${gear.id}-${slot.slotIndex}`}>
                              <span>Charm {slot.slotIndex + 1}</span>
                              <label>
                                <small>From</small>
                                <select value={slot.from} onChange={(event) => updateCharmSlot(gear.id, slot.slotIndex, "from", Number(event.currentTarget.value))}>
                                  <option value={0}>0</option>
                                  {chiefCharmLevels.map((level) => (
                                    <option value={level.level} key={level.level}>Lv.{level.level}</option>
                                  ))}
                                </select>
                              </label>
                              <label>
                                <small>To</small>
                                <select value={slot.to} onChange={(event) => updateCharmSlot(gear.id, slot.slotIndex, "to", Number(event.currentTarget.value))}>
                                  <option value={0}>0</option>
                                  {chiefCharmLevels.map((level) => (
                                    <option value={level.level} key={level.level}>Lv.{level.level}</option>
                                  ))}
                                </select>
                              </label>
                            </div>
                          ))}
                        </div>
                        <div className="charm-gear-total">
                          <span><img src={chiefCharmMaterialIcons.design} alt="" />{formatNumber(total.design)} Design</span>
                          <span><img src={chiefCharmMaterialIcons.guide} alt="" />{formatNumber(total.guide)} Guide</span>
                          <span><img src={chiefCharmMaterialIcons.secret} alt="" />{formatNumber(total.secret)} Secret</span>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>

                <div className="chief-charm-panel charm-inventory">
                  <div className="chief-charm-panel-head">
                    <span>Owned Inventory</span>
                    <strong>Shortfall Check</strong>
                  </div>
                  <div className="charm-inventory-inputs">
                    <label>
                      <span><img src={chiefCharmMaterialIcons.design} alt="" />Charm Design</span>
                      <input value={ownedCharmDesign} onChange={(event) => setOwnedCharmDesign(Number(event.currentTarget.value.replace(/\D/g, "")) || 0)} inputMode="numeric" />
                    </label>
                    <label>
                      <span><img src={chiefCharmMaterialIcons.guide} alt="" />Charm Guide</span>
                      <input value={ownedCharmGuide} onChange={(event) => setOwnedCharmGuide(Number(event.currentTarget.value.replace(/\D/g, "")) || 0)} inputMode="numeric" />
                    </label>
                    <label>
                      <span><img src={chiefCharmMaterialIcons.secret} alt="" />Jewel Secret</span>
                      <input value={ownedCharmSecret} onChange={(event) => setOwnedCharmSecret(Number(event.currentTarget.value.replace(/\D/g, "")) || 0)} inputMode="numeric" />
                    </label>
                  </div>
                  <div className="charm-shortfall-list">
                    {[
                      { label: "Design", needed: charmAllSlotCost.design, owned: ownedCharmDesign, missing: charmShortfall.design, coverage: charmCoverage.design },
                      { label: "Guide", needed: charmAllSlotCost.guide, owned: ownedCharmGuide, missing: charmShortfall.guide, coverage: charmCoverage.guide },
                      { label: "Jewel Secret", needed: charmAllSlotCost.secret, owned: ownedCharmSecret, missing: charmShortfall.secret, coverage: charmCoverage.secret },
                    ].map((item) => (
                      <div className="charm-shortfall-row" key={item.label}>
                        <div>
                          <strong>{item.label}</strong>
                          <span>{formatNumber(item.owned)} / {formatNumber(item.needed)}</span>
                        </div>
                        <div className="charm-progress" style={{ ["--coverage" as string]: `${item.coverage}%` }}><span /></div>
                        <small>{item.missing > 0 ? `${formatNumber(item.missing)} short` : "Covered"}</small>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section className="chief-charm-results" aria-label="Chief Charm material totals">
                {[
                  { label: "Charm Design", value: charmAllSlotCost.design, single: charmSingleCost.design, className: "design", icon: chiefCharmMaterialIcons.design },
                  { label: "Charm Guide", value: charmAllSlotCost.guide, single: charmSingleCost.guide, className: "guide", icon: chiefCharmMaterialIcons.guide },
                  { label: "Jewel Secret", value: charmAllSlotCost.secret, single: charmSingleCost.secret, className: "secret", icon: chiefCharmMaterialIcons.secret },
                  { label: "Power Gain", value: charmAllSlotCost.power, single: charmSingleCost.power, className: "power", icon: "" },
                ].map((item) => (
                  <article className={`charm-result-card ${item.className}`} key={item.label}>
                    <span>{item.icon ? <img src={item.icon} alt="" /> : null}{item.label}</span>
                    <strong>{formatNumber(item.value)}</strong>
                    <small>{formatNumber(item.single)} for one charm</small>
                  </article>
                ))}
              </section>

              <section className="chief-charm-deep-grid">
                <article className="chief-charm-panel charm-exchange">
                  <div className="chief-charm-panel-head">
                    <span>Material Exchange</span>
                    <strong>Unlocked after one Lv.11 charm</strong>
                  </div>
                  <div className="exchange-grid">
                    <span><strong>2</strong> Guide <Icon name="chevron" /> <strong>1</strong> Design</span>
                    <span><strong>2</strong> Design <Icon name="chevron" /> <strong>1</strong> Guide</span>
                    <span><strong>40</strong> Guide <Icon name="chevron" /> <strong>1</strong> Secret</span>
                    <span><strong>40</strong> Design <Icon name="chevron" /> <strong>1</strong> Secret</span>
                  </div>
                  <p>Your current Design and Guide inventory could convert into up to <strong>{formatNumber(charmExchangeToSecret)}</strong> Secrets before any game-side exchange limits.</p>
                </article>

                <article className="chief-charm-panel charm-advice">
                  <div className="chief-charm-panel-head">
                    <span>Upgrade Advice</span>
                    <strong>{charmRecommendation}</strong>
                  </div>
                  <div className="charm-advice-grid">
                    {charmTroopCosts.map((item) => (
                      <span key={item.troop}>
                        <small>{item.troop} cost</small>
                        <strong>{formatNumber(item.total.design + item.total.guide + item.total.secret)}</strong>
                      </span>
                    ))}
                    <span>
                      <small>Best early power/material</small>
                      <strong>Lv.{charmBestEfficiency.level}</strong>
                    </span>
                    <span>
                      <small>Power per weighted material</small>
                      <strong>{formatNumber(charmBestEfficiency.efficiency)}</strong>
                    </span>
                  </div>
                </article>
              </section>

              <section className="chief-charm-chart" aria-label="Chief Charm level chart">
                <div className="chief-charm-chart-head">
                  <div>
                    <span className="section-kicker">Reference Chart</span>
                    <h2>Upgrade Cost, Stat, and Power by Level</h2>
                  </div>
                  <a href="https://www.whiteoutsurvival.wiki/wos-calculator/chief-charms/" target="_blank" rel="noreferrer">
                    Source
                    <Icon name="external" />
                  </a>
                </div>
                <div className="chief-charm-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Level</th>
                        <th>Design</th>
                        <th>Guide</th>
                        <th>Secret</th>
                        <th>Stat Total</th>
                        <th>Power</th>
                        <th>Gain</th>
                      </tr>
                    </thead>
                    <tbody>
                      {charmEfficiencyRows.map((level) => (
                        <tr className={charmSlotRows.some((slot) => level.level > slot.from && level.level <= slot.to) ? "selected" : ""} key={level.level}>
                          <td>Lv.{level.level}</td>
                          <td>{formatNumber(level.design)}</td>
                          <td>{formatNumber(level.guide)}</td>
                          <td>{level.secret ? formatNumber(level.secret) : "-"}</td>
                          <td>{formatPercent(level.stat)}</td>
                          <td>{formatNumber(level.power)}</td>
                          <td>{formatNumber(level.powerGain)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

            </section>
          ) : activeMenu === "wikiHeroes" ? (
            <section className="home-page wiki-page" id="wiki-heroes" aria-label="Whiteout Survival wiki heroes">
              <section className="wiki-hero">
                <div>
                  <span className="section-kicker">Whiteout Survival Guide</span>
                  <h1>Whiteout Survival Heroes Wiki</h1>
                  <p>Browse hero stats, classes, skills, shards, and progression details in one place.</p>
                </div>
                <div className="wiki-switcher" aria-label="Wiki section switcher">
                  <button className="active" type="button" onClick={() => navigateToMenu("wikiHeroes")}>Heroes</button>
                  <button type="button" onClick={() => navigateToMenu("wikiBuildings")}>Buildings</button>
                </div>
              </section>

              {activeWikiHero ? (
                <article className="wiki-detail-panel" aria-label={`${activeWikiHero.name} details`}>
                  <div className="wiki-detail-toolbar">
                    <button type="button" onClick={() => navigateToMenu("wikiHeroes")}>
                      <Icon name="chevron" />
                      Back to Heroes
                    </button>
                    <span>{heroFilterFor(activeWikiHero)} | {activeWikiHero.rarity}</span>
                  </div>
                  <div className="wiki-detail-head">
                    {activeWikiHero.thumbnail && <img src={activeWikiHero.thumbnail} alt="" />}
                    <div>
                      <span className={`wiki-rarity rarity-${activeWikiHero.rarity.toLowerCase()}`}>{activeWikiHero.rarity}</span>
                      <h2>{activeWikiHero.name}</h2>
                      <p>{activeWikiHero.heroClass} | {activeWikiHero.subClass}</p>
                    </div>
                  </div>
                  <div className="wiki-detail-facts">
                    {activeWikiHero.stats?.slice(0, 6).map((stat) => (
                      <span key={`${stat.label}-${stat.value}`}><strong>{stat.value}</strong>{stat.label}</span>
                    ))}
                    {activeWikiHero.skills?.slice(0, 6).map((skill) => (
                      <span key={skill}><strong>{skill}</strong>Skill</span>
                    ))}
                  </div>
                  <div className="wiki-scraped-content" dangerouslySetInnerHTML={{ __html: activeWikiHero.html }} />
                </article>
              ) : (
                <section className="wiki-panel" aria-label="Hero list">
                  <div className="wiki-panel-head">
                    <div>
                      <h2>{activeHeroFilter} Heroes</h2>
                      <p>{filteredWosHeroes.length} hero{filteredWosHeroes.length === 1 ? "" : "es"} in this group. Open any hero to view stats, skills, shards, and tables inside this website.</p>
                    </div>
                  </div>
                  <div className="wiki-filter-layout">
                    <nav className="wiki-filter-rail" aria-label="Hero filters">
                      {visibleHeroFilters.map((filter) => (
                        <button
                          className={activeHeroFilter === filter ? "active" : ""}
                          type="button"
                          key={filter}
                          onClick={() => setActiveHeroFilter(filter)}
                        >
                          <span>{filter}</span>
                          <small>{heroFilterCounts[filter]}</small>
                        </button>
                      ))}
                    </nav>
                    <div className="wiki-grid">
                      {filteredWosHeroes.map((hero) => (
                        <article className="wiki-card hero-card" key={hero.slug}>
                          {hero.thumbnail && <img className="wiki-card-image" src={hero.thumbnail} alt="" />}
                          <div className="wiki-card-title">
                            <strong>{hero.name}</strong>
                            <span className={`wiki-rarity rarity-${hero.rarity.toLowerCase()}`}>{hero.rarity}</span>
                          </div>
                          <div className="wiki-card-meta">
                            <span><Icon name="shield" />{hero.heroClass}</span>
                            <span><Icon name="star" />{hero.subClass}</span>
                          </div>
                          <button type="button" onClick={() => openWikiItem("wikiHeroes", hero.slug)}>
                            View details
                            <Icon name="chevron" />
                          </button>
                        </article>
                      ))}
                    </div>
                  </div>
                </section>
              )}
            </section>
          ) : activeMenu === "wikiBuildings" ? (
            <section className="home-page wiki-page" id="wiki-buildings" aria-label="Whiteout Survival wiki buildings">
              <section className="wiki-hero">
                <div>
                  <span className="section-kicker">Whiteout Survival Guide</span>
                  <h1>Whiteout Survival Buildings Wiki</h1>
                  <p>Browse building categories, upgrade requirements, costs, timers, and power details in one place.</p>
                </div>
                <div className="wiki-switcher" aria-label="Wiki section switcher">
                  <button type="button" onClick={() => navigateToMenu("wikiHeroes")}>Heroes</button>
                  <button className="active" type="button" onClick={() => navigateToMenu("wikiBuildings")}>Buildings</button>
                </div>
              </section>

              {activeWikiBuilding ? (
                <article className="wiki-detail-panel" aria-label={`${activeWikiBuilding.name} details`}>
                  <div className="wiki-detail-toolbar">
                    <button type="button" onClick={() => navigateToMenu("wikiBuildings")}>
                      <Icon name="chevron" />
                      Back to Buildings
                    </button>
                    <span>{activeWikiBuilding.category}</span>
                  </div>
                  <div className="wiki-detail-head">
                    {activeWikiBuilding.thumbnail && <img src={activeWikiBuilding.thumbnail} alt="" />}
                    <div>
                      <span>{activeWikiBuilding.category}</span>
                      <h2>{activeWikiBuilding.name}</h2>
                      <p>Upgrade requirements, costs, timers, and power data are shown below.</p>
                    </div>
                  </div>
                  <div className="wiki-detail-facts">
                    <span><strong>{activeWikiBuilding.category}</strong>Category</span>
                    <span><strong>{activeWikiBuilding.tableCount || 0}</strong>Tables</span>
                  </div>
                  <div className="wiki-scraped-content" dangerouslySetInnerHTML={{ __html: activeWikiBuilding.html }} />
                </article>
              ) : (
                <section className="wiki-panel" aria-label="Building list">
                  <div className="wiki-panel-head">
                    <div>
                      <h2>{buildingFilters.find((filter) => filter.value === activeBuildingFilter)?.label}</h2>
                      <p>{filteredWosBuildings.length} building{filteredWosBuildings.length === 1 ? "" : "s"} in this category. Open any building to view descriptions, requirements, costs, timers, and power tables.</p>
                    </div>
                  </div>
                  <div className="wiki-building-tabs" aria-label="Building filters">
                    {buildingFilters.map((filter) => (
                      <button
                        className={activeBuildingFilter === filter.value ? "active" : ""}
                        type="button"
                        key={filter.value}
                        onClick={() => setActiveBuildingFilter(filter.value)}
                      >
                        <Icon name={filter.value === "Military" ? "shield" : filter.value === "Fire Crystal" ? "flame" : filter.value === "Inner City" ? "home" : "grid"} />
                        <span>{filter.label}</span>
                        <small>{buildingCategoryCounts[filter.value] || 0}</small>
                      </button>
                    ))}
                  </div>
                  <div className="wiki-grid buildings-grid">
                    {filteredWosBuildings.map((building) => (
                      <article className="wiki-card building-card" key={building.slug}>
                        {building.thumbnail && <img className="wiki-card-image" src={building.thumbnail} alt="" />}
                        <div className="wiki-card-title">
                          <strong>{building.name}</strong>
                          <span>{building.category}</span>
                        </div>
                        <button type="button" onClick={() => openWikiItem("wikiBuildings", building.slug)}>
                          View details
                          <Icon name="chevron" />
                        </button>
                      </article>
                    ))}
                  </div>
                </section>
              )}
            </section>
          ) : activeMenu === "planner" ? (
            <section className="home-page foundry-planner-page" id="foundry-team-planner" aria-label="Foundry Team Planner">
              <section className="foundry-hero">
                <div>
                  <span className="section-kicker">Planner Setup</span>
                  <h1>Whiteout Survival Foundry Team Planner</h1>
                  <p>Select legion, UTC time, teams, buildings, rally leaders, and joiners. The plan can be exported as a map image and a team table image.</p>
                </div>
                <div className="foundry-hero-actions">
                  <button className="foundry-primary-download" type="button" onClick={() => void exportFoundryPlanImages()}>
                    <Icon name="download" />
                    Download Map + Team Plan
                  </button>
                  {authUser && (
                    <button type="button" onClick={saveFoundryPlanner}>
                      <Icon name="copy" />
                      Save Progress
                    </button>
                  )}
                  <button type="button" onClick={() => void shareFoundryPlanner()}>
                    <Icon name="share" />
                    Share Editable Link
                  </button>
                  {authUser && foundrySavedAt && <small className="foundry-save-meta">Saved {formatFoundrySavedAt(foundrySavedAt)}</small>}
                </div>
              </section>


              {!authUser && (
                <section className="foundry-signin-gate" aria-label="Foundry planner sign in required">
                  <div>
                    <span className="section-kicker">Sign In Required</span>
                    <h2>Sign in to build, edit, download, and share Foundry plans.</h2>
                    <p>Editable planner links can be shared with alliance members, but every editor must sign in first.</p>
                  </div>
                  <button type="button" onClick={() => setLoginOpen(true)}>
                    <Icon name="user" />
                    Sign In to Use Planner
                  </button>
                </section>
              )}

              {authUser && <section className="foundry-setup-panel" aria-label="Foundry setup steps">
                <label>
                  <span>1. Legion</span>
                  <select value={foundryLegion} onChange={(event) => setFoundryLegion(event.target.value as "1" | "2")}>
                    <option value="1">Legion 1</option>
                    <option value="2">Legion 2</option>
                  </select>
                </label>
                <div className="foundry-time-control">
                  <span>2. Battle Time UTC</span>
                  <div className="foundry-time-inputs">
                    <input
                      aria-label="Foundry battle date in UTC"
                      type="date"
                      value={foundryUtcDatePart}
                      onChange={(event) => setFoundryBattleTimeParts(event.target.value, foundryUtcClockPart)}
                    />
                    <input
                      aria-label="Foundry battle time in UTC"
                      type="time"
                      value={foundryUtcClockPart}
                      onChange={(event) => setFoundryBattleTimeParts(foundryUtcDatePart, event.target.value)}
                    />
                  </div>
                  <div className="foundry-time-actions" aria-label="Foundry battle UTC quick actions">
                    <button type="button" onClick={() => setFoundryUtcTime(utcInputDateTime())}>Now UTC</button>
                    <button type="button" onClick={() => adjustFoundryBattleTime(30)}>+30m</button>
                    <button type="button" onClick={() => adjustFoundryBattleTime(60)}>+1h</button>
                    <button type="button" onClick={() => setFoundryUtcTime("")}>Clear</button>
                  </div>
                </div>
                <label>
                  <span>3. Number of Teams</span>
                  <select value={foundryTeamCount} onChange={(event) => updateFoundryTeamCount(Number(event.target.value))}>
                    {Array.from({ length: 8 }, (_, index) => index + 1).map((count) => (
                      <option value={count} key={count}>{count} team{count > 1 ? "s" : ""}</option>
                    ))}
                  </select>
                </label>
                <div className="foundry-export-note">
                  <label className="foundry-looter-toggle">
                    <input type="checkbox" checked={foundryIncludeLooter} onChange={(event) => setFoundryIncludeLooter(event.target.checked)} />
                    <span>Add Looter Team</span>
                  </label>
                  <small>{allFoundryTeams.length} editable team table rows</small>
                </div>
              </section>}

              {authUser && <section className="foundry-planner-shell">
                <div className="foundry-map-panel">
                  <div className="foundry-map-toolbar">
                    <span><Icon name="mapPin" /> Building map</span>
                    <div>
                      <button
                        className={foundryShowBuildingLabels ? "active" : ""}
                        type="button"
                        onClick={() => setFoundryShowBuildingLabels((value) => !value)}
                      >
                        {foundryShowBuildingLabels ? "Hide Names" : "Show Names"}
                      </button>
                      <button
                        className={foundryShowTeamRoster ? "active" : ""}
                        type="button"
                        onClick={() => setFoundryShowTeamRoster((value) => !value)}
                      >
                        {foundryShowTeamRoster ? "Hide Players" : "Show Players"}
                      </button>
                      <strong>Legion {foundryLegion}</strong>
                      <strong>{formatFoundryUtcTime(foundryUtcTime)}</strong>
                    </div>
                  </div>
                  <div className="foundry-map-frame">
                    <img src={foundryMapImage} alt="Whiteout Survival Foundry battlefield map" />
                    <img className="foundry-map-logo" src={foundryLogoImage} alt="Whiteout Survival" />
                    {foundryShowBuildingLabels && foundryBuildings.map((building) => (
                      <span
                        className={`foundry-map-marker ${building.phase === "Spawn" ? "spawn" : building.id.includes("workshop") ? "workshop" : "building"}`}
                        key={building.id}
                        style={{ left: `${building.x}%`, top: `${building.y}%` }}
                      >
                        {building.name}
                      </span>
                    ))}
                    {foundryShowTeamRoster && allFoundryTeams.map((team, teamIndex) => {
                      const building = foundryBuildings.find((item) => item.id === team.buildingId);
                      if (!building) {
                        return null;
                      }
                      const members = [team.rallyLeader, ...team.joiners].filter((member) => member.playerId || member.profile);
                      const teamColor = foundryTeamColors[teamIndex % foundryTeamColors.length];
                      const teamsAtBuilding = allFoundryTeams.filter((item) => item.buildingId === team.buildingId);
                      const buildingTeamIndex = teamsAtBuilding.findIndex((item) => item.id === team.id);
                      const teamOffset = Math.max(0, buildingTeamIndex);
                      const labelOffset = 12.3 + teamOffset * 1.6;
                      return (
                        <div key={team.id}>
                          <span
                            className="foundry-map-team-label"
                            style={{
                              left: `${Math.max(8, Math.min(92, building.x))}%`,
                              top: `${Math.max(7, Math.min(93, building.y - labelOffset))}%`,
                              ["--foundry-team-color" as string]: teamColor,
                            }}
                          >
                            {team.name} - {building.name}
                          </span>
                          {members.map((member, memberIndex) => {
                            const offset = foundryMapCircleOffset(memberIndex, members.length, teamOffset);
                            const left = Math.max(6, Math.min(94, building.x + offset.x));
                            const top = Math.max(8, Math.min(92, building.y + offset.y));
                            const memberColor = member.role === "leader" ? foundryLeaderColor : teamColor;
                            const roleLabel = member.role === "leader" ? "Rally" : "Joiner";
                            return (
                              <span
                                className={`foundry-map-member ${member.role}`}
                                key={member.id}
                                style={{
                                  left: `${left}%`,
                                  top: `${top}%`,
                                  ["--foundry-team-color" as string]: teamColor,
                                  ["--foundry-member-color" as string]: memberColor,
                                }}
                              >
                                <span className="foundry-map-member-avatar">
                                  <b>{foundryMemberName(member).slice(0, 1).toUpperCase()}</b>
                                  <WosPlayerAvatar src={member.profile?.avatarImage} fallback={null} />
                                </span>
                                <span className="foundry-map-member-role">{roleLabel}</span>
                                <strong>{foundryMemberName(member)}</strong>
                                {member.profile && <small>Furnace {furnaceDisplay(member.profile)}</small>}
                              </span>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>}

              {authUser && <section className="foundry-team-editor" aria-label="Foundry team editor">
                <div className="foundry-table-head">
                  <div>
                    <span className="section-kicker">4. Team Table</span>
                    <h2>Edit Teams, Buildings, Leaders, and Joiners</h2>
                  </div>
                </div>
                {allFoundryTeams.map((team, teamIndex) => (
                  <article className="foundry-team-table" key={team.id}>
                    <header>
                      <label>
                        Team Name
                        <input value={team.name} onChange={(event) => updateFoundryTeam(team.id, { name: event.target.value })} />
                      </label>
                      <label>
                        Building
                        <select value={team.buildingId} onChange={(event) => updateFoundryTeam(team.id, { buildingId: event.target.value })}>
                          {foundrySelectableBuildings.map((building) => (
                            <option value={building.id} key={building.id}>{building.name}</option>
                          ))}
                        </select>
                      </label>
                      <span style={{ ["--foundry-team-color" as string]: foundryTeamColors[teamIndex % foundryTeamColors.length] }}>
                        Team {teamIndex + 1}
                      </span>
                    </header>
                    <div className="foundry-roster-table">
                      <div className="foundry-roster-row head">
                        <span>Role</span>
                        <span>Player ID</span>
                        <span>Player</span>
                        <span>Furnace</span>
                        <span>Status</span>
                        <span>Action</span>
                      </div>
                      {[team.rallyLeader, ...team.joiners].map((member) => (
                        <div className="foundry-roster-row" key={member.id}>
                          <strong>{member.role === "leader" ? "Rally Leader" : "Joiner"}</strong>
                          <input
                            value={member.playerId}
                            inputMode="numeric"
                            placeholder="Player ID"
                            onChange={(event) => updateFoundryMember(team.id, member.id, { playerId: event.target.value.replace(/\D/g, ""), status: "", profile: undefined })}
                            onBlur={() => {
                              if (member.playerId) {
                                void lookupFoundryPlayer(team.id, member);
                              }
                            }}
                          />
                          <span className="foundry-roster-player">
                            <span className="foundry-roster-avatar">
                              <WosPlayerAvatar src={member.profile?.avatarImage} />
                            </span>
                            <strong>{member.profile?.nickname || "-"}</strong>
                          </span>
                          <span>{member.profile ? furnaceDisplay(member.profile) : "-"}</span>
                          <small>{member.loading ? "Fetching..." : member.status || "-"}</small>
                          <div>
                            <button type="button" onClick={() => void lookupFoundryPlayer(team.id, member)} disabled={member.loading}>
                              <Icon name="search" />
                              Fetch
                            </button>
                            {member.role === "joiner" && (
                              <button type="button" className="danger" onClick={() => removeFoundryJoiner(team.id, member.id)}>
                                <Icon name="trash" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <button className="foundry-add-joiner" type="button" onClick={() => addFoundryJoiner(team.id)}>
                      <Icon name="plus" />
                      Add Joiner
                    </button>
                  </article>
                ))}
              </section>}
            </section>
          ) : activeMenu === "templates" ? (
            <section className="home-page message-templates-page" id="message-templates" aria-label="Whiteout Survival message templates">
              <section className="templates-hero">
                <div>
                  <span className="section-kicker">Alliance Chat Tools</span>
                  <h1>Whiteout Survival Message Templates</h1>
                  <p>Create, edit, share, and copy alliance chat templates with tags, likes, and a game chat preview.</p>
                </div>
              </section>

              <section className="templates-howto" aria-label="How to use message templates">
                {["Create or choose a template", "Check the preview", "Copy, like, or share"].map((step, index) => (
                  <div key={step}>
                    <span>{index + 1}</span>
                    <strong>{step}</strong>
                  </div>
                ))}
              </section>

              <section className="showcase-head templates-head">
                <div>
                  <h2>Message Gallery</h2>
                </div>
                <div className="daybreak-controls">
                  <div className="daybreak-control-bar templates-filter-bar" aria-label="Message template category filter">
                    {messageTemplateCategories.map((category) => (
                      <button
                        className={activeTemplateCategory === category.value ? "selected" : ""}
                        type="button"
                        key={category.value}
                        onClick={() => setActiveTemplateCategory(category.value)}
                      >
                        {category.label}
                      </button>
                    ))}
                  </div>
                  <button className="template-create-button" type="button" onClick={openTemplateComposer}>
                    <Icon name="plus" />
                    New Template
                  </button>
                </div>
              </section>

              {selectedTemplateTag && (
                <div className="active-tag-filter template-active-filter">
                  <span>#{selectedTemplateTag}</span>
                  <button type="button" onClick={() => setSelectedTemplateTag("")} aria-label="Clear template tag filter">Clear</button>
                </div>
              )}


              {templateTagSuggestions.length > 0 && templateView === "gallery" && (
                <div className="template-tag-strip" aria-label="Template tag filters">
                  {templateTagSuggestions.map((tag) => (
                    <button type="button" key={tag} onClick={() => setSelectedTemplateTag(tag)}>#{tag}</button>
                  ))}
                </div>
              )}

              <section className={`template-grid ${activeTemplateCategory === "unicodes" ? "template-grid-unicodes" : ""}`} aria-label="Template cards">
                {filteredMessageTemplates.map((template) => (
                  template.iconGlyph ? (
                    <article className="template-card template-card-unicode" id={`message-template-${template.id}`} key={template.id}>
                      <button className="template-unicode-copy" type="button" onClick={() => void copyMessageTemplate(template)} aria-label={`Copy ${template.title}`}>
                        <Icon name="copy" />
                        {copiedTemplateId === template.id ? "Copied" : "Copy"}
                      </button>
                      <button className="template-unicode-tile" type="button" onClick={() => void copyMessageTemplate(template)} aria-label={`Copy ${template.title} unicode`}>
                        <span className="template-unicode-glyph" aria-hidden="true">{template.iconVisual || template.iconGlyph}</span>
                        <strong>{template.title}</strong>
                        {template.iconCode && <small>{template.iconCode}</small>}
                      </button>
                    </article>
                  ) : (
                    <article className={`template-card ${template.imageUrl ? "template-card-has-image" : ""}`} id={`message-template-${template.id}`} key={template.id}>
                      <header className="template-card-title">
                        <button className="template-title-open" type="button" onClick={() => setTemplateViewer(template)} aria-label={`Open ${template.title}`}>
                          <span>{messageTemplateCategories.find((category) => category.value === template.category)?.label}</span>
                          <h3>{template.title}</h3>
                        </button>
                        <div className="template-card-actions">
                          {template.canManage && !template.builtin && (
                            <button
                              type="button"
                              onClick={() => openEditTemplateComposer(template)}
                              aria-label={`Edit ${template.title}`}
                            >
                              <Icon name="edit" />
                              Edit
                            </button>
                          )}
                          <button type="button" onClick={() => void copyMessageTemplate(template)} aria-label={`Copy ${template.title}`}>
                            <Icon name="copy" />
                            {copiedTemplateId === template.id ? "Copied" : "Copy"}
                          </button>
                        </div>
                      </header>
                      {template.description && <p>{template.description}</p>}
                      {template.imageUrl && (
                        <button className="template-card-image" type="button" onClick={() => setTemplateViewer(template)} aria-label={`Open ${template.title}`}>
                          <img src={template.imageUrl} alt="" />
                        </button>
                      )}
                      <button className="template-chat-preview template-preview-open" type="button" onClick={() => setTemplateViewer(template)} aria-label={`Open ${template.title} full preview`}>
                        <div className="template-chat-top">
                          <span>WOS Chat Preview</span>
                          <small>{Array.from(template.text).length} chars</small>
                        </div>
                        <pre>{(template.previewText ? template.previewText.split("\n") : templatePreviewLines(template.text)).map((line, index) => (
                          <span key={`${template.id}-${index}`}>{line}</span>
                        ))}</pre>
                      </button>
                      <footer className="template-card-footer">
                        <div className="template-tags">
                          {template.tags.map((tag) => (
                            <button type="button" key={`${template.id}-${tag}`} onClick={() => setSelectedTemplateTag(tag)}>{tag}</button>
                          ))}
                        </div>
                      </footer>
                      <footer className="template-action-footer">
                        <button
                          className={`${likedTemplates[template.id] ? "liked" : ""} ${templateLikeBursts[template.id] ? "like-burst" : ""}`}
                          type="button"
                          onClick={() => void likeTemplate(template)}
                          aria-label={`${likedTemplates[template.id] ? "Unlike" : "Like"} ${template.title}`}
                          title={likedTemplates[template.id] ? "Click again to unlike" : "Like template"}
                        >
                          <Icon name="heart" />
                          {templateLikeCount(template)}
                        </button>
                        <button type="button" onClick={() => setShareTemplateTarget(template)}>
                          <Icon name="share" />
                          {template.shares || 0}
                        </button>
                        {template.canManage && !template.builtin && (
                          <button
                            className="danger"
                            type="button"
                            onClick={() => void deleteTemplate(template)}
                            disabled={deletingTemplateId === template.id}
                          >
                            <Icon name="trash" />
                          </button>
                        )}
                      </footer>
                    </article>
                  )
                ))}
                {!filteredMessageTemplates.length && (
                  <div className="empty-island-state template-empty-state">
                    <Icon name="message" />
                    <strong>No templates found</strong>
                    <span>Create one or clear the current filters.</span>
                  </div>
                )}
              </section>
            </section>
          ) : activeMenu === "sneak" ? (
            <section className="home-page sneak-peek-page" id="sneak-peek" aria-label="Chief Concierge Sneak Peek">
              <section className="sneak-peek-hero">
                <span className="section-kicker">Chief Concierge</span>
                <h1>Whiteout Survival Sneak Peek News</h1>
                <p>Childhood Memory Festival details, event schedule, Penguin Bounce rewards, skins, packs, and gift code information from the official sneak peek.</p>
              </section>

              <article className="sneak-peek-frame">
                <header className="sneak-peek-frame-title">
                  <h2>Chief Concierge: Sneak Peek</h2>
                  <button className="sneak-peek-share-button" type="button" onClick={() => setShareSneakPeekOpen(true)} aria-label="Share sneak peek">
                    <Icon name="share" />
                    <span>Share</span>
                  </button>
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
                  <h1>Whiteout Survival Discord Bot</h1>
                  <div className="bot-brand-row">
                    <Image className="bot-brand-logo" src="/molly-logo.png" alt="Whiteout Survival bot logo" width={58} height={58} />
                    <span className="bot-brand-name">Whiteout <span>Survival</span></span>
                  </div>
                  <p>
                    Run your Discord server smarter with DeepL auto-translation, welcome messages, smart reminders, admin tools, gift-code alerts, auto redeem, and alliance activity monitoring.
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
                    <span><strong>{botMetrics.members}</strong> monitored members</span>
                    <span><strong>{botMetrics.monitors}</strong> active monitors</span>
                    <span><strong>{botMetrics.redeemServers}</strong> redeem servers</span>
                    <span><strong>{botMetrics.giftCodes}</strong> active codes</span>
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
                      <div className="bot-preview-event">
                        <span>Gift Code</span>
                        <strong>Active Gift Code Detected</strong>
                        <p>Active gift code detected; auto redeem pending across configured servers.</p>
                      </div>
                      <div className="bot-preview-image-showcase" aria-label="Bot image previews">
                        <figure className="bot-preview-image-card arena">
                          <img src="/bot-preview-arena.png" alt="Whiteout Survival Discord arena alert preview" />
                        </figure>
                        <figure className="bot-preview-image-card dashboard">
                          <img src="/bot-preview-dashboard-reference.png" alt="Whiteout Survival bot dashboard preview" />
                        </figure>
                      </div>
                      <div className="bot-preview-process">
                        <div className="bot-preview-process-head">
                          <span>Live Process</span>
                          <strong>live feed</strong>
                        </div>
                        <article>
                          <b>GC</b>
                          <div>
                            <strong>Active gift code detected</strong>
                            <p>Bot feed connected to live gift-code, monitor, and auto-redeem events.</p>
                          </div>
                        </article>
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
                  <h1>Whiteout Survival Daybreak Island Layouts</h1>
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
                          <WosPlayerAvatar src={island.player.avatarImage} />
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

          <section className="bottom-community-section" aria-label="Whiteout Survival resource links">
            <div className="bottom-community-brand">
              <span className="bottom-community-mark">
                <Image src="/wos-logo.png" alt="" width={44} height={44} />
              </span>
              <div>
                <strong>WhiteoutSurvival.dev</strong>
                <p>Your companion for Whiteout Survival. Free calculators, planners, tools, guides, and Discord bot resources.</p>
                <small>This is a fan-made website for Whiteout Survival, not affiliated with, endorsed by, or sponsored by Century Games.</small>
              </div>
              <a className="bottom-community-action" href={DISCORD_COMMUNITY_URL} target="_blank" rel="noreferrer">
                <Image src="/discord-logo.png" alt="" width={20} height={20} />
                <span>Discord Community</span>
              </a>
            </div>
            <nav className="bottom-community-links" aria-label="End of page links">
              <div>
                <h2>Popular Tools</h2>
                <a href="/gift-codes" onClick={(event) => { event.preventDefault(); navigateToMenu("gift"); }}>Gift Codes</a>
                <a href="/chief-gear-calculator" onClick={(event) => { event.preventDefault(); navigateToMenu("chiefGear"); }}>Chief Gear Calculator</a>
                <a href="/chief-charm-calculator" onClick={(event) => { event.preventDefault(); navigateToMenu("chiefCharm"); }}>Chief Charm Calculator</a>
                <a href="/state-age" onClick={(event) => { event.preventDefault(); navigateToMenu("stateAge"); }}>State Age Tracker</a>
              </div>
              <div>
                <h2>Resources</h2>
                <a href="/wiki/heroes" onClick={(event) => { event.preventDefault(); navigateToMenu("wikiHeroes"); }}>Heroes Wiki</a>
                <a href="/wiki/buildings" onClick={(event) => { event.preventDefault(); navigateToMenu("wikiBuildings"); }}>Buildings Wiki</a>
                <a href="/message-templates" onClick={(event) => { event.preventDefault(); navigateToMenu("templates"); }}>Message Templates</a>
                <a href="/sneak-peek" onClick={(event) => { event.preventDefault(); navigateToMenu("sneak"); }}>Sneak Peek</a>
              </div>
              <div>
                <h2>Community</h2>
                <a href="/discord-bot" onClick={(event) => { event.preventDefault(); navigateToMenu("bot"); }}>Discord Bot</a>
                <a href="/foundry-team-planner" onClick={(event) => { event.preventDefault(); navigateToMenu("planner"); }}>Foundry Planner</a>
                <a href="/daybreak-island" onClick={(event) => { event.preventDefault(); navigateToMenu("daybreak"); }}>Daybreak Island</a>
                <a href={DISCORD_COMMUNITY_URL} target="_blank" rel="noreferrer">Discord Server</a>
              </div>
            </nav>
            <div className="bottom-community-meta">
              <span>(c) 2026 WhiteoutSurvival.dev - All rights reserved.</span>
              <span className="bottom-community-credit">
                <span>Built for WOS community - By</span>
                <Image src="/magnus-logo-cropped.png" alt="Magnus" width={104} height={31} />
              </span>
            </div>
          </section>

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
            <div className="social-login-stack">
              <button className="social-login google" type="button" onClick={() => signInWith("google")}>
                <span className="provider-mark"><SocialProviderLogo provider="google" /></span>
                Continue with Google
              </button>
              <div className="login-divider"><span>Or continue with</span></div>
              <button className="social-login discord" type="button" onClick={() => signInWith("discord")}>
                <span className="provider-mark"><SocialProviderLogo provider="discord" /></span>
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
                  <AccountAvatar src={authUser.avatarUrl} />
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
                      <WosPlayerAvatar src={playerLookup?.avatarImage} />
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
                            <WosPlayerAvatar src={player.avatarImage} />
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
                          <WosPlayerAvatar src={player.avatarImage} />
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
                  <WosPlayerAvatar src={playerLookup?.avatarImage} />
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

      {templateComposerOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={editingTemplate ? `Edit ${editingTemplate.title}` : "Create Message Template"} onClick={closeTemplateComposer}>
          <section className="upload-modal template-composer-modal" onClick={(event) => event.stopPropagation()}>
            <button className="close-button" type="button" onClick={closeTemplateComposer} aria-label="Close">x</button>
            <div className="upload-modal-head">
              <span className="section-kicker">Message Templates</span>
              <h2>{editingTemplate ? "Edit message template" : "Create message template"}</h2>
            </div>
            <form className="upload-form template-composer-form" onSubmit={handleTemplateSave}>
              <div className="form-grid">
                <label>
                  Title
                  <input name="title" maxLength={90} defaultValue={editingTemplate?.title || ""} placeholder="SVS Prep Guide" required />
                </label>
                <label>
                  Category
                  <select name="category" defaultValue={editingTemplate?.category || "unicodes"} required>
                    {messageTemplateCategories.filter((category) => category.value !== "all").map((category) => (
                      <option value={category.value} key={category.value}>{category.label}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="template-main-text-field">
                <span>Template text</span>
                <small>Paste or create the exact message players should copy into WOS chat.</small>
                <textarea className="template-source-input" name="text" maxLength={4000} defaultValue={editingTemplate?.text || ""} placeholder="Paste or create your template text here..." required />
              </label>
              <div className="template-compact-row">
                <label>
                  Description <span className="optional-red">optional</span>
                  <textarea className="template-description-input" name="description" maxLength={360} defaultValue={editingTemplate?.description || ""} placeholder="Short note for this template." />
                </label>
                <label className="hashtag-field">
                  Tags
                  <input className="template-tags-input" name="tags" defaultValue={editingTemplate?.tags.map((tag) => `#${tag}`).join(" ") || ""} placeholder="#SVS #Prep #Recruit" />
                </label>
              </div>
              <details className="template-image-details">
                <summary><Icon name="image" /> Add preview image <span className="optional-red">optional</span></summary>
                <section className="image-uploader template-image-uploader" aria-label="Template image source">
                  <div className="image-uploader-preview">
                    {templateImagePreviewUrl ? (
                      <img src={templateImagePreviewUrl} alt="Selected template preview" />
                    ) : (
                      <div className="preview-empty">
                        <Icon name="upload" />
                        <strong>Small image</strong>
                        <span>Hidden until needed</span>
                      </div>
                    )}
                  </div>
                  <div className="image-uploader-controls">
                    <div className="image-source-head">
                      <strong>Attach image</strong>
                      <span>Choose a file or paste a direct image URL.</span>
                    </div>
                    <label className="file-dropzone">
                      <Icon name="upload" />
                      <span>
                        <strong>{templateImageLabel}</strong>
                        <small>PNG, JPG, WEBP, GIF</small>
                      </span>
                      <input name="image" type="file" accept="image/*" onChange={handleTemplateImageChange} />
                    </label>
                    <label className="image-url-field">
                      <span>Image link</span>
                      <input name="imageUrl" type="url" placeholder="https://..." onChange={handleTemplateImageUrlChange} />
                    </label>
                  </div>
                </section>
              </details>
              <div className="edit-island-actions">
                <button className="secondary-cta" type="button" onClick={closeTemplateComposer}>Cancel</button>
                <button className="submit-button" type="submit" disabled={savingTemplate}>{savingTemplate ? "Saving..." : editingTemplate ? "Save Template" : "Publish Template"}</button>
              </div>
            </form>
          </section>
        </div>
      )}

      {templateViewer && (
        <div className="modal-backdrop image-viewer-backdrop" role="dialog" aria-modal="true" aria-label={`${templateViewer.title} template details`} onClick={() => setTemplateViewer(null)}>
          <section className="template-detail-modal" onClick={(event) => event.stopPropagation()}>
            <button className="close-button" type="button" onClick={() => setTemplateViewer(null)} aria-label="Close">x</button>
            <div className="template-detail-media">
              {templateViewer.imageUrl && (
                <button className="template-detail-image" type="button" onClick={() => setTemplateImageViewer(templateViewer)} aria-label={`Open ${templateViewer.title} image`}>
                  <img src={templateViewer.imageUrl} alt={templateViewer.title} />
                </button>
              )}
              <div className="template-chat-preview template-detail-preview" aria-label={`${templateViewer.title} full chat preview`}>
                <div className="template-chat-top">
                  <span>WOS Chat Preview</span>
                  <small>{Array.from(templateViewer.text).length} chars</small>
                </div>
                <pre>{(templateViewer.previewText ? templateViewer.previewText.split("\n") : templatePreviewLines(templateViewer.text)).map((line, index) => (
                  <span key={`${templateViewer.id}-detail-${index}`}>{line}</span>
                ))}</pre>
              </div>
            </div>
            <aside className="template-detail-panel">
              <span className="section-kicker">{messageTemplateCategories.find((category) => category.value === templateViewer.category)?.label || "Template"}</span>
              <h2>{templateViewer.title}</h2>
              {templateViewer.description && <p>{templateViewer.description}</p>}
              <div className="template-detail-meta">
                <span>{templateLikeCount(templateViewer)} likes</span>
                <span>{templateViewer.shares || 0} shares</span>
              </div>
              <div className="template-detail-tags">
                {templateViewer.tags.map((tag) => (
                  <button type="button" key={`${templateViewer.id}-viewer-${tag}`} onClick={() => { setSelectedTemplateTag(tag); setTemplateViewer(null); }}>#{tag}</button>
                ))}
              </div>
              <div className="template-detail-actions">
                <button type="button" onClick={() => void copyMessageTemplate(templateViewer)}><Icon name="copy" />Copy Text</button>
                <button
                  className={`${likedTemplates[templateViewer.id] ? "liked" : ""} ${templateLikeBursts[templateViewer.id] ? "like-burst" : ""}`}
                  type="button"
                  onClick={() => void likeTemplate(templateViewer)}
                  aria-label={`${likedTemplates[templateViewer.id] ? "Unlike" : "Like"} ${templateViewer.title}`}
                >
                  <Icon name="heart" />{likedTemplates[templateViewer.id] ? "Unlike" : "Like"}
                </button>
                <button type="button" onClick={() => setShareTemplateTarget(templateViewer)}><Icon name="share" />Share</button>
                <button type="button" onClick={() => void copyTextToClipboard(templateShareUrlFor(templateViewer), "Copy template link")}><Icon name="external" />Copy Link</button>
                {templateViewer.imageUrl && <button type="button" onClick={() => void downloadTemplateImage(templateViewer)}><Icon name="download" />Download Image</button>}
              </div>
            </aside>
          </section>
        </div>
      )}

      {templateImageViewer?.imageUrl && (
        <div className="modal-backdrop image-viewer-backdrop" role="dialog" aria-modal="true" aria-label={`${templateImageViewer.title} preview image`} onClick={() => setTemplateImageViewer(null)}>
          <section className="image-viewer template-image-viewer" onClick={(event) => event.stopPropagation()}>
            <button className="close-button" type="button" onClick={() => setTemplateImageViewer(null)} aria-label="Close">x</button>
            <div className="image-viewer-toolbar template-image-toolbar" aria-label="Template image controls">
              <button type="button" onClick={() => void shareMessageTemplate(templateImageViewer, "native")} aria-label="Share image link">
                <Icon name="share" />
              </button>
              <button type="button" onClick={() => void copyTextToClipboard(templateShareUrlFor(templateImageViewer), "Copy template dialog link")} aria-label="Copy template dialog link">
                <Icon name="copy" />
              </button>
              <a href={templateImageViewer.imageUrl} target="_blank" rel="noreferrer" aria-label="Open full image">
                <Icon name="expand" />
              </a>
              <button type="button" onClick={() => void downloadTemplateImage(templateImageViewer)} aria-label="Download template image">
                <Icon name="download" />
              </button>
            </div>
            <img src={templateImageViewer.imageUrl} alt={templateImageViewer.title} />
            <div>
              <strong>{templateImageViewer.title}</strong>
              <span>{templateImageViewer.creatorName || "Community"} | {templateShareUrlFor(templateImageViewer)}</span>
            </div>
          </section>
        </div>
      )}

      {foundryShareOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Share Foundry battle plan" onClick={() => setFoundryShareOpen(false)}>
          <section className="share-modal foundry-share-modal" onClick={(event) => event.stopPropagation()}>
            <button className="close-button" type="button" onClick={() => setFoundryShareOpen(false)} aria-label="Close">x</button>
            <div className="share-modal-head">
              <img src="/foundry-team-planner-map.webp" alt="" />
              <div>
                <h2>Share Foundry Plan</h2>
                <p>Legion {foundryLegion} | {formatFoundryUtcTime(foundryUtcTime)} | {allFoundryTeams.length} team{allFoundryTeams.length === 1 ? "" : "s"}</p>
              </div>
            </div>
            <div className="share-preview-row">
              <div className="share-url-box">
                <span>{foundryShareUrl()}</span>
                <button type="button" onClick={() => void copyFoundryShareLink()} aria-label="Copy Foundry plan URL">
                  <Icon name="copy" />
                </button>
              </div>
              <img className="share-qr" src={qrCodeUrlFor(foundryShareUrl())} alt="Foundry plan share QR code" />
            </div>
            <div className="foundry-share-summary" aria-label="Foundry share summary">
              <span><Icon name="shield" /><strong>Editable</strong>Signed-in alliance members can edit the plan from this link.</span>
              <span><Icon name="download" /><strong>Exports</strong>Map and team plan images stay available after opening.</span>
            </div>
            <div className="share-icon-row share-option-grid">
              <button type="button" onClick={() => void nativeShareFoundryPlanner()}><Icon name="share" />Native</button>
              <button type="button" onClick={() => void copyFoundryShareLink()}><Icon name="copy" />Copy</button>
              <a href={foundryShareUrl()} target="_blank" rel="noreferrer"><Icon name="external" />Open</a>
              <button type="button" onClick={() => void exportFoundryPlanImages()}><Icon name="image" />Images</button>
              <a className="brand-share whatsapp" href={socialShareUrl("whatsapp", foundryShareUrl(), "Foundry Battle Plan", `Legion ${foundryLegion} Foundry battle plan`)} target="_blank" rel="noreferrer" onClick={() => void copyFoundryShareLink()}><BrandLogo brand="whatsapp" /><span>WhatsApp</span></a>
              <a className="brand-share discord" href={socialShareUrl("discord", foundryShareUrl(), "Foundry Battle Plan", `Legion ${foundryLegion} Foundry battle plan`)} target="_blank" rel="noreferrer" onClick={() => void copyFoundryShareLink()}><BrandLogo brand="discord" /><span>Discord</span></a>
              <a className="brand-share x" href={socialShareUrl("x", foundryShareUrl(), "Foundry Battle Plan", `Legion ${foundryLegion} Foundry battle plan`)} target="_blank" rel="noreferrer" onClick={() => void copyFoundryShareLink()}><BrandLogo brand="x" /><span>X</span></a>
              <a className="brand-share facebook" href={socialShareUrl("facebook", foundryShareUrl(), "Foundry Battle Plan")} target="_blank" rel="noreferrer" onClick={() => void copyFoundryShareLink()}><BrandLogo brand="facebook" /><span>Facebook</span></a>
              <a className="brand-share linkedin" href={socialShareUrl("linkedin", foundryShareUrl(), "Foundry Battle Plan")} target="_blank" rel="noreferrer" onClick={() => void copyFoundryShareLink()}><BrandLogo brand="linkedin" /><span>LinkedIn</span></a>
              <a className="brand-share telegram" href={socialShareUrl("telegram", foundryShareUrl(), "Foundry Battle Plan", `Legion ${foundryLegion} Foundry battle plan`)} target="_blank" rel="noreferrer" onClick={() => void copyFoundryShareLink()}><BrandLogo brand="telegram" /><span>Telegram</span></a>
              <a className="brand-share email" href={socialShareUrl("email", foundryShareUrl(), "Foundry Battle Plan", `Legion ${foundryLegion} Foundry battle plan`)} onClick={() => void copyFoundryShareLink()}><BrandLogo brand="email" /><span>Email</span></a>
            </div>
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
                  <WosPlayerAvatar src={viewerImage.player.avatarImage} />
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

      {shareTemplateTarget && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={`Share ${shareTemplateTarget.title}`} onClick={() => setShareTemplateTarget(null)}>
          <section className="share-modal" onClick={(event) => event.stopPropagation()}>
            <button className="close-button" type="button" onClick={() => setShareTemplateTarget(null)} aria-label="Close">x</button>
            <div className="share-modal-head">
              {shareTemplateTarget.imageUrl ? <img src={shareTemplateTarget.imageUrl} alt="" /> : <span><Icon name="message" /></span>}
              <div>
                <h2>Share Template</h2>
                <p>{shareTemplateTarget.title}</p>
              </div>
            </div>
            <div className="share-preview-row">
              <div className="share-url-box">
                <span>{templateShareUrlFor(shareTemplateTarget)}</span>
                <button type="button" onClick={() => void shareMessageTemplate(shareTemplateTarget)} aria-label="Copy template URL">
                  <Icon name="copy" />
                </button>
              </div>
              <img className="share-qr" src={qrCodeUrlFor(templateShareUrlFor(shareTemplateTarget))} alt="Template share QR code" />
            </div>
            <div className="share-icon-row share-option-grid">
              <button type="button" onClick={() => void shareMessageTemplate(shareTemplateTarget, "native")}><Icon name="share" />Native</button>
              <button type="button" onClick={() => void shareMessageTemplate(shareTemplateTarget)}><Icon name="copy" />Copy</button>
              <a href={templateShareUrlFor(shareTemplateTarget)} target="_blank" rel="noreferrer"><Icon name="external" />Open</a>
              {shareTemplateTarget.imageUrl && <button type="button" onClick={() => { setTemplateViewer(shareTemplateTarget); setShareTemplateTarget(null); }}><Icon name="image" />Image</button>}
              <a className="brand-share whatsapp" href={socialShareUrl("whatsapp", templateShareUrlFor(shareTemplateTarget), shareTemplateTarget.title, `${shareTemplateTarget.title} message template`)} target="_blank" rel="noreferrer" onClick={() => void shareMessageTemplate(shareTemplateTarget)}><BrandLogo brand="whatsapp" /><span>WhatsApp</span></a>
              <a className="brand-share discord" href={socialShareUrl("discord", templateShareUrlFor(shareTemplateTarget), shareTemplateTarget.title, `${shareTemplateTarget.title} message template`)} target="_blank" rel="noreferrer" onClick={() => void shareMessageTemplate(shareTemplateTarget)}><BrandLogo brand="discord" /><span>Discord</span></a>
              <a className="brand-share x" href={socialShareUrl("x", templateShareUrlFor(shareTemplateTarget), shareTemplateTarget.title, `${shareTemplateTarget.title} message template`)} target="_blank" rel="noreferrer" onClick={() => void shareMessageTemplate(shareTemplateTarget)}><BrandLogo brand="x" /><span>X</span></a>
              <a className="brand-share facebook" href={socialShareUrl("facebook", templateShareUrlFor(shareTemplateTarget), shareTemplateTarget.title)} target="_blank" rel="noreferrer" onClick={() => void shareMessageTemplate(shareTemplateTarget)}><BrandLogo brand="facebook" /><span>Facebook</span></a>
              <a className="brand-share linkedin" href={socialShareUrl("linkedin", templateShareUrlFor(shareTemplateTarget), shareTemplateTarget.title)} target="_blank" rel="noreferrer" onClick={() => void shareMessageTemplate(shareTemplateTarget)}><BrandLogo brand="linkedin" /><span>LinkedIn</span></a>
              <a className="brand-share telegram" href={socialShareUrl("telegram", templateShareUrlFor(shareTemplateTarget), shareTemplateTarget.title, `${shareTemplateTarget.title} message template`)} target="_blank" rel="noreferrer" onClick={() => void shareMessageTemplate(shareTemplateTarget)}><BrandLogo brand="telegram" /><span>Telegram</span></a>
              <a className="brand-share email" href={socialShareUrl("email", templateShareUrlFor(shareTemplateTarget), shareTemplateTarget.title, `${shareTemplateTarget.title} message template`)} onClick={() => void shareMessageTemplate(shareTemplateTarget)}><BrandLogo brand="email" /><span>Email</span></a>
            </div>
          </section>
        </div>
      )}

      {shareSneakPeekOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={`Share ${sneakPeekTitle}`} onClick={() => setShareSneakPeekOpen(false)}>
          <section className="share-modal" onClick={(event) => event.stopPropagation()}>
            <button className="close-button" type="button" onClick={() => setShareSneakPeekOpen(false)} aria-label="Close">x</button>
            <div className="share-modal-head">
              <img src="/sneak-peek/sneak-01.png" alt="" />
              <div>
                <h2>Share Sneak Peek</h2>
                <p>{sneakPeekTitle}</p>
              </div>
            </div>
            <div className="share-preview-row">
              <div className="share-url-box">
                <span>{sneakPeekShareUrl()}</span>
                <button type="button" onClick={() => void shareSneakPeek()} aria-label="Copy sneak peek URL">
                  <Icon name="copy" />
                </button>
              </div>
              <img className="share-qr" src={qrCodeUrlFor(sneakPeekShareUrl())} alt="Sneak peek share QR code" />
            </div>
            <div className="share-icon-row share-option-grid">
              <button type="button" onClick={() => void shareSneakPeek("native")}><Icon name="share" />Native</button>
              <button type="button" onClick={() => void shareSneakPeek()}><Icon name="copy" />Copy</button>
              <a href={sneakPeekShareUrl()} target="_blank" rel="noreferrer"><Icon name="external" />Open</a>
              <a className="brand-share whatsapp" href={socialShareUrl("whatsapp", sneakPeekShareUrl(), sneakPeekTitle, sneakPeekShareText)} target="_blank" rel="noreferrer" onClick={() => void shareSneakPeek()}><BrandLogo brand="whatsapp" /><span>WhatsApp</span></a>
              <a className="brand-share discord" href={socialShareUrl("discord", sneakPeekShareUrl(), sneakPeekTitle, sneakPeekShareText)} target="_blank" rel="noreferrer" onClick={() => void shareSneakPeek()}><BrandLogo brand="discord" /><span>Discord</span></a>
              <a className="brand-share x" href={socialShareUrl("x", sneakPeekShareUrl(), sneakPeekTitle, sneakPeekShareText)} target="_blank" rel="noreferrer" onClick={() => void shareSneakPeek()}><BrandLogo brand="x" /><span>X</span></a>
              <a className="brand-share facebook" href={socialShareUrl("facebook", sneakPeekShareUrl(), sneakPeekTitle)} target="_blank" rel="noreferrer" onClick={() => void shareSneakPeek()}><BrandLogo brand="facebook" /><span>Facebook</span></a>
              <a className="brand-share linkedin" href={socialShareUrl("linkedin", sneakPeekShareUrl(), sneakPeekTitle)} target="_blank" rel="noreferrer" onClick={() => void shareSneakPeek()}><BrandLogo brand="linkedin" /><span>LinkedIn</span></a>
              <a className="brand-share telegram" href={socialShareUrl("telegram", sneakPeekShareUrl(), sneakPeekTitle, sneakPeekShareText)} target="_blank" rel="noreferrer" onClick={() => void shareSneakPeek()}><BrandLogo brand="telegram" /><span>Telegram</span></a>
              <a className="brand-share email" href={socialShareUrl("email", sneakPeekShareUrl(), sneakPeekTitle, sneakPeekShareText)} onClick={() => void shareSneakPeek()}><BrandLogo brand="email" /><span>Email</span></a>
            </div>
          </section>
        </div>
      )}

      {shareIslandTarget && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={`Share ${shareIslandTarget.title}`} onClick={() => setShareIslandTarget(null)}>
          <section className="share-modal" onClick={(event) => event.stopPropagation()}>
            <button className="close-button" type="button" onClick={() => setShareIslandTarget(null)} aria-label="Close">x</button>
            <div className="share-modal-head">
              <img src={shareIslandTarget.imageUrl} alt="" />
              <div>
                <h2>Share Island</h2>
                <p>{shareIslandTarget.title}</p>
              </div>
            </div>
            <div className="share-preview-row">
              <div className="share-url-box">
                <span>{shareUrlFor(shareIslandTarget)}</span>
                <button type="button" onClick={() => shareIsland(shareIslandTarget)} aria-label="Copy island URL">
                  <Icon name="copy" />
                </button>
              </div>
              <img className="share-qr" src={qrCodeUrlFor(shareUrlFor(shareIslandTarget))} alt="Island share QR code" />
            </div>
            <div className="share-icon-row share-option-grid">
              <button type="button" onClick={() => void shareIsland(shareIslandTarget, "native")}><Icon name="share" />Native</button>
              <button type="button" onClick={() => shareIsland(shareIslandTarget)}><Icon name="copy" />Copy</button>
              <a href={shareUrlFor(shareIslandTarget)} target="_blank" rel="noreferrer"><Icon name="external" />Open</a>
              <button type="button" onClick={() => { setShareIslandTarget(null); void loadComments(shareIslandTarget); }}><Icon name="image" />Image</button>
              <a className="brand-share whatsapp" href={socialShareUrl("whatsapp", shareUrlFor(shareIslandTarget), shareIslandTarget.title, `${shareIslandTarget.title} by ${shareIslandTarget.player.nickname}`)} target="_blank" rel="noreferrer" onClick={() => void shareIsland(shareIslandTarget)}><BrandLogo brand="whatsapp" /><span>WhatsApp</span></a>
              <a className="brand-share discord" href={socialShareUrl("discord", shareUrlFor(shareIslandTarget), shareIslandTarget.title, `${shareIslandTarget.title} by ${shareIslandTarget.player.nickname}`)} target="_blank" rel="noreferrer" onClick={() => void shareIsland(shareIslandTarget)}><BrandLogo brand="discord" /><span>Discord</span></a>
              <a className="brand-share x" href={socialShareUrl("x", shareUrlFor(shareIslandTarget), shareIslandTarget.title, `${shareIslandTarget.title} by ${shareIslandTarget.player.nickname}`)} target="_blank" rel="noreferrer" onClick={() => void shareIsland(shareIslandTarget)}><BrandLogo brand="x" /><span>X</span></a>
              <a className="brand-share facebook" href={socialShareUrl("facebook", shareUrlFor(shareIslandTarget), shareIslandTarget.title)} target="_blank" rel="noreferrer" onClick={() => void shareIsland(shareIslandTarget)}><BrandLogo brand="facebook" /><span>Facebook</span></a>
              <a className="brand-share linkedin" href={socialShareUrl("linkedin", shareUrlFor(shareIslandTarget), shareIslandTarget.title)} target="_blank" rel="noreferrer" onClick={() => void shareIsland(shareIslandTarget)}><BrandLogo brand="linkedin" /><span>LinkedIn</span></a>
              <a className="brand-share telegram" href={socialShareUrl("telegram", shareUrlFor(shareIslandTarget), shareIslandTarget.title, `${shareIslandTarget.title} by ${shareIslandTarget.player.nickname}`)} target="_blank" rel="noreferrer" onClick={() => void shareIsland(shareIslandTarget)}><BrandLogo brand="telegram" /><span>Telegram</span></a>
              <a className="brand-share email" href={socialShareUrl("email", shareUrlFor(shareIslandTarget), shareIslandTarget.title, `${shareIslandTarget.title} by ${shareIslandTarget.player.nickname}`)} onClick={() => void shareIsland(shareIslandTarget)}><BrandLogo brand="email" /><span>Email</span></a>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

