"use client";

import { useEffect, useMemo, useState } from "react";

type PlannerTab = "schedule" | "settings" | "analytics" | "howto";

type AppointmentRole = {
  id: string;
  name: string;
  icon: string;
  focus: string;
  color: string;
};

type AppointmentSlot = {
  player: string;
  level: string;
  description: string;
  resources: string;
  confirmed: boolean;
};

type PlannerState = Record<string, Record<string, AppointmentSlot>>;

type SavedPlanner = {
  enabledRoleIds?: string[];
  plannerName?: string;
  plannerState?: PlannerState;
  selectedRoleId?: string;
  slotMinutes?: number;
  startTime?: string;
  stateNumber?: string;
};

const storageKey = "wos-svs-appointment-planner-v1";

const appointmentRoles: AppointmentRole[] = [
  { id: "president", name: "President", icon: "P", focus: "SvS command handoff", color: "#f48120" },
  { id: "war", name: "Minister of War", icon: "W", focus: "Rally launch and battle buffs", color: "#ef4444" },
  { id: "defense", name: "Minister of Defense", icon: "D", focus: "Garrison and city defense", color: "#38bdf8" },
  { id: "strategy", name: "Minister of Strategy", icon: "S", focus: "March timing and troop swaps", color: "#a855f7" },
  { id: "interior", name: "Minister of Interior", icon: "I", focus: "Resource and support windows", color: "#22c55e" },
  { id: "construction", name: "Minister of Construction", icon: "C", focus: "Pre-SvS upgrade bursts", color: "#eab308" },
];

const rolePresets = [
  { label: "Battle Core", roles: ["president", "war", "defense", "strategy"] },
  { label: "Full SvS", roles: appointmentRoles.map((role) => role.id) },
  { label: "Growth Prep", roles: ["interior", "construction", "strategy"] },
];

const savedPlanner = (): SavedPlanner | null => {
  if (typeof window === "undefined") return null;
  try {
    const saved = window.localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) as SavedPlanner : null;
  } catch {
    return null;
  }
};

const createEmptySlot = (): AppointmentSlot => ({
  player: "",
  level: "",
  description: "",
  resources: "",
  confirmed: false,
});

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

const filled = (slot: AppointmentSlot) =>
  Boolean(slot.player.trim() || slot.level.trim() || slot.description.trim() || slot.resources.trim());

const appointmentCsv = (role: AppointmentRole, rows: { key: string; utc: string; local: string; slot: AppointmentSlot }[]) => {
  const escape = (value: string | boolean) => `"${String(value).replace(/"/g, '""')}"`;
  return [
    ["Role", "Time UTC", "Local Time", "Player Name", "Level", "Description", "Resources", "Confirmed"].map(escape).join(","),
    ...rows.map((row) => [
      role.name,
      row.utc,
      row.local,
      row.slot.player,
      row.slot.level,
      row.slot.description,
      row.slot.resources,
      row.slot.confirmed ? "Yes" : "No",
    ].map(escape).join(",")),
  ].join("\n");
};

