"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import "./player.css";

// ── Types ─────────────────────────────────────────────────────────────────────

type Track = {
  title: string;
  author: string;
  uri: string;
  length: number;
  position?: number;
  artwork?: string | null;
};

type Playlist = {
  id?: string;
  guildId: string;
  userId: string;
  name: string;
  iconUrl?: string | null;
  trackCount: number;
  tracks: Track[];
  createdAt: string;
  updatedAt: string;
};

type Guild = {
  id: string;
  name: string;
  iconUrl?: string | null;
  memberCount?: number;
  voiceChannelCount?: number;
  textChannelCount?: number;
  activeVoiceChannel?: { id: string; name: string } | null;
};

type NowPlaying = {
  guildId: string;
  guildName?: string;
  playing: boolean;
  paused: boolean;
  volume: number;
  loopMode: "off" | "track" | "queue";
  currentTrack: Track | null;
  queue: Track[];
  queueSize: number;
  voiceChannel?: { id: string; name: string } | null;
  playlistName?: string | null;
  updatedAt?: number;
  source?: "live" | "db";
};

type User = {
  id: string;
  displayName: string;
  avatarUrl?: string;
  discordUserId?: string;
  musicGuilds?: { id: string; name: string; iconUrl?: string; permissions: string }[];
  providers?: string[];
};

// ── Utility helpers ───────────────────────────────────────────────────────────

