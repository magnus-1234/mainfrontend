"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";

type PlannerTab = "schedule" | "settings" | "analytics" | "howto";

type AppointmentRole = {
  id: "education" | "vicePresident";
  name: string;
  shortName: string;
  focus: string;
  image: string;
};

type PlayerProfile = {
  playerId: string;
  nickname: string;
  furnaceLevel?: number;
  furnaceLevelFormatted?: string;
  avatarImage?: string;
  alliance?: string;
};

type ResourceKey = "constructionSpeedup" | "trainingSpeedup" | "researchSpeedup" | "fireCrystal" | "fireCrystalShards";

type AppointmentResources = Record<ResourceKey, string>;

type AppointmentSlot = {
  playerId: string;
  playerName: string;
  furnace: string;
  alliance: string;
  avatarImage: string;
  description: string;
  resources: AppointmentResources;
  confirmed: boolean;
  loading?: boolean;
  status?: string;
};

type PlannerState = Record<AppointmentRole["id"], Record<string, AppointmentSlot>>;

type SavedPlanner = {
  plannerName?: string;
  plannerState?: PlannerState;
  selectedRoleId?: AppointmentRole["id"];
  slotMinutes?: number;
  startTime?: string;
};

const storageKey = "wos-svs-appointment-planner-v2";
const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "";

const appointmentRoles: AppointmentRole[] = [
  {
    id: "education",
    name: "Minister of Education",
    shortName: "Education",
    focus: "Training appointment: +50% training speed and +200 training capacity.",
    image: "/wiki/buildings/dawn-academy/256b457966c8.png",
  },
  {
    id: "vicePresident",
    name: "Vice President",
    shortName: "Vice President",
    focus: "Prep appointment: +10% research, construction, and training speed.",
    image: "/vendor/krozac-wos-interactive-map/sunfire.png",
  },
];

const plannerLogo = "/whiteout-survival-logo.png";
const plannerMark = "/wos-logo.png";

const resourceItems: { key: ResourceKey; label: string; icon: string }[] = [
  { key: "constructionSpeedup", label: "Construction Speedup", icon: "/svs-resources/construction-speedup.webp" },
  { key: "trainingSpeedup", label: "Training Speedup", icon: "/svs-resources/training-speedup.webp" },
  { key: "researchSpeedup", label: "Research Speedup", icon: "/svs-resources/research-speedup.webp" },
  { key: "fireCrystal", label: "Fire Crystal", icon: "/svs-resources/fire-crystal.png" },
  { key: "fireCrystalShards", label: "Fire Crystal Shards", icon: "/svs-resources/fire-crystal-shard.png" },
];

const emptyResources = (): AppointmentResources => ({
  constructionSpeedup: "",
  trainingSpeedup: "",
  researchSpeedup: "",
  fireCrystal: "",
  fireCrystalShards: "",
});

const createEmptySlot = (): AppointmentSlot => ({
  playerId: "",
  playerName: "",
  furnace: "",
  alliance: "",
  avatarImage: "",
  description: "",
  resources: emptyResources(),
  confirmed: false,
});

const savedPlanner = (): SavedPlanner | null => {
  if (typeof window === "undefined") return null;
  try {
    const saved = window.localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) as SavedPlanner : null;
  } catch {
    return null;
  }
};

const normalizeTime = (value: string) => value || "00:00";

const minutesFromTime = (value: string) => {
  const [hours, minutes] = normalizeTime(value).split(":").map((part) => Number(part));
  return (Number.isFinite(hours) ? hours : 0) * 60 + (Number.isFinite(minutes) ? minutes : 0);
};

