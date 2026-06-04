"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { warAcademyBranches, type WarAcademyBranch, type WarAcademyBranchKey, type WarAcademyCost, type WarAcademyTroop } from "@/data/warAcademyResearch";

type BranchState = Record<string, { from: number; to: number }>;
type OwnedState = WarAcademyCost & { speedups: number };

const troopLabels: Record<WarAcademyTroop, string> = {
  infantry: "Infantry",
  marksman: "Marksman",
  lancer: "Lancer",
};

const branchOrder: WarAcademyBranchKey[] = ["capacity", "health", "lethality", "attack", "defense", "rally", "helios", "firstAid", "healing", "training"];
const materialLabels: Record<keyof WarAcademyCost, string> = {
  shards: "Fire Crystal Shards",
  steel: "Steel",
  meat: "Meat",
  wood: "Wood",
  coal: "Coal",
  iron: "Iron",
};

const emptyCost: WarAcademyCost = { meat: 0, wood: 0, coal: 0, iron: 0, steel: 0, shards: 0 };

const addCost = (left: WarAcademyCost, right: WarAcademyCost): WarAcademyCost => ({
  meat: left.meat + right.meat,
  wood: left.wood + right.wood,
  coal: left.coal + right.coal,
  iron: left.iron + right.iron,
  steel: left.steel + right.steel,
  shards: left.shards + right.shards,
});

const formatNumber = (value: number) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Math.round(value));
const formatCompact = (value: number) => new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: value >= 1_000_000 ? 1 : 0 }).format(Math.round(value));
const formatDays = (seconds: number) => `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(seconds / 86400)} days`;
const branchId = (branch: WarAcademyBranch) => `${branch.troop}:${branch.key}`;

const totalForRange = (branch: WarAcademyBranch, from: number, to: number) =>
  branch.levels
    .filter((level) => level.level > from && level.level <= to)
    .reduce(
      (sum, level) => ({
        cost: addCost(sum.cost, level.cost),
        seconds: sum.seconds + level.seconds,
        power: sum.power + level.power,
      }),
      { cost: emptyCost, seconds: 0, power: 0 },
    );

const createState = (target: "capacity" | "helios" | "support" | "clear"): BranchState =>
  warAcademyBranches.reduce<BranchState>((state, branch) => {
    const max = branch.maxLevel;
    const to =
      target === "clear" ? 0 :
      target === "capacity" ? (branch.key === "capacity" ? max : 0) :
      target === "helios" ? (["capacity", "health", "lethality", "attack", "defense", "rally", "helios"].includes(branch.key) ? max : 0) :
      max;

    state[branchId(branch)] = { from: 0, to };
    return state;
  }, {});

