"use client";
/* eslint-disable @next/next/no-img-element */
import Image from "next/image";
import type { CSSProperties, ChangeEvent, FormEvent, PointerEvent as ReactPointerEvent, ReactNode, WheelEvent as ReactWheelEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Island = {
  id: string;
  title: string;
  creatorName: string;
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

const apiBase =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:3001"
    : "");

const botFrontendUrl =
  process.env.NEXT_PUBLIC_BOT_FRONTEND_URL || "https://bot.whiteoutsurvival.dev/";

const FOOTER_IDLE_DELAY_MS = 5 * 60 * 1000;
const FOOTER_INTENT_DELAY_MS = 450;
const FOOTER_HIDE_DELAY_MS = 900;

const menuItems = [
  { label: "Browse", icon: "grid" },
  { label: "Calculators", icon: "calculator" },
  { label: "Tools", icon: "wrench" },
  { label: "Database", icon: "database" },
  { label: "More", icon: "book" },
];

const sidebarItems = [
  { label: "Home", icon: "home", href: "#home" },
  { label: "City Layout Planner", icon: "grid", href: "#city-layout-planner" },
  { label: "Daybreak Island", icon: "island", href: "#daybreak" },
  { label: "Discord Bot", icon: "bot", href: "#discord-bot" },
];

const plannerGridSize = 28;
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

const starterIslands: Island[] = [
  {
    id: "starter-tree-of-life",
    title: "Tree of Life Plaza",
    creatorName: "WhiteoutSurvival.dev",
    description: "A reference Daybreak Island build centered around the Tree of Life with clean symmetrical paths.",
    playerId: "000000000",
    coordinates: { x: 512, y: 512 },
    player: {
      playerId: "000000000",
      nickname: "WhiteoutSurvival.dev",
      stateId: "Public",
      furnaceLevel: 30,
      furnaceLevelFormatted: "30",
    },
    server: "Public",
    alliance: "Community",
    tags: ["Tree of Life", "Symmetry", "Plaza"],
    imageUrl: "/daybreak-island-tree-of-life.webp",
    likes: 128,
    shares: 36,
    commentsCount: 2,
    createdAt: new Date().toISOString(),
  },
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

export default function Home() {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [layoutOpen, setLayoutOpen] = useState(false);
  const [collapsedSidebar, setCollapsedSidebar] = useState(false);
  const [hideTopNav, setHideTopNav] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [resizingSidebar, setResizingSidebar] = useState(false);
  const [contentWidth, setContentWidth] = useState<"centered" | "full">("centered");
  const [loginOpen, setLoginOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authStatus, setAuthStatus] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return new URLSearchParams(window.location.search).get("auth_error") || "";
  });
  const [linkingPlayer, setLinkingPlayer] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadImageLabel, setUploadImageLabel] = useState("No image selected");
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState("");
  const [viewerImage, setViewerImage] = useState<Island | null>(null);
  const [shareIslandTarget, setShareIslandTarget] = useState<Island | null>(null);
  const [comments, setComments] = useState<IslandComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentSaving, setCommentSaving] = useState(false);
  const [playerLookup, setPlayerLookup] = useState<PlayerProfile | null>(null);
  const [playerLookupStatus, setPlayerLookupStatus] = useState("");
  const [fetchingPlayer, setFetchingPlayer] = useState(false);
  const [likedIslands, setLikedIslands] = useState<Record<string, boolean>>({});
  const [activeMenu, setActiveMenu] = useState<"home" | "planner" | "daybreak" | "bot">("home");
  const [islands, setIslands] = useState<Island[]>(starterIslands);
  const [linkedIslandId, setLinkedIslandId] = useState("");
  const [footerVisible, setFooterVisible] = useState(false);
  const [sort, setSort] = useState<"recent" | "popular">("popular");
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
  const [viewerId] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }

    const stored = localStorage.getItem("daybreak-viewer-id") || crypto.randomUUID();
    localStorage.setItem("daybreak-viewer-id", stored);
    return stored;
  });
  const effectiveSidebarWidth = collapsedSidebar ? 48 : sidebarWidth;

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
    const syncMenuFromHash = () => {
      const params = new URLSearchParams(window.location.search);
      const hash = window.location.hash;
      const daybreakHashes = new Set(["#daybreak", "#showcase", "#upload"]);
      const botHashes = new Set(["#discord-bot", "#bot"]);
      const plannerHashes = new Set(["#city-layout-planner", "#layout-planner", "#planner"]);
      setActiveMenu(
        params.get("menu") === "daybreak" ||
          params.has("island") ||
          window.location.pathname.startsWith("/daybreak/island/") ||
          daybreakHashes.has(hash) ||
          hash.startsWith("#island-")
          ? "daybreak"
          : params.get("menu") === "bot" || botHashes.has(hash)
            ? "bot"
          : params.get("menu") === "planner" || plannerHashes.has(hash)
            ? "planner"
          : "home",
      );
    };

    syncMenuFromHash();
    window.addEventListener("hashchange", syncMenuFromHash);

    return () => window.removeEventListener("hashchange", syncMenuFromHash);
  }, []);

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
    fetch(`${apiBase}/api/daybreak/islands?sort=${sort}`)
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: { islands: Island[] }) => {
        if (data.islands.length) {
          setIslands(data.islands);
          setStatus("");
        }
      })
      .catch(() => setStatus(""));
  }, [sort]);

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
    const response = await fetch(`${apiBase}/api/daybreak/islands?sort=${sort}`);
    if (!response.ok) {
      throw new Error("Unable to refresh islands");
    }

    const data = (await response.json()) as { islands: Island[] };
    setIslands(data.islands.length ? data.islands : starterIslands);
  };

  const loadComments = async (island: Island) => {
    setViewerImage(island);
    setComments([]);

    if (island.id.startsWith("starter")) {
      return;
    }

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
        body,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.detail || data?.error || "Upload failed");
      }

      form.reset();
      setUploadImageLabel("No image selected");
      setUploadPreviewUrl("");
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

  const updateIsland = (next: Island) => {
    setIslands((current) => current.map((island) => (island.id === next.id ? next : island)));
    setViewerImage((current) => (current?.id === next.id ? next : current));
    setShareIslandTarget((current) => (current?.id === next.id ? next : current));
  };

  const likeIsland = async (island: Island) => {
    if (island.id.startsWith("starter")) {
      setLikedIslands((current) => ({ ...current, [island.id]: true }));
      updateIsland({ ...island, likes: island.likes + 1 });
      return;
    }

    const response = await fetch(`${apiBase}/api/daybreak/islands/${island.id}/like`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ viewerId }),
    });
    const data = (await response.json()) as { island?: Island };
    if (data.island) {
      setLikedIslands((current) => ({ ...current, [island.id]: true }));
      updateIsland(data.island);
    }
  };

  const shareIsland = async (island: Island) => {
    const shareUrl = shareUrlFor(island);
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(shareUrl);
    } else {
      window.prompt("Copy island link", shareUrl);
    }

    if (island.id.startsWith("starter")) {
      updateIsland({ ...island, shares: island.shares + 1 });
      setStatus("Share link copied.");
      return;
    }

    const response = await fetch(`${apiBase}/api/daybreak/islands/${island.id}/share`, { method: "POST" });
    const data = (await response.json()) as { island?: Island };
    if (data.island) {
      updateIsland(data.island);
    }

    setStatus("Share link copied.");
  };

  const addComment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!viewerImage || viewerImage.id.startsWith("starter")) {
      setStatus("Comments are available after an island is published.");
      return;
    }

    setCommentSaving(true);
    try {
      const form = event.currentTarget;
      const body = Object.fromEntries(new FormData(form).entries());
      const response = await fetch(`${apiBase}/api/daybreak/islands/${viewerImage.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || "Unable to add comment");
      }

      if (data.island) {
        updateIsland(data.island);
      }
      setComments(data.comments || []);
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

  const plannerCells = useMemo(
    () => Array.from({ length: plannerGridSize * plannerGridSize }, (_, index) => ({
      x: index % plannerGridSize,
      y: Math.floor(index / plannerGridSize),
    })),
    [],
  );

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
    const cellWidth = rect.width / plannerGridSize;
    const cellHeight = rect.height / plannerGridSize;
    return {
      x: Math.floor((clientX - rect.left) / cellWidth),
      y: Math.floor((clientY - rect.top) / cellHeight),
    };
  };

  const clampPlannerObjectPosition = (x: number, y: number, width: number, height: number) => ({
    x: Math.min(plannerGridSize - width, Math.max(0, x)),
    y: Math.min(plannerGridSize - height, Math.max(0, y)),
  });

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

    const width = selectedPlannerTemplate.id === "obstacle" ? plannerObstacleSize : selectedPlannerTemplate.width;
    const height = selectedPlannerTemplate.id === "obstacle" ? plannerObstacleSize : selectedPlannerTemplate.height;
    const next = clampPlannerObjectPosition(plannerHoverCell.x, plannerHoverCell.y, width, height);
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

    const width = template.id === "obstacle" ? plannerObstacleSize : template.width;
    const height = template.id === "obstacle" ? plannerObstacleSize : template.height;

    if (!canPlacePlannerObject(x, y, width, height)) {
      setPlannerStatus("That space is blocked or outside the planner grid.");
      return;
    }

    const sameTypeCount = plannerObjects.filter((item) => item.type === template.id).length + 1;
    const nextObject: PlannerObject = {
      id: crypto.randomUUID(),
      type: template.id,
      label: template.id === "city" ? `City ${sameTypeCount}` : template.label,
      x,
      y,
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

  const copyPlannerCode = async () => {
    const code = encodePlannerLayout();
    setPlannerImportCode(code);
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(code);
    }
    setPlannerStatus("Layout code copied.");
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
    const cellSize = 24;
    const canvas = document.createElement("canvas");
    canvas.width = plannerGridSize * cellSize;
    canvas.height = plannerGridSize * cellSize;
    const context = canvas.getContext("2d");
    if (!context) {
      setPlannerStatus("PNG export is not available in this browser.");
      return;
    }

    context.fillStyle = theme === "dark" ? "#101314" : "#fbfaf7";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = theme === "dark" ? "rgba(255,255,255,0.12)" : "rgba(25,23,20,0.14)";
    for (let index = 0; index <= plannerGridSize; index += 1) {
      context.beginPath();
      context.moveTo(index * cellSize, 0);
      context.lineTo(index * cellSize, canvas.height);
      context.moveTo(0, index * cellSize);
      context.lineTo(canvas.width, index * cellSize);
      context.stroke();
    }

    plannerObjects.forEach((item) => {
      const template = plannerBuildings.find((building) => building.id === item.type);
      context.fillStyle = template?.color || "#64748b";
      context.globalAlpha = item.alliance === "farm" ? 0.72 : 0.92;
      context.fillRect(item.x * cellSize + 2, item.y * cellSize + 2, item.width * cellSize - 4, item.height * cellSize - 4);
      context.globalAlpha = 1;
      context.fillStyle = "#ffffff";
      context.font = "700 10px Arial";
      context.fillText(item.label.slice(0, 10), item.x * cellSize + 5, item.y * cellSize + 16);
    });

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = "city-layout-planner.png";
    link.click();
    setPlannerStatus("PNG exported.");
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

  return (
    <main
      className={`app-shell ${theme === "dark" ? "dark" : "light"} ${collapsedSidebar ? "collapsed-sidebar" : ""} ${hideTopNav ? "hide-top-nav" : ""} width-${contentWidth} ${resizingSidebar ? "resizing-sidebar" : ""}`}
      style={shellStyle}
    >
      <header className="ks-header">
        <div className="ks-header-inner">
          <a className="brand" href="#home" aria-label="WhiteoutSurvival.dev Home">
            <span className="brand-icon">
              <Image src="/wos-logo.png" alt="" width={24} height={24} />
            </span>
            <span>WhiteoutSurvival.dev</span>
          </a>

          <nav className="top-menu" aria-label="Top menu">
            {menuItems.map((item) => (
              <button type="button" className="menu-trigger" key={item.label}>
                <Icon name={item.icon} />
                {item.label}
                <Icon name="chevron" />
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
            <button className="sign-in" type="button" onClick={() => (authUser ? setProfileOpen(true) : setLoginOpen(true))}>
              {authUser?.avatarUrl ? <img src={authUser.avatarUrl} alt="" /> : <Icon name="user" />}
              {authLoading ? "Account" : authUser ? "Profile" : "Sign In"}
            </button>
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
          <div className="sidebar-content">
            {sidebarItems.map((item) => (
              <a
                className={`sidebar-item ${activeMenu === (item.label === "Home" ? "home" : item.label === "Discord Bot" ? "bot" : item.label === "City Layout Planner" ? "planner" : "daybreak") ? "active" : ""}`}
                href={item.href}
                key={item.label}
                onClick={() => setActiveMenu(item.label === "Home" ? "home" : item.label === "Discord Bot" ? "bot" : item.label === "City Layout Planner" ? "planner" : "daybreak")}
              >
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </a>
            ))}
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
                    <div className="planner-grid" role="grid" aria-label="City planner grid" ref={plannerGridRef} onPointerLeave={() => setPlannerHoverCell(null)}>
                      {plannerCells.map((cell) => (
                        <button
                          className="planner-cell"
                          type="button"
                          role="gridcell"
                          aria-label={`Cell ${cell.x}, ${cell.y}`}
                          key={`${cell.x}-${cell.y}`}
                          onPointerEnter={() => setPlannerHoverCell(cell)}
                          onFocus={() => setPlannerHoverCell(cell)}
                          onClick={() => handlePlannerCellClick(cell.x, cell.y)}
                        />
                      ))}
                      {plannerPlacementPreview && (
                        <div
                          className={`planner-placement-preview ${plannerPlacementPreview.valid ? "valid" : "invalid"}`}
                          style={{
                            gridColumn: `${plannerPlacementPreview.x + 1} / span ${plannerPlacementPreview.width}`,
                            gridRow: `${plannerPlacementPreview.y + 1} / span ${plannerPlacementPreview.height}`,
                            "--planner-object-color": plannerPlacementPreview.color,
                          } as CSSProperties}
                          aria-hidden="true"
                        >
                          <span>{plannerPlacementPreview.label}</span>
                        </div>
                      )}
                      {plannerObjects.map((item) => {
                        const template = plannerBuildings.find((building) => building.id === item.type);
                        const preview = plannerDragPreview?.id === item.id ? plannerDragPreview : null;
                        return (
                          <button
                            className={`planner-object planner-${item.type} ${item.alliance === "farm" ? "farm" : "main"} ${selectedPlannerObjectId === item.id ? "selected" : ""} ${preview && !preview.valid ? "invalid" : ""} ${preview ? "dragging" : ""}`}
                            type="button"
                            key={item.id}
                            style={{
                              gridColumn: `${(preview?.x ?? item.x) + 1} / span ${item.width}`,
                              gridRow: `${(preview?.y ?? item.y) + 1} / span ${item.height}`,
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
          ) : activeMenu === "bot" ? (
            <section className="home-page bot-page" id="discord-bot" aria-label="Discord bot">
              <a className="bot-ad" href={botFrontendUrl} target="_blank" rel="noreferrer">
                <div className="bot-ad-copy">
                  <span className="section-kicker">WOS Discord Bot</span>
                  <h1>Manage alliance automation from the bot dashboard.</h1>
                  <p>Open the separate Whiteout Survival Bot frontend for gift codes, reminders, commands, chat, moderation, and web dashboard controls.</p>
                  <span className="bot-ad-action">
                    Open Bot Dashboard
                    <Icon name="external" />
                  </span>
                </div>
                <div className="bot-ad-panel" aria-hidden="true">
                  <div className="bot-ad-window">
                    <div className="bot-ad-window-bar">
                      <span />
                      <span />
                      <span />
                    </div>
                    <div className="bot-ad-window-body">
                      <div className="bot-ad-logo">
                        <Image src="/discord-logo.png" alt="" width={48} height={48} />
                      </div>
                      <strong>Whiteout Survival Bot</strong>
                      <div className="bot-ad-lines">
                        <span />
                        <span />
                        <span />
                      </div>
                      <div className="bot-ad-stats">
                        <span>Gift Codes</span>
                        <span>Reminders</span>
                        <span>Dashboard</span>
                      </div>
                    </div>
                  </div>
                </div>
              </a>
            </section>
          ) : (
          <section className="home-page daybreak-page" id="daybreak" aria-label="Daybreak Island community showcase">
            <section className="daybreak-hero">
              <div className="daybreak-hero-copy">
                <span className="section-kicker">Community Showcase</span>
                <h1>Daybreak Island</h1>
                <p>Browse community island layouts, save inspiration with likes, upload your own build, and share island links with your alliance.</p>
                <div className="hero-actions">
                  <button className="primary-cta" type="button" onClick={() => setUploadOpen(true)}>Upload Island</button>
                  <a className="secondary-cta" href="#showcase">Explore Showcase</a>
                </div>
              </div>
              <div className="daybreak-hero-art">
                <Image src="/daybreak-island-tree-of-life.webp" alt="Daybreak Island Tree of Life showcase" width={1080} height={1042} priority />
              </div>
            </section>

            <section className="showcase-head" id="showcase">
              <div>
                <h2>Island Gallery</h2>
              </div>
              <div className="segmented daybreak-sort" aria-label="Sort islands">
                <button className={sort === "popular" ? "selected" : ""} type="button" onClick={() => setSort("popular")}>Popular</button>
                <button className={sort === "recent" ? "selected" : ""} type="button" onClick={() => setSort("recent")}>Recent</button>
              </div>
            </section>

            {status && <p className="daybreak-status">{status}</p>}

            <section className="island-grid">
              {islands.map((island) => (
                <article className={`island-card ${linkedIslandId === island.id ? "island-card-linked" : ""}`} id={`island-${island.id}`} key={island.id}>
                  <button className="island-image" type="button" onClick={() => loadComments(island)} aria-label={`Open ${island.title}`}>
                    <Image src={island.imageUrl} alt={island.title} width={720} height={520} />
                  </button>
                  <div className="island-card-body">
                    <h3 className="compact-island-title">{island.title}</h3>
                    <div className="player-strip">
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
                    <div className="compact-meta">
                      <span>S{island.player.stateId || island.server || "N/A"}</span>
                      <span>{`Furnace ${furnaceDisplay(island.player)}`}</span>
                      <span>X:{island.coordinates.x} Y:{island.coordinates.y}</span>
                    </div>
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
                    </div>
                  </div>
                </article>
              ))}
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
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Sign In">
          <section className="login-modal">
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
        <div className="modal-backdrop profile-backdrop" role="dialog" aria-modal="true" aria-label="Profile">
          <section className="profile-modal">
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
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Upload Daybreak Island">
          <section className="upload-modal">
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
                <span>Player ID</span>
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
              <label>
                Tags
                <input name="tags" placeholder="Tree, Plaza, Symmetry" />
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

      {viewerImage && (
        <div className="modal-backdrop image-viewer-backdrop" role="dialog" aria-modal="true" aria-label={viewerImage.title}>
          <section className="island-detail-modal">
            <button className="close-button" type="button" onClick={() => setViewerImage(null)} aria-label="Close">x</button>
            <div className="island-detail-media">
              <img src={viewerImage.imageUrl} alt={viewerImage.title} />
            </div>
            <div className="island-detail-panel">
              <div>
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
                <span>State {viewerImage.player.stateId || viewerImage.server || "N/A"}</span>
                <span>Furnace {furnaceDisplay(viewerImage.player)}</span>
                <span>X:{viewerImage.coordinates.x} Y:{viewerImage.coordinates.y}</span>
                <span>{viewerImage.likes} likes | {viewerImage.shares} shares</span>
              </div>
              {viewerImage.tags.length > 0 && (
                <div className="tag-row">
                  {viewerImage.tags.map((tag) => <span key={tag}>{tag}</span>)}
                </div>
              )}
              <div className="detail-actions">
                <button type="button" onClick={() => likeIsland(viewerImage)}>Like</button>
                <button type="button" onClick={() => setShareIslandTarget(viewerImage)}>Share Link</button>
              </div>
              <section className="comments-panel">
                <h3>Comments</h3>
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
                  <input name="authorName" maxLength={60} placeholder="Name" required disabled={viewerImage.id.startsWith("starter")} />
                  <textarea name="message" maxLength={360} placeholder="Add a comment" required disabled={viewerImage.id.startsWith("starter")} />
                  <button type="submit" disabled={commentSaving || viewerImage.id.startsWith("starter")}>{commentSaving ? "Posting..." : "Post Comment"}</button>
                </form>
              </section>
            </div>
          </section>
        </div>
      )}

      {shareIslandTarget && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={`Share ${shareIslandTarget.title}`}>
          <section className="share-modal">
            <button className="close-button" type="button" onClick={() => setShareIslandTarget(null)} aria-label="Close">x</button>
            <h2>Share Island</h2>
            <p>{shareIslandTarget.title}</p>
            <div className="share-url-box">{shareUrlFor(shareIslandTarget)}</div>
            <div className="share-icon-row">
              <button type="button" onClick={() => shareIsland(shareIslandTarget)}>Copy</button>
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
