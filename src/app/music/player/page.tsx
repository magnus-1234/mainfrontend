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
  guildId: string;
  userId: string;
  name: string;
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
        <p className="login-note">
          We only request the <code>identify</code> scope — no messages or guild management access.
        </p>
        <div className="login-features">
          <div className="login-feature">
            <span className="feature-icon">🎵</span>
            <span>View & browse playlists</span>
          </div>
          <div className="login-feature">
            <span className="feature-icon">▶️</span>
            <span>Play, pause, skip tracks</span>
          </div>
          <div className="login-feature">
            <span className="feature-icon">🎚️</span>
            <span>Control volume & loop</span>
          </div>
          <div className="login-feature">
            <span className="feature-icon">📡</span>
            <span>Live queue & now playing</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SkeletonLoader() {
  return (
    <div className="skeleton-layout">
      <div className="skeleton-sidebar">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="skeleton-item" style={{ width: `${60 + i * 8}%` }} />
        ))}
      </div>
      <div className="skeleton-main">
        <div className="skeleton-hero" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="skeleton-row" />
        ))}
      </div>
    </div>
  );
}

function PlayingBars() {
  return (
    <div className="playing-bars">
      <i /><i /><i />
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function MusicPlayerPage() {
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Data state
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [selectedGuildId, setSelectedGuildId] = useState<string>("");
  const [playlistsLoading, setPlaylistsLoading] = useState(false);
  const [activePlaylist, setActivePlaylist] = useState<Playlist | null>(null);
  const [activeTrack, setActiveTrack] = useState<Track | null>(null);

  // Bot status
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const [controlLoading, setControlLoading] = useState(false);
  const [controlError, setControlError] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // UI state
  const [showQueue, setShowQueue] = useState(false);
  const [volume, setVolume] = useState(50);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Play form state
  const [voiceChannels, setVoiceChannels] = useState<{id: string, name: string}[]>([]);
  const [textChannels, setTextChannels] = useState<{id: string, name: string}[]>([]);
  const [selectedVoiceChannel, setSelectedVoiceChannel] = useState<string>("");
  const [selectedTextChannel, setSelectedTextChannel] = useState<string>("");
  const [songQuery, setSongQuery] = useState("");

  const fetchChannels = useCallback(async (guildId: string) => {
    if (!guildId) return;
    try {
      const res = await fetch("/api/music/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "channels", guildId }),
      });
      const data = await res.json();
      if (data.ok && data.voiceChannels) {
        const voices = data.voiceChannels || [];
        const texts = data.textChannels || [];
        setVoiceChannels(voices);
        setTextChannels(texts);
        if (voices.length > 0) setSelectedVoiceChannel((current) => current || voices[0].id);
        if (texts.length > 0) setSelectedTextChannel((current) => current || texts[0].id);
      }
    } catch {
      setVoiceChannels([]);
      setTextChannels([]);
    }
  }, []);

  useEffect(() => {
    if (!selectedGuildId) return;
    const timer = setTimeout(() => {
      void fetchChannels(selectedGuildId);
    }, 0);
    return () => clearTimeout(timer);
  }, [selectedGuildId, fetchChannels]);


  // ── Auth check ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/session", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user || data);
        }
      } catch {
        // not authenticated
      } finally {
        setAuthLoading(false);
      }
    };
    checkAuth();
  }, []);

  // ── Load playlists when user logs in ──────────────────────────────────────
  useEffect(() => {
    if (!user?.discordUserId) return;
    const load = async () => {
      setPlaylistsLoading(true);
      try {
        const [playlistsRes, guildsRes] = await Promise.all([
          fetch(`/api/music/playlists?userId=${encodeURIComponent(user.discordUserId!)}`, { credentials: "include" }),
          fetch("/api/music/guilds", { credentials: "include" }),
        ]);

        const playlistData = await playlistsRes.json().catch(() => ({ playlists: [], guilds: [] }));
        const guildData = await guildsRes.json().catch(() => ({ guilds: [] }));
        const loadedPlaylists: Playlist[] = playlistData.playlists || [];
        const botGuilds: Guild[] = Array.isArray(guildData.guilds) ? guildData.guilds : [];
        const userGuilds = user.musicGuilds || [];
        const botGuildIds = new Set(botGuilds.map((g) => g.id));
        const intersectedGuilds: Guild[] = userGuilds
          .filter((g) => botGuildIds.has(g.id))
          .map((g) => ({ id: g.id, name: g.name, iconUrl: g.iconUrl }));

        const playlistGuilds = (playlistData.guilds || []).map((id: string) => guildFromId(id));
        const guildMap = new Map<string, Guild>();

        if (guildData.error) {
          setGlobalError(guildData.error);
        }

        for (const guild of [...intersectedGuilds, ...playlistGuilds]) {
          if (guild?.id) guildMap.set(guild.id, guild);
        }

        const mergedGuilds = Array.from(guildMap.values());
        setPlaylists(loadedPlaylists);
        setGuilds(mergedGuilds);

        if (mergedGuilds.length === 1) {
          const firstGuild = mergedGuilds[0].id;
          setSelectedGuildId(firstGuild);
          const firstForGuild = loadedPlaylists.find((p) => p.guildId === firstGuild) || loadedPlaylists[0];
          setActivePlaylist(firstForGuild || null);
        }
      } catch {
        // silently fail
      } finally {
        setPlaylistsLoading(false);
      }
    };
    load();
  }, [user]);

  // ── Poll now-playing status ────────────────────────────────────────────────
  const fetchNowPlaying = useCallback(async (guildId: string) => {
    if (!guildId) return;
    try {
      const res = await fetch(`/api/music/now-playing?guildId=${encodeURIComponent(guildId)}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setNowPlaying(data);
        if (data.volume != null) setVolume(data.volume);
      }
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    if (!selectedGuildId || !user) return;
    const initialTimer = setTimeout(() => {
      void fetchNowPlaying(selectedGuildId);
    }, 0);
    pollIntervalRef.current = setInterval(() => void fetchNowPlaying(selectedGuildId), 4000);
    return () => {
      clearTimeout(initialTimer);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [selectedGuildId, user, fetchNowPlaying]);

  // ── Control bot ────────────────────────────────────────────────────────────
  const sendControl = useCallback(
    async (action: string, value?: unknown, extra?: Record<string, unknown>) => {
      if (!selectedGuildId) {
        setControlError("Select a server first");
        return;
      }
      setControlLoading(true);
      setControlError(null);
      try {
        const res = await fetch("/api/music/control", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ action, guildId: selectedGuildId, value, ...extra }),
        });
        const data = await res.json();
        if (!res.ok) {
          setControlError(data.error || "Command failed");
        } else {
          // Refresh status after short delay
          setTimeout(() => fetchNowPlaying(selectedGuildId), 600);
        }
      } catch {
        setControlError("Could not reach the music bot");
      } finally {
        setControlLoading(false);
      }
    },
    [selectedGuildId, fetchNowPlaying]
  );

  // ── Derived state ──────────────────────────────────────────────────────────
  const filteredPlaylists = playlists.filter((p) =>
    selectedGuildId ? p.guildId === selectedGuildId : true
  );
  const selectedGuild = guilds.find((guild) => guild.id === selectedGuildId) || (selectedGuildId ? guildFromId(selectedGuildId) : null);
  const guildName = (guildId: string) => guilds.find((guild) => guild.id === guildId)?.name || `Server ${guildId}`;

  const isLive = nowPlaying?.source === "live";
  const displayTrack = nowPlaying?.currentTrack || activeTrack;
  const isPlaying = nowPlaying?.playing ?? false;
  const loopMode = nowPlaying?.loopMode || "off";

  // ── Early returns ──────────────────────────────────────────────────────────
  if (authLoading) return <SkeletonLoader />;
  if (!user || !user.providers?.includes('discord-music') || user.musicGuilds === undefined) return <DiscordLoginScreen />;

  // ── Main UI ────────────────────────────────────────────────────────────────
  if (globalError) {
    return (
      <div className="player-layout" style={{ minHeight: "100vh", padding: "40px 0" }}>
        <div className="server-selection-view">
          <h1 className="server-selection-title">Connection Error</h1>
          <div className="playlists-empty" style={{ maxWidth: 400, margin: "40px auto", textAlign: "center", color: "var(--text-muted)" }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 20 }}>
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <p>{globalError}</p>
            <p style={{ marginTop: 10, fontSize: "0.9em" }}>The music bot might be offline or undergoing maintenance.</p>
            <button className="btn-primary" style={{ marginTop: 20 }} onClick={() => window.location.reload()}>Retry</button>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedGuildId && guilds.length > 0) {
    return (
      <div className="player-layout" style={{ minHeight: "100vh", padding: "40px 0" }}>
        <div className="server-selection-view">
          <h1 className="server-selection-title">Select a Server to Manage Music</h1>
          <div className="servers-grid">
            {guilds.map((guild) => (
              <div
                key={guild.id}
                className="server-card"
                onClick={() => {
                  setSelectedGuildId(guild.id);
                  const first = playlists.find((p) => p.guildId === guild.id);
                  setActivePlaylist(first || null);
                }}
              >
                <div className="server-banner" />
                <div className="server-icon">
                  <img src={guild.iconUrl || fallbackGuildIcon} alt={guild.name} />
                </div>
                <div className="server-body">
                  <div className="server-name">{guild.name}</div>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.9em" }}>
                    {guild.voiceChannelCount || 0} voice channels
                    {guild.activeVoiceChannel ? ` • live in ${guild.activeVoiceChannel.name}` : ""}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="player-layout">
      {/* ── Sidebar ── */}
      <aside className="player-sidebar">
        <div className="sidebar-header">
          <Link href="/music" className="back-link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Back
          </Link>
        </div>

        {/* User profile */}
        <div className="sidebar-user">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.displayName} className="user-avatar-img" />
          ) : (
            <div className="user-avatar-placeholder">
              {user.displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="user-info">
            <div className="user-name">{user.displayName}</div>
            <div className="user-tag">Discord</div>
          </div>
          <button className="logout-btn" title="Sign out" onClick={async () => { 
            await fetch("/api/auth/logout", { method: "POST" });
            window.location.reload(); 
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>

        {/* Guild selector */}
        {guilds.length > 1 && (
          <div className="guild-selector">
            <label className="selector-label">SERVER</label>
            <select
              className="guild-select"
              value={selectedGuildId}
              onChange={(e) => {
                setSelectedGuildId(e.target.value);
                setSelectedVoiceChannel("");
                setSelectedTextChannel("");
                const first = playlists.find((p) => p.guildId === e.target.value);
                setActivePlaylist(first || null);
              }}
            >
              {guilds.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Sidebar nav */}
        <nav className="sidebar-nav">
          <div className="nav-item active">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
            </svg>
            Library
          </div>
          <div
            className={`nav-item ${showQueue ? "active" : ""}`}
            onClick={() => setShowQueue(!showQueue)}
            style={{ cursor: "pointer" }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
            Queue {nowPlaying?.queueSize ? `(${nowPlaying.queueSize})` : ""}
          </div>
        </nav>

        {/* Playlists list */}
        <div className="sidebar-playlists">
          <div className="playlists-header">
            <span>PLAYLISTS</span>
            <span className="playlist-count">{filteredPlaylists.length}</span>
          </div>
          <div className="playlists-list">
            {playlistsLoading ? (
              [1, 2, 3].map((i) => <div key={i} className="skeleton-item" />)
            ) : filteredPlaylists.length === 0 ? (
              <div className="playlists-empty">
                No playlists yet.<br />
                Use <code>/playlist save</code> in Discord to create one.
              </div>
            ) : (
              filteredPlaylists.map((pl, i) => (
                <div
                  key={i}
                  className={`playlist-item ${activePlaylist?.name === pl.name ? "active" : ""}`}
                  onClick={() => setActivePlaylist(pl)}
                >
                  <div className="playlist-item-icon">♪</div>
                  <div className="playlist-item-text">
                    <div className="playlist-item-name">{pl.name}</div>
                    <div className="playlist-item-meta">{pl.trackCount} tracks</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="player-main">
        <header className="main-header">
          <div className="header-nav-controls">
            <button className="nav-btn" onClick={() => history.back()} aria-label="Go back">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
          </div>

          {/* Live status indicator */}
          {selectedGuild && (
            <div className="live-badge server-badge">
              {selectedGuild.iconUrl && <img src={selectedGuild.iconUrl} alt="" />}
              {selectedGuild.name}
            </div>
          )}
          {nowPlaying?.playing && (
            <div className="live-badge">
              <span className="live-dot" />
              Now Playing in #{nowPlaying.voiceChannel?.name || "voice"}
            </div>
          )}

          <div className="header-right">
            <a
              href="https://discord.com/oauth2/authorize?client_id=1509574640853585990&permissions=8&integration_type=0&scope=bot"
              target="_blank"
              rel="noreferrer"
              className="invite-btn"
            >
              Add Bot
            </a>
          </div>
        </header>

        {/* Queue panel */}
        {showQueue && nowPlaying?.queue && nowPlaying.queue.length > 0 && (
          <div className="queue-panel">
            <div className="queue-header">
              <span>Queue ({nowPlaying.queue.length})</span>
              <button className="icon-btn" onClick={() => setShowQueue(false)}>✕</button>
            </div>
            <div className="queue-list">
              {nowPlaying.queue.map((t, i) => (
                <div key={i} className="queue-item">
                  <span className="queue-num">{i + 1}</span>
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

        {/* Main playlist view */}
        <div className="playlist-view">
          {controlError && (
            <div className="control-error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {controlError}
              <button onClick={() => setControlError(null)}>✕</button>
            </div>
          )}

          {/* PLAY CONTROLS */}
          <div className="play-controls-card">
             <div className="play-controls-row">
                <div className="control-select-group">
                  <label>Voice channel</label>
                  <select 
                    className="channel-select" 
                    value={selectedVoiceChannel}
                    onChange={(e) => setSelectedVoiceChannel(e.target.value)}
                  >
                     {voiceChannels.length === 0 && <option value="">No voice channels</option>}
                     {voiceChannels.map(vc => <option key={vc.id} value={vc.id}>{vc.name}</option>)}
                  </select>
                </div>
                <div className="control-select-group">
                  <label>Music channel</label>
                  <select 
                    className="channel-select" 
                    value={selectedTextChannel}
                    onChange={(e) => setSelectedTextChannel(e.target.value)}
                  >
                     {textChannels.length === 0 && <option value="">No text channels</option>}
                     {textChannels.map(tc => <option key={tc.id} value={tc.id}>{tc.name}</option>)}
                  </select>
                </div>
                <input 
                  type="text" 
                  className="play-input" 
                  placeholder="Search for a song or paste URL..." 
                  value={songQuery}
                  onChange={(e) => setSongQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && songQuery) {
                      sendControl("play", songQuery, { voiceChannelId: selectedVoiceChannel, textChannelId: selectedTextChannel });
                      setSongQuery("");
                    }
                  }}
                />
                <button 
                  className="btn-primary" 
                  disabled={!songQuery || !selectedVoiceChannel || controlLoading}
                  onClick={() => {
                     sendControl("play", songQuery, { voiceChannelId: selectedVoiceChannel, textChannelId: selectedTextChannel });
                     setSongQuery("");
                  }}
                >
                  {controlLoading ? "..." : "Play"}
                </button>
             </div>
          </div>



          {activePlaylist ? (
            <>
              {/* Playlist hero */}
              <div className="playlist-hero">
                <div className="hero-art">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
                  </svg>
                </div>
                <div className="hero-info">
                  <span className="hero-type">PLAYLIST</span>
                  <h1 className="hero-title">{activePlaylist.name}</h1>
                  <p className="hero-meta">
                    <strong>{guildName(activePlaylist.guildId)}</strong> &bull; {activePlaylist.trackCount} tracks &bull; last updated{" "}
                    {new Date(activePlaylist.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Actions bar */}
              <div className="playlist-actions">
                <button
                  className={`play-all-btn ${controlLoading ? "loading" : ""}`}
                  onClick={() => sendControl("play_playlist", activePlaylist.name, {
                    voiceChannelId: selectedVoiceChannel,
                    textChannelId: selectedTextChannel,
                    userId: user.discordUserId,
                  })}
                  title={`Play ${activePlaylist.name} in Discord`}
                  disabled={controlLoading || !selectedVoiceChannel}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M5 3l14 9-14 9V3z" />
                  </svg>
                </button>
                <button
                  className="icon-btn"
                  onClick={() => sendControl("shuffle")}
                  title="Shuffle queue"
                  disabled={controlLoading}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" />
                    <polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" />
                    <line x1="4" y1="4" x2="9" y2="9" />
                  </svg>
                </button>
                {/* Loop button */}
                <button
                  className={`icon-btn loop-btn ${loopMode !== "off" ? "active" : ""}`}
                  onClick={() => {
                    const next = loopMode === "off" ? "queue" : loopMode === "queue" ? "track" : "off";
                    sendControl("loop", next);
                  }}
                  title={`Loop: ${loopMode}`}
                  disabled={controlLoading}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" />
                    <polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
                  </svg>
                  {loopMode !== "off" && <span className="loop-label">{loopMode === "track" ? "1" : "∞"}</span>}
                </button>
              </div>

              {/* Track list */}
              <div className="tracks-container">
                <div className="tracks-header">
                  <div className="col-id">#</div>
                  <div className="col-title">Title</div>
                  <div className="col-album">Artist</div>
                  <div className="col-time">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                </div>
                <div className="tracks-list">
                  {activePlaylist.tracks.map((track, idx) => {
                    const isNowPlaying =
                      nowPlaying?.currentTrack?.title === track.title &&
                      nowPlaying?.currentTrack?.author === track.author;
                    return (
                      <div
                        key={idx}
                        className={`track-row ${isNowPlaying ? "playing" : ""}`}
                        onClick={() => setActiveTrack(track)}
                      >
                        <div className="col-id">
                          {isNowPlaying && isPlaying ? (
                            <PlayingBars />
                          ) : (
                            <>
                              <span className="idx-num">{idx + 1}</span>
                              <button
                                className="play-icon"
                                aria-label={`Play ${track.title}`}
                                disabled={controlLoading || !selectedVoiceChannel}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  sendControl("play", track.uri || track.title, {
                                    voiceChannelId: selectedVoiceChannel,
                                    textChannelId: selectedTextChannel,
                                  });
                                }}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M5 3l14 9-14 9V3z" />
                                </svg>
                              </button>
                            </>
                          )}
                        </div>
                        <div className="col-title">
                          <span className="track-name">{track.title}</span>
                        </div>
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
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
              </svg>
              <h2>No playlists found</h2>
              <p>
                Create a playlist with <code>/playlist save &lt;name&gt;</code> in your Discord server,
                then come back here to control it.
              </p>
              <a
                href="https://discord.com/oauth2/authorize?client_id=1509574640853585990&permissions=8&integration_type=0&scope=bot"
                target="_blank"
                rel="noreferrer"
                className="invite-btn"
              >
                Add Music Bot to Server
              </a>
            </div>
          )}
        </div>
      </main>

      {/* ── Now Playing Bar ── */}
      <footer className="now-playing-bar">
        {/* Track info */}
        <div className="np-track-info">
          {displayTrack ? (
            <>
              <div className="np-art">
                {displayTrack.artwork ? (
                  <img src={displayTrack.artwork} alt={displayTrack.title} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 4 }} />
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
                  </svg>
                )}
              </div>
              <div className="np-text">
                <div className="np-title">{displayTrack.title}</div>
                <div className="np-author">{displayTrack.author}</div>
              </div>
              {isLive && (
                <div className="live-indicator">
                  <span className="live-dot" />
                  LIVE
                </div>
              )}
            </>
          ) : (
            <div className="np-empty">
              {nowPlaying?.playing ? "Loading..." : "No track playing"}
            </div>
          )}
        </div>

        {/* Playback controls */}
        <div className="np-controls">
          <div className="np-buttons">
            <button className="icon-btn" onClick={() => sendControl("previous")} disabled={controlLoading} title="Previous">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="19 20 9 12 19 4 19 20" /><line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" strokeWidth="2" />
              </svg>
            </button>
            <button
              className="play-pause-btn"
              onClick={() => sendControl(isPlaying ? "pause" : "resume")}
              disabled={controlLoading}
              title={isPlaying ? "Pause" : "Resume"}
            >
              {controlLoading ? (
                <div className="spinner" />
              ) : isPlaying ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M5 3l14 9-14 9V3z" />
                </svg>
              )}
            </button>
            <button className="icon-btn" onClick={() => sendControl("skip")} disabled={controlLoading} title="Skip">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 4 15 12 5 20 5 4" /><line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="2" />
              </svg>
            </button>
            <button className="icon-btn" onClick={() => sendControl("stop")} disabled={controlLoading} title="Stop">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <rect x="3" y="3" width="18" height="18" rx="2" />
              </svg>
            </button>
          </div>

          {/* Progress bar */}
          <div className="np-progress">
            <span className="time">
              {displayTrack?.position ? formatTime(displayTrack.position) : "0:00"}
            </span>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: displayTrack?.length && displayTrack?.position
                    ? `${Math.min(100, (displayTrack.position / displayTrack.length) * 100)}%`
                    : "0%",
                }}
              />
            </div>
            <span className="time">{displayTrack ? formatTime(displayTrack.length) : "0:00"}</span>
          </div>
        </div>

        {/* Volume + extras */}
        <div className="np-extra">
          <button
            className={`icon-btn queue-toggle ${showQueue ? "active" : ""}`}
            onClick={() => setShowQueue(!showQueue)}
            title="Toggle queue"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          </button>
          <button className="icon-btn" title="Volume">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
          </button>
          <input
            type="range"
            className="volume-slider"
            min={0}
            max={200}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            onMouseUp={(e) => sendControl("volume", Number((e.target as HTMLInputElement).value))}
            onTouchEnd={(e) => sendControl("volume", Number((e.target as HTMLInputElement).value))}
            title={`Volume: ${volume}%`}
            aria-label="Volume"
          />
          <span className="volume-label">{volume}%</span>
        </div>
      </footer>
    </div>
  );
}