export default function WarAcademyCalculator() {
  const [plan, setPlan] = useState<BranchState>(() => createState("helios"));
  const [owned, setOwned] = useState<OwnedState>({ ...emptyCost, speedups: 0 });
  const [researchSpeed, setResearchSpeed] = useState(70);
  const [dailyShards, setDailyShards] = useState(20);
  const [showSupport, setShowSupport] = useState(false);

  const rows = useMemo(() => {
    return warAcademyBranches
      .filter((branch) => showSupport || !["firstAid", "healing", "training"].includes(branch.key))
      .sort((a, b) => troopLabels[a.troop].localeCompare(troopLabels[b.troop]) || branchOrder.indexOf(a.key) - branchOrder.indexOf(b.key))
      .map((branch) => {
        const selection = plan[branchId(branch)] || { from: 0, to: 0 };
        return { branch, selection, ...totalForRange(branch, selection.from, selection.to) };
      });
  }, [plan, showSupport]);

  const totals = rows.reduce(
    (sum, row) => ({
      cost: addCost(sum.cost, row.cost),
      seconds: sum.seconds + row.seconds,
      power: sum.power + row.power,
    }),
    { cost: emptyCost, seconds: 0, power: 0 },
  );

  const effectiveSeconds = totals.seconds / (1 + researchSpeed / 100);
  const speedupSeconds = owned.speedups * 86400;
  const finalSeconds = Math.max(0, effectiveSeconds - speedupSeconds);
  const shortfall = Object.fromEntries(
    (Object.keys(emptyCost) as (keyof WarAcademyCost)[]).map((key) => [key, Math.max(0, totals.cost[key] - owned[key])]),
  ) as WarAcademyCost;
  const daysByShardIncome = dailyShards > 0 ? Math.ceil(shortfall.shards / dailyShards) : 0;
  const crystalsNeeded = Math.ceil(shortfall.shards / 1.3);
  const steelExchangeEquivalent = shortfall.shards * 5000;

  const updateBranch = (id: string, field: "from" | "to", value: number, maxLevel: number) => {
    setPlan((current) => {
      const next = { ...(current[id] || { from: 0, to: 0 }) };
      next[field] = Math.min(Math.max(0, value), maxLevel);
      if (next.to < next.from) {
        if (field === "from") next.to = next.from;
        else next.from = next.to;
      }
      return { ...current, [id]: next };
    });
  };

  return (
    <main className="war-academy-page">
      <section className="war-academy-hero">
        <div>
          <Link href="/" className="war-academy-back">WhiteoutSurvival.dev</Link>
          <h1>War Academy Calculator</h1>
          <p>Plan T11 Helios research with exact official wiki table costs, current levels, inventory shortfalls, research speed, speedups, and shard exchange timing.</p>
          <div className="war-academy-chips" aria-label="War Academy facts">
            <span>13,421 shards per Helios tree</span>
            <span>271.2 base research days</span>
            <span>5,000 steel = 1 shard</span>
            <span>10 Fire Crystals = 13 shards</span>
          </div>
        </div>
      </section>

      <section className="war-academy-summary" aria-label="Plan summary">
        <article><span>Total shards</span><strong>{formatNumber(totals.cost.shards)}</strong></article>
        <article><span>Base time</span><strong>{formatDays(totals.seconds)}</strong></article>
        <article><span>Adjusted time</span><strong>{formatDays(finalSeconds)}</strong></article>
        <article><span>Power gain</span><strong>{formatCompact(totals.power)}</strong></article>
      </section>

      <section className="war-academy-workbench" aria-label="War Academy calculator controls">
        <div className="war-academy-panel">
          <div className="war-academy-panel-head">
            <strong>Plan Controls</strong>
            <label className="war-academy-toggle">
              <input type="checkbox" checked={showSupport} onChange={(event) => setShowSupport(event.currentTarget.checked)} />
              <span>Show post-Helios support</span>
            </label>
          </div>
          <div className="war-academy-actions">
            <button type="button" onClick={() => setPlan(createState("capacity"))}>Capacity first</button>
            <button type="button" onClick={() => setPlan(createState("helios"))}>Full Helios unlock</button>
            <button type="button" onClick={() => { setShowSupport(true); setPlan(createState("support")); }}>Max support</button>
            <button type="button" onClick={() => setPlan(createState("clear"))}>Clear</button>
          </div>
          <div className="war-academy-settings">
            <label><span>Research speed bonus</span><input value={researchSpeed} onChange={(event) => setResearchSpeed(Number(event.currentTarget.value.replace(/\D/g, "")) || 0)} inputMode="numeric" /><em>%</em></label>
            <label><span>Daily shard income</span><input value={dailyShards} onChange={(event) => setDailyShards(Number(event.currentTarget.value.replace(/\D/g, "")) || 0)} inputMode="numeric" /><em>/day</em></label>
            <label><span>Research speedups owned</span><input value={owned.speedups} onChange={(event) => setOwned({ ...owned, speedups: Number(event.currentTarget.value.replace(/\D/g, "")) || 0 })} inputMode="numeric" /><em>days</em></label>
          </div>
        </div>

        <div className="war-academy-panel">
          <div className="war-academy-panel-head"><strong>Owned Materials</strong></div>
          <div className="war-academy-inventory">
            {(Object.keys(emptyCost) as (keyof WarAcademyCost)[]).map((key) => (
              <label key={key}>
                <span>{materialLabels[key]}</span>
                <input value={owned[key]} onChange={(event) => setOwned({ ...owned, [key]: Number(event.currentTarget.value.replace(/\D/g, "")) || 0 })} inputMode="numeric" />
              </label>
            ))}
          </div>
        </div>
      </section>

      <section className="war-academy-shortfalls" aria-label="Material shortfalls">
        {(Object.keys(emptyCost) as (keyof WarAcademyCost)[]).map((key) => (
          <article className={shortfall[key] ? "short" : "ready"} key={key}>
            <span>{materialLabels[key]}</span>
            <strong>{formatCompact(shortfall[key])}</strong>
            <small>{formatCompact(totals.cost[key])} needed, {formatCompact(owned[key])} owned</small>
          </article>
        ))}
      </section>

      <section className="war-academy-exchange" aria-label="Shard exchange estimate">
        <article>
          <strong>{daysByShardIncome ? formatNumber(daysByShardIncome) : "0"} days</strong>
          <span>At {formatNumber(dailyShards)} shards per day for your remaining shard shortfall.</span>
        </article>
        <article>
          <strong>{formatCompact(steelExchangeEquivalent)} steel</strong>
          <span>Equivalent steel if every missing shard came from the 5,000 steel exchange.</span>
        </article>
        <article>
          <strong>{formatNumber(crystalsNeeded)} Fire Crystals</strong>
          <span>Equivalent Fire Crystal conversion at 10 crystals for 13 shards.</span>
        </article>
      </section>

      <section className="war-academy-table-wrap" aria-label="War Academy branch selector">
        <table>
          <thead>
            <tr>
              <th>Troop</th>
              <th>Branch</th>
              <th>Current</th>
              <th>Target</th>
              <th>Shards</th>
              <th>Steel</th>
              <th>Base Time</th>
              <th>Power</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ branch, selection, cost, seconds, power }) => {
              const id = branchId(branch);
              return (
                <tr className={selection.to > selection.from ? "selected" : ""} key={id}>
                  <td>{troopLabels[branch.troop]}</td>
                  <td><a href={`https://www.whiteoutsurvival.wiki/research/${branch.slug}/`} target="_blank" rel="noreferrer">{branch.name}</a></td>
                  <td><select value={selection.from} onChange={(event) => updateBranch(id, "from", Number(event.currentTarget.value), branch.maxLevel)}>{Array.from({ length: branch.maxLevel + 1 }, (_, level) => <option value={level} key={level}>{level}</option>)}</select></td>
                  <td><select value={selection.to} onChange={(event) => updateBranch(id, "to", Number(event.currentTarget.value), branch.maxLevel)}>{Array.from({ length: branch.maxLevel + 1 }, (_, level) => <option value={level} key={level}>{level}</option>)}</select></td>
                  <td>{formatNumber(cost.shards)}</td>
                  <td>{formatCompact(cost.steel)}</td>
                  <td>{formatDays(seconds)}</td>
                  <td>{formatCompact(power)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="war-academy-notes">
        <article>
          <strong>Priority</strong>
          <span>F2P and low spenders usually start with Flame Squad in all three trees, then their best stat branch. Rally leads usually rush Infantry Helios first, then Marksman, then Lancer.</span>
        </article>
        <article>
          <strong>Data source</strong>
          <span>Research rows were scraped from the official Whiteout Survival Wiki on June 4, 2026. Patch changes can happen, so the in-game preview is still the final authority.</span>
        </article>
      </section>
    </main>
  );
}