const formatTime = (ms: number) => {
  if (!ms || ms <= 0) return "Live";
  const totalSecs = Math.floor(ms / 1000);
  const m = Math.floor(totalSecs / 60);
  const s = totalSecs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const DISCORD_LOGIN_URL = "/api/auth/discord-music?returnTo=/music/player";
const fallbackGuildIcon = "https://cdn.discordapp.com/embed/avatars/0.png";

const guildFromId = (guildId: string): Guild => ({
  id: guildId,
  name: `Server ${guildId}`,
  iconUrl: fallbackGuildIcon,
});

const SEARCH_SUGGESTIONS = [
  "lofi hip hop", "phonk", "trending", "chill vibes", "workout",
  "bollywood hits", "K-pop", "EDM", "jazz", "classical",
];

// ── Subcomponents ─────────────────────────────────────────────────────────────

function DiscordLoginScreen() {
  return (
    <div className="login-screen">
      <div className="login-glow" />
      <div className="login-card">
        <div className="login-icon">
          <svg viewBox="0 0 71 55" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M60.1 4.9A58.5 58.5 0 0 0 45.5.4a40 40 0 0 0-1.8 3.7 54 54 0 0 0-16.4 0A38 38 0 0 0 25.4.4 58.4 58.4 0 0 0 10.9 5C1.6 18.8-1 32.3.3 45.6a59 59 0 0 0 18 9.1 44 44 0 0 0 3.8-6.2 38.4 38.4 0 0 1-6-2.9l1.5-1.1a42.2 42.2 0 0 0 36 0l1.5 1.1a38.5 38.5 0 0 1-6 2.9 43.8 43.8 0 0 0 3.8 6.2 58.8 58.8 0 0 0 18-9.1C72.3 30.2 68.2 16.8 60.1 4.9ZM23.7 37.8c-3.6 0-6.5-3.3-6.5-7.3s2.9-7.3 6.5-7.3c3.6 0 6.6 3.3 6.5 7.3 0 4-2.9 7.3-6.5 7.3Zm23.6 0c-3.6 0-6.5-3.3-6.5-7.3s2.9-7.3 6.5-7.3c3.6 0 6.6 3.3 6.5 7.3 0 4-2.9 7.3-6.5 7.3Z" />
          </svg>
        </div>
        <h1 className="login-title">Music Bot Controller</h1>
        <p className="login-subtitle">
          Login with Discord to view your playlists, see what&apos;s playing in your server, and control the bot directly from here.
        </p>
        <a href={DISCORD_LOGIN_URL} className="login-btn" id="discord-login-btn">
          <svg viewBox="0 0 71 55" fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="20" height="20">
            <path d="M60.1 4.9A58.5 58.5 0 0 0 45.5.4a40 40 0 0 0-1.8 3.7 54 54 0 0 0-16.4 0A38 38 0 0 0 25.4.4 58.4 58.4 0 0 0 10.9 5C1.6 18.8-1 32.3.3 45.6a59 59 0 0 0 18 9.1 44 44 0 0 0 3.8-6.2 38.4 38.4 0 0 1-6-2.9l1.5-1.1a42.2 42.2 0 0 0 36 0l1.5 1.1a38.5 38.5 0 0 1-6 2.9 43.8 43.8 0 0 0 3.8 6.2 58.8 58.8 0 0 0 18-9.1C72.3 30.2 68.2 16.8 60.1 4.9ZM23.7 37.8c-3.6 0-6.5-3.3-6.5-7.3s2.9-7.3 6.5-7.3c3.6 0 6.6 3.3 6.5 7.3 0 4-2.9 7.3-6.5 7.3Zm23.6 0c-3.6 0-6.5-3.3-6.5-7.3s2.9-7.3 6.5-7.3c3.6 0 6.6 3.3 6.5 7.3 0 4-2.9 7.3-6.5 7.3Z" />
          </svg>
          Login with Discord
        </a>
        <p className="login-note">We only request the <code>identify</code> scope — no messages or guild management access.</p>
        <div className="login-features">
          <div className="login-feature"><span className="feature-icon">🎵</span><span>View &amp; browse playlists</span></div>
          <div className="login-feature"><span className="feature-icon">▶️</span><span>Play, pause, skip tracks</span></div>
          <div className="login-feature"><span className="feature-icon">🎚️</span><span>Control volume &amp; loop</span></div>
          <div className="login-feature"><span className="feature-icon">📡</span><span>Live queue &amp; now playing</span></div>
        </div>
      </div>
    </div>
  );
}

function SkeletonLoader() {
  return (
    <div className="skeleton-layout">
      <div className="skeleton-sidebar">{[1,2,3,4,5].map(i=><div key={i} className="skeleton-item" style={{width:`${60+i*8}%`}}/>)}</div>
      <div className="skeleton-main"><div className="skeleton-hero"/>{[1,2,3,4,5].map(i=><div key={i} className="skeleton-row"/>)}</div>
    </div>
  );
}

function PlayingBars() {
  return <div className="playing-bars"><i/><i/><i/></div>;
}

// ── Real-time Progress Bar ────────────────────────────────────────────────────
function ProgressBar({ nowPlaying }: { nowPlaying: NowPlaying | null }) {
  const [localPosition, setLocalPosition] = useState(0);
  const startRef = useRef<{ position: number; ts: number } | null>(null);
  const rafRef = useRef<number | null>(null);

  const track = nowPlaying?.currentTrack;
  const isPlaying = nowPlaying?.playing && !nowPlaying?.paused;
  const duration = track?.length ?? 0;
  const serverPosition = track?.position ?? 0;
  const updatedAt = nowPlaying?.updatedAt ?? Date.now();

  useEffect(() => {
    if (!track) { setLocalPosition(0); return; }
    const pos = serverPosition + (isPlaying ? Date.now() - updatedAt : 0);
    startRef.current = { position: pos, ts: Date.now() };
    setLocalPosition(Math.min(pos, duration));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track?.title, serverPosition, updatedAt, isPlaying]);

  useEffect(() => {
    if (!isPlaying || !duration) return;
    const tick = () => {
      if (!startRef.current) return;
      const elapsed = Date.now() - startRef.current.ts;
      const pos = startRef.current.position + elapsed;
      setLocalPosition(Math.min(pos, duration));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, duration, track?.title]);

  const percent = duration > 0 ? Math.min((localPosition / duration) * 100, 100) : 0;

  return (
    <div className="np-progress">
      <span className="time">{formatTime(localPosition)}</span>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${percent}%` }} />
        <div className="progress-thumb" style={{ left: `calc(${percent}% - 6px)` }} />
      </div>
      <span className="time">{duration > 0 ? formatTime(duration) : "Live"}</span>
    </div>
  );
}

// ── Search Bar ────────────────────────────────────────────────────────────────
function SearchBar({
  songQuery, setSongQuery, onSearch, disabled,
}: {
  songQuery: string; setSongQuery: (v: string) => void;
  onSearch: () => void; disabled: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={`search-wrapper ${focused ? "focused" : ""}`}>
      <div className="search-bar">
        <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder="Search songs, artists, or paste a URL…"
          value={songQuery}
          onChange={e => setSongQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onKeyDown={e => { if (e.key === "Enter" && songQuery && !disabled) onSearch(); }}
        />
        {songQuery && (
          <button className="search-clear" onClick={() => setSongQuery("")} tabIndex={-1}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
        <button className="search-submit-btn" disabled={!songQuery || disabled} onClick={onSearch}>
          {disabled ? <div className="spinner-sm"/> : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l14 9-14 9V3z"/></svg>
          )}
          Play
        </button>
      </div>
      {(focused || !songQuery) && (
        <div className="search-suggestions">
          {SEARCH_SUGGESTIONS.map(s => (
            <button key={s} className={`suggestion-chip ${songQuery===s?"active":""}`}
              onMouseDown={() => { setSongQuery(s); inputRef.current?.focus(); }}>
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function MusicPlayerPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [selectedGuildId, setSelectedGuildId] = useState<string>("");
  const [playlistsLoading, setPlaylistsLoading] = useState(false);
  const [activePlaylist, setActivePlaylist] = useState<Playlist | null>(null);
  const [activeTrack, setActiveTrack] = useState<Track | null>(null);
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const [controlLoading, setControlLoading] = useState(false);
  const [controlError, setControlError] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [showQueue, setShowQueue] = useState(false);
  const [volume, setVolume] = useState(50);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [voiceChannels, setVoiceChannels] = useState<{id:string;name:string}[]>([]);
  const [selectedVoiceChannel, setSelectedVoiceChannel] = useState<string>("");
  const [songQuery, setSongQuery] = useState("");

  const [isEditingPlaylist, setIsEditingPlaylist] = useState(false);
  const [editPlaylistName, setEditPlaylistName] = useState("");
  const [editPlaylistIconUrl, setEditPlaylistIconUrl] = useState("");
  const [editPlaylistTracks, setEditPlaylistTracks] = useState<Track[]>([]);
  const [isSavingPlaylist, setIsSavingPlaylist] = useState(false);

  const startEditingPlaylist = () => {
    if (!activePlaylist) return;
    setIsEditingPlaylist(true);
    setEditPlaylistName(activePlaylist.name);
    setEditPlaylistIconUrl(activePlaylist.iconUrl || "");
    setEditPlaylistTracks(activePlaylist.tracks ? [...activePlaylist.tracks] : []);
  };

  const savePlaylistEdits = async () => {
    if (!activePlaylist?.id) return;
    setIsSavingPlaylist(true);
    try {
      const res = await fetch(`/api/music/playlists`, {
        method: "PUT", headers: {"Content-Type":"application/json"}, credentials: "include",
        body: JSON.stringify({
          id: activePlaylist.id,
          name: editPlaylistName,
          iconUrl: editPlaylistIconUrl,
          tracks: editPlaylistTracks,
        }),
      });
      if (res.ok) {
        setIsEditingPlaylist(false);
        // Refresh playlists locally
        setPlaylists(prev => prev.map(p => 
          p.id === activePlaylist.id ? { ...p, name: editPlaylistName, iconUrl: editPlaylistIconUrl, tracks: editPlaylistTracks } : p
        ));
        setActivePlaylist(prev => prev ? { ...prev, name: editPlaylistName, iconUrl: editPlaylistIconUrl, tracks: editPlaylistTracks } : null);
      } else {
        const data = await res.json();
        setControlError(data.error || "Failed to save playlist");
        setTimeout(() => setControlError(null), 3000);
      }
    } catch {
      setControlError("Failed to save playlist");
      setTimeout(() => setControlError(null), 3000);
    } finally {
      setIsSavingPlaylist(false);
    }
  };

  const moveTrack = (index: number, direction: -1 | 1) => {
    if (index + direction < 0 || index + direction >= editPlaylistTracks.length) return;
    const newTracks = [...editPlaylistTracks];
    const temp = newTracks[index];
    newTracks[index] = newTracks[index + direction];
    newTracks[index + direction] = temp;
    setEditPlaylistTracks(newTracks);
  };


  const fetchChannels = useCallback(async (guildId: string) => {
    if (!guildId) return;
    try {
      const res = await fetch("/api/music/control", {
        method: "POST", headers: {"Content-Type":"application/json"}, credentials: "include",
        body: JSON.stringify({ action: "channels", guildId }),
      });
      const data = await res.json();
      if (data.ok && data.voiceChannels) {
        const voices = data.voiceChannels || [];
        setVoiceChannels(voices);
        if (voices.length > 0) setSelectedVoiceChannel(cur => cur || voices[0].id);
      }
    } catch { setVoiceChannels([]); }
  }, []);

  useEffect(() => {
    if (!selectedGuildId) return;
    setSelectedVoiceChannel("");
    const t = setTimeout(() => void fetchChannels(selectedGuildId), 0);
    return () => clearTimeout(t);
  }, [selectedGuildId, fetchChannels]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/session", { credentials: "include" });
        if (res.ok) { const data = await res.json(); setUser(data.user || data); }
      } catch {} finally { setAuthLoading(false); }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (!user?.discordUserId) return;
    const load = async () => {
      setPlaylistsLoading(true);
      try {
        const [pr, gr] = await Promise.all([
          fetch(`/api/music/playlists?userId=${encodeURIComponent(user.discordUserId!)}`, { credentials: "include" }),
          fetch("/api/music/guilds", { credentials: "include" }),
        ]);
        const pd = await pr.json().catch(() => ({ playlists: [], guilds: [] }));
        const gd = await gr.json().catch(() => ({ guilds: [] }));
        const botGuilds: Guild[] = Array.isArray(gd.guilds) ? gd.guilds : [];
        const userGuilds = user.musicGuilds || [];
        const botIds = new Set(botGuilds.map(g => g.id));
        const intersected: Guild[] = userGuilds.filter(g => botIds.has(g.id)).map(g => {
          const bg = botGuilds.find(b => b.id === g.id);
          return { id: g.id, name: g.name, iconUrl: g.iconUrl || bg?.iconUrl, memberCount: bg?.memberCount, voiceChannelCount: bg?.voiceChannelCount, activeVoiceChannel: bg?.activeVoiceChannel };
        });
        const pgIds: string[] = pd.guilds || [];
        const gMap = new Map<string, Guild>();
        for (const g of intersected) if (g?.id) gMap.set(g.id, g);
        for (const id of pgIds) if (!gMap.has(id)) { const bg = botGuilds.find(g => g.id === id); gMap.set(id, bg || guildFromId(id)); }
        const lp: Playlist[] = (pd.playlists || []).map((p: Playlist) => ({
          ...p,
          createdAt: p.createdAt || (p as unknown as {created_at?:string}).created_at || '',
          updatedAt: p.updatedAt || (p as unknown as {updated_at?:string}).updated_at || '',
        }));
        if (gd.error) setGlobalError(gd.error);
        const mg = Array.from(gMap.values());
        setPlaylists(lp); setGuilds(mg);
        if (mg.length === 1) {
          setSelectedGuildId(mg[0].id);
          setActivePlaylist(lp.find(p => p.guildId === mg[0].id) || lp[0] || null);
        }
      } catch {} finally { setPlaylistsLoading(false); }
    };
    load();
  }, [user]);

  const fetchNowPlaying = useCallback(async (guildId: string) => {
    if (!guildId) return;
    try {
      const res = await fetch(`/api/music/now-playing?guildId=${encodeURIComponent(guildId)}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        data.updatedAt = Date.now();
        setNowPlaying(data);
        if (data.volume != null) setVolume(data.volume);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!selectedGuildId || !user) return;
    const t = setTimeout(() => void fetchNowPlaying(selectedGuildId), 0);
    pollIntervalRef.current = setInterval(() => void fetchNowPlaying(selectedGuildId), 4000);
    return () => { clearTimeout(t); if (pollIntervalRef.current) clearInterval(pollIntervalRef.current); };
  }, [selectedGuildId, user, fetchNowPlaying]);

  const sendControl = useCallback(async (action: string, value?: unknown, extra?: Record<string,unknown>) => {
    if (!selectedGuildId) { setControlError("Select a server first"); return; }
    setControlLoading(true); setControlError(null);
    try {
      const res = await fetch("/api/music/control", {
        method: "POST", headers: {"Content-Type":"application/json"}, credentials: "include",
        body: JSON.stringify({ action, guildId: selectedGuildId, value, voiceChannelId: selectedVoiceChannel, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) setControlError(data.error || "Command failed");
      else setTimeout(() => fetchNowPlaying(selectedGuildId), 600);
    } catch { setControlError("Could not reach the music bot"); }
    finally { setControlLoading(false); }
  }, [selectedGuildId, selectedVoiceChannel, fetchNowPlaying]);

  const filteredPlaylists = playlists.filter(p => selectedGuildId ? p.guildId === selectedGuildId : true);
  const selectedGuild = guilds.find(g => g.id === selectedGuildId) || (selectedGuildId ? guildFromId(selectedGuildId) : null);
  const guildName = (guildId: string) => guilds.find(g => g.id === guildId)?.name || `Server ${guildId}`;
  const isLive = nowPlaying?.source === "live";
  const displayTrack = nowPlaying?.currentTrack || activeTrack;
  const isPlaying = nowPlaying?.playing ?? false;
  const loopMode = nowPlaying?.loopMode || "off";

  if (authLoading) return <SkeletonLoader/>;
  if (!user || !user.providers?.includes('discord-music') || user.musicGuilds === undefined) return <DiscordLoginScreen/>;

  if (globalError) {
    return (
      <div className="error-screen">
        <div className="error-card">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <h2>Connection Error</h2>
          <p>{globalError}</p>
          <p className="error-sub">The music bot might be offline or undergoing maintenance.</p>
          <button className="btn-primary" onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  if (!selectedGuildId && guilds.length > 0) {
    return (
      <div className="server-select-screen">
        <div className="server-select-inner">
          <div className="server-select-header">
            <Link href="/music" className="back-link-plain">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              Back
            </Link>
          </div>
          <h1 className="server-select-title">Choose a Server</h1>
          <p className="server-select-sub">Select the server where you want to control music</p>
          <div className="servers-grid">
            {guilds.map(guild => (
              <div key={guild.id} className="server-card" onClick={() => {
                setSelectedGuildId(guild.id);
                setActivePlaylist(playlists.find(p => p.guildId === guild.id) || null);
              }}>
                <div className="server-banner"/>
                <div className="server-icon"><img src={guild.iconUrl || fallbackGuildIcon} alt={guild.name}/></div>
                <div className="server-body">
                  <div className="server-name">{guild.name}</div>
                  <div className="server-meta">
                    {guild.voiceChannelCount || 0} voice channels
                    {guild.activeVoiceChannel ? ` · 🔴 ${guild.activeVoiceChannel.name}` : ""}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── MAIN LAYOUT ────────────────────────────────────────────────────────────
  return (
    <div className="player-layout">

      {/* ════════════════════════ SIDEBAR ════════════════════════ */}
      <aside className="player-sidebar">

        {/* Top: logo / back */}
        <div className="sidebar-top">
          <Link href="/music" className="back-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            Back
          </Link>
        </div>

        {/* User chip */}
        <div className="sidebar-user">
          {user.avatarUrl
            ? <img src={user.avatarUrl} alt={user.displayName} className="user-avatar-img"/>
            : <div className="user-avatar-placeholder">{user.displayName.charAt(0).toUpperCase()}</div>
          }
          <div className="user-info">
            <div className="user-name">{user.displayName}</div>
            <div className="user-tag">Discord</div>
          </div>
          <button className="logout-btn" title="Sign out" onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            window.location.reload();
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>

        {/* Server selector (multi-server) */}
        {guilds.length > 1 && (
          <div className="sidebar-section">
            <span className="section-label">SERVER</span>
            <select className="guild-select" value={selectedGuildId} onChange={e => {
              setSelectedGuildId(e.target.value);
              setSelectedVoiceChannel("");
              setActivePlaylist(playlists.find(p => p.guildId === e.target.value) || null);
            }}>
              {guilds.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
        )}

        {/* Voice channel inline */}
        {voiceChannels.length > 0 && (
          <div className="sidebar-section">
            <span className="section-label">VOICE CHANNEL</span>
            <select className="guild-select" value={selectedVoiceChannel} onChange={e => setSelectedVoiceChannel(e.target.value)}>
              {voiceChannels.map(vc => <option key={vc.id} value={vc.id}>{vc.name}</option>)}
            </select>
          </div>
        )}

        {/* Queue nav item */}
        <div className="sidebar-section">
          <span className="section-label">NAVIGATION</span>
          <nav className="sidebar-nav">
            <div className={`nav-item ${showQueue ? "active" : ""}`} onClick={() => setShowQueue(!showQueue)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
              </svg>
              Queue
              {(nowPlaying?.queueSize ?? 0) > 0 && (
                <span className="queue-badge">{nowPlaying!.queueSize}</span>
              )}
            </div>
          </nav>
        </div>

        {/* Playlists */}
        <div className="sidebar-playlists">
          <div className="playlists-header">
            <span className="section-label" style={{margin:0}}>PLAYLISTS</span>
            <span className="playlist-count">{filteredPlaylists.length}</span>
          </div>
          <div className="playlists-list">
            {playlistsLoading
              ? [1,2,3].map(i => <div key={i} className="skeleton-item" style={{height:40,borderRadius:8}}/>)
              : filteredPlaylists.length === 0
                ? <div className="playlists-empty">No playlists yet.<br/>Use <code>/playlist save</code> in Discord.</div>
                : filteredPlaylists.map((pl,i) => (
                    <div key={i} className={`playlist-item ${activePlaylist?.name===pl.name?"active":""}`} onClick={() => setActivePlaylist(pl)}>
                      <div className="playlist-item-icon">♪</div>
                      <div className="playlist-item-text">
                        <div className="playlist-item-name">{pl.name}</div>
                        <div className="playlist-item-meta">{pl.trackCount} tracks</div>
                      </div>
                    </div>
                  ))
            }
          </div>
        </div>

      </aside>

      {/* ════════════════════════ MAIN ════════════════════════ */}
      <main className="player-main">

        {/* Sticky header — minimal */}
        <header className="main-header">
          <div className="header-left">
            <button className="nav-btn" onClick={() => history.back()} aria-label="Go back">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            {selectedGuild && (
              <div className="header-server-chip">
                {selectedGuild.iconUrl && <img src={selectedGuild.iconUrl} alt=""/>}
                <span>{selectedGuild.name}</span>
              </div>
            )}
          </div>

          <div className="header-center">
            {nowPlaying?.playing && (
              <div className="header-live-pill">
                <span className="live-dot"/>
                <span>Live · #{nowPlaying.voiceChannel?.name || "voice"}</span>
              </div>
            )}
          </div>

          <div className="header-right">
            {/* intentionally empty — no add bot button */}
          </div>
        </header>

        {/* Queue slide-down */}
        {showQueue && nowPlaying?.queue && nowPlaying.queue.length > 0 && (
          <div className="queue-panel">
            <div className="queue-header">
              <span>Up Next · {nowPlaying.queue.length} tracks</span>
              <button className="icon-btn sm" onClick={() => setShowQueue(false)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="queue-list">
              {nowPlaying.queue.map((t,i) => (
                <div key={i} className="queue-item">
                  <span className="queue-num">{i+1}</span>
                  <div className="queue-track-info">
                    <div className="queue-track-title">{t.title}</div>
                    <div className="queue-track-author">{t.author}</div>
                  </div>
                  <span className="queue-duration">{formatTime(t.length)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Content area ── */}
        <div className="playlist-view">

          {controlError && (
            <div className="control-error">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {controlError}
              <button onClick={() => setControlError(null)}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          )}

          {/* Search card — full width, compact */}
          <div className="search-card">
            <SearchBar
              songQuery={songQuery}
              setSongQuery={setSongQuery}
              disabled={!selectedVoiceChannel || controlLoading}
              onSearch={() => {
                if (songQuery) { sendControl("play", songQuery, { voiceChannelId: selectedVoiceChannel }); setSongQuery(""); }
              }}
            />
          </div>

          {activePlaylist ? (
            <>
              {/* Playlist hero */}
              <div className="playlist-hero">
                {isEditingPlaylist ? (
                  <>
                    <div className="hero-art edit-art">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><line x1="15" y1="5" x2="19" y2="9"/></svg>
                    </div>
                    <div className="hero-info edit-info">
                      <span className="hero-type">EDIT PLAYLIST</span>
                      <input 
                        type="text" 
                        className="edit-input-lg" 
                        value={editPlaylistName} 
                        onChange={e => setEditPlaylistName(e.target.value)} 
                        placeholder="Playlist Name" 
                      />
                      <input 
                        type="text" 
                        className="edit-input-sm" 
                        value={editPlaylistIconUrl} 
                        onChange={e => setEditPlaylistIconUrl(e.target.value)} 
                        placeholder="Cover Image URL (optional)" 
                      />
                      <div className="edit-actions">
                        <button className="btn-save" onClick={savePlaylistEdits} disabled={isSavingPlaylist}>
                          {isSavingPlaylist ? "Saving..." : "Save Changes"}
                        </button>
                        <button className="btn-cancel" onClick={() => setIsEditingPlaylist(false)} disabled={isSavingPlaylist}>Cancel</button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="hero-art" style={activePlaylist.iconUrl ? { backgroundImage: `url(${activePlaylist.iconUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>
                      {!activePlaylist.iconUrl && (
                        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
                        </svg>
                      )}
                    </div>
                    <div className="hero-info">
                      <span className="hero-type">PLAYLIST</span>
                      <h1 className="hero-title">{activePlaylist.name}</h1>
                      <p className="hero-meta">
                        <strong>{guildName(activePlaylist.guildId)}</strong>
                        <span className="hero-dot">·</span>{activePlaylist.trackCount} tracks
                        <span className="hero-dot">·</span>Updated {new Date(activePlaylist.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Action row */}
              <div className="playlist-actions">
                <button
                  className="play-all-btn"
                  onClick={() => sendControl("play_playlist", activePlaylist.name, { voiceChannelId: selectedVoiceChannel, userId: user.discordUserId })}
                  disabled={controlLoading || !selectedVoiceChannel}
                  title={`Play ${activePlaylist.name}`}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l14 9-14 9V3z"/></svg>
                </button>

                <button className="icon-btn" onClick={() => sendControl("shuffle")} disabled={controlLoading} title="Shuffle">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/>
                    <polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/>
                    <line x1="4" y1="4" x2="9" y2="9"/>
                  </svg>
                </button>

                <button
                  className={`icon-btn loop-btn ${loopMode !== "off" ? "active" : ""}`}
                  onClick={() => { const n = loopMode==="off"?"queue":loopMode==="queue"?"track":"off"; sendControl("loop",n); }}
                  disabled={controlLoading} title={`Loop: ${loopMode}`}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                    <polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                  </svg>
                  {loopMode !== "off" && <span className="loop-label">{loopMode==="track"?"1":"∞"}</span>}
                </button>

                <div className="actions-right">
                  {!isEditingPlaylist && (
                    <button className="icon-btn edit-btn" onClick={startEditingPlaylist} disabled={controlLoading || isEditingPlaylist} title="Edit Playlist">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      <span className="btn-text">Edit</span>
                    </button>
                  )}
                  {nowPlaying?.playing && (
                    <div className="now-playing-badge">
                      <PlayingBars/>
                      <span>Playing in #{nowPlaying.voiceChannel?.name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Tracks */}
              <div className="tracks-container">
                <div className={`tracks-header${isEditingPlaylist ? " editing" : ""}`}>
                  <div className="col-id">#</div>
                  <div className="col-title">Title</div>
                  <div className="col-album">Artist</div>
                  <div className="col-time">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  </div>
                  {isEditingPlaylist && <div className="col-actions">Actions</div>}
                </div>
                <div className="tracks-list">
                  {(isEditingPlaylist ? editPlaylistTracks : activePlaylist.tracks).map((track, idx) => {
                    const isNP = !isEditingPlaylist && nowPlaying?.currentTrack?.title === track.title && nowPlaying?.currentTrack?.author === track.author;
                    return (
                      <div key={idx} className={`track-row ${isNP?"playing":""} ${isEditingPlaylist?"editing":""}`} onClick={() => !isEditingPlaylist && setActiveTrack(track)}>
                        <div className="col-id">
                          {isNP && isPlaying
                            ? <PlayingBars/>
                            : <>
                                <span className="idx-num">{idx+1}</span>
                                {!isEditingPlaylist && (
                                  <button className="play-icon" aria-label={`Play ${track.title}`}
                                    disabled={controlLoading || !selectedVoiceChannel}
                                    onClick={e => { e.stopPropagation(); sendControl("play", track.uri||track.title, { voiceChannelId: selectedVoiceChannel }); }}>
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l14 9-14 9V3z"/></svg>
                                  </button>
                                )}
                              </>
                          }
                        </div>
                        <div className="col-title"><span className="track-name">{track.title}</span></div>
                        <div className="col-album">{track.author}</div>
                        <div className="col-time">{formatTime(track.length)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="playlist-empty">
              <div className="empty-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
                </svg>
              </div>
              <h2>No playlists found</h2>
              <p>Save a playlist with <code>/playlist save &lt;name&gt;</code> in your Discord server, then return here to control it.</p>
            </div>
          )}
        </div>
      </main>

      {/* ════════════════════════ NOW PLAYING BAR ════════════════════════ */}
      <footer className="now-playing-bar">

        {/* Left — track info */}
        <div className="np-track-info">
          <div className={`np-art ${isPlaying ? "playing" : ""}`}>
            {displayTrack?.artwork
              ? <img src={displayTrack.artwork} alt={displayTrack.title} style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:6}}/>
              : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
            }
            {isPlaying && <div className="np-art-pulse"/>}
          </div>
          {displayTrack ? (
            <div className="np-text">
              <div className="np-title">{displayTrack.title}</div>
              <div className="np-author">{displayTrack.author}</div>
            </div>
          ) : (
            <div className="np-empty">{nowPlaying?.playing ? "Loading…" : "Nothing playing"}</div>
          )}
          {isLive && <div className="live-pill"><span className="live-dot"/><span>LIVE</span></div>}
        </div>

        {/* Center — controls + progress */}
        <div className="np-controls">
          <div className="np-buttons">
            <button className={`icon-btn ${loopMode!=="off"?"active":""}`}
              onClick={() => { const n=loopMode==="off"?"queue":loopMode==="queue"?"track":"off"; sendControl("loop",n); }}
              disabled={controlLoading} title={`Loop: ${loopMode}`} style={{position:"relative"}}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                <polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
              </svg>
              {loopMode==="track" && <span className="loop-label">1</span>}
            </button>

            <button className="play-pause-btn" onClick={() => sendControl(isPlaying?"pause":"resume")} disabled={controlLoading} title={isPlaying?"Pause":"Play"}>
              {controlLoading
                ? <div className="spinner"/>
                : isPlaying
                  ? <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                  : <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l14 9-14 9V3z"/></svg>
              }
            </button>

            <button className="icon-btn" onClick={() => sendControl("skip")} disabled={controlLoading} title="Skip">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="2"/></svg>
            </button>

            <button className="icon-btn" onClick={() => sendControl("stop")} disabled={controlLoading} title="Stop">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
            </button>
          </div>

          <ProgressBar nowPlaying={nowPlaying}/>
        </div>

        {/* Right — volume + queue */}
        <div className="np-extra">
          <button className={`icon-btn ${showQueue?"active":""}`} onClick={() => setShowQueue(!showQueue)} title="Queue">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
            {(nowPlaying?.queueSize ?? 0) > 0 && <span className="queue-badge sm">{nowPlaying!.queueSize}</span>}
          </button>

          <div className="volume-group">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color:"var(--text-muted)",flexShrink:0}}>
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              {volume > 0 && <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>}
              {volume > 80 && <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>}
            </svg>
            <input type="range" className="volume-slider" min={0} max={200} value={volume}
              onChange={e => setVolume(Number(e.target.value))}
              onMouseUp={e => sendControl("volume", Number((e.target as HTMLInputElement).value))}
              onTouchEnd={e => sendControl("volume", Number((e.target as HTMLInputElement).value))}
              title={`Volume: ${volume}%`} aria-label="Volume"
            />
            <span className="volume-label">{volume}%</span>
          </div>
        </div>

      </footer>
    </div>
  );
}
