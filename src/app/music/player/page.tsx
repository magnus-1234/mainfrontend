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

type DiscoverSong = {
  videoId: string;
  title: string;
  artist: string;
  artistId?: string;
  album?: string;
  albumId?: string;
  thumbnail?: string;
  duration?: number;
};

type DiscoverAlbum = {
  id: string;
  playlistId?: string;
  name: string;
  artist: string;
  artistId?: string;
  year?: string | null;
  thumbnail?: string;
  type?: string;
};

type GenreItem = {
  id: string;
  name: string;
  query: string;
  color: string;
  thumb?: string;
};

type ArtistData = {
  id: string;
  name: string;
  description?: string;
  subscribers?: string;
  thumbnail?: string;
  songs: DiscoverSong[];
  albums: DiscoverAlbum[];
};

type AlbumData = {
  id: string;
  name: string;
  artist: string;
  artistId?: string;
  year?: string | null;
  description?: string;
  thumbnail?: string;
  trackCount: number;
  tracks: DiscoverSong[];
};

type ContextMenuState = {
  x: number;
  y: number;
  song: DiscoverSong | SearchSong;
  mode?: "default" | "playlist_select";
} | null;

type ResolvedTrack = {
  type: "song";
  videoId: string;
  title: string;
  artist: string;
  album?: string;
  duration?: string;
  thumbnail?: string;
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
  results, loading, query, onPlaySong, onPlayAlbum, onPlayArtist, onSaveSong, onClose, onContextMenu,
}: {
  results: SearchResults | null;
  loading: boolean;
  query: string;
  onPlaySong: (song: SearchSong, action?: "play" | "play_now") => void;
  onPlayAlbum: (album: SearchAlbum) => void;
  onPlayArtist: (artist: SearchArtist) => void;
  onSaveSong: (song: SearchSong) => void;
  onClose: () => void;
  onContextMenu?: (e: React.MouseEvent, song: SearchSong) => void;
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
        <div className="sr-top-container">
          <div className="sr-top-result">
            <div className="sr-section-title">Top Result</div>
            {(() => {
              const topSong = results!.songs[0];
              return (
                <div className="sr-top-card" onClick={() => onPlaySong(topSong, "play_now")}>
                  <div className="sr-top-cover">
                    {topSong.thumbnail
                      ? <img src={topSong.thumbnail} alt={topSong.title} />
                      : <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
                    }
                    <div className="sr-thumb-play">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l14 9-14 9V3z"/></svg>
                    </div>
                  </div>
                  <div className="sr-top-info">
                    <div className="sr-top-title">{topSong.title}</div>
                    <div className="sr-top-meta">
                      <span className="sr-top-badge">Track</span>
                      <span className="sr-top-artist">{topSong.artist}</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
          <div className="sr-songs-list-container">
            <div className="sr-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              Songs
              {results!.songs.length > 4 && <span className="sr-show-all">Show All</span>}
            </div>
            <div className="sr-songs-list">
              {results!.songs.slice(0, 4).map((song) => (
                <div key={song.videoId} className="sr-song-row" onContextMenu={e => onContextMenu?.(e, song)}>
                  <button className="sr-thumb" onClick={() => onPlaySong(song, "play_now")}>
                    {song.thumbnail
                      ? <img src={song.thumbnail} alt={song.title} />
                      : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
                    }
                    <div className="sr-thumb-play">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l14 9-14 9V3z"/></svg>
                    </div>
                  </button>
                  <div className="sr-song-info" onClick={() => onPlaySong(song, "play_now")} style={{cursor:"pointer"}}>
                    <div className="sr-song-title">{song.title}</div>
                    <div className="sr-song-meta">
                      <span className="sr-explicit-badge">E</span>
                      {song.artist}{song.album ? ` · ${song.album}` : ""}
                    </div>
                  </div>
                  <div className="sr-song-actions">
                    <button className="sr-queue-btn sr-more-btn" onClick={(e) => { e.stopPropagation(); onPlaySong(song, "play"); }} title="Add to Queue">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
                    </button>
                    <button className="sr-save-btn" onClick={(e) => { e.stopPropagation(); onSaveSong(song); }} title="Save to Favorites">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                    </button>
                    {song.duration && <span className="sr-song-dur">{song.duration}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
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
type ActiveView = "home" | "playlists" | "liked" | "artists" | "albums" | "history" | "playlist-detail" | "search" | "artist-detail" | "album-detail" | "genre-detail";

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
  const [activeView, setActiveView] = useState<ActiveView>("home");
  const [voiceChannels, setVoiceChannels] = useState<{id:string;name:string}[]>([]);
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Discovery state
  const [discoverNewReleases, setDiscoverNewReleases] = useState<DiscoverAlbum[]>([]);
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [genres, setGenres] = useState<GenreItem[]>([]);
  const [artistData, setArtistData] = useState<ArtistData | null>(null);
  const [artistLoading, setArtistLoading] = useState(false);
  const [albumData, setAlbumData] = useState<AlbumData | null>(null);
  const [albumLoading, setAlbumLoading] = useState(false);
  const [genreSongs, setGenreSongs] = useState<DiscoverSong[]>([]);
  const [currentGenre, setCurrentGenre] = useState<GenreItem | null>(null);
  const [genreLoading, setGenreLoading] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Search state
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchBarRef = useRef<HTMLDivElement>(null);

  // Playlist search state
  const [playlistSearchQuery, setPlaylistSearchQuery] = useState("");
  const [playlistSearchResults, setPlaylistSearchResults] = useState<SearchSong[]>([]);
  const [playlistSearchLoading, setPlaylistSearchLoading] = useState(false);
  const playlistSearchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced playlist search
  useEffect(() => {
    if (!playlistSearchQuery || playlistSearchQuery.trim().length < 2) {
      setPlaylistSearchResults([]);
      return;
    }
    if (playlistSearchDebounceRef.current) clearTimeout(playlistSearchDebounceRef.current);
    playlistSearchDebounceRef.current = setTimeout(async () => {
      setPlaylistSearchLoading(true);
      try {
        const res = await fetch(`/api/music/search?q=${encodeURIComponent(playlistSearchQuery.trim())}`);
        if (res.ok) {
          const data: SearchResults = await res.json();
          setPlaylistSearchResults(data.songs || []);
        }
      } catch {} finally {
        setPlaylistSearchLoading(false);
      }
    }, 400);
    return () => { if (playlistSearchDebounceRef.current) clearTimeout(playlistSearchDebounceRef.current); };
  }, [playlistSearchQuery]);


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
  const [textChannels, setTextChannels] = useState<{id:string;name:string}[]>([]);
  const [selectedTextChannel, setSelectedTextChannel] = useState<string>("");
  
  const [serverDropdownOpen, setServerDropdownOpen] = useState(false);
  const serverDropdownRef = useRef<HTMLDivElement>(null);
  
  const [vcDropdownOpen, setVcDropdownOpen] = useState(false);
  const vcDropdownRef = useRef<HTMLDivElement>(null);

  const [tcDropdownOpen, setTcDropdownOpen] = useState(false);
  const tcDropdownRef = useRef<HTMLDivElement>(null);

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (serverDropdownRef.current && !serverDropdownRef.current.contains(e.target as Node)) {
        setServerDropdownOpen(false);
      }
      if (vcDropdownRef.current && !vcDropdownRef.current.contains(e.target as Node)) {
        setVcDropdownOpen(false);
      }
      if (tcDropdownRef.current && !tcDropdownRef.current.contains(e.target as Node)) {
        setTcDropdownOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
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
  const [dragTrackIndex, setDragTrackIndex] = useState<number | null>(null);
  const [dragOverTrackIndex, setDragOverTrackIndex] = useState<number | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Create Playlist modal state ──
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [createPlName, setCreatePlName] = useState("");
  const [createPlIconUrl, setCreatePlIconUrl] = useState("");
  const [createPlTracks, setCreatePlTracks] = useState<Track[]>([]);
  const [createPlSearchQuery, setCreatePlSearchQuery] = useState("");
  const [createPlSearchResults, setCreatePlSearchResults] = useState<SearchSong[]>([]);
  const [createPlSearchLoading, setCreatePlSearchLoading] = useState(false);
  const createPlSearchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [createPlLinkInput, setCreatePlLinkInput] = useState("");
  const [createPlLinkLoading, setCreatePlLinkLoading] = useState(false);
  const [createPlSaving, setCreatePlSaving] = useState(false);

  // ── YouTube URL paste state for edit mode ──
  const [editPlLinkInput, setEditPlLinkInput] = useState("");
  const [editPlLinkLoading, setEditPlLinkLoading] = useState(false);

  // ── Toast state ──
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMsg(null), 3000);
  }, []);

  // YouTube URL detection helper
  const isYouTubeUrl = (text: string) =>
    /(?:youtube\.com|youtu\.be|music\.youtube\.com)/.test(text) ||
    /^[a-zA-Z0-9_-]{11}$/.test(text.trim());

  // Resolve a YouTube URL via the backend
  const resolveYouTubeUrl = useCallback(async (url: string): Promise<ResolvedTrack | null> => {
    try {
      const res = await fetch(`/api/music/resolve?url=${encodeURIComponent(url.trim())}`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }, []);

  // Convert a resolved track to a Track object
  const resolvedToTrack = (r: ResolvedTrack): Track => {
    let length = 0;
    if (r.duration) {
      length = r.duration.split(":").reduce((acc, t) => (60 * acc) + +t, 0) * 1000;
    }
    return {
      title: r.title,
      author: r.artist,
      uri: `https://www.youtube.com/watch?v=${r.videoId}`,
      length,
      artwork: r.thumbnail || null,
    };
  };

  // ── Create Playlist search debounce ──
  useEffect(() => {
    if (!createPlSearchQuery || createPlSearchQuery.trim().length < 2) {
      setCreatePlSearchResults([]);
      return;
    }
    // Auto-detect YouTube URL in the search box
    if (isYouTubeUrl(createPlSearchQuery)) {
      setCreatePlSearchResults([]);
      return;
    }
    if (createPlSearchDebounceRef.current) clearTimeout(createPlSearchDebounceRef.current);
    createPlSearchDebounceRef.current = setTimeout(async () => {
      setCreatePlSearchLoading(true);
      try {
        const res = await fetch(`/api/music/search?q=${encodeURIComponent(createPlSearchQuery.trim())}`);
        if (res.ok) {
          const data: SearchResults = await res.json();
          setCreatePlSearchResults(data.songs || []);
        }
      } catch {} finally {
        setCreatePlSearchLoading(false);
      }
    }, 400);
    return () => { if (createPlSearchDebounceRef.current) clearTimeout(createPlSearchDebounceRef.current); };
  }, [createPlSearchQuery]);

  // Handle pasting a YouTube link in create-playlist modal
  const handleCreatePlResolveLink = async () => {
    if (!createPlLinkInput.trim()) return;
    setCreatePlLinkLoading(true);
    try {
      const resolved = await resolveYouTubeUrl(createPlLinkInput);
      if (resolved) {
        setCreatePlTracks(prev => [...prev, resolvedToTrack(resolved)]);
        setCreatePlLinkInput("");
        showToast(`Added "${resolved.title}"`);
      } else {
        showToast("Could not resolve the YouTube link");
      }
    } catch {
      showToast("Failed to resolve link");
    } finally {
      setCreatePlLinkLoading(false);
    }
  };

  // Handle pasting a YouTube link in edit-playlist mode
  const handleEditPlResolveLink = async () => {
    if (!editPlLinkInput.trim()) return;
    setEditPlLinkLoading(true);
    try {
      const resolved = await resolveYouTubeUrl(editPlLinkInput);
      if (resolved) {
        setEditPlaylistTracks(prev => [...prev, resolvedToTrack(resolved)]);
        setEditPlLinkInput("");
        showToast(`Added "${resolved.title}"`);
      } else {
        showToast("Could not resolve the YouTube link");
      }
    } catch {
      showToast("Failed to resolve link");
    } finally {
      setEditPlLinkLoading(false);
    }
  };

  // Auto-detect + resolve if search input contains a YouTube URL
  const handleCreatePlSearchSubmit = async () => {
    if (isYouTubeUrl(createPlSearchQuery)) {
      setCreatePlLinkInput(createPlSearchQuery);
      setCreatePlSearchQuery("");
      const resolved = await resolveYouTubeUrl(createPlSearchQuery);
      if (resolved) {
        setCreatePlTracks(prev => [...prev, resolvedToTrack(resolved)]);
        setCreatePlLinkInput("");
        showToast(`Added "${resolved.title}"`);
      } else {
        showToast("Could not resolve the YouTube link");
      }
    }
  };

  // Create a new playlist
  const createPlaylist = async () => {
    if (!createPlName.trim() || !selectedGuildId) return;
    setCreatePlSaving(true);
    try {
      const userId = user?.discordUserId || user?.id || "";
      const res = await fetch(`/api/music/playlists?userId=${encodeURIComponent(userId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: createPlName.trim(),
          guildId: selectedGuildId,
          iconUrl: createPlIconUrl.trim() || undefined,
          tracks: createPlTracks,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        showToast(`Playlist "${createPlName.trim()}" created!`);
        // Reset modal
        setShowCreatePlaylist(false);
        setCreatePlName("");
        setCreatePlIconUrl("");
        setCreatePlTracks([]);
        setCreatePlSearchQuery("");
        setCreatePlSearchResults([]);
        setCreatePlLinkInput("");
        // Reload playlists
        if (user?.discordUserId || user?.id) {
          const pr = await fetch(`/api/music/playlists?userId=${encodeURIComponent(user.discordUserId || user.id)}`, { credentials: "include" });
          const pd = await pr.json();
          const lp: Playlist[] = (pd.playlists || []).map((p: any) => ({
            ...p,
            createdAt: p.createdAt || p.created_at || '',
            updatedAt: p.updatedAt || p.updated_at || '',
          }));
          setPlaylists(lp);
          // Navigate to the new playlist
          const newPl = lp.find(p => p.id === data.id);
          if (newPl) {
            setActivePlaylist(newPl);
            setActiveView("playlist-detail");
          }
        }
      } else {
        const errData = await res.json();
        showToast(errData.error || "Failed to create playlist");
      }
    } catch {
      showToast("Failed to create playlist");
    } finally {
      setCreatePlSaving(false);
    }
  };

  // Quick add-to-queue inline action
  const addToQueueInline = (song: DiscoverSong | SearchSong) => {
    sendControl("play", `https://www.youtube.com/watch?v=${song.videoId}`, {});
    showToast(`Queued "${song.title}"`);
  };

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
      const userId = user?.discordUserId || user?.id || "";
      const res = await fetch(`/api/music/playlists?userId=${encodeURIComponent(userId)}`, {
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

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDragTrackIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };
  
  const handleDragEnter = (e: React.DragEvent, index: number) => {
    if (dragTrackIndex === null) return;
    setDragOverTrackIndex(index);
  };
  
  const handleDragEnd = () => {
    if (dragTrackIndex !== null && dragOverTrackIndex !== null && dragTrackIndex !== dragOverTrackIndex) {
      const newTracks = [...editPlaylistTracks];
      const draggedTrack = newTracks[dragTrackIndex];
      newTracks.splice(dragTrackIndex, 1);
      newTracks.splice(dragOverTrackIndex, 0, draggedTrack);
      setEditPlaylistTracks(newTracks);
    }
    setDragTrackIndex(null);
    setDragOverTrackIndex(null);
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
        const savedVc = localStorage.getItem("wos_music_vc");
        if (savedVc && voices.find((v: any) => v.id === savedVc)) setSelectedVoiceChannel(savedVc);
        else if (voices.length > 0) setSelectedVoiceChannel((cur: string) => cur || voices[0].id);

        const texts = data.textChannels || [];
        setTextChannels(texts);
        const savedTc = localStorage.getItem("wos_music_tc");
        if (savedTc && texts.find((t: any) => t.id === savedTc)) setSelectedTextChannel(savedTc);
        else if (texts.length > 0) setSelectedTextChannel((cur: string) => cur || texts[0].id);
      }
    } catch { setVoiceChannels([]); setTextChannels([]); }
  }, []);

  useEffect(() => {
    if (!selectedGuildId) return;
    setSelectedVoiceChannel("");
    setSelectedTextChannel("");
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


  // Fetch Discover home data when home view is opened
  useEffect(() => {
    if (activeView !== "home") return;
    if (discoverNewReleases.length > 0 && genres.length > 0) return;
    const fetchDiscover = async () => {
      setDiscoverLoading(true);
      try {
        const [homeRes, genresRes] = await Promise.all([
          fetch("/api/music/home?v=2"),
          fetch("/api/music/genres?v=2"),
        ]);
        if (homeRes.ok) {
          const data = await homeRes.json();
          setDiscoverNewReleases(data.newReleases ?? []);
        }
        if (genresRes.ok) {
          const data = await genresRes.json();
          setGenres(data.genres ?? []);
        }
      } catch {} finally { setDiscoverLoading(false); }
    };
    fetchDiscover();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView]);

  const openArtist = async (artistId: string) => {
    if (!artistId) return;
    setActiveView("artist-detail");
    setArtistData(null);
    setArtistLoading(true);
    try {
      const res = await fetch(`/api/music/artist?id=${encodeURIComponent(artistId)}`);
      if (res.ok) setArtistData(await res.json());
    } catch {} finally { setArtistLoading(false); }
  };

  const openAlbum = async (albumId: string) => {
    if (!albumId) return;
    setActiveView("album-detail");
    setAlbumData(null);
    setAlbumLoading(true);
    try {
      const res = await fetch(`/api/music/album?id=${encodeURIComponent(albumId)}`);
      if (res.ok) setAlbumData(await res.json());
    } catch {} finally { setAlbumLoading(false); }
  };

  const openGenre = async (genre: GenreItem) => {
    setCurrentGenre(genre);
    setActiveView("genre-detail");
    setGenreSongs([]);
    setGenreLoading(true);
    try {
      const res = await fetch(`/api/music/genres?genre=${encodeURIComponent(genre.id)}`);
      if (res.ok) { const data = await res.json(); setGenreSongs(data.tracks ?? []); }
    } catch {} finally { setGenreLoading(false); }
  };

  const openContextMenu = (e: React.MouseEvent, song: DiscoverSong | SearchSong) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, song, mode: "default" });
  };

  const playDiscoverSong = (song: DiscoverSong | SearchSong, action: "play" | "play_now" = "play_now") => {
    sendControl(action, `https://www.youtube.com/watch?v=${song.videoId}`, { voiceChannelId: selectedVoiceChannel });
  };

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

  const addToPlaylist = async (song: DiscoverSong | SearchSong, playlist: Playlist) => {
    if (!selectedGuildId) { setControlError("Select a server first"); return; }
    
    let length = 0;
    if ('duration' in song && song.duration) {
      if (typeof song.duration === 'string') {
        length = song.duration.split(":").reduce((acc, time) => (60 * acc) + +time, 0) * 1000;
      } else if (typeof song.duration === 'number') {
        length = song.duration;
      }
    }

    const track = {
      title: song.title,
      author: 'artist' in song ? song.artist : '',
      uri: `https://www.youtube.com/watch?v=${song.videoId}`,
      length,
      artwork: song.thumbnail || null
    };

    setControlLoading(true);
    try {
      const userId = user?.discordUserId || user?.id || "";
      const res = await fetch(`/api/music/playlists?userId=${encodeURIComponent(userId)}`, {
        method: "PUT", headers: {"Content-Type":"application/json"}, credentials: "include",
        body: JSON.stringify({ id: playlist.id, tracks: [...playlist.tracks, track] })
      });
      if (res.ok) {
        setControlError(`Added to ${playlist.name}!`);
        setTimeout(() => setControlError(null), 3000);
        
        if (user?.discordUserId || user?.id) {
          const pr = await fetch(`/api/music/playlists?userId=${encodeURIComponent(user.discordUserId || user.id)}`, { credentials: "include" });
          const pd = await pr.json();
          const lp: Playlist[] = (pd.playlists || []).map((p: any) => ({
            ...p,
            createdAt: p.createdAt || p.created_at || '',
            updatedAt: p.updatedAt || p.updated_at || '',
          }));
          setPlaylists(lp);
          if (activePlaylist && activePlaylist.id === playlist.id) {
            setActivePlaylist(lp.find(p => p.id === playlist.id) || null);
          }
        }
      } else {
         const data = await res.json();
         setControlError(data.error || "Failed to add to playlist");
         setTimeout(() => setControlError(null), 3000);
      }
    } catch {
      setControlError("Failed to add to playlist");
      setTimeout(() => setControlError(null), 3000);
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
        body: JSON.stringify({ action, guildId: selectedGuildId, value, voiceChannelId: selectedVoiceChannel, textChannelId: selectedTextChannel, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) {
        let errorMsg = data.error || "Command failed";
        if (errorMsg.includes("status=404") || errorMsg.includes("reason=Not Found")) {
          // Send disconnect and leave to try to clear it
          fetch("/api/music/control", {
            method: "POST", headers: {"Content-Type":"application/json"}, credentials: "include",
            body: JSON.stringify({ action: "disconnect", guildId: selectedGuildId, voiceChannelId: selectedVoiceChannel, textChannelId: selectedTextChannel, ...extra })
          }).catch(() => {});
          
          errorMsg = "Session expired! Please Right-Click the Bot in Discord and select 'Disconnect', then play a song here.";
        }
        setControlError(errorMsg);
        setTimeout(() => setControlError(null), 8000); // give them more time to read it
      }
      else setTimeout(() => fetchNowPlaying(selectedGuildId), 600);
    } catch { setControlError("Could not reach the music bot"); }
    finally { setControlLoading(false); }
  }, [selectedGuildId, selectedVoiceChannel, selectedTextChannel, fetchNowPlaying]);

  const filteredPlaylists = playlists.filter(p => !selectedGuildId || p.guildId === selectedGuildId);
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
    return (
      <div className="dz-root">
        <DiscordLoginScreen />
      </div>
    );
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
          {/* Primary tabs — always visible on mobile bottom bar */}
          <button className={`dz-nav-item dz-nav-primary ${activeView === "home" ? "active" : ""}`} onClick={() => { setActiveView("home"); setMobileMoreOpen(false); }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            <span>Home</span>
          </button>
          <button className={`dz-nav-item dz-nav-primary ${activeView === "history" ? "active" : ""}`} onClick={() => { setActiveView("history"); setMobileMoreOpen(false); }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>
            <span>History</span>
          </button>
          <button className={`dz-nav-item dz-nav-primary ${activeView === "playlists" ? "active" : ""}`} onClick={() => { setActiveView("playlists"); setMobileMoreOpen(false); }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            <span>Playlists</span>
          </button>

          {/* Secondary tabs — shown on desktop sidebar, hidden on mobile (inside More sheet) */}
          <button className={`dz-nav-item dz-nav-secondary`} onClick={() => setActiveView("playlists")}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
            <span>Library</span>
          </button>
          <button className={`dz-nav-item dz-nav-secondary ${activeView === "liked" ? "active" : ""}`} onClick={() => setActiveView("liked")}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            <span>Liked Songs</span>
          </button>
          <button className={`dz-nav-item dz-nav-secondary ${activeView === "artists" ? "active" : ""}`} onClick={() => setActiveView("artists")}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>
            <span>Artists</span>
          </button>
          <button className={`dz-nav-item dz-nav-secondary ${activeView === "albums" ? "active" : ""}`} onClick={() => setActiveView("albums")}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
            <span>Albums</span>
          </button>

          {/* More button — only visible on mobile */}
          <button className={`dz-nav-item dz-nav-more-btn ${mobileMoreOpen ? "active" : ""}`} onClick={() => setMobileMoreOpen(!mobileMoreOpen)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
            <span>More</span>
          </button>
        </nav>

        {/* Mobile "More" sheet */}
        {mobileMoreOpen && (
          <div className="dz-mobile-more-overlay" onClick={() => setMobileMoreOpen(false)}>
            <div className="dz-mobile-more-sheet" onClick={e => e.stopPropagation()}>
              <div className="dz-mobile-more-handle" />
              <button className={`dz-mobile-more-item ${activeView === "liked" ? "active" : ""}`} onClick={() => { setActiveView("liked"); setMobileMoreOpen(false); }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                <span>Liked Songs</span>
              </button>
              <button className={`dz-mobile-more-item ${activeView === "artists" ? "active" : ""}`} onClick={() => { setActiveView("artists"); setMobileMoreOpen(false); }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>
                <span>Artists</span>
              </button>
              <button className={`dz-mobile-more-item ${activeView === "albums" ? "active" : ""}`} onClick={() => { setActiveView("albums"); setMobileMoreOpen(false); }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
                <span>Albums</span>
              </button>
              <button className={`dz-mobile-more-item`} onClick={() => { setActiveView("playlists"); setMobileMoreOpen(false); }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
                <span>Library</span>
              </button>
            </div>
          </div>
        )}

        {/* Sidebar playlist list */}
        <div className="dz-sidebar-playlists">
          {/* + New Playlist button */}
          <button className="dz-sidebar-pl dz-sidebar-new-pl" onClick={() => setShowCreatePlaylist(true)}>
            <div className="dz-sidebar-pl-icon dz-sidebar-new-pl-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
            </div>
            <div className="dz-sidebar-pl-info">
              <div className="dz-sidebar-pl-name">New Playlist</div>
            </div>
          </button>
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
                  onPlaySong={(song, action = "play_now") => {
                    playDiscoverSong(song, action);
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
                  onContextMenu={openContextMenu}
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
              <div className="dz-server-dropdown-container" ref={vcDropdownRef}>
                <button className="dz-server-dropdown-btn" onClick={() => setVcDropdownOpen(!vcDropdownOpen)}>
                  {(() => {
                    const activeVc = voiceChannels.find(vc => vc.id === selectedVoiceChannel);
                    return activeVc ? (
                      <div className="dz-server-dropdown-active">
                        <span className="dz-server-dropdown-name" style={{ paddingLeft: "8px" }}>#{activeVc.name}</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
                      </div>
                    ) : (
                      <div className="dz-server-dropdown-active">
                        <span className="dz-server-dropdown-name" style={{ paddingLeft: "8px" }}>Select Voice</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
                      </div>
                    );
                  })()}
                </button>
                {vcDropdownOpen && (
                  <div className="dz-server-dropdown-menu">
                    {voiceChannels.map(vc => (
                      <button key={vc.id} className={`dz-server-dropdown-item ${vc.id === selectedVoiceChannel ? "active" : ""}`} onClick={() => {
                        setSelectedVoiceChannel(vc.id);
                        localStorage.setItem("wos_music_vc", vc.id);
                        setVcDropdownOpen(false);
                      }}>
                        <span className="dz-server-dropdown-name">#{vc.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {/* Text channel selector */}
            {textChannels.length > 0 && (
              <div className="dz-server-dropdown-container" ref={tcDropdownRef}>
                <button className="dz-server-dropdown-btn" onClick={() => setTcDropdownOpen(!tcDropdownOpen)}>
                  {(() => {
                    const activeTc = textChannels.find(tc => tc.id === selectedTextChannel);
                    return activeTc ? (
                      <div className="dz-server-dropdown-active">
                        <span className="dz-server-dropdown-name" style={{ paddingLeft: "8px" }}>#{activeTc.name}</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
                      </div>
                    ) : (
                      <div className="dz-server-dropdown-active">
                        <span className="dz-server-dropdown-name" style={{ paddingLeft: "8px" }}>Select Text</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
                      </div>
                    );
                  })()}
                </button>
                {tcDropdownOpen && (
                  <div className="dz-server-dropdown-menu">
                    {textChannels.map(tc => (
                      <button key={tc.id} className={`dz-server-dropdown-item ${tc.id === selectedTextChannel ? "active" : ""}`} onClick={() => {
                        setSelectedTextChannel(tc.id);
                        localStorage.setItem("wos_music_tc", tc.id);
                        setTcDropdownOpen(false);
                      }}>
                        <span className="dz-server-dropdown-name">#{tc.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {/* User avatar */}
            <div className="dz-server-dropdown-container" ref={userDropdownRef}>
              <button className="dz-user-btn" title={`Signed in as ${user.displayName}`} onClick={() => setUserDropdownOpen(!userDropdownOpen)}>
                {user.avatarUrl
                  ? <img src={user.avatarUrl} alt={user.displayName} className="dz-avatar-img" />
                  : <div className="dz-avatar-placeholder">{user.displayName.charAt(0).toUpperCase()}</div>
                }
              </button>
              {userDropdownOpen && (
                <div className="dz-server-dropdown-menu" style={{ right: 0, left: "auto", top: "calc(100% + 8px)" }}>
                  <div className="dz-server-dropdown-item" style={{ borderBottom: "1px solid var(--border)", pointerEvents: "none", opacity: 0.7 }}>
                    <span className="dz-server-dropdown-name">{user.displayName}</span>
                  </div>
                  <button className="dz-server-dropdown-item" onClick={async () => {
                    await fetch("/api/auth/logout", { method: "POST" });
                    window.location.reload();
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    <span className="dz-server-dropdown-name" style={{ marginLeft: "8px" }}>Log out</span>
                  </button>
                </div>
              )}
            </div>
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

        {/* Success toast */}
        {toastMsg && (
          <div className="dz-success-toast">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            {toastMsg}
            <button onClick={() => setToastMsg(null)}>
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
              {nowPlaying.queue.map((t, i) => {
                const songObj: SearchSong = {
                  type: "song",
                  videoId: t.uri.includes('=') ? t.uri.split('=').pop() || '' : t.uri,
                  title: t.title,
                  artist: t.author,
                  duration: formatTime(t.length),
                  thumbnail: t.artwork || undefined
                };
                return (
                  <div key={i} className="dz-track-row dz-queue-item-row" style={{ display: "grid", gridTemplateColumns: "24px minmax(0, 1fr) auto 40px", alignItems: "center", gap: "8px", padding: "4px 8px", minHeight: "48px", borderBottom: "1px solid rgba(255,255,255,0.02)" }} onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setContextMenu({ x: e.clientX, y: e.clientY, song: songObj, mode: "default" });
                  }}>
                    <span className="dz-track-idx" style={{width: "24px", fontSize: "12px", textAlign: "center"}}>{i + 1}</span>
                    <div className="dz-col-title" style={{gap: "10px"}}>
                      <div className="dz-track-thumb" style={{width: "36px", height: "36px"}}>
                        {t.artwork ? <img src={t.artwork} alt="" /> : (
                           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>
                        )}
                      </div>
                      <div style={{display: "flex", flexDirection: "column", overflow: "hidden"}}>
                        <span className="dz-track-name" style={{fontSize: "13px"}}>{t.title}</span>
                        <span className="dz-col-artist" style={{fontSize: "12px", display: "block"}}>{t.author}</span>
                      </div>
                    </div>
                    <div className="dz-track-inline-actions">
                      <button className="dz-inline-btn" title="Add to Playlist" onClick={(e) => { e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY, song: songObj, mode: "default" }); }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                      </button>
                      <button className="dz-inline-btn" title="Save to Favorites" onClick={(e) => { e.stopPropagation(); saveToFavorites(songObj as any); }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                      </button>
                      <button className="dz-inline-btn" title="Remove from Queue" onClick={(e) => { e.stopPropagation(); sendControl("remove_queue", i.toString()); }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      </button>
                    </div>
                    <div className="dz-col-dur" style={{width: "40px", fontSize: "12px", textAlign: "right"}}>{formatTime(t.length)}</div>
                  </div>
                );
              })}
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
                      <div key={idx} 
                        className={`dz-track-row ${isNP ? "playing" : ""} ${isEditingPlaylist ? "editing" : ""} ${dragTrackIndex === idx ? "dragging" : ""} ${dragOverTrackIndex === idx ? "drag-over" : ""}`}
                        draggable={isEditingPlaylist}
                        onDragStart={(e) => isEditingPlaylist && handleDragStart(e, idx)}
                        onDragEnter={(e) => isEditingPlaylist && handleDragEnter(e, idx)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => isEditingPlaylist && e.preventDefault()}
                        style={isEditingPlaylist ? { cursor: dragTrackIndex !== null ? "grabbing" : "grab" } : {}}
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
                            <div className="dz-reorder-grip" style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", marginRight: "8px", pointerEvents: "none" }}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="12" r="1.5"/><circle cx="9" cy="5" r="1.5"/><circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="15" cy="5" r="1.5"/><circle cx="15" cy="19" r="1.5"/></svg>
                            </div>
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
                
                {isEditingPlaylist && (
                  <div className="dz-playlist-add-songs" style={{marginTop:"24px", paddingTop:"24px", borderTop:"1px solid var(--border)"}}>
                    <div className="dz-add-songs-header" style={{marginBottom:"16px"}}>
                      <h3 style={{fontSize:"16px", color:"#fff"}}>Add songs to playlist</h3>
                    </div>
                    {/* YouTube link paste */}
                    <div className="dz-edit-link-paste" style={{marginBottom:"16px"}}>
                      <label style={{fontSize:"13px", color:"var(--text-muted)", marginBottom:"6px", display:"flex", alignItems:"center", gap:"6px"}}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                        Paste YouTube Link (works with unlisted videos)
                      </label>
                      <div style={{display:"flex", gap:"8px"}}>
                        <input type="text" className="dz-search-input" value={editPlLinkInput}
                          onChange={e => setEditPlLinkInput(e.target.value)}
                          placeholder="https://youtube.com/watch?v=... or https://youtu.be/..."
                          onKeyDown={e => { if (e.key === 'Enter') handleEditPlResolveLink(); }}
                          style={{flex:1, background:"var(--bg-elevated)", border:"1px solid var(--border)", borderRadius:"6px", padding:"8px 12px", color:"#fff"}}
                        />
                        <button className="dz-btn-save" onClick={handleEditPlResolveLink}
                          disabled={editPlLinkLoading || !editPlLinkInput.trim()}
                          style={{minWidth:"60px"}}>
                          {editPlLinkLoading ? <div className="dz-spinner-sm" /> : 'Add'}
                        </button>
                      </div>
                    </div>
                    <div className="dz-add-songs-search">
                      <div className="dz-search-bar" style={{ width: "100%", maxWidth: "400px", margin: 0 }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        </svg>
                        <input
                          type="text"
                          className="dz-search-input"
                          placeholder="Search for songs"
                          value={playlistSearchQuery}
                          onChange={e => setPlaylistSearchQuery(e.target.value)}
                        />
                      </div>
                    </div>
                    {playlistSearchLoading && <div className="dz-spinner-sm" style={{marginTop:"16px"}} />}
                    {!playlistSearchLoading && playlistSearchResults.length > 0 && (
                      <div className="dz-add-songs-results" style={{marginTop:"16px"}}>
                        {playlistSearchResults.map(song => (
                          <div key={song.videoId} className="dz-track-row">
                            <div className="dz-col-title">
                              <div className="dz-track-thumb">
                                {song.thumbnail ? <img src={song.thumbnail} alt="" /> : null}
                              </div>
                              <span className="dz-track-name">{song.title}</span>
                            </div>
                            <div className="dz-col-artist">{song.artist}</div>
                            <div className="dz-col-dur">{song.duration}</div>
                            <div className="dz-col-reorder" style={{width:"80px", justifyContent:"flex-end"}}>
                              <button className="dz-btn-save" onClick={() => {
                                let length = 0;
                                if (typeof song.duration === 'string') {
                                  length = song.duration.split(":").reduce((acc, time) => (60 * acc) + +time, 0) * 1000;
                                }
                                const track = {
                                  title: song.title,
                                  author: song.artist,
                                  uri: `https://www.youtube.com/watch?v=${song.videoId}`,
                                  length,
                                  artwork: song.thumbnail || null
                                };
                                setEditPlaylistTracks(prev => [...prev, track]);
                                setPlaylistSearchQuery("");
                                setPlaylistSearchResults([]);
                              }}>Add</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : activeView === "playlists" ? (
            /* PLAYLISTS GRID VIEW */
            <div className="dz-view">
              <div className="dz-view-header">
                <h2 className="dz-view-title">Your Playlists</h2>
                <button className="dz-create-pl-btn" onClick={() => setShowCreatePlaylist(true)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                  Create Playlist
                </button>
              </div>
              {playlistsLoading ? (
                <div className="dz-playlists-grid">
                  {[1,2,3,4].map(i => <div key={i} className="dz-pl-card-skeleton" />)}
                </div>
              ) : (
                <div className="dz-playlists-grid">
                  {/* + Create Playlist card */}
                  <button className="dz-pl-card dz-pl-card-create" onClick={() => setShowCreatePlaylist(true)}>
                    <div className="dz-pl-card-cover dz-pl-card-create-cover">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 5v14M5 12h14"/>
                      </svg>
                    </div>
                    <div className="dz-pl-card-info">
                      <div className="dz-pl-card-name">Create Playlist</div>
                      <div className="dz-pl-card-meta">Add songs from search or YouTube links</div>
                    </div>
                  </button>
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
                  <h2 className="dz-view-title">Good {new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 18 ? "Afternoon" : "Evening"} 👋</h2>

                  {/* Genre Grid */}
                  <div className="dz-genre-container">
                    <div className="dz-genre-header">
                      <h2 className="dz-genre-title">Choose a genre to get started</h2>
                      <p className="dz-genre-subtitle">Your playlist will evolve based on what you like or skip.</p>
                    </div>
                    {discoverLoading && genres.length === 0 ? (
                      <div className="dz-genre-scroll">
                        {[1,2,3,4,5,6].map(i => <div key={i} className="dz-genre-skeleton" />)}
                      </div>
                    ) : (
                      <div className="dz-genre-scroll">
                        {genres.map(g => {
                          // Support multiple possible image keys if backend varies
                          const imgUrl = g.thumb || (g as any).thumbnail || (g as any).image;
                          return (
                            <button key={g.id} className="dz-genre-card" onClick={() => openGenre(g)}>
                              <div className="dz-genre-card-bg" style={{ background: g.color || '#333' }}></div>
                              <div className="dz-genre-card-img">
                                {imgUrl ? <img src={imgUrl} alt={g.name} /> : <div className="dz-genre-placeholder"></div>}
                              </div>
                              <span className="dz-genre-name">{g.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* New Releases */}
                  {(discoverNewReleases.length > 0 || discoverLoading) && (
                    <div className="dz-section">
                      <h2 className="dz-section-title">New Releases</h2>
                      <div className="dz-card-row">
                        {discoverLoading && discoverNewReleases.length === 0
                          ? [1,2,3,4,5].map(i => <div key={i} className="dz-music-card-skeleton" />)
                          : discoverNewReleases.map((album, i) => (
                          <button key={i} className="dz-music-card" onClick={() => openAlbum(album.id)}>
                            {album.thumbnail
                              ? <img src={album.thumbnail} alt={album.name} className="dz-music-card-thumb" />
                              : <div className="dz-music-card-thumb" style={{ background: "var(--bg-elevated)" }} />}
                            <div className="dz-music-card-name">{album.name}</div>
                            <div className="dz-music-card-sub">{album.artist}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Your Playlists */}
                  {filteredPlaylists.length > 0 && (
                    <div className="dz-section">
                      <div className="dz-section-header">
                        <h2 className="dz-section-title">Your Playlists</h2>
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
              {activeView === "artist-detail" && (
                artistLoading || !artistData ? (
                  <div className="dz-empty-state"><div className="dz-spinner" /><p>Loading artist…</p></div>
                ) : (
                  <div className="dz-discover-view">
                    <div className="dz-artist-hero">
                      {artistData.thumbnail
                        ? <img src={artistData.thumbnail} alt={artistData.name} className="dz-artist-hero-img" />
                        : <div className="dz-artist-hero-placeholder"><svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 0 0-16 0"/></svg></div>
                      }
                      <div className="dz-artist-hero-info">
                        <span className="dz-hero-label">ARTIST</span>
                        <h1 className="dz-playlist-title">{artistData.name}</h1>
                        {artistData.subscribers && <p className="dz-artist-subs">{artistData.subscribers}</p>}
                      </div>
                    </div>
                    {artistData.songs.length > 0 && (
                      <div className="dz-section">
                        <h2 className="dz-section-title">Popular</h2>
                        <div className="dz-tracks-list">
                          {artistData.songs.map((s, i) => (
                            <div key={i} className="dz-track-row" onClick={() => playDiscoverSong(s)} onContextMenu={e => openContextMenu(e, s)}>
                              <div className="dz-col-id"><span className="dz-track-idx">{i+1}</span>
                                <button className="dz-track-play-btn" onClick={e => { e.stopPropagation(); playDiscoverSong(s); }} disabled={controlLoading || !selectedVoiceChannel}><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l14 9-14 9V3z"/></svg></button>
                              </div>
                              <div className="dz-col-title">
                                <div className="dz-track-thumb">{s.thumbnail ? <img src={s.thumbnail} alt="" /> : null}</div>
                                <span className="dz-track-name">{s.title}</span>
                              </div>
                              <div className="dz-col-artist" style={{cursor:s.albumId?"pointer":undefined}} onClick={e => { e.stopPropagation(); if(s.albumId) openAlbum(s.albumId); }}>{s.album}</div>
                              <div className="dz-track-inline-actions">
                                <button className="dz-inline-btn" title="Add to Queue" onClick={e => { e.stopPropagation(); addToQueueInline(s); }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg></button>
                                <button className="dz-inline-btn" title="Add to Playlist" onClick={e => { e.stopPropagation(); openContextMenu(e, s); setContextMenu(prev => prev ? {...prev, mode: 'playlist_select'} : null); }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg></button>
                                <button className="dz-inline-btn" title="More" onClick={e => { e.stopPropagation(); openContextMenu(e, s); }}><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg></button>
                              </div>
                              <div className="dz-col-dur">{s.duration ? formatTime(s.duration) : ""}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {artistData.albums.length > 0 && (
                      <div className="dz-section">
                        <h2 className="dz-section-title">Discography</h2>
                        <div className="dz-card-row">
                          {artistData.albums.map((a, i) => (
                            <button key={i} className="dz-music-card" onClick={() => openAlbum(a.id)}>
                              {a.thumbnail ? <img src={a.thumbnail} alt={a.name} className="dz-music-card-thumb" /> : <div className="dz-music-card-thumb" style={{background:"var(--bg-elevated)"}} />}
                              <div className="dz-music-card-name">{a.name}</div>
                              <div className="dz-music-card-sub">{a.year ?? a.type ?? "Album"}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              )}
              {activeView === "album-detail" && (
                albumLoading || !albumData ? (
                  <div className="dz-empty-state"><div className="dz-spinner" /><p>Loading album…</p></div>
                ) : (
                  <div className="dz-discover-view">
                    <div className="dz-playlist-hero">
                      <div className="dz-playlist-cover" style={albumData.thumbnail ? { backgroundImage: `url(${albumData.thumbnail})`, backgroundSize:"cover", backgroundPosition:"center" } : { background:"var(--bg-elevated)" }}>
                        {!albumData.thumbnail && <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>}
                      </div>
                      <div className="dz-playlist-hero-info">
                        <span className="dz-hero-label">ALBUM</span>
                        <h1 className="dz-playlist-title">{albumData.name}</h1>
                        <div className="dz-playlist-meta">
                          <span className="dz-meta-author" style={{cursor:albumData.artistId?"pointer":undefined}} onClick={() => { if(albumData.artistId) openArtist(albumData.artistId); }}>{albumData.artist}</span>
                          {albumData.year && <><span className="dz-meta-sep">·</span><span>{albumData.year}</span></>}
                          <span className="dz-meta-sep">·</span><span>{albumData.trackCount} songs</span>
                        </div>
                        <div style={{display:"flex",gap:"12px",marginTop:"16px"}}>
                          <button className="dz-play-btn" onClick={() => { if(albumData.tracks[0]) playDiscoverSong(albumData.tracks[0]); }} disabled={controlLoading || !selectedVoiceChannel}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l14 9-14 9V3z"/></svg>
                            Play
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="dz-tracks">
                      <div className="dz-tracks-header">
                        <div className="dz-col-id">#</div><div className="dz-col-title">Title</div><div className="dz-col-artist">Artist</div><div className="dz-col-dur">Duration</div>
                      </div>
                      <div className="dz-tracks-list">
                        {albumData.tracks.map((t, i) => (
                          <div key={i} className="dz-track-row" onClick={() => playDiscoverSong(t)} onContextMenu={e => openContextMenu(e, t)}>
                            <div className="dz-col-id"><span className="dz-track-idx">{i+1}</span>
                              <button className="dz-track-play-btn" onClick={e => { e.stopPropagation(); playDiscoverSong(t); }} disabled={controlLoading || !selectedVoiceChannel}><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l14 9-14 9V3z"/></svg></button>
                            </div>
                            <div className="dz-col-title">
                              <div className="dz-track-thumb">{t.thumbnail ? <img src={t.thumbnail} alt="" /> : null}</div>
                              <span className="dz-track-name">{t.title}</span>
                            </div>
                            <div className="dz-col-artist">{t.artist}</div>
                            <div className="dz-track-inline-actions">
                              <button className="dz-inline-btn" title="Add to Queue" onClick={e => { e.stopPropagation(); addToQueueInline(t); }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg></button>
                              <button className="dz-inline-btn" title="Add to Playlist" onClick={e => { e.stopPropagation(); openContextMenu(e, t); setContextMenu(prev => prev ? {...prev, mode: 'playlist_select'} : null); }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg></button>
                              <button className="dz-inline-btn" title="More" onClick={e => { e.stopPropagation(); openContextMenu(e, t); }}><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg></button>
                            </div>
                            <div className="dz-col-dur">{t.duration ? formatTime(t.duration) : ""}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              )}
              {activeView === "genre-detail" && currentGenre && (
                <div className="dz-discover-view">
                  <div className="dz-genre-hero" style={{ background: currentGenre.color }}>
                    <h1 className="dz-playlist-title">{currentGenre.name}</h1>
                    <p style={{color:"rgba(255,255,255,0.8)",marginTop:"8px"}}>Top tracks in {currentGenre.name}</p>
                  </div>
                  {genreLoading ? (
                    <div className="dz-empty-state"><div className="dz-spinner" /><p>Loading tracks…</p></div>
                  ) : (
                    <div className="dz-tracks">
                      <div className="dz-tracks-header">
                        <div className="dz-col-id">#</div><div className="dz-col-title">Title</div><div className="dz-col-artist">Artist</div><div className="dz-col-dur">Duration</div>
                      </div>
                      <div className="dz-tracks-list">
                        {genreSongs.map((s, i) => (
                          <div key={i} className="dz-track-row" onClick={() => playDiscoverSong(s)} onContextMenu={e => openContextMenu(e, s)}>
                            <div className="dz-col-id"><span className="dz-track-idx">{i+1}</span>
                              <button className="dz-track-play-btn" onClick={e => { e.stopPropagation(); playDiscoverSong(s); }} disabled={controlLoading || !selectedVoiceChannel}><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l14 9-14 9V3z"/></svg></button>
                            </div>
                            <div className="dz-col-title">
                              <div className="dz-track-thumb">{s.thumbnail ? <img src={s.thumbnail} alt="" /> : null}</div>
                              <span className="dz-track-name">{s.title}</span>
                            </div>
                            <div className="dz-col-artist" style={{cursor:s.artistId?"pointer":undefined}} onClick={e => { e.stopPropagation(); if(s.artistId) openArtist(s.artistId); }}>{s.artist}</div>
                            <div className="dz-track-inline-actions">
                              <button className="dz-inline-btn" title="Add to Queue" onClick={e => { e.stopPropagation(); addToQueueInline(s); }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg></button>
                              <button className="dz-inline-btn" title="Add to Playlist" onClick={e => { e.stopPropagation(); openContextMenu(e, s); setContextMenu(prev => prev ? {...prev, mode: 'playlist_select'} : null); }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg></button>
                              <button className="dz-inline-btn" title="More" onClick={e => { e.stopPropagation(); openContextMenu(e, s); }}><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg></button>
                            </div>
                            <div className="dz-col-dur">{s.duration ? formatTime(s.duration) : ""}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
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
                            <div className="dz-history-title" style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '4px', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{entry.track.title || "Unknown Track"}</div>
                            <div className="dz-history-date" style={{ fontSize: '13px', fontWeight: 400, color: '#a0a0a0', marginBottom: '2px' }}>{formattedDate}</div>
                            <div className="dz-history-sub" style={{ fontSize: '12px' }}>Bot</div>
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
            <button className="dz-np-icon-btn" onClick={() => sendControl("now_playing")} disabled={controlLoading || !displayTrack} title="Control Playback from Discord">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/>
              </svg>
            </button>
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

      {/* ── Context Menu ── */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="dz-context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          {contextMenu.mode === "playlist_select" ? (
            <>
              <div className="dz-ctx-header">
                <button className="dz-ctx-back" onClick={() => setContextMenu({...contextMenu, mode: "default"})} style={{background:"none",border:"none",color:"#fff",cursor:"pointer",marginRight:"8px",display:"flex",alignItems:"center"}}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
                </button>
                <div className="dz-ctx-song-info">
                  <div className="dz-ctx-song-title">Add to Playlist</div>
                </div>
              </div>
              <div className="dz-ctx-divider" />
              <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                {playlists.length === 0 && <div style={{padding:"8px",color:"#999",fontSize:"13px"}}>No playlists found</div>}
                {filteredPlaylists.map(pl => (
                  <button key={pl.id} className="dz-ctx-item" onClick={() => { addToPlaylist(contextMenu.song, pl); setContextMenu(null); }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                    <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{pl.name}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              {/* Song header */}
              <div className="dz-ctx-header">
                {contextMenu.song.thumbnail && <img src={contextMenu.song.thumbnail} alt="" className="dz-ctx-thumb" />}
                <div className="dz-ctx-song-info">
                  <div className="dz-ctx-song-title">{contextMenu.song.title}</div>
                  <div className="dz-ctx-song-artist">{contextMenu.song.artist}</div>
                </div>
              </div>
              <div className="dz-ctx-divider" />
              <button className="dz-ctx-item" onClick={() => { playDiscoverSong(contextMenu.song); setContextMenu(null); }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l14 9-14 9V3z"/></svg>
                Play Now
              </button>
              <button className="dz-ctx-item" onClick={() => { sendControl("play", `https://www.youtube.com/watch?v=${contextMenu.song.videoId}`, {}); setContextMenu(null); }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                Add to Queue
              </button>
              <button className="dz-ctx-item" onClick={() => setContextMenu({ ...contextMenu, mode: "playlist_select" })}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
                Add to Playlist
              </button>
              <button className="dz-ctx-item" onClick={() => { navigator.clipboard?.writeText(`https://www.youtube.com/watch?v=${contextMenu.song.videoId}`); setContextMenu(null); }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                Copy Track Link
              </button>
          {'albumId' in contextMenu.song && contextMenu.song.albumId && (
            <>
              <div className="dz-ctx-divider" />
              <div className="dz-ctx-label">ALBUM</div>
              <button className="dz-ctx-item" onClick={() => { if('albumId' in contextMenu.song && contextMenu.song.albumId) openAlbum(contextMenu.song.albumId); setContextMenu(null); }}>
                {contextMenu.song.thumbnail && <img src={contextMenu.song.thumbnail} alt="" className="dz-ctx-item-thumb" />}
                <span>{('album' in contextMenu.song && contextMenu.song.album) ? contextMenu.song.album : "View Album"}</span>
              </button>
            </>
          )}
          {'artistId' in contextMenu.song && contextMenu.song.artistId && (
            <>
              <div className="dz-ctx-divider" />
              <div className="dz-ctx-label">ARTIST</div>
              <button className="dz-ctx-item" onClick={() => { if('artistId' in contextMenu.song && contextMenu.song.artistId) openArtist(contextMenu.song.artistId); setContextMenu(null); }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>
                <span>{contextMenu.song.artist}</span>
              </button>
            </>
          )}
            </>
          )}
        </div>
      )}

      {/* ── Create Playlist Modal ── */}
      {showCreatePlaylist && (
        <div className="dz-modal-overlay" onClick={() => setShowCreatePlaylist(false)}>
          <div className="dz-modal" onClick={e => e.stopPropagation()}>
            <div className="dz-modal-header">
              <h2>Create Playlist</h2>
              <button className="dz-modal-close" onClick={() => setShowCreatePlaylist(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div className="dz-modal-body">
              {/* Name & cover */}
              <div className="dz-modal-field">
                <label>Playlist Name</label>
                <input type="text" value={createPlName} onChange={e => setCreatePlName(e.target.value)} placeholder="My awesome playlist" autoFocus />
              </div>
              <div className="dz-modal-field">
                <label>Cover Image URL <span style={{opacity:0.5}}>(optional)</span></label>
                <input type="text" value={createPlIconUrl} onChange={e => setCreatePlIconUrl(e.target.value)} placeholder="https://example.com/cover.jpg" />
              </div>

              <div className="dz-modal-divider" />

              {/* Paste YouTube link */}
              <div className="dz-modal-field">
                <label>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign: 'middle', marginRight: '6px'}}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                  Paste YouTube Link
                </label>
                <div className="dz-link-input-row">
                  <input type="text" value={createPlLinkInput} onChange={e => setCreatePlLinkInput(e.target.value)}
                    placeholder="https://youtube.com/watch?v=... or https://youtu.be/..."
                    onKeyDown={e => { if (e.key === 'Enter') handleCreatePlResolveLink(); }}
                  />
                  <button className="dz-btn-resolve" onClick={handleCreatePlResolveLink} disabled={createPlLinkLoading || !createPlLinkInput.trim()}>
                    {createPlLinkLoading ? <div className="dz-spinner-sm" /> : 'Add'}
                  </button>
                </div>
                <p className="dz-field-hint">Works with unlisted videos, shorts, and YouTube Music links</p>
              </div>

              {/* Search songs */}
              <div className="dz-modal-field">
                <label>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign: 'middle', marginRight: '6px'}}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  Search Songs
                </label>
                <input type="text" value={createPlSearchQuery} onChange={e => setCreatePlSearchQuery(e.target.value)}
                  placeholder="Search by song name or artist"
                  onKeyDown={e => { if (e.key === 'Enter') handleCreatePlSearchSubmit(); }}
                />
              </div>
              {createPlSearchLoading && <div className="dz-spinner-sm" style={{margin: '8px auto'}} />}
              {createPlSearchResults.length > 0 && (
                <div className="dz-modal-search-results">
                  {createPlSearchResults.map(song => (
                    <div key={song.videoId} className="dz-modal-song-row">
                      <div className="dz-modal-song-thumb">{song.thumbnail ? <img src={song.thumbnail} alt="" /> : null}</div>
                      <div className="dz-modal-song-info">
                        <div className="dz-modal-song-title">{song.title}</div>
                        <div className="dz-modal-song-artist">{song.artist}</div>
                      </div>
                      <span className="dz-modal-song-dur">{song.duration}</span>
                      <button className="dz-btn-add-song" onClick={() => {
                        let length = 0;
                        if (typeof song.duration === 'string') {
                          length = song.duration.split(':').reduce((acc, t) => (60 * acc) + +t, 0) * 1000;
                        }
                        setCreatePlTracks(prev => [...prev, {
                          title: song.title,
                          author: song.artist,
                          uri: `https://www.youtube.com/watch?v=${song.videoId}`,
                          length,
                          artwork: song.thumbnail || null,
                        }]);
                        showToast(`Added "${song.title}"`);
                      }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Added tracks preview */}
              {createPlTracks.length > 0 && (
                <>
                  <div className="dz-modal-divider" />
                  <div className="dz-modal-tracks-header">
                    <span>{createPlTracks.length} song{createPlTracks.length !== 1 ? 's' : ''} added</span>
                  </div>
                  <div className="dz-modal-tracks-list">
                    {createPlTracks.map((track, idx) => (
                      <div key={idx} className="dz-modal-song-row">
                        <span className="dz-modal-track-num">{idx + 1}</span>
                        <div className="dz-modal-song-thumb">{track.artwork ? <img src={track.artwork} alt="" /> : null}</div>
                        <div className="dz-modal-song-info">
                          <div className="dz-modal-song-title">{track.title}</div>
                          <div className="dz-modal-song-artist">{track.author}</div>
                        </div>
                        <span className="dz-modal-song-dur">{formatTime(track.length)}</span>
                        <button className="dz-btn-remove-song" onClick={() => setCreatePlTracks(prev => prev.filter((_, i) => i !== idx))}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="dz-modal-footer">
              <button className="dz-btn-cancel" onClick={() => setShowCreatePlaylist(false)}>Cancel</button>
              <button className="dz-btn-save" onClick={createPlaylist} disabled={createPlSaving || !createPlName.trim() || !selectedGuildId}>
                {createPlSaving ? 'Creating…' : 'Create Playlist'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
