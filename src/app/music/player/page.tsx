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

type SearchSong = {
  type: "song";
  videoId: string;
  title: string;
  artist: string;
  album?: string;
  duration?: string;
  thumbnail?: string;
};

type SearchAlbum = {
  type: "album";
  browseId: string;
  title: string;
  artist: string;
  year?: string;
  thumbnail?: string;
};

type SearchArtist = {
  type: "artist";
  browseId: string;
  name: string;
  subscribers?: string;
  thumbnail?: string;
};

type SearchResults = {
  songs: SearchSong[];
  albums: SearchAlbum[];
  artists: SearchArtist[];
};

type HistoryEntry = {
  guildId: string;
  track: {
    title: string;
    author: string;
    uri: string;
    thumbnail?: string | null;
  };
  playlistName?: string | null;
  playedAt?: string | null;
};


// ── Utility helpers ───────────────────────────────────────────────────────────

const formatTime = (ms: number) => {
  if (!ms || ms <= 0) return "Live";
  const totalSecs = Math.floor(ms / 1000);
  const m = Math.floor(totalSecs / 60);
  const s = totalSecs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const formatDuration = (ms: number) => {
  const totalSecs = Math.floor(ms / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  if (h > 0) return `${h} hr ${m} min`;
  return `${m} min`;
};

const DISCORD_LOGIN_URL = "/api/auth/discord-music?returnTo=/music/player";
const fallbackGuildIcon = "https://cdn.discordapp.com/embed/avatars/0.png";

const guildFromId = (guildId: string): Guild => ({
  id: guildId,
  name: `Server ${guildId}`,
  iconUrl: fallbackGuildIcon,
});

const PLAYLIST_COLORS = [
  "#e13300", "#e91e63", "#9c27b0", "#673ab7",
  "#3f51b5", "#2196f3", "#00bcd4", "#009688",
  "#4caf50", "#8bc34a", "#ff9800", "#ff5722",
];

const getPlaylistColor = (name: string) =>
  PLAYLIST_COLORS[name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % PLAYLIST_COLORS.length];

// ── Subcomponents ─────────────────────────────────────────────────────────────

function DiscordLoginScreen() {
  return (
    <div className="dz-login-screen">
      <div className="dz-login-card">
        <div className="dz-login-icon">
          <svg viewBox="0 0 71 55" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M60.1 4.9A58.5 58.5 0 0 0 45.5.4a40 40 0 0 0-1.8 3.7 54 54 0 0 0-16.4 0A38 38 0 0 0 25.4.4 58.4 58.4 0 0 0 10.9 5C1.6 18.8-1 32.3.3 45.6a59 59 0 0 0 18 9.1 44 44 0 0 0 3.8-6.2 38.4 38.4 0 0 1-6-2.9l1.5-1.1a42.2 42.2 0 0 0 36 0l1.5 1.1a38.5 38.5 0 0 1-6 2.9 43.8 43.8 0 0 0 3.8 6.2 58.8 58.8 0 0 0 18-9.1C72.3 30.2 68.2 16.8 60.1 4.9ZM23.7 37.8c-3.6 0-6.5-3.3-6.5-7.3s2.9-7.3 6.5-7.3c3.6 0 6.6 3.3 6.5 7.3 0 4-2.9 7.3-6.5 7.3Zm23.6 0c-3.6 0-6.5-3.3-6.5-7.3s2.9-7.3 6.5-7.3c3.6 0 6.6 3.3 6.5 7.3 0 4-2.9 7.3-6.5 7.3Z" />
          </svg>
        </div>
        <h1 className="dz-login-title">Music Bot Controller</h1>
        <p className="dz-login-subtitle">
          Login with Discord to view your playlists, control playback, and manage your queue.
        </p>
        <a href={DISCORD_LOGIN_URL} className="dz-login-btn" id="discord-login-btn">
          <svg viewBox="0 0 71 55" fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="18" height="18">
            <path d="M60.1 4.9A58.5 58.5 0 0 0 45.5.4a40 40 0 0 0-1.8 3.7 54 54 0 0 0-16.4 0A38 38 0 0 0 25.4.4 58.4 58.4 0 0 0 10.9 5C1.6 18.8-1 32.3.3 45.6a59 59 0 0 0 18 9.1 44 44 0 0 0 3.8-6.2 38.4 38.4 0 0 1-6-2.9l1.5-1.1a42.2 42.2 0 0 0 36 0l1.5 1.1a38.5 38.5 0 0 1-6 2.9 43.8 43.8 0 0 0 3.8 6.2 58.8 58.8 0 0 0 18-9.1C72.3 30.2 68.2 16.8 60.1 4.9ZM23.7 37.8c-3.6 0-6.5-3.3-6.5-7.3s2.9-7.3 6.5-7.3c3.6 0 6.6 3.3 6.5 7.3 0 4-2.9 7.3-6.5 7.3Zm23.6 0c-3.6 0-6.5-3.3-6.5-7.3s2.9-7.3 6.5-7.3c3.6 0 6.6 3.3 6.5 7.3 0 4-2.9 7.3-6.5 7.3Z" />
          </svg>
          Login with Discord
        </a>
        <p className="dz-login-note">We only request the <code>identify</code> scope — no messages or guild management access.</p>
      </div>
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

// ── Search Results Panel ─────────────────────────────────────────────────────
function SearchResultsPanel({
  results, loading, query, onPlaySong, onPlayAlbum, onPlayArtist, onSaveSong, onClose,
}: {
  results: SearchResults | null;
  loading: boolean;
  query: string;
  onPlaySong: (song: SearchSong) => void;
  onPlayAlbum: (album: SearchAlbum) => void;
  onPlayArtist: (artist: SearchArtist) => void;
  onSaveSong: (song: SearchSong) => void;
  onClose: () => void;
}) {
  if (!query || query.length < 2) return null;

  const hasSongs = results && results.songs.length > 0;
  const hasAlbums = results && results.albums.length > 0;
  const hasArtists = results && results.artists.length > 0;
  const hasAny = hasSongs || hasAlbums || hasArtists;

  return (
    <div className="sr-panel">
      {loading && (
        <div className="sr-loading">
          <div className="dz-spinner-sm" />
          <span>Searching YouTube Music…</span>
        </div>
      )}
      {!loading && !hasAny && (
        <div className="sr-empty">No results found for &ldquo;{query}&rdquo;</div>
      )}
      {hasSongs && (
        <div className="sr-section">
          <div className="sr-section-title">Songs</div>
          {results!.songs.map((song) => (
            <div key={song.videoId} className="sr-song-row">
              <button className="sr-thumb" onClick={() => onPlaySong(song)}>
                {song.thumbnail
                  ? <img src={song.thumbnail} alt={song.title} />
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
                }
                <div className="sr-thumb-play">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l14 9-14 9V3z"/></svg>
                </div>
              </button>
              <div className="sr-song-info" onClick={() => onPlaySong(song)} style={{cursor:"pointer"}}>
                <div className="sr-song-title">{song.title}</div>
                <div className="sr-song-meta">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" style={{color:"#ff0000",flexShrink:0}}><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.19a8.24 8.24 0 0 0 4.83 1.55V6.3a4.85 4.85 0 0 1-1.06-.39z"/></svg>
                  {song.artist}{song.album ? ` · ${song.album}` : ""}
                </div>
              </div>
              <div className="sr-song-actions">
                <button className="sr-save-btn" onClick={(e) => { e.stopPropagation(); onSaveSong(song); }} title="Save to Favorites">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                </button>
                <button className="sr-queue-btn" onClick={(e) => { e.stopPropagation(); onPlaySong(song); }} title="Add to Queue">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </button>
                {song.duration && <span className="sr-song-dur">{song.duration}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
      {hasAlbums && (
        <div className="sr-section">
          <div className="sr-section-title">Albums</div>
          <div className="sr-album-grid">
            {results!.albums.map((album) => (
              <button key={album.browseId} className="sr-album-card" onClick={() => onPlayAlbum(album)}>
                <div className="sr-album-cover">
                  {album.thumbnail
                    ? <img src={album.thumbnail} alt={album.title} />
                    : <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </div>
                <div className="sr-album-name">{album.title}</div>
                <div className="sr-album-meta">{album.artist}{album.year ? ` · ${album.year}` : ""}</div>
              </button>
            ))}
          </div>
        </div>
      )}
      {hasArtists && (
        <div className="sr-section">
          <div className="sr-section-title">Artists</div>
          <div className="sr-artist-list">
            {results!.artists.map((artist) => (
              <button key={artist.browseId} className="sr-artist-row" onClick={() => onPlayArtist(artist)}>
                <div className="sr-artist-avatar">
                  {artist.thumbnail
                    ? <img src={artist.thumbnail} alt={artist.name} />
                    : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>
                  }
                </div>
                <div className="sr-artist-info">
                  <div className="sr-artist-name">{artist.name}</div>
                  {artist.subscribers && <div className="sr-artist-subs">{artist.subscribers}</div>}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
type ActiveView = "home" | "playlists" | "liked" | "artists" | "albums" | "history" | "playlist-detail" | "search";

export default function MusicPlayerPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [selectedGuildId, setSelectedGuildId] = useState<string>("");
  const [playlistsLoading, setPlaylistsLoading] = useState(false);
  const [activePlaylist, setActivePlaylist] = useState<Playlist | null>(null);
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const [controlLoading, setControlLoading] = useState(false);
  const [controlError, setControlError] = useState<string | null>(null);
  const [showQueue, setShowQueue] = useState(false);
  const [volume, setVolume] = useState(50);
  const [songQuery, setSongQuery] = useState("");
  const [activeView, setActiveView] = useState<ActiveView>("playlists");
  const [voiceChannels, setVoiceChannels] = useState<{id:string;name:string}[]>([]);
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);


  // Search state
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchBarRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (!songQuery || songQuery.trim().length < 2) {
      setSearchResults(null);
      return;
    }
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/music/search?q=${encodeURIComponent(songQuery.trim())}`);
        if (res.ok) {
          const data: SearchResults = await res.json();
          setSearchResults(data);
        }
      } catch {} finally {
        setSearchLoading(false);
      }
    }, 400);
    return () => { if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current); };
  }, [songQuery]);

  // Click-outside to close search
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchBarRef.current && !searchBarRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  const [selectedVoiceChannel, setSelectedVoiceChannel] = useState<string>("");
  
  const [serverDropdownOpen, setServerDropdownOpen] = useState(false);
  const serverDropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (serverDropdownRef.current && !serverDropdownRef.current.contains(e.target as Node)) {
        setServerDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  // Edit playlist state
  const [isEditingPlaylist, setIsEditingPlaylist] = useState(false);
  const [editPlaylistName, setEditPlaylistName] = useState("");
  const [editPlaylistIconUrl, setEditPlaylistIconUrl] = useState("");
  const [editPlaylistTracks, setEditPlaylistTracks] = useState<Track[]>([]);
  const [isSavingPlaylist, setIsSavingPlaylist] = useState(false);

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
        body: JSON.stringify({ id: activePlaylist.id, name: editPlaylistName, iconUrl: editPlaylistIconUrl, tracks: editPlaylistTracks }),
      });
      if (res.ok) {
        setIsEditingPlaylist(false);
        setPlaylists(prev => prev.map(p =>
          p.id === activePlaylist.id ? { ...p, name: editPlaylistName, iconUrl: editPlaylistIconUrl, tracks: editPlaylistTracks, trackCount: editPlaylistTracks.length } : p
        ));
        setActivePlaylist(prev => prev ? { ...prev, name: editPlaylistName, iconUrl: editPlaylistIconUrl, tracks: editPlaylistTracks, trackCount: editPlaylistTracks.length } : null);
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
    if (!(user?.discordUserId || user?.id)) return;
    const load = async () => {
      setPlaylistsLoading(true);
      try {
        const [pr, gr] = await Promise.all([
          fetch(`/api/music/playlists?userId=${encodeURIComponent(user.discordUserId || user.id)}`, { credentials: "include" }),
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
        const mg = Array.from(gMap.values());
        setPlaylists(lp); setGuilds(mg);
        if (mg.length === 1) {
          setSelectedGuildId(mg[0].id);
          setActivePlaylist(lp.find(p => p.guildId === mg[0].id) || lp[0] || null);
        }
        const savedGuild = localStorage.getItem("wos_music_guild");
        if (savedGuild && mg.some((g: any) => g.id === savedGuild)) {
          setSelectedGuildId(savedGuild);
        } else if (!selectedGuildId && mg.length > 0) {
          setSelectedGuildId(mg[0].id);
          localStorage.setItem("wos_music_guild", mg[0].id);
        }
      } catch {} finally { setPlaylistsLoading(false); }
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Fetch music history when history view is opened
  useEffect(() => {
    if (activeView !== "history") return;
    const fetchHistory = async () => {
      setHistoryLoading(true);
      try {
        const params = selectedGuildId ? `?guildId=${encodeURIComponent(selectedGuildId)}` : "";
        const res = await fetch(`/api/music/history${params}`, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setHistoryEntries(Array.isArray(data.history) ? data.history : []);
        }
      } catch {}
      finally { setHistoryLoading(false); }
    };
    fetchHistory();
  }, [activeView, selectedGuildId]);


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

  const saveToFavorites = async (song: SearchSong) => {
    if (!selectedGuildId) { setControlError("Select a server first"); return; }
    
    // Find "Favorites" or "Liked Songs" playlist
    let target = playlists.find(p => p.guildId === selectedGuildId && (p.name.toLowerCase() === "favorites" || p.name.toLowerCase() === "liked songs"));
    
    const track = {
      title: song.title,
      author: song.artist,
      uri: `https://www.youtube.com/watch?v=${song.videoId}`,
      length: song.duration ? song.duration.split(":").reduce((acc, time) => (60 * acc) + +time, 0) * 1000 : 0
    };

    setControlLoading(true);
    try {
      if (target) {
        // Add to existing playlist
        const res = await fetch("/api/music/playlists", {
          method: "PUT", headers: {"Content-Type":"application/json"}, credentials: "include",
          body: JSON.stringify({ id: target.id, tracks: [...target.tracks, track] })
        });
        if (res.ok) {
          setControlError("Saved to Favorites!");
          setTimeout(() => setControlError(null), 3000);
        }
      } else {
        // Create "Favorites" playlist
        const res = await fetch("/api/music/playlists", {
          method: "POST", headers: {"Content-Type":"application/json"}, credentials: "include",
          body: JSON.stringify({ name: "Favorites", guildId: selectedGuildId, tracks: [track] })
        });
        if (res.ok) {
          setControlError("Saved to Favorites!");
          setTimeout(() => setControlError(null), 3000);
        }
      }
      
      // Reload playlists to reflect the new favorite
      if (user?.discordUserId || user?.id) {
        const pr = await fetch(`/api/music/playlists?userId=${encodeURIComponent(user.discordUserId || user.id)}`, { credentials: "include" });
        const pd = await pr.json();
        const lp: Playlist[] = (pd.playlists || []).map((p: any) => ({
          ...p,
          createdAt: p.createdAt || p.created_at || '',
          updatedAt: p.updatedAt || p.updated_at || '',
        }));
        setPlaylists(lp);
      }
    } catch {
      setControlError("Failed to save favorite");
    } finally {
      setControlLoading(false);
    }
  };

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

  const filteredPlaylists = playlists; // Show all playlists globally
  const isPlaying = nowPlaying?.playing ?? false;
  const loopMode = nowPlaying?.loopMode || "off";
  const displayTrack = nowPlaying?.currentTrack;
  const isLive = nowPlaying?.source === "live";

  const openPlaylist = (pl: Playlist) => {
    setActivePlaylist(pl);
    setActiveView("playlist-detail");
    setIsEditingPlaylist(false);
  };

  if (authLoading) {
    return (
      <div className="dz-root">
        <div className="dz-loading">
          <div className="dz-spinner" />
        </div>
      </div>
    );
  }

  if (!user || !user.providers?.includes('discord-music') || user.musicGuilds === undefined) {
    return <DiscordLoginScreen />;
  }

  const totalTracks = filteredPlaylists.reduce((s, p) => s + p.trackCount, 0);
  const totalDurationMs = filteredPlaylists.reduce((s, p) => s + p.tracks.reduce((a, t) => a + t.length, 0), 0);

  return (
    <div className="dz-root">

      {/* ════════════ SIDEBAR ════════════ */}
      <aside className="dz-sidebar">

        {/* Logo */}
        <div className="dz-logo">
          <svg width="32" height="24" viewBox="0 0 32 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="8" width="4" height="16" rx="2" fill="white" opacity="0.3"/>
            <rect x="7" y="4" width="4" height="20" rx="2" fill="white" opacity="0.6"/>
            <rect x="14" y="0" width="4" height="24" rx="2" fill="white"/>
            <rect x="21" y="4" width="4" height="20" rx="2" fill="white" opacity="0.6"/>
            <rect x="28" y="8" width="4" height="16" rx="2" fill="white" opacity="0.3"/>
          </svg>
        </div>

        {/* Nav */}
        <nav className="dz-nav">
          <button className={`dz-nav-item ${activeView === "home" ? "active" : ""}`} onClick={() => setActiveView("home")}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            <span>Home</span>
          </button>
          <button className={`dz-nav-item ${activeView === "history" ? "active" : ""}`} onClick={() => setActiveView("history")}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>
            <span>History</span>
          </button>
          <button className={`dz-nav-item`} onClick={() => setActiveView("playlists")}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
            <span>Library</span>
          </button>
          <button className={`dz-nav-item ${activeView === "liked" ? "active" : ""}`} onClick={() => setActiveView("liked")}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            <span>Liked Songs</span>
          </button>
          <button className={`dz-nav-item ${activeView === "artists" ? "active" : ""}`} onClick={() => setActiveView("artists")}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>
            <span>Artists</span>
          </button>
          <button className={`dz-nav-item ${activeView === "albums" ? "active" : ""}`} onClick={() => setActiveView("albums")}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
            <span>Albums</span>
          </button>
          <button className={`dz-nav-item ${activeView === "playlists" ? "active" : ""}`} onClick={() => setActiveView("playlists")}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            <span>Playlists</span>
          </button>
        </nav>

        {/* Sidebar playlist list */}
        <div className="dz-sidebar-playlists">
          {playlistsLoading
            ? [1,2,3].map(i => <div key={i} className="dz-pl-skeleton" />)
            : filteredPlaylists.map((pl, i) => (
                <button key={i} className={`dz-sidebar-pl ${activePlaylist?.id === pl.id && activeView === "playlist-detail" ? "active" : ""}`}
                  onClick={() => openPlaylist(pl)}>
                  <div className="dz-sidebar-pl-icon" style={{ background: pl.iconUrl ? `url(${pl.iconUrl}) center/cover` : getPlaylistColor(pl.name) }}>
                    {!pl.iconUrl && <span>{pl.name.charAt(0).toUpperCase()}</span>}
                  </div>
                  <div className="dz-sidebar-pl-info">
                    <div className="dz-sidebar-pl-name">{pl.name}</div>
                    <div className="dz-sidebar-pl-meta">Playlist · {pl.trackCount} songs</div>
                  </div>
                </button>
              ))
          }
        </div>

      </aside>

      {/* ════════════ CONTENT ════════════ */}
      <div className="dz-content-wrapper">

        {/* Top bar */}
        <header className="dz-topbar">
          <div className="dz-topbar-left">
            <button className="dz-nav-btn" onClick={() => history.back()} aria-label="Back">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <button className="dz-nav-btn" onClick={() => history.forward()} aria-label="Forward">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>

          <div className="dz-topbar-center">
            <div className="dz-search-bar" ref={searchBarRef}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                className="dz-search-input"
                placeholder="Search songs or artists"
                value={songQuery}
                onChange={e => setSongQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onKeyDown={e => {
                  if (e.key === "Enter" && songQuery && selectedVoiceChannel) {
                    sendControl("play", songQuery, { voiceChannelId: selectedVoiceChannel });
                    setSongQuery("");
                    setSearchFocused(false);
                  }
                }}
              />
              {songQuery && (
                <button className="dz-search-clear" onClick={() => { setSongQuery(""); setSearchFocused(false); }} tabIndex={-1}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              )}

              {/* Search Dropdown Panel */}
              {searchFocused && songQuery.trim().length >= 2 && (
                <SearchResultsPanel
                  results={searchResults}
                  loading={searchLoading}
                  query={songQuery}
                  onPlaySong={(song) => {
                    sendControl("play", song.videoId, { voiceChannelId: selectedVoiceChannel });
                    setSearchFocused(false);
                  }}
                  onPlayAlbum={(album) => {
                    sendControl("play", album.title + " " + album.artist, { voiceChannelId: selectedVoiceChannel });
                    setSearchFocused(false);
                  }}
                  onPlayArtist={(artist) => {
                    sendControl("play", artist.name, { voiceChannelId: selectedVoiceChannel });
                    setSearchFocused(false);
                  }}
                  onSaveSong={(song) => {
                    saveToFavorites(song);
                    setSearchFocused(false);
                  }}
                  onClose={() => setSearchFocused(false)}
                />
              )}
            </div>
          </div>

          <div className="dz-topbar-right">
            {/* Server selector if multiple */}
            {guilds.length > 1 && (
              <div className="dz-server-dropdown-container" ref={serverDropdownRef}>
                <button className="dz-server-dropdown-btn" onClick={() => setServerDropdownOpen(!serverDropdownOpen)}>
                  {(() => {
                    const activeGuild = guilds.find(g => g.id === selectedGuildId);
                    return activeGuild ? (
                      <div className="dz-server-dropdown-active">
                        {activeGuild.iconUrl ? (
                          <img src={activeGuild.iconUrl} alt="" className="dz-server-icon" />
                        ) : (
                          <div className="dz-server-icon-fallback">{activeGuild.name.charAt(0).toUpperCase()}</div>
                        )}
                        <span className="dz-server-dropdown-name">{activeGuild.name}</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
                      </div>
                    ) : (
                      "Select Server"
                    );
                  })()}
                </button>
                {serverDropdownOpen && (
                  <div className="dz-server-dropdown-menu">
                    {guilds.map(g => (
                      <button key={g.id} className={`dz-server-dropdown-item ${g.id === selectedGuildId ? "active" : ""}`} onClick={() => {
                        setSelectedGuildId(g.id);
                        localStorage.setItem("wos_music_guild", g.id);
                        setSelectedVoiceChannel("");
                        setServerDropdownOpen(false);
                      }}>
                        {g.iconUrl ? (
                          <img src={g.iconUrl} alt="" className="dz-server-icon" />
                        ) : (
                          <div className="dz-server-icon-fallback">{g.name.charAt(0).toUpperCase()}</div>
                        )}
                        <span className="dz-server-dropdown-name">{g.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {/* Voice channel selector */}
            {voiceChannels.length > 0 && (
              <select className="dz-vc-select" value={selectedVoiceChannel} onChange={e => setSelectedVoiceChannel(e.target.value)}>
                {voiceChannels.map(vc => <option key={vc.id} value={vc.id}>#{vc.name}</option>)}
              </select>
            )}
            {/* User avatar */}
            <button className="dz-user-btn" title={`Signed in as ${user.displayName}`} onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              window.location.reload();
            }}>
              {user.avatarUrl
                ? <img src={user.avatarUrl} alt={user.displayName} className="dz-avatar-img" />
                : <div className="dz-avatar-placeholder">{user.displayName.charAt(0).toUpperCase()}</div>
              }
            </button>
          </div>
        </header>

        {/* Error toast */}
        {controlError && (
          <div className="dz-error-toast">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {controlError}
            <button onClick={() => setControlError(null)}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        )}

        {/* ── Queue panel ── */}
        {showQueue && nowPlaying?.queue && nowPlaying.queue.length > 0 && (
          <div className="dz-queue-panel">
            <div className="dz-queue-header">
              <span>Up Next · {nowPlaying.queue.length} tracks</span>
              <button className="dz-icon-btn" onClick={() => setShowQueue(false)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="dz-queue-list">
              {nowPlaying.queue.map((t, i) => (
                <div key={i} className="dz-queue-item">
                  <span className="dz-queue-num">{i + 1}</span>
                  <div className="dz-queue-info">
                    <div className="dz-queue-title">{t.title}</div>
                    <div className="dz-queue-author">{t.author}</div>
                  </div>
                  <span className="dz-queue-dur">{formatTime(t.length)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Main scrollable content ── */}
        <main className="dz-main">

          {/* PLAYLIST DETAIL VIEW */}
          {activeView === "playlist-detail" && activePlaylist ? (
            <div className="dz-playlist-view">
              {/* Hero */}
              <div className="dz-playlist-hero">
                <div className="dz-playlist-cover"
                  style={activePlaylist.iconUrl
                    ? { backgroundImage: `url(${activePlaylist.iconUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
                    : { background: `linear-gradient(135deg, ${getPlaylistColor(activePlaylist.name)}, rgba(0,0,0,0.5))` }
                  }
                >
                  {!activePlaylist.iconUrl && (
                    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
                    </svg>
                  )}
                </div>
                <div className="dz-playlist-hero-info">
                  {isEditingPlaylist ? (
                    <>
                      <span className="dz-hero-label">EDIT PLAYLIST</span>
                      <input type="text" className="dz-edit-name" value={editPlaylistName} onChange={e => setEditPlaylistName(e.target.value)} placeholder="Playlist name" />
                      <input type="text" className="dz-edit-icon" value={editPlaylistIconUrl} onChange={e => setEditPlaylistIconUrl(e.target.value)} placeholder="Cover image URL (optional)" />
                      <div className="dz-edit-btns">
                        <button className="dz-btn-save" onClick={savePlaylistEdits} disabled={isSavingPlaylist}>{isSavingPlaylist ? "Saving…" : "Save"}</button>
                        <button className="dz-btn-cancel" onClick={() => setIsEditingPlaylist(false)} disabled={isSavingPlaylist}>Cancel</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="dz-hero-label">PLAYLIST</span>
                      <h1 className="dz-playlist-title">{activePlaylist.name}</h1>
                      <div className="dz-playlist-meta">
                        <span className="dz-meta-author">
                          <div className="dz-meta-avatar">
                            {user.avatarUrl ? <img src={user.avatarUrl} alt={user.displayName} /> : user.displayName.charAt(0)}
                          </div>
                          {user.displayName}
                        </span>
                        <span className="dz-meta-sep">·</span>
                        <span>{activePlaylist.trackCount} songs</span>
                        {totalDurationMs > 0 && activePlaylist.tracks.length > 0 && (
                          <>
                            <span className="dz-meta-sep">·</span>
                            <span>{formatDuration(activePlaylist.tracks.reduce((a, t) => a + t.length, 0))}</span>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Playlist action row */}
              {!isEditingPlaylist && (
                <div className="dz-playlist-actions">
                  <button className="dz-play-btn"
                    onClick={() => sendControl("play_playlist", activePlaylist.name, { voiceChannelId: selectedVoiceChannel, userId: user.discordUserId })}
                    disabled={controlLoading || !selectedVoiceChannel}
                    title={`Play ${activePlaylist.name}`}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l14 9-14 9V3z"/></svg>
                    Play
                  </button>

                  <button className="dz-action-icon-btn" onClick={() => sendControl("shuffle")} disabled={controlLoading} title="Shuffle">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/>
                      <polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/>
                      <line x1="4" y1="4" x2="9" y2="9"/>
                    </svg>
                  </button>

                  <button className={`dz-action-icon-btn ${loopMode !== "off" ? "active" : ""}`}
                    onClick={() => { const n = loopMode==="off"?"queue":loopMode==="queue"?"track":"off"; sendControl("loop",n); }}
                    disabled={controlLoading} title={`Loop: ${loopMode}`}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                      <polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                    </svg>
                  </button>

                  <button className="dz-action-icon-btn" onClick={startEditingPlaylist} title="Edit Playlist">
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>

                  <button className="dz-action-icon-btn" onClick={() => sendControl("stop")} disabled={controlLoading} title="Stop">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
                  </button>

                  <div className="dz-actions-right">
                    {nowPlaying?.playing && (
                      <div className="dz-live-badge">
                        <PlayingBars/>
                        <span>#{nowPlaying.voiceChannel?.name || "voice"}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Track list */}
              <div className="dz-tracks">
                <div className={`dz-tracks-header ${isEditingPlaylist ? "editing" : ""}`}>
                  <div className="dz-col-id">#</div>
                  <div className="dz-col-title">Title</div>
                  <div className="dz-col-artist">Artist</div>
                  <div className="dz-col-actions-h">
                    {/* heart */}
                  </div>
                  <div className="dz-col-dur">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  </div>
                  {isEditingPlaylist && <div className="dz-col-reorder"></div>}
                </div>
                <div className="dz-tracks-list">
                  {(isEditingPlaylist ? editPlaylistTracks : activePlaylist.tracks).map((track, idx) => {
                    const isNP = !isEditingPlaylist && nowPlaying?.currentTrack?.title === track.title && nowPlaying?.currentTrack?.author === track.author;
                    const isNpPlaying = isNP && isPlaying;
                    return (
                      <div key={idx} className={`dz-track-row ${isNP ? "playing" : ""} ${isEditingPlaylist ? "editing" : ""}`}
                        onClick={() => !isEditingPlaylist && sendControl("play", track.uri || track.title, { voiceChannelId: selectedVoiceChannel })}>

                        <div className="dz-col-id">
                          {isNpPlaying ? <PlayingBars /> : (
                            <>
                              <span className="dz-track-idx">{idx + 1}</span>
                              {!isEditingPlaylist && (
                                <button className="dz-track-play-btn" aria-label={`Play ${track.title}`}
                                  disabled={controlLoading || !selectedVoiceChannel}
                                  onClick={e => { e.stopPropagation(); sendControl("play", track.uri || track.title, { voiceChannelId: selectedVoiceChannel }); }}>
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l14 9-14 9V3z"/></svg>
                                </button>
                              )}
                            </>
                          )}
                        </div>

                        <div className="dz-col-title">
                          <div className="dz-track-thumb">
                            {track.artwork
                              ? <img src={track.artwork} alt="" />
                              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
                            }
                          </div>
                          <span className="dz-track-name">{track.title}</span>
                        </div>

                        <div className="dz-col-artist">{track.author}</div>

                        <div className="dz-col-actions-h">
                          {/* Row menu / like placeholder */}
                          <button className="dz-track-action-btn" onClick={e => e.stopPropagation()}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
                          </button>
                          <button className="dz-track-heart-btn" onClick={e => e.stopPropagation()}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                          </button>
                        </div>

                        <div className="dz-col-dur">{formatTime(track.length)}</div>

                        {isEditingPlaylist && (
                          <div className="dz-col-reorder">
                            <button className="dz-reorder-btn" disabled={idx === 0} onClick={e => { e.stopPropagation(); moveTrack(idx, -1); }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"/></svg>
                            </button>
                            <button className="dz-reorder-btn" disabled={idx === editPlaylistTracks.length - 1} onClick={e => { e.stopPropagation(); moveTrack(idx, 1); }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                            </button>
                            <button className="dz-reorder-btn dz-delete-btn" onClick={e => { e.stopPropagation(); setEditPlaylistTracks(prev => prev.filter((_, i) => i !== idx)); }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                            {isEditingPlaylist && idx === editPlaylistTracks.length - 1 && (
                              <button className="dz-btn-save dz-save-inline" onClick={savePlaylistEdits} disabled={isSavingPlaylist}>
                                {isSavingPlaylist ? "…" : "Save"}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : activeView === "playlists" ? (
            /* PLAYLISTS GRID VIEW */
            <div className="dz-view">
              <h2 className="dz-view-title">Your Playlists</h2>
              {playlistsLoading ? (
                <div className="dz-playlists-grid">
                  {[1,2,3,4].map(i => <div key={i} className="dz-pl-card-skeleton" />)}
                </div>
              ) : filteredPlaylists.length === 0 ? (
                <div className="dz-empty-state">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
                  <h3>No playlists yet</h3>
                  <p>Save a playlist with <code>/playlist save &lt;name&gt;</code> in Discord.</p>
                </div>
              ) : (
                <div className="dz-playlists-grid">
                  {filteredPlaylists.map((pl, i) => (
                    <button key={i} className="dz-pl-card" onClick={() => openPlaylist(pl)}>
                      <div className="dz-pl-card-cover"
                        style={pl.iconUrl
                          ? { backgroundImage: `url(${pl.iconUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
                          : { background: `linear-gradient(135deg, ${getPlaylistColor(pl.name)}, rgba(0,0,0,0.5))` }
                        }
                      >
                        {!pl.iconUrl && (
                          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
                          </svg>
                        )}
                      </div>
                      <div className="dz-pl-card-info">
                        <div className="dz-pl-card-name">{pl.name}</div>
                        <div className="dz-pl-card-meta">{pl.trackCount} songs · {formatDuration(pl.tracks.reduce((a, t) => a + t.length, 0))}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* OTHER VIEWS (Home / Liked / Artists / Albums / History) */
            <div className="dz-view">
              {activeView === "home" && (
                <>
                  {filteredPlaylists.length > 0 && (
                    <div className="dz-section">
                      <div className="dz-section-header">
                        <h2 className="dz-section-title">Playlists</h2>
                        <button className="dz-show-all" onClick={() => setActiveView("playlists")}>Show All</button>
                      </div>
                      <div className="dz-home-pl-list">
                        {filteredPlaylists.slice(0, 4).map((pl, i) => (
                          <button key={i} className="dz-home-pl-item" onClick={() => openPlaylist(pl)}>
                            <div className="dz-home-pl-cover"
                              style={pl.iconUrl
                                ? { backgroundImage: `url(${pl.iconUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
                                : { background: `linear-gradient(135deg, ${getPlaylistColor(pl.name)}, rgba(0,0,0,0.5))` }
                              }
                            />
                            <span className="dz-home-pl-name">{pl.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
              {activeView === "liked" && (
                (() => {
                  const likedPl = playlists.find(p => p.guildId === selectedGuildId && (p.name.toLowerCase() === "favorites" || p.name.toLowerCase() === "liked songs"));
                  if (!likedPl || !likedPl.tracks || likedPl.tracks.length === 0) {
                    return (
                      <div className="dz-empty-state">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                        <h3>No liked songs yet</h3>
                        <p>Songs you like will appear here.</p>
                      </div>
                    );
                  }
                  return (
                    <div className="dz-tracks">
                      <div className="dz-tracks-header">
                        <div className="dz-col-id">#</div>
                        <div className="dz-col-title">Title</div>
                        <div className="dz-col-artist">Artist</div>
                        <div className="dz-col-actions-h"></div>
                        <div className="dz-col-dur">Duration</div>
                      </div>
                      <div className="dz-tracks-list">
                        {likedPl.tracks.map((track, idx) => (
                          <div key={idx} className="dz-track-row"
                            onClick={() => sendControl("play", track.uri || track.title, { voiceChannelId: selectedVoiceChannel })}>
                            <div className="dz-col-id">
                              <span className="dz-track-idx">{idx + 1}</span>
                              <button className="dz-track-play-btn" aria-label={`Play ${track.title}`}
                                disabled={controlLoading || !selectedVoiceChannel}
                                onClick={e => { e.stopPropagation(); sendControl("play", track.uri || track.title, { voiceChannelId: selectedVoiceChannel }); }}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l14 9-14 9V3z"/></svg>
                              </button>
                            </div>
                            <div className="dz-col-title">
                              <div className="dz-track-thumb">
                                {track.artwork
                                  ? <img src={track.artwork} alt="" />
                                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
                                }
                              </div>
                              <span className="dz-track-name">{track.title}</span>
                            </div>
                            <div className="dz-col-artist">{track.author}</div>
                            <div className="dz-col-actions-h">
                              <button className="dz-track-heart-btn" onClick={e => {
                                e.stopPropagation();
                                // future: unlike functionality
                              }} style={{color: "var(--brand)"}}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                              </button>
                            </div>
                            <div className="dz-col-dur">{formatTime(track.length)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()
              )}
              {activeView === "artists" && (
                <div className="dz-empty-state">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>
                  <h3>No liked artists yet</h3>
                  <p>Artists you like will appear here.</p>
                </div>
              )}
              {activeView === "albums" && (
                <div className="dz-empty-state">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
                  <h3>No liked albums yet</h3>
                  <p>Albums you like will appear here.</p>
                </div>
              )}
              {activeView === "history" && (
                historyLoading ? (
                  <div className="dz-empty-state">
                    <div className="dz-spinner" />
                    <p>Loading history…</p>
                  </div>
                ) : historyEntries.length === 0 ? (
                  <div className="dz-empty-state">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>
                    <h3>No history yet</h3>
                    <p>Tracks you&apos;ve played will appear here.</p>
                  </div>
                ) : (
                  <div className="dz-history-list">
                    {historyEntries.map((entry, idx) => {
                      const dateObj = new Date(entry.playedAt || Date.now());
                      const formattedDate = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) + ", " + dateObj.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
                      return (
                        <div key={idx} className="dz-history-row"
                          onClick={() => sendControl("play", entry.track.uri || entry.track.title, { voiceChannelId: selectedVoiceChannel })}>
                          
                          <div className="dz-history-thumb">
                            {entry.track.thumbnail
                              ? <img src={entry.track.thumbnail} alt="" />
                              : <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
                            }
                          </div>

                          <div className="dz-history-info">
                            <div className="dz-history-date">{formattedDate}</div>
                            <div className="dz-history-sub">Bot</div>
                          </div>

                          <div className="dz-history-avatars">
                            <img src={user.avatarUrl || "https://cdn.discordapp.com/embed/avatars/0.png"} className="dz-history-avatar" alt="User" />
                            <img src="https://cdn.discordapp.com/embed/avatars/1.png" className="dz-history-avatar fake-avatar" alt="Bot" />
                          </div>

                          <div className="dz-history-arrow">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              )}

            </div>
          )}
        </main>

        {/* ════════════ NOW PLAYING BAR ════════════ */}
        <footer className="dz-now-playing">

          {/* Left - track info */}
          <div className="dz-np-track">
            <div className={`dz-np-art ${isPlaying ? "playing" : ""}`}>
              {displayTrack?.artwork
                ? <img src={displayTrack.artwork} alt={displayTrack.title} />
                : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
              }
              {isPlaying && <div className="dz-np-art-glow" />}
            </div>
            {displayTrack ? (
              <div className="dz-np-text">
                <div className="dz-np-title">{displayTrack.title}</div>
                <div className="dz-np-author">{displayTrack.author}</div>
              </div>
            ) : (
              <div className="dz-np-empty">Nothing playing</div>
            )}
            {isLive && <div className="dz-live-pill"><span className="dz-live-dot"/><span>LIVE</span></div>}
          </div>

          {/* Center - controls */}
          <div className="dz-np-center">
            <div className="dz-np-btns">
              <button className={`dz-np-icon-btn ${loopMode !== "off" ? "active" : ""}`}
                onClick={() => { const n = loopMode==="off"?"queue":loopMode==="queue"?"track":"off"; sendControl("loop",n); }}
                disabled={controlLoading} title={`Loop: ${loopMode}`}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                  <polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                </svg>
                {loopMode === "track" && <span className="dz-loop-label">1</span>}
              </button>

              <button className="dz-np-icon-btn" onClick={() => sendControl("previous")} disabled={controlLoading} title="Previous">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" strokeWidth="2"/></svg>
              </button>

              <button className="dz-play-pause-btn" onClick={() => sendControl(isPlaying ? "pause" : "resume")} disabled={controlLoading} title={isPlaying ? "Pause" : "Play"}>
                {controlLoading
                  ? <div className="dz-spinner-sm" />
                  : isPlaying
                    ? <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                    : <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l14 9-14 9V3z"/></svg>
                }
              </button>

              <button className="dz-np-icon-btn" onClick={() => sendControl("skip")} disabled={controlLoading} title="Skip">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="2"/></svg>
              </button>

              <button className="dz-np-icon-btn" onClick={() => sendControl("shuffle")} disabled={controlLoading} title="Shuffle">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/>
                  <polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/>
                  <line x1="4" y1="4" x2="9" y2="9"/>
                </svg>
              </button>
            </div>
            <ProgressBar nowPlaying={nowPlaying} />
          </div>

          {/* Right - volume + queue */}
          <div className="dz-np-right">
            <button className={`dz-np-icon-btn ${showQueue ? "active" : ""}`} onClick={() => setShowQueue(!showQueue)} title="Queue">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
              </svg>
              {(nowPlaying?.queueSize ?? 0) > 0 && <span className="dz-q-badge">{nowPlaying!.queueSize}</span>}
            </button>

            <div className="dz-volume-group">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color:"var(--text-muted)",flexShrink:0}}>
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                {volume > 0 && <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>}
                {volume > 80 && <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>}
              </svg>
              <input type="range" className="dz-volume-slider" min={0} max={200} value={volume}
                onChange={e => setVolume(Number(e.target.value))}
                onMouseUp={e => sendControl("volume", Number((e.target as HTMLInputElement).value))}
                onTouchEnd={e => sendControl("volume", Number((e.target as HTMLInputElement).value))}
                title={`Volume: ${volume}%`} aria-label="Volume"
              />
              <span className="dz-volume-label">{volume}%</span>
            </div>
          </div>

        </footer>
      </div>
    </div>
  );
}
