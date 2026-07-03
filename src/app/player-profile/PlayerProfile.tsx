import React, { useState } from "react";
import "./player-profile.css";

type PlayerProfileData = {
  playerId: string;
  nickname: string;
  stateId?: string;
  furnaceLevel?: number;
  furnaceLevelFormatted?: string;
  furnaceIcon?: string;
  avatarImage?: string;
};

// This helps bypass CORS and other issues for external avatars if the proxy is available.
const proxiedWosAvatarUrl = (value?: string) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^(data:|blob:)/i.test(raw)) return raw;
  
  let normalized = raw;
  if (raw.startsWith("//")) {
    normalized = `https:${raw}`;
  } else if (!raw.startsWith("http:") && !raw.startsWith("https:")) {
    const cleaned = raw.replace(/^\/+/, "");
    if (/^(avatar|avatar-dev|profile|head|icon)\//i.test(cleaned) || /\.(png|jpe?g|webp)$/i.test(cleaned)) {
      normalized = `https://gof-formal-avatar.akamaized.net/${cleaned}`;
    }
  }
  
  return `/api/avatar-proxy?url=${encodeURIComponent(normalized)}`;
};

export default function PlayerProfile() {
  const [playerId, setPlayerId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [player, setPlayer] = useState<PlayerProfileData | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerId.trim()) return;

    setLoading(true);
    setError("");
    setPlayer(null);

    try {
      const response = await fetch("/api/player/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: playerId.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch player profile.");
      }

      setPlayer(data.player);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!player?.avatarImage) return;
    
    const imageUrl = proxiedWosAvatarUrl(player.avatarImage);
    try {
      // Use the proxy to avoid CORS when downloading the blob
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error("Failed to download image");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = url;
      link.download = `player_${player.playerId}_avatar.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up object URL
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    } catch (err) {
      console.error("Error downloading image:", err);
      // Fallback if fetch fails (e.g. browser security blocking blob creation)
      window.open(imageUrl, '_blank');
    }
  };

  return (
    <div className="player-profile-container">
      <div className="player-profile-header">
        <h1>Player Details</h1>
        <p>Find player profiles and download high-quality avatars</p>
      </div>

      <form className="player-profile-search" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Enter Player ID (e.g. 12345678)"
          value={playerId}
          onChange={(e) => setPlayerId(e.target.value)}
          disabled={loading}
        />
        <button type="submit" disabled={loading || !playerId.trim()}>
          {loading ? (
            <>
              <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              </svg>
              Searching...
            </>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              Search
            </>
          )}
        </button>
      </form>

      {error && <div className="player-profile-error">{error}</div>}

      {player && (
        <div className="player-profile-card">
          <div className="player-profile-avatar-wrapper">
            {player.avatarImage ? (
              <img 
                src={proxiedWosAvatarUrl(player.avatarImage)} 
                alt={`${player.nickname}'s avatar`} 
                className="player-profile-avatar"
                crossOrigin="anonymous"
              />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#374151", color: "#9ca3af" }}>
                No Avatar
              </div>
            )}
          </div>
          
          <div className="player-profile-info">
            <div className="player-profile-name">{player.nickname}</div>
            
            <div className="player-profile-stats">
              <div className="player-stat-item">
                <div className="player-stat-label">Player ID</div>
                <div className="player-stat-value">{player.playerId}</div>
              </div>
              <div className="player-stat-item">
                <div className="player-stat-label">State</div>
                <div className="player-stat-value">{player.stateId ? `#${player.stateId}` : "Unknown"}</div>
              </div>
              <div className="player-stat-item" style={{ gridColumn: "span 2" }}>
                <div className="player-stat-label">Furnace Level</div>
                <div className="player-stat-value">
                  {player.furnaceLevelFormatted || player.furnaceLevel || "Unknown"}
                </div>
              </div>
            </div>

            {player.avatarImage && (
              <button 
                className="player-profile-download" 
                onClick={handleDownload}
                title="Download High Quality Avatar"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Download Avatar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
