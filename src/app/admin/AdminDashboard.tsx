"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Visit = {
  id: string;
  visitorId: string;
  ip: string;
  country: string;
  region: string;
  city: string;
  browser: string;
  os: string;
  device: string;
  page: string;
  referrer: string;
  userAgent: string;
  language: string;
  timezone: string;
  screen: string;
  viewport: string;
  timestamp: string;
};

type AdminData = {
  summary: {
    totalVisits: number;
    uniqueVisitors: number;
    uniqueIps: number;
    userCount: number;
    activeAdminSessions: number;
  };
  visits: Visit[];
  topPages: { name: string; count: number }[];
  topCountries: { name: string; count: number }[];
  topBrowsers: { name: string; count: number }[];
};

const emptyData: AdminData = {
  summary: { totalVisits: 0, uniqueVisitors: 0, uniqueIps: 0, userCount: 0, activeAdminSessions: 0 },
  visits: [],
  topPages: [],
  topCountries: [],
  topBrowsers: [],
};

const numberFormat = new Intl.NumberFormat("en");

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-slate-50">{numberFormat.format(value)}</div>
    </div>
  );
}

function RankList({ title, items }: { title: string; items: { name: string; count: number }[] }) {
  const max = Math.max(...items.map((item) => item.count), 1);
  return (
    <section className="rounded-lg border border-white/10 bg-[#0b1220] p-4">
      <h2 className="text-sm font-semibold text-slate-100">{title}</h2>
      <div className="mt-3 space-y-3">
        {items.length ? (
          items.map((item) => (
            <div key={item.name} className="space-y-1">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="truncate text-slate-300">{item.name}</span>
                <span className="font-mono text-slate-500">{item.count}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-cyan-400" style={{ width: `${(item.count / max) * 100}%` }} />
              </div>
            </div>
          ))
        ) : (
          <div className="text-sm text-slate-500">No records yet.</div>
        )}
      </div>
    </section>
  );
}

