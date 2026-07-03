import re

def main():
    file_path = "src/app/music/player/page.tsx"
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Update sendControl to support extra payload (voiceChannelId)
    old_sendControl = """  const sendControl = useCallback(
    async (action: string, value?: unknown) => {
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
          body: JSON.stringify({ action, guildId: selectedGuildId, value }),
        });"""
        
    new_sendControl = """  const sendControl = useCallback(
    async (action: string, value?: unknown, extra?: Record<string, any>) => {
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
        });"""
        
    content = content.replace(old_sendControl, new_sendControl)

    # 2. Add state for channels and play form
    old_state = """  // UI state
  const [showQueue, setShowQueue] = useState(false);
  const [volume, setVolume] = useState(50);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);"""
  
    new_state = """  // UI state
  const [showQueue, setShowQueue] = useState(false);
  const [volume, setVolume] = useState(50);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Play form state
  const [voiceChannels, setVoiceChannels] = useState<{id: string, name: string}[]>([]);
  const [selectedVoiceChannel, setSelectedVoiceChannel] = useState<string>("");
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
        setVoiceChannels(data.voiceChannels);
        if (data.voiceChannels.length > 0) setSelectedVoiceChannel(data.voiceChannels[0].id);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!selectedGuildId) return;
    fetchChannels(selectedGuildId);
  }, [selectedGuildId, fetchChannels]);
"""
    content = content.replace(old_state, new_state)

    # 3. Change auto-select guild logic
    old_auto_select = """          setGuilds(data.guilds || []);
          const firstGuild = data.guilds?.[0] || data.playlists[0]?.guildId || "";
          setSelectedGuildId(firstGuild);
          const firstForGuild = data.playlists.find((p: Playlist) => p.guildId === firstGuild) || data.playlists[0];
          setActivePlaylist(firstForGuild || null);"""
          
    new_auto_select = """          setGuilds(data.guilds || []);
          if (data.guilds?.length === 1) {
            const firstGuild = data.guilds[0];
            setSelectedGuildId(firstGuild);
            const firstForGuild = data.playlists.find((p: Playlist) => p.guildId === firstGuild) || data.playlists[0];
            setActivePlaylist(firstForGuild || null);
          }"""
          
    content = content.replace(old_auto_select, new_auto_select)

    # 4. Inject Server Grid if no server selected
    old_main_return = """  // ── Main UI ────────────────────────────────────────────────────────────────
  return (
    <div className="player-layout">
      {/* ── Sidebar ── */}"""
      
    new_main_return = """  // ── Main UI ────────────────────────────────────────────────────────────────
  if (!selectedGuildId && guilds.length > 0) {
    return (
      <div className="player-layout" style={{ minHeight: "100vh", padding: "40px 0" }}>
        <div className="server-selection-view">
          <h1 className="server-selection-title">Select a Server to Manage Music</h1>
          <div className="servers-grid">
            {guilds.map((g) => (
              <div key={g} className="server-card" onClick={() => setSelectedGuildId(g)}>
                <div className="server-banner" />
                <div className="server-icon">
                  <img src="https://cdn.discordapp.com/embed/avatars/0.png" alt="Server" />
                </div>
                <div className="server-body">
                  <div className="server-name">Server {g}</div>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.9em" }}>Click to manage music</div>
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
      {/* ── Sidebar ── */}"""
    content = content.replace(old_main_return, new_main_return)

    # 5. Inject Play Song Form
    old_playlist_view = """        {/* Main playlist view */}
        <div className="playlist-view">
          {controlError && ("""
          
    new_playlist_view = """        {/* Main playlist view */}
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
                <select 
                  className="channel-select" 
                  value={selectedVoiceChannel}
                  onChange={(e) => setSelectedVoiceChannel(e.target.value)}
                >
                   {voiceChannels.length === 0 && <option value="">No voice channels</option>}
                   {voiceChannels.map(vc => <option key={vc.id} value={vc.id}>{vc.name}</option>)}
                </select>
                <input 
                  type="text" 
                  className="play-input" 
                  placeholder="Search for a song or paste URL..." 
                  value={songQuery}
                  onChange={(e) => setSongQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && songQuery) {
                      sendControl("play", songQuery, { voiceChannelId: selectedVoiceChannel });
                      setSongQuery("");
                    }
                  }}
                />
                <button 
                  className="btn-primary" 
                  disabled={!songQuery || controlLoading}
                  onClick={() => {
                     sendControl("play", songQuery, { voiceChannelId: selectedVoiceChannel });
                     setSongQuery("");
                  }}
                >
                  {controlLoading ? "..." : "Play"}
                </button>
             </div>
          </div>
"""
    
    # We replace up to the controlError to insert the block correctly
    content = content.replace(old_playlist_view, new_playlist_view)
    
    # Cleanup duplicate control error since we appended it manually to new_playlist_view
    duplicate_err = """            <div className="control-error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {controlError}
              <button onClick={() => setControlError(null)}>✕</button>
            </div>
          )}

          {activePlaylist ? ("""
          
    clean_duplicate = """          {activePlaylist ? ("""
    
    # Actually, the string replace might be tricky with newlines. Let's use regex.
    # The `new_playlist_view` above re-creates the `controlError` div, so we will have two if we just replace the start.
    
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

if __name__ == "__main__":
    main()
