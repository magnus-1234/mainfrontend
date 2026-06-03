"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";

type PlannerTab = "schedule" | "analytics" | "howto";

type AppointmentRole = {
  id: "education" | "vicePresident";
  name: string;
  shortName: string;
  focus: string;
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
    focus: "Research and learning appointment windows for SvS preparation.",
  },
  {
    id: "vicePresident",
    name: "Vice President",
    shortName: "Vice President",
    focus: "High-priority appointment coverage and backup leadership windows.",
  },
];

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
    avatarImage: normalizeAvatarUrl(payload.avatarImage || payload.avatarUrl || payload.avatar_url || payload.avatar || payload.avatar_image),
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

const csvFor = (role: AppointmentRole, rows: { utc: string; local: string; slot: AppointmentSlot }[]) => {
  const escape = (value: string | boolean) => `"${String(value).replace(/"/g, '""')}"`;
  return [
    [
      "Role",
      "Time UTC",
      "Local Time",
      "Player ID",
      "Player Name",
      "Furnace",
      "Alliance",
      "Description",
      ...resourceItems.map((item) => item.label),
      "Confirmed",
    ].map(escape).join(","),
    ...rows.map((row) => [
      role.name,
      row.utc,
      row.local,
      row.slot.playerId,
      row.slot.playerName,
      row.slot.furnace,
      row.slot.alliance,
      row.slot.description,
      ...resourceItems.map((item) => row.slot.resources[item.key]),
      row.slot.confirmed ? "Yes" : "No",
    ].map(escape).join(",")),
  ].join("\n");
};

export default function SvsAppointmentPlanner() {
  const [activeTab, setActiveTab] = useState<PlannerTab>("schedule");
  const [selectedRoleId, setSelectedRoleId] = useState<AppointmentRole["id"]>(() => savedPlanner()?.selectedRoleId || "education");
  const [startTime, setStartTime] = useState(() => savedPlanner()?.startTime || "00:00");
  const [slotMinutes, setSlotMinutes] = useState(() => savedPlanner()?.slotMinutes === 60 ? 60 : 30);
  const [plannerName, setPlannerName] = useState(() => savedPlanner()?.plannerName || "SvS Appointment Plan");
  const [plannerState, setPlannerState] = useState<PlannerState>(() => savedPlanner()?.plannerState || { education: {}, vicePresident: {} });
  const [editingResource, setEditingResource] = useState<{ roleId: AppointmentRole["id"]; slotKey: string } | null>(null);
  const [notice, setNotice] = useState("");

  const selectedRole = appointmentRoles.find((role) => role.id === selectedRoleId) || appointmentRoles[0];
  const startMinutes = minutesFromTime(startTime);
  const slotsPerDay = Math.floor(1440 / slotMinutes);

  const rows = useMemo(() => Array.from({ length: slotsPerDay }, (_, index) => {
    const key = slotKeyFor(startMinutes, slotMinutes, index);
    const utcStart = timeFromMinutes(startMinutes + index * slotMinutes);
    return {
      key,
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

  const totalFilled = roleStats.reduce((sum, row) => sum + row.filledCount, 0);
  const totalConfirmed = roleStats.reduce((sum, row) => sum + row.confirmedCount, 0);
  const totalSlots = roleStats.length * slotsPerDay;
  const coverage = totalSlots ? Math.round((totalFilled / totalSlots) * 100) : 0;

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
        status: "Loaded",
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
    const blob = new Blob([csvFor(selectedRole, rows)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `wos-${selectedRole.id}-svs-appointments.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setNotice("CSV downloaded.");
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
          <span className="section-kicker">Whiteout Survival SvS</span>
          <h1>Appointment Planner</h1>
          <p>Schedule only Minister of Education and Vice President appointments. Enter a player ID to fetch player details, write the appointment description, and add resource needs from the edit resource button.</p>
        </div>
        <div className="svs-hero-metrics" aria-label="Planner summary">
          <article><strong>{totalFilled}/{totalSlots}</strong><small>filled</small></article>
          <article><strong>{totalConfirmed}</strong><small>confirmed</small></article>
          <article><strong>{coverage}%</strong><small>coverage</small></article>
        </div>
      </section>

      <nav className="svs-tabs" aria-label="Appointment planner sections">
        {[
          ["schedule", "Schedule"],
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
                <span>{role.shortName.slice(0, 2).toUpperCase()}</span>
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
                      <span className="svs-avatar">{row.slot.avatarImage ? <img src={row.slot.avatarImage} alt="" /> : row.slot.playerName.slice(0, 1) || "?"}</span>
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

      {activeTab === "analytics" && (
        <section className="svs-analytics" aria-label="Appointment planner analytics">
          <div className="svs-analytics-summary">
            <article><strong>{totalFilled}</strong><small>Total filled slots</small></article>
            <article><strong>{totalConfirmed}</strong><small>Total confirmed slots</small></article>
            <article><strong>{totalSlots - totalFilled}</strong><small>Open slots</small></article>
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