const timeFromMinutes = (value: number) => {
  const normalized = ((value % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

const localTimeFor = (utcTime: string) => {
  const [hours, minutes] = utcTime.split(":").map((part) => Number(part));
  const date = new Date();
  date.setUTCHours(hours || 0, minutes || 0, 0, 0);
  return new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(date);
};

const slotKeyFor = (startMinutes: number, slotMinutes: number, index: number) =>
  `${timeFromMinutes(startMinutes + index * slotMinutes)}-${timeFromMinutes(startMinutes + (index + 1) * slotMinutes)}`;

const slotTimeFor = (key: string) => key.replace("-", " - ");

const normalizeAvatarUrl = (value?: string) => {
  if (!value) return "";
  if (value.startsWith("http")) return value;
  if (value.startsWith("//")) return `https:${value}`;
  if (value.startsWith("/")) return value;
  return `https://gof-formal-avatar-cdn.centurygame.com/${value.replace(/^\/+/, "")}`;
};

const proxiedAvatarUrl = (value?: string) => {
  const normalized = normalizeAvatarUrl(value);
  return normalized && normalized.startsWith("http") ? `/api/avatar-proxy?url=${encodeURIComponent(normalized)}` : normalized;
};

const playerFromPayload = (data: unknown): PlayerProfile | undefined => {
  const record = data as {
    data?: unknown;
    player?: unknown;
    result?: unknown;
    profile?: unknown;
  };
  const payload = (record?.player || record?.data || record?.result || record?.profile || data) as {
    avatar?: string;
    avatarImage?: string;
    avatarUrl?: string;
    avatar_image?: string;
    avatar_url?: string;
    furnace?: number;
    furnaceLevel?: number;
    furnaceLevelFormatted?: string;
    furnace_lv?: number;
    id?: number | string;
    name?: string;
    nickname?: string;
    playerId?: string;
    alliance?: string;
  };
  const playerId = String(payload?.playerId || payload?.id || "");
  if (!playerId) return undefined;
  const furnaceLevel = payload.furnaceLevel ?? payload.furnace_lv ?? payload.furnace;
  return {
    playerId,
    nickname: payload.nickname || payload.name || "Unknown Player",
    furnaceLevel,
    furnaceLevelFormatted: payload.furnaceLevelFormatted,
    avatarImage: proxiedAvatarUrl(payload.avatarImage || payload.avatarUrl || payload.avatar_url || payload.avatar || payload.avatar_image),
    alliance: payload.alliance || "",
  };
};

const furnaceDisplay = (player: PlayerProfile) =>
  player.furnaceLevelFormatted || (player.furnaceLevel ? String(player.furnaceLevel) : "");

const hasResources = (resources: AppointmentResources) =>
  resourceItems.some((item) => resources[item.key].trim());

const filled = (slot: AppointmentSlot) =>
  Boolean(slot.playerId.trim() || slot.playerName.trim() || slot.description.trim() || hasResources(slot.resources));

const resourceSummary = (resources: AppointmentResources) => {
  const selected = resourceItems
    .filter((item) => resources[item.key].trim())
    .map((item) => `${item.label}: ${resources[item.key].trim()}`);
  return selected.length ? selected.join(", ") : "No resources";
};

const csvFor = (plannerName: string, role: AppointmentRole, rows: { key: string; utcStart: string; utcEnd: string; local: string; slot: AppointmentSlot }[]) => {
  const escape = (value: string | boolean) => `"${String(value).replace(/"/g, '""').replace(/\r?\n/g, " ")}"`;
  return [
    "sep=,",
    [
      "Plan Name",
      "Role",
      "Slot",
      "Start UTC",
      "End UTC",
      "Local Start",
      "Status",
      "Player ID",
      "Player Name",
      "Furnace Level",
      "Alliance",
      "Confirmed",
      "Description",
      ...resourceItems.map((item) => item.label),
    ].map(escape).join(","),
    ...rows.map((row) => [
      plannerName,
      role.name,
      row.key,
      row.utcStart,
      row.utcEnd,
      row.local,
      filled(row.slot) ? "Filled" : "Open",
      row.slot.playerId,
      row.slot.playerName,
      row.slot.furnace,
      row.slot.alliance,
      row.slot.confirmed ? "Yes" : "No",
      row.slot.description,
      ...resourceItems.map((item) => row.slot.resources[item.key]),
    ].map(escape).join(",")),
  ].join("\n");
};

const filePart = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "svs-appointments";

export default function SvsAppointmentPlanner() {
  const [activeTab, setActiveTab] = useState<PlannerTab>("schedule");
  const [selectedRoleId, setSelectedRoleId] = useState<AppointmentRole["id"]>(() => savedPlanner()?.selectedRoleId || "education");
  const [startTime, setStartTime] = useState(() => savedPlanner()?.startTime || "00:00");
  const [slotMinutes, setSlotMinutes] = useState(() => savedPlanner()?.slotMinutes === 60 ? 60 : 30);
  const [plannerName, setPlannerName] = useState(() => savedPlanner()?.plannerName || "SvS Appointment Plan");
  const [plannerState, setPlannerState] = useState<PlannerState>(() => savedPlanner()?.plannerState || { education: {}, vicePresident: {} });
  const [editingResource, setEditingResource] = useState<{ roleId: AppointmentRole["id"]; slotKey: string } | null>(null);
  const [notice, setNotice] = useState("");
  const [exportingPng, setExportingPng] = useState(false);

  const selectedRole = appointmentRoles.find((role) => role.id === selectedRoleId) || appointmentRoles[0];
  const startMinutes = minutesFromTime(startTime);
  const slotsPerDay = Math.floor(1440 / slotMinutes);

  const rows = useMemo(() => Array.from({ length: slotsPerDay }, (_, index) => {
    const key = slotKeyFor(startMinutes, slotMinutes, index);
    const utcStart = timeFromMinutes(startMinutes + index * slotMinutes);
    return {
      key,
      utcStart,
      utcEnd: timeFromMinutes(startMinutes + (index + 1) * slotMinutes),
      utc: `${slotTimeFor(key)} UTC`,
      local: localTimeFor(utcStart),
      slot: plannerState[selectedRole.id]?.[key] || createEmptySlot(),
    };
  }), [plannerState, selectedRole.id, slotMinutes, slotsPerDay, startMinutes]);

  const roleStats = useMemo(() => appointmentRoles.map((role) => {
    const slots = Array.from({ length: slotsPerDay }, (_, index) => {
      const key = slotKeyFor(startMinutes, slotMinutes, index);
      return plannerState[role.id]?.[key] || createEmptySlot();
    });
    const filledCount = slots.filter(filled).length;
    const confirmedCount = slots.filter((slot) => slot.confirmed).length;
    return { role, filledCount, confirmedCount, total: slotsPerDay };
  }), [plannerState, slotMinutes, slotsPerDay, startMinutes]);

  const selectedRoleStats = roleStats.find((row) => row.role.id === selectedRole.id) || roleStats[0];
  const selectedCoverage = selectedRoleStats?.total ? Math.round((selectedRoleStats.filledCount / selectedRoleStats.total) * 100) : 0;
  const selectedOpenSlots = selectedRoleStats ? selectedRoleStats.total - selectedRoleStats.filledCount : 0;

  const editingSlot = editingResource ? plannerState[editingResource.roleId]?.[editingResource.slotKey] || createEmptySlot() : undefined;

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify({
      plannerName,
      plannerState,
      selectedRoleId,
      slotMinutes,
      startTime,
    }));
  }, [plannerName, plannerState, selectedRoleId, slotMinutes, startTime]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 3200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const updateSlot = (roleId: AppointmentRole["id"], key: string, updates: Partial<AppointmentSlot>) => {
    setPlannerState((current) => ({
      ...current,
      [roleId]: {
        ...current[roleId],
        [key]: {
          ...(current[roleId]?.[key] || createEmptySlot()),
          ...updates,
        },
      },
    }));
  };

  const fetchPlayer = async (key: string, playerId: string) => {
    const cleanedPlayerId = playerId.replace(/\D/g, "");
    updateSlot(selectedRole.id, key, { playerId: cleanedPlayerId, loading: false, status: "" });
    if (!cleanedPlayerId) return;
    if (!/^\d{8,9}$/.test(cleanedPlayerId)) {
      updateSlot(selectedRole.id, key, { status: "Enter an 8 or 9 digit ID." });
      return;
    }

    updateSlot(selectedRole.id, key, { loading: true, status: "Fetching..." });
    try {
      const response = await fetch(`${apiBase}/api/daybreak/players/${cleanedPlayerId}`);
      const data = await response.json().catch(() => null);
      const player = playerFromPayload(data);
      if (!response.ok || !player) {
        updateSlot(selectedRole.id, key, { loading: false, status: "Not found" });
        return;
      }
      updateSlot(selectedRole.id, key, {
        playerId: cleanedPlayerId,
        playerName: player.nickname,
        furnace: furnaceDisplay(player),
        alliance: player.alliance || "",
        avatarImage: player.avatarImage || "",
        loading: false,
        status: "",
      });
    } catch {
      updateSlot(selectedRole.id, key, { loading: false, status: "Lookup failed" });
    }
  };

  const clearCurrentRole = () => {
    setPlannerState((current) => ({ ...current, [selectedRole.id]: {} }));
    setNotice(`${selectedRole.name} schedule cleared.`);
  };

  const downloadCsv = () => {
    const blob = new Blob([`\uFEFF${csvFor(plannerName, selectedRole, rows)}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filePart(plannerName)}-${selectedRole.id}-appointments.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setNotice("CSV downloaded.");
  };

  const downloadPng = async () => {
    setExportingPng(true);
    try {
      const loadImage = (src: string) => new Promise<HTMLImageElement | null>((resolve) => {
        if (!src) {
          resolve(null);
          return;
        }
        const image = new Image();
        image.crossOrigin = "anonymous";
        image.onload = () => resolve(image);
        image.onerror = () => resolve(null);
        image.src = src;
      });

      const filledRows = rows.filter((row) => filled(row.slot));
      const exportRows = filledRows.length ? filledRows : rows.slice(0, Math.min(8, rows.length));
      const width = 1200;
      const rowHeight = 82;
      const height = 230 + exportRows.length * rowHeight + 56;
      const scale = 2;
      const canvas = document.createElement("canvas");
      canvas.width = width * scale;
      canvas.height = height * scale;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas not available");
      context.scale(scale, scale);

      const [logo, mark, roleImage, resourceImages, avatarImages] = await Promise.all([
        loadImage(plannerLogo),
        loadImage(plannerMark),
        loadImage(selectedRole.image),
        Promise.all(resourceItems.map((item) => loadImage(item.icon))),
        Promise.all(exportRows.map((row) => loadImage(row.slot.avatarImage))),
      ]);

      const roundedRect = (x: number, y: number, rectWidth: number, rectHeight: number, radius: number, fill: string, stroke?: string) => {
        context.beginPath();
        context.moveTo(x + radius, y);
        context.lineTo(x + rectWidth - radius, y);
        context.quadraticCurveTo(x + rectWidth, y, x + rectWidth, y + radius);
        context.lineTo(x + rectWidth, y + rectHeight - radius);
        context.quadraticCurveTo(x + rectWidth, y + rectHeight, x + rectWidth - radius, y + rectHeight);
        context.lineTo(x + radius, y + rectHeight);
        context.quadraticCurveTo(x, y + rectHeight, x, y + rectHeight - radius);
        context.lineTo(x, y + radius);
        context.quadraticCurveTo(x, y, x + radius, y);
        context.closePath();
        context.fillStyle = fill;
        context.fill();
        if (stroke) {
          context.strokeStyle = stroke;
          context.lineWidth = 1;
          context.stroke();
        }
      };

      const text = (value: string, x: number, y: number, font: string, color = "#e5edf7", align: CanvasTextAlign = "left") => {
        context.font = font;
        context.fillStyle = color;
        context.textAlign = align;
        context.textBaseline = "top";
        context.fillText(value, x, y);
      };

      const trimText = (value: string, maxWidth: number, font: string) => {
        context.font = font;
        if (context.measureText(value).width <= maxWidth) return value;
        let result = value;
        while (result.length > 3 && context.measureText(`${result}...`).width > maxWidth) {
          result = result.slice(0, -1);
        }
        return `${result}...`;
      };

      const background = context.createLinearGradient(0, 0, width, height);
      background.addColorStop(0, "#07111f");
      background.addColorStop(0.55, "#0d1420");
      background.addColorStop(1, "#10243a");
      context.fillStyle = background;
      context.fillRect(0, 0, width, height);
      roundedRect(28, 28, width - 56, height - 56, 24, "#0d1420", "#2f6f8d");

      if (roleImage) {
        context.globalAlpha = 0.18;
        context.drawImage(roleImage, width - 330, 20, 240, 240);
        context.globalAlpha = 1;
      }
      if (logo) context.drawImage(logo, 54, 46, 230, 88);
      if (mark) context.drawImage(mark, width - 126, 52, 66, 66);

      text(plannerName, 54, 142, "900 36px Arial", "#f8fafc");
      text(`${selectedRole.name} | ${startTime} UTC start | ${slotMinutes} minute slots`, 56, 184, "800 18px Arial", "#7dd3fc");

      roundedRect(766, 142, 106, 52, 10, "#172235", "#263449");
      roundedRect(886, 142, 106, 52, 10, "#172235", "#263449");
      roundedRect(1006, 142, 106, 52, 10, "#172235", "#263449");
      text(`${selectedRoleStats?.filledCount || 0}/${selectedRoleStats?.total || slotsPerDay}`, 819, 150, "900 22px Arial", "#e5edf7", "center");
      text("filled", 819, 176, "800 12px Arial", "#94a3b8", "center");
      text(`${selectedRoleStats?.confirmedCount || 0}`, 939, 150, "900 22px Arial", "#e5edf7", "center");
      text("confirmed", 939, 176, "800 12px Arial", "#94a3b8", "center");
      text(`${selectedCoverage}%`, 1059, 150, "900 22px Arial", "#e5edf7", "center");
      text("coverage", 1059, 176, "800 12px Arial", "#94a3b8", "center");

      text("UTC", 58, 224, "900 12px Arial", "#94a3b8");
      text("PLAYER", 198, 224, "900 12px Arial", "#94a3b8");
      text("DETAILS", 456, 224, "900 12px Arial", "#94a3b8");
      text("RESOURCES", 770, 224, "900 12px Arial", "#94a3b8");
      text("OK", 1084, 224, "900 12px Arial", "#94a3b8");

      exportRows.forEach((row, index) => {
        const top = 248 + index * rowHeight;
        roundedRect(48, top, width - 96, 68, 12, filled(row.slot) ? "#0f1a2a" : "#0b1220", "#263449");
        text(`${row.utcStart}-${row.utcEnd}`, 64, top + 16, "900 19px Arial", "#e5edf7");
        text(row.local, 64, top + 42, "800 12px Arial", "#94a3b8");

        const avatar = avatarImages[index];
        roundedRect(196, top + 12, 44, 44, 10, "#172235", "#2f6f8d");
        if (avatar) {
          context.save();
          context.beginPath();
          context.roundRect(196, top + 12, 44, 44, 10);
          context.clip();
          context.drawImage(avatar, 196, top + 12, 44, 44);
          context.restore();
        } else {
          text((row.slot.playerName || "?").slice(0, 1), 218, top + 22, "900 22px Arial", "#7dd3fc", "center");
        }

        text(trimText(row.slot.playerName || row.slot.playerId || "Open slot", 188, "900 18px Arial"), 252, top + 14, "900 18px Arial");
        text(trimText([row.slot.furnace ? `FC ${row.slot.furnace}` : "", row.slot.alliance].filter(Boolean).join(" | ") || "Awaiting player", 188, "800 12px Arial"), 252, top + 40, "800 12px Arial", "#94a3b8");
        text(trimText(row.slot.description || "No appointment description", 280, "800 15px Arial"), 456, top + 16, "800 15px Arial", row.slot.description ? "#e5edf7" : "#94a3b8");

        const activeResources = resourceItems.filter((item) => row.slot.resources[item.key].trim());
        if (activeResources.length) {
          activeResources.slice(0, 3).forEach((item, itemIndex) => {
            const left = 770 + itemIndex * 96;
            const resourceImage = resourceImages[resourceItems.findIndex((resource) => resource.key === item.key)];
            if (resourceImage) context.drawImage(resourceImage, left, top + 17, 24, 24);
            text(trimText(row.slot.resources[item.key], 58, "800 13px Arial"), left + 30, top + 22, "800 13px Arial", "#e5edf7");
          });
          if (activeResources.length > 3) text(`+${activeResources.length - 3}`, 1058, top + 22, "900 14px Arial", "#a7f3d0");
        } else {
          text("No resources", 770, top + 24, "800 13px Arial", "#94a3b8");
        }

        roundedRect(1078, top + 18, 32, 32, 8, row.slot.confirmed ? "#14532d" : "#172235", row.slot.confirmed ? "#a7f3d0" : "#263449");
        text(row.slot.confirmed ? "Y" : "-", 1094, top + 24, "900 16px Arial", row.slot.confirmed ? "#a7f3d0" : "#94a3b8", "center");
      });

      text("Generated by WhiteoutSurvival.dev", width / 2, height - 40, "800 14px Arial", "#94a3b8", "center");

      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `${filePart(plannerName)}-${selectedRole.id}-appointments.png`;
      link.click();
      setNotice("PNG downloaded.");
    } catch {
      setNotice("PNG export failed.");
    } finally {
      setExportingPng(false);
    }
  };

  const copySummary = async () => {
    const filledRows = rows.filter((row) => filled(row.slot));
    const message = [
      plannerName,
      `${selectedRole.name} rotation (${startTime} UTC start)`,
      ...filledRows.map((row) => [
        `${row.utc}:`,
        row.slot.playerName || row.slot.playerId || "Open",
        row.slot.furnace ? `FC ${row.slot.furnace}` : "",
        row.slot.description ? `- ${row.slot.description}` : "",
        hasResources(row.slot.resources) ? `Resources: ${resourceSummary(row.slot.resources)}` : "",
        row.slot.confirmed ? "[confirmed]" : "",
      ].filter(Boolean).join(" ")),
    ].join("\n");
    await navigator.clipboard.writeText(message);
    setNotice("Alliance summary copied.");
  };

  return (
    <section className="home-page svs-planner-page" id="svs-appointment-planner" aria-label="Whiteout Survival SvS appointment planner">
      <section className="svs-tool-hero">
        <div>
          <img className="svs-hero-logo" src={plannerLogo} alt="Whiteout Survival" />
          <span className="section-kicker">Whiteout Survival SvS</span>
          <h1>Appointment Planner</h1>
          <p>Schedule only Minister of Education and Vice President appointments. Enter a player ID to fetch player details, write the appointment description, and add resource needs from the edit resource button.</p>
        </div>
        <img className="svs-hero-art" src={selectedRole.image} alt="" />
        <div className="svs-hero-metrics" aria-label="Planner summary">
          <article><strong>{selectedRoleStats?.filledCount || 0}/{selectedRoleStats?.total || slotsPerDay}</strong><small>{selectedRole.shortName} filled</small></article>
          <article><strong>{selectedRoleStats?.confirmedCount || 0}</strong><small>confirmed</small></article>
          <article><strong>{selectedCoverage}%</strong><small>coverage</small></article>
        </div>
      </section>

      <nav className="svs-tabs" aria-label="Appointment planner sections">
        {[
          ["schedule", "Schedule"],
          ["settings", "Settings"],
          ["analytics", "Analytics"],
          ["howto", "How to Use"],
        ].map(([tab, label]) => (
          <button className={activeTab === tab ? "active" : ""} type="button" key={tab} onClick={() => setActiveTab(tab as PlannerTab)}>
            {label}
          </button>
        ))}
      </nav>

      {notice && <div className="svs-notice" role="status">{notice}</div>}

      {activeTab === "schedule" && (
        <>
          <section className="svs-role-grid" aria-label="Appointment roles">
            {roleStats.map(({ role, filledCount, confirmedCount, total }) => (
              <button className={`svs-role-card ${selectedRole.id === role.id ? "active" : ""}`} type="button" key={role.id} onClick={() => setSelectedRoleId(role.id)}>
                <span><img src={role.image} alt="" /></span>
                <strong>{role.name}</strong>
                <small>{role.focus}</small>
                <b>{filledCount}/{total} filled</b>
                <b>{confirmedCount} confirmed</b>
              </button>
            ))}
          </section>

          <section className="svs-schedule-panel" aria-label={`${selectedRole.name} rotation schedule`}>
            <header>
              <div>
                <span className="section-kicker">{selectedRole.name}</span>
                <h2>Rotation Schedule</h2>
                <p>{selectedRole.focus}</p>
              </div>
              <div className="svs-panel-actions">
                <label>
                  <span>Plan Name</span>
                  <input value={plannerName} onChange={(event) => setPlannerName(event.currentTarget.value)} />
                </label>
                <label>
                  <span>Start UTC</span>
                  <input type="time" value={startTime} onChange={(event) => setStartTime(event.currentTarget.value)} />
                </label>
                <label>
                  <span>Slot</span>
                  <select value={slotMinutes} onChange={(event) => setSlotMinutes(Number(event.currentTarget.value))}>
                    <option value={30}>30m</option>
                    <option value={60}>60m</option>
                  </select>
                </label>
                <button type="button" onClick={() => void copySummary()}>Copy</button>
                <button type="button" onClick={downloadCsv}>CSV</button>
                <button type="button" onClick={() => void downloadPng()} disabled={exportingPng}>{exportingPng ? "PNG..." : "PNG"}</button>
                <button type="button" className="danger" onClick={clearCurrentRole}>Clear</button>
              </div>
            </header>

            <div className="svs-table-wrap">
              <div className="svs-table">
                <div className="svs-row svs-head">
                  <span>Time</span>
                  <span>Player ID</span>
                  <span>Fetched Player</span>
                  <span>Description</span>
                  <span>Resources</span>
                  <span>Confirmed</span>
                </div>
                {rows.map((row) => (
                  <div className={`svs-row ${filled(row.slot) ? "filled" : ""}`} key={row.key}>
                    <div className="svs-time-cell">
                      <strong>{row.utc}</strong>
                      <span>{row.local}</span>
                    </div>
                    <div className="svs-player-id-cell">
                      <input
                        value={row.slot.playerId}
                        inputMode="numeric"
                        placeholder="Player ID"
                        onBlur={() => void fetchPlayer(row.key, row.slot.playerId)}
                        onChange={(event) => updateSlot(selectedRole.id, row.key, {
                          playerId: event.currentTarget.value.replace(/\D/g, ""),
                          playerName: "",
                          furnace: "",
                          alliance: "",
                          avatarImage: "",
                          status: "",
                        })}
                      />
                      <button type="button" onClick={() => void fetchPlayer(row.key, row.slot.playerId)} disabled={row.slot.loading}>
                        {row.slot.loading ? "..." : "Fetch"}
                      </button>
                    </div>
                    <div className="svs-player-cell">
                      <span className="svs-avatar">
                        <b>{row.slot.playerName.slice(0, 1) || "?"}</b>
                        {row.slot.avatarImage && <img src={row.slot.avatarImage} alt="" onError={(event) => { event.currentTarget.style.display = "none"; }} />}
                      </span>
                      <div>
                        <strong>{row.slot.playerName || "No player loaded"}</strong>
                        <small>{row.slot.furnace ? `FC ${row.slot.furnace}` : "Awaiting fetch"}{row.slot.alliance ? ` | ${row.slot.alliance}` : ""}</small>
                        {row.slot.status && <em>{row.slot.status}</em>}
                      </div>
                    </div>
                    <textarea value={row.slot.description} placeholder="Appointment description" onChange={(event) => updateSlot(selectedRole.id, row.key, { description: event.currentTarget.value })} />
                    <div className="svs-resource-cell">
                      <button type="button" onClick={() => setEditingResource({ roleId: selectedRole.id, slotKey: row.key })}>
                        Edit Resource
                      </button>
                      <small>{resourceSummary(row.slot.resources)}</small>
                    </div>
                    <label className="svs-confirm">
                      <input type="checkbox" checked={row.slot.confirmed} onChange={(event) => updateSlot(selectedRole.id, row.key, { confirmed: event.currentTarget.checked })} />
                      <span>{row.slot.confirmed ? "Yes" : "No"}</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      {activeTab === "settings" && (
        <section className="svs-settings" aria-label="Appointment planner settings">
          <article>
            <span className="section-kicker">Planner Setup</span>
            <h2>Settings</h2>
            <div className="svs-settings-form">
              <label>
                <span>Plan Name</span>
                <input value={plannerName} onChange={(event) => setPlannerName(event.currentTarget.value)} />
              </label>
              <label>
                <span>Start Time UTC</span>
                <input type="time" value={startTime} onChange={(event) => setStartTime(event.currentTarget.value)} />
              </label>
              <label>
                <span>Slot Length</span>
                <select value={slotMinutes} onChange={(event) => setSlotMinutes(Number(event.currentTarget.value))}>
                  <option value={30}>30 minutes</option>
                  <option value={60}>60 minutes</option>
                </select>
              </label>
              <label>
                <span>Default Role</span>
                <select value={selectedRoleId} onChange={(event) => setSelectedRoleId(event.currentTarget.value as AppointmentRole["id"])}>
                  {appointmentRoles.map((role) => <option value={role.id} key={role.id}>{role.name}</option>)}
                </select>
              </label>
            </div>
          </article>

          <article>
            <span className="section-kicker">Resource Fields</span>
            <h2>Tracked Resources</h2>
            <div className="svs-resource-reference">
              {resourceItems.map((item) => (
                <span key={item.key}><img src={item.icon} alt="" />{item.label}</span>
              ))}
            </div>
          </article>

          <article>
            <span className="section-kicker">Data</span>
            <h2>Reset Planner</h2>
            <p>Clear the current role or wipe both appointment tables. This does not change the two allowed roles.</p>
            <div className="svs-settings-actions">
              <button type="button" onClick={clearCurrentRole}>Clear Current Role</button>
              <button
                type="button"
                className="danger"
                onClick={() => {
                  setPlannerState({ education: {}, vicePresident: {} });
                  setNotice("All appointment schedules cleared.");
                }}
              >
                Clear All Schedules
              </button>
            </div>
          </article>
        </section>
      )}

      {activeTab === "analytics" && (
        <section className="svs-analytics" aria-label="Appointment planner analytics">
          <div className="svs-analytics-summary">
            <article><strong>{selectedRoleStats?.filledCount || 0}</strong><small>{selectedRole.shortName} filled slots</small></article>
            <article><strong>{selectedRoleStats?.confirmedCount || 0}</strong><small>{selectedRole.shortName} confirmed</small></article>
            <article><strong>{selectedOpenSlots}</strong><small>{selectedRole.shortName} open slots</small></article>
          </div>
          <div className="svs-analytics-bars">
            {roleStats.map(({ role, filledCount, confirmedCount, total }) => (
              <article key={role.id}>
                <header><strong>{role.name}</strong><span>{filledCount}/{total}</span></header>
                <div><span style={{ width: `${total ? (filledCount / total) * 100 : 0}%` }} /></div>
                <small>{confirmedCount} confirmed, {total - filledCount} open</small>
              </article>
            ))}
          </div>
        </section>
      )}

      {activeTab === "howto" && (
        <section className="svs-howto" aria-label="How to use the SvS appointment planner">
          {[
            ["Choose a role", "Only Minister of Education and Vice President are available."],
            ["Enter Player ID", "The planner fetches player name, furnace, avatar, and alliance data. State is intentionally not displayed."],
            ["Write details", "Use the description field for appointment purpose, timing notes, or alliance instructions."],
            ["Edit resources", "Open Edit Resource to add Construction Speedup, Training Speedup, Research Speedup, Fire Crystal, and Fire Crystal Shard counts."],
          ].map(([title, body], index) => (
            <article key={title}><span>{index + 1}</span><strong>{title}</strong><p>{body}</p></article>
          ))}
        </section>
      )}

      {editingResource && editingSlot && (
        <div className="svs-modal-backdrop" role="dialog" aria-modal="true" aria-label="Edit appointment resources" onClick={() => setEditingResource(null)}>
          <section className="svs-resource-modal" onClick={(event) => event.stopPropagation()}>
            <header>
              <div>
                <span className="section-kicker">Resources</span>
                <h2>Edit Resource Details</h2>
              </div>
              <button type="button" onClick={() => setEditingResource(null)} aria-label="Close resource editor">x</button>
            </header>
            <div className="svs-resource-editor">
              {resourceItems.map((item) => (
                <label key={item.key}>
                  <span><img src={item.icon} alt="" />{item.label}</span>
                  <input
                    value={editingSlot.resources[item.key]}
                    placeholder="Amount"
                    onChange={(event) => updateSlot(editingResource.roleId, editingResource.slotKey, {
                      resources: {
                        ...editingSlot.resources,
                        [item.key]: event.currentTarget.value,
                      },
                    })}
                  />
                </label>
              ))}
            </div>
            <footer>
              <button type="button" onClick={() => {
                updateSlot(editingResource.roleId, editingResource.slotKey, { resources: emptyResources() });
              }}>Clear Resources</button>
              <button type="button" onClick={() => setEditingResource(null)}>Done</button>
            </footer>
          </section>
        </div>
      )}
    </section>
  );
}