export function AdminDashboard() {
  const [configured, setConfigured] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AdminData>(emptyData);
  const [selected, setSelected] = useState<Visit | null>(null);

  const loadData = async () => {
    const response = await fetch("/api/admin/visits?limit=150", { cache: "no-store" });
    if (response.status === 401) {
      setAuthenticated(false);
      return;
    }
    if (!response.ok) throw new Error("Unable to load admin data");
    const nextData = (await response.json()) as AdminData;
    setData(nextData);
    setSelected(nextData.visits[0] || null);
  };

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        const response = await fetch("/api/admin/status", { cache: "no-store" });
        const status = await response.json();
        if (!mounted) return;
        setConfigured(Boolean(status.configured));
        setAuthenticated(Boolean(status.authenticated));
        if (status.authenticated) await loadData();
      } catch {
        if (mounted) setError("Admin panel is unavailable.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    init();
    return () => {
      mounted = false;
    };
  }, []);

  const latest = useMemo(
    () => (data.visits[0]?.timestamp ? new Date(data.visits[0].timestamp).toLocaleString() : "No visits"),
    [data],
  );

  const login = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!response.ok) {
      setError("Invalid admin secret.");
      return;
    }
    setPassword("");
    setAuthenticated(true);
    await loadData();
  };

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthenticated(false);
    setData(emptyData);
    setSelected(null);
  };

  if (loading) return <main className="min-h-screen bg-[#050812] p-6 text-slate-300">Loading admin console...</main>;

  if (!configured) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#050812] p-6 text-slate-200">
        <div className="w-full max-w-md rounded-lg border border-amber-300/20 bg-amber-300/10 p-5">
          <h1 className="text-lg font-semibold text-amber-100">Admin secret missing</h1>
          <p className="mt-2 text-sm text-amber-100/75">Set ADMIN_PASSWORD or ADMIN_ACCESS_TOKEN on the server to enable this private page.</p>
        </div>
      </main>
    );
  }

  if (!authenticated) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#050812] p-6 text-slate-200">
        <form onSubmit={login} className="w-full max-w-sm rounded-lg border border-white/10 bg-[#0b1220] p-5 shadow-2xl shadow-black/30">
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300">Private</div>
          <h1 className="mt-2 text-2xl font-semibold text-white">Whiteout Admin</h1>
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            autoFocus
            placeholder="Admin secret"
            className="mt-5 w-full rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none ring-cyan-400/30 focus:ring-2"
          />
          {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
          <button className="mt-4 w-full rounded-md bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300">Enter</button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050812] p-4 text-slate-200 md:p-6">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-3 border-b border-white/10 pb-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300">Private admin</div>
            <h1 className="mt-1 text-2xl font-semibold text-white md:text-3xl">WhiteoutSurvival.dev Activity</h1>
            <p className="mt-1 text-sm text-slate-500">Latest record: {latest}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={loadData} className="rounded-md border border-white/10 px-3 py-2 text-sm text-slate-200 hover:bg-white/5">Refresh</button>
            <button onClick={logout} className="rounded-md border border-red-300/20 px-3 py-2 text-sm text-red-200 hover:bg-red-400/10">Logout</button>
          </div>
        </header>

        <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Stat label="Visits" value={data.summary.totalVisits} />
          <Stat label="Visitors" value={data.summary.uniqueVisitors} />
          <Stat label="IPs" value={data.summary.uniqueIps} />
          <Stat label="Users" value={data.summary.userCount} />
          <Stat label="Sessions" value={data.summary.activeAdminSessions} />
        </section>

        <section className="mt-5 grid gap-4 lg:grid-cols-3">
          <RankList title="Top Pages" items={data.topPages} />
          <RankList title="Countries" items={data.topCountries} />
          <RankList title="Browsers" items={data.topBrowsers} />
        </section>

        <section className="mt-5 grid gap-4 xl:grid-cols-[1fr_360px]">
          <div className="overflow-hidden rounded-lg border border-white/10 bg-[#0b1220]">
            <div className="border-b border-white/10 px-4 py-3 text-sm font-semibold text-white">Visit Log</div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead className="bg-white/[0.03] text-slate-500">
                  <tr>
                    {["Time", "ID", "IP", "Country", "Browser", "Page", "Device"].map((head) => (
                      <th key={head} className="whitespace-nowrap px-3 py-2 font-semibold">{head}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data.visits.map((visit) => (
                    <tr
                      key={visit.id}
                      onClick={() => setSelected(visit)}
                      className={`cursor-pointer hover:bg-white/[0.04] ${selected?.id === visit.id ? "bg-cyan-400/10" : ""}`}
                    >
                      <td className="whitespace-nowrap px-3 py-2 text-slate-400">{new Date(visit.timestamp).toLocaleString()}</td>
                      <td className="max-w-[130px] truncate px-3 py-2 font-mono text-slate-500">{visit.id}</td>
                      <td className="whitespace-nowrap px-3 py-2 font-mono text-slate-200">{visit.ip}</td>
                      <td className="whitespace-nowrap px-3 py-2">{visit.country}</td>
                      <td className="whitespace-nowrap px-3 py-2">{visit.browser}</td>
                      <td className="max-w-[340px] truncate px-3 py-2 text-slate-300">{visit.page}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-slate-400">{visit.device}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="rounded-lg border border-white/10 bg-[#0b1220] p-4">
            <h2 className="text-sm font-semibold text-white">Selected Details</h2>
            {selected ? (
              <dl className="mt-4 space-y-3 text-xs">
                {Object.entries(selected).map(([key, value]) => (
                  <div key={key}>
                    <dt className="font-semibold uppercase tracking-[0.14em] text-slate-500">{key}</dt>
                    <dd className="mt-1 break-words font-mono text-slate-200">
                      {key === "timestamp" ? new Date(value).toLocaleString() : value || "-"}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <div className="mt-3 text-sm text-slate-500">Select a visit row to inspect all captured fields.</div>
            )}
          </aside>
        </section>
      </div>
    </main>
  );
}