export default function SvsAppointmentPlanner() {
  const [activeTab, setActiveTab] = useState<PlannerTab>("schedule");
  const [selectedRoleId, setSelectedRoleId] = useState(() => savedPlanner()?.selectedRoleId || appointmentRoles[1].id);
  const [enabledRoleIds, setEnabledRoleIds] = useState(() => {
    const saved = savedPlanner()?.enabledRoleIds;
    return saved?.length ? saved : appointmentRoles.map((role) => role.id);
  });
  const [startTime, setStartTime] = useState(() => savedPlanner()?.startTime || "00:00");
  const [slotMinutes, setSlotMinutes] = useState(() => savedPlanner()?.slotMinutes === 60 ? 60 : 30);
  const [plannerName, setPlannerName] = useState(() => savedPlanner()?.plannerName || "SvS Castle Battle");
  const [stateNumber, setStateNumber] = useState(() => savedPlanner()?.stateNumber || "");
  const [plannerState, setPlannerState] = useState<PlannerState>(() => savedPlanner()?.plannerState || {});
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
    const roleSlots = Array.from({ length: slotsPerDay }, (_, index) => {
      const key = slotKeyFor(startMinutes, slotMinutes, index);
      return plannerState[role.id]?.[key] || createEmptySlot();
    });
    const filledCount = roleSlots.filter(filled).length;
    const confirmedCount = roleSlots.filter((slot) => slot.confirmed).length;
    return { role, filledCount, confirmedCount, total: slotsPerDay };
  }), [plannerState, slotMinutes, slotsPerDay, startMinutes]);

  const totalFilled = roleStats.reduce((sum, row) => sum + row.filledCount, 0);
  const totalConfirmed = roleStats.reduce((sum, row) => sum + row.confirmedCount, 0);
  const totalSlots = roleStats.length * slotsPerDay;
  const coverage = totalSlots ? Math.round((totalFilled / totalSlots) * 100) : 0;

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify({
      enabledRoleIds,
      plannerName,
      plannerState,
      selectedRoleId,
      slotMinutes,
      startTime,
      stateNumber,
    }));
  }, [enabledRoleIds, plannerName, plannerState, selectedRoleId, slotMinutes, startTime, stateNumber]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 3200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const updateSlot = (key: string, updates: Partial<AppointmentSlot>) => {
    setPlannerState((current) => ({
      ...current,
      [selectedRole.id]: {
        ...current[selectedRole.id],
        [key]: {
          ...(current[selectedRole.id]?.[key] || createEmptySlot()),
          ...updates,
        },
      },
    }));
  };

  const clearCurrentRole = () => {
    setPlannerState((current) => {
      const next = { ...current };
      delete next[selectedRole.id];
      return next;
    });
    setNotice(`${selectedRole.name} schedule cleared.`);
  };

  const applyPreset = (roleIds: string[]) => {
    setEnabledRoleIds(roleIds);
    if (!roleIds.includes(selectedRoleId)) {
      setSelectedRoleId(roleIds[0] || appointmentRoles[0].id);
    }
  };

  const downloadCsv = () => {
    const blob = new Blob([appointmentCsv(selectedRole, rows)], { type: "text/csv;charset=utf-8" });
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
    const title = `${plannerName}${stateNumber ? ` - State ${stateNumber}` : ""}`;
    const message = [
      `${title}`,
      `${selectedRole.name} rotation (${startTime} UTC start)`,
      ...filledRows.map((row) => `${row.utc}: ${row.slot.player || "Open"}${row.slot.level ? `, FC ${row.slot.level}` : ""}${row.slot.confirmed ? " [confirmed]" : ""}`),
    ].join("\n");
    await navigator.clipboard.writeText(message || title);
    setNotice("Alliance summary copied.");
  };

  return (
    <section className="home-page svs-planner-page" id="svs-appointment-planner" aria-label="Whiteout Survival SvS appointment planner">
      <section className="svs-tool-hero">
        <div>
          <span className="section-kicker">Whiteout Survival Tools & Guides</span>
          <h1>SvS Appointment Planner</h1>
          <p>Plan president and minister handoffs for your alliance. Schedule 30-minute or 60-minute slots across 24 hours with player names, furnace levels, resource notes, and confirmations.</p>
        </div>
        <div className="svs-hero-metrics" aria-label="Planner summary">
          <article>
            <strong>{totalFilled}/{totalSlots}</strong>
            <small>filled</small>
          </article>
          <article>
            <strong>{totalConfirmed}</strong>
            <small>confirmed</small>
          </article>
          <article>
            <strong>{coverage}%</strong>
            <small>coverage</small>
          </article>
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
            {roleStats.filter((row) => enabledRoleIds.includes(row.role.id)).map(({ role, filledCount, confirmedCount, total }) => (
              <button
                className={`svs-role-card ${selectedRole.id === role.id ? "active" : ""}`}
                style={{ ["--svs-role-color" as string]: role.color }}
                type="button"
                key={role.id}
                onClick={() => setSelectedRoleId(role.id)}
              >
                <span>{role.icon}</span>
                <strong>{role.name}</strong>
                <small>{filledCount}/{total} filled</small>
                <small>{confirmedCount} Confirmed</small>
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
                  <span>Start Time</span>
                  <input type="time" value={startTime} onChange={(event) => setStartTime(event.currentTarget.value)} />
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
                  <span>Local Time</span>
                  <span>Player Name</span>
                  <span>Level</span>
                  <span>Description</span>
                  <span>Resources</span>
                  <span>Confirmed</span>
                </div>
                {rows.map((row) => (
                  <div className={`svs-row ${filled(row.slot) ? "filled" : ""}`} key={row.key}>
                    <strong>{row.utc}</strong>
                    <span>{row.local}</span>
                    <input value={row.slot.player} placeholder="Player name" onChange={(event) => updateSlot(row.key, { player: event.currentTarget.value })} />
                    <input value={row.slot.level} placeholder="FC / Furnace" onChange={(event) => updateSlot(row.key, { level: event.currentTarget.value })} />
                    <input value={row.slot.description} placeholder="Buff purpose" onChange={(event) => updateSlot(row.key, { description: event.currentTarget.value })} />
                    <input value={row.slot.resources} placeholder="RSS / troops / notes" onChange={(event) => updateSlot(row.key, { resources: event.currentTarget.value })} />
                    <label className="svs-confirm">
                      <input type="checkbox" checked={row.slot.confirmed} onChange={(event) => updateSlot(row.key, { confirmed: event.currentTarget.checked })} />
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
        <section className="svs-settings-grid" aria-label="Appointment planner settings">
          <article>
            <h2>Schedule Settings</h2>
            <label>
              Planner Name
              <input value={plannerName} onChange={(event) => setPlannerName(event.currentTarget.value)} />
            </label>
            <label>
              State Number
              <input value={stateNumber} inputMode="numeric" placeholder="Example: 314" onChange={(event) => setStateNumber(event.currentTarget.value.replace(/\D/g, ""))} />
            </label>
            <label>
              Start Time UTC
              <input type="time" value={startTime} onChange={(event) => setStartTime(event.currentTarget.value)} />
            </label>
            <label>
              Slot Length
              <select value={slotMinutes} onChange={(event) => setSlotMinutes(Number(event.currentTarget.value))}>
                <option value={30}>30 minutes</option>
                <option value={60}>60 minutes</option>
              </select>
            </label>
          </article>
          <article>
            <h2>Role Presets</h2>
            <div className="svs-preset-list">
              {rolePresets.map((preset) => (
                <button type="button" key={preset.label} onClick={() => applyPreset(preset.roles)}>{preset.label}</button>
              ))}
            </div>
            <div className="svs-role-toggles">
              {appointmentRoles.map((role) => (
                <label key={role.id}>
                  <input
                    type="checkbox"
                    checked={enabledRoleIds.includes(role.id)}
                    onChange={(event) => {
                      setEnabledRoleIds((current) => event.currentTarget.checked
                        ? [...new Set([...current, role.id])]
                        : current.filter((id) => id !== role.id));
                    }}
                  />
                  <span>{role.name}</span>
                </label>
              ))}
            </div>
          </article>
        </section>
      )}

      {activeTab === "analytics" && (
        <section className="svs-analytics" aria-label="Appointment planner analytics">
          <div className="svs-analytics-summary">
            <article><strong>{totalFilled}</strong><small>Total filled slots</small></article>
            <article><strong>{totalConfirmed}</strong><small>Total confirmed slots</small></article>
            <article><strong>{totalSlots - totalFilled}</strong><small>Open slots</small></article>
          </div>
          <div className="svs-analytics-bars">
            {roleStats.filter((row) => enabledRoleIds.includes(row.role.id)).map(({ role, filledCount, confirmedCount, total }) => (
              <article key={role.id} style={{ ["--svs-role-color" as string]: role.color }}>
                <header>
                  <strong>{role.name}</strong>
                  <span>{filledCount}/{total}</span>
                </header>
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
            ["Pick roles", "Use Full SvS or Battle Core presets, then select the appointment role you are scheduling."],
            ["Set UTC start", "Choose the first rotation time. The table fills the next 24 hours and shows each user's local time."],
            ["Fill slots", "Add player names, furnace or FC level, purpose, resource notes, and mark confirmed handoffs."],
            ["Share plan", "Copy the alliance summary for chat or export the selected role to CSV for Discord and sheets."],
          ].map(([title, body], index) => (
            <article key={title}>
              <span>{index + 1}</span>
              <strong>{title}</strong>
              <p>{body}</p>
            </article>
          ))}
        </section>
      )}
    </section>
  );
}
