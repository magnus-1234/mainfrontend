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
  const [countdown, setCountdown] = useState<number | null>(null);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [verificationMode, setVerificationMode] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    return () => clearTimer();
  }, []);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setCountdown(null);
  };

  const executeSearch = async (idToSearch: string) => {
    try {
      const response = await fetch("/api/player/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: idToSearch }),
      });

      let data;
      try {
        data = await response.json();
      } catch (parseErr) {
        throw new Error("Server returned an invalid response. Please try again.");
      }

      if (!response.ok) {
        if (response.status === 429 && data.error?.includes("wait")) {
          const match = data.error.match(/wait ([\d.]+)s/);
          if (match) {
            const waitTime = Math.ceil(parseFloat(match[1]));
            startCountdown(waitTime, idToSearch);
            return;
          }
        }
        throw new Error(data.error || "Failed to fetch player profile.");
      }

      setPlayer(data.player);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setLoading(false);
    }
  };

  const startCountdown = (seconds: number, idToSearch: string) => {
    setCountdown(seconds);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearTimer();
          executeSearch(idToSearch);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerId.trim()) return;

    clearTimer();
    setLoading(true);
    setError("");
    setPlayer(null);
    setVerificationMode(false);
    setVerificationCode("");
    setVerificationSuccess(false);

    await executeSearch(playerId.trim());
  };

  const handleSendVerification = async () => {
    if (!playerId.trim()) return;
    setVerifying(true);
    setError("");
    
    try {
      const response = await fetch("/api/wos-auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ playerId: playerId.trim() }),
      });
      
      let data;
      try {
        data = await response.json();
      } catch (parseErr) {
        const text = await response.text().catch(() => "");
        console.error("Failed to parse JSON response:", text.substring(0, 500));
        throw new Error("Server returned an invalid response (HTML). Please ensure you are logged into the dashboard.");
      }
      
      if (!response.ok) throw new Error(data.error || "Failed to send code");
      
      setVerificationMode(true);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setVerifying(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode.trim() || verificationCode.length !== 6) {
      setError("Please enter a valid 6-digit code");
      return;
    }
    
    setVerifying(true);
    setError("");
    
    try {
      const response = await fetch("/api/wos-auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ 
          playerId: playerId.trim(),
          code: verificationCode.trim()
        }),
      });
      
      let data;
      try {
        data = await response.json();
      } catch (parseErr) {
        const text = await response.text().catch(() => "");
        console.error("Failed to parse JSON response:", text.substring(0, 500));
        throw new Error("Server returned an invalid response. Please ensure you are logged in.");
      }
      
      if (!response.ok) throw new Error(data.error || "Failed to verify code");
      
      // Verification successful, link the account
      await linkVerifiedAccount(data.wosToken);
      
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setVerifying(false);
    }
  };

  const linkVerifiedAccount = async (wosToken: string) => {
    try {
      const response = await fetch("/api/profile/player-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          playerId: playerId.trim(),
          wosVerified: true,
          wosToken
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to link account");
      }
      
      setVerificationSuccess(true);
      setVerificationMode(false);
    } catch (err: any) {
      setError(err.message || "Verification succeeded but linking failed.");
    } finally {
      setVerifying(false);
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

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const faqs = [
    {
      question: "How do I find my Player ID?",
      answer: "Open Whiteout Survival, tap your avatar in the top left corner, and look for the 'ID' number located below your Chief name."
    },
    {
      question: "Is this service free?",
      answer: "Yes, searching profiles and downloading high-quality avatars is completely free of charge."
    },
    {
      question: "Why isn't my avatar updating here?",
      answer: "Game servers may take some time to propagate avatar changes. If you recently changed it, please wait up to 24 hours."
    },
    {
      question: "How do I download my avatar in HD?",
      answer: "Search for your Player ID, and once your profile appears, click the vibrant 'Download HD Avatar' button below your details."
    }
  ];

  const screenshots = [
    { src: "/bot-preview-arena.png", alt: "Arena Info" },
    { src: "/bot-preview-dashboard-reference.png", alt: "Dashboard Interface" },
    { src: "/showcase-furnace-up.png", alt: "Furnace Upgrades" },
    { src: "/showcase-avatar-change.png", alt: "Avatar Settings" },
    { src: "/showcase-gift-alert.png", alt: "Gift Alerts" },
    { src: "/showcase-state-age.png", alt: "State Age Tracking" }
  ];

  return (
    <div className="pp-page">
      <div className="pp-container">
        
        {/* HERO SECTION */}
        <div className="pp-hero">
          <div className="pp-hero-glow"></div>
          <h1>Player Explorer</h1>
          <p>Uncover complete player details and download high-quality, vibrant avatars instantly.</p>
        </div>

        {/* SEARCH FORM */}
        <form className="pp-search" onSubmit={handleSearch}>
          <div className="pp-search-input-wrapper">
            <svg className="pp-search-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="Enter Player ID (e.g. 12345678)"
              value={playerId}
              onChange={(e) => setPlayerId(e.target.value)}
              disabled={loading}
            />
          </div>
          <button type="submit" className="pp-search-btn" disabled={loading || !playerId.trim() || countdown !== null}>
            {countdown !== null ? (
              <>
                <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                </svg>
                <span>Retry in {countdown}s</span>
              </>
            ) : loading ? (
              <>
                <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                </svg>
                <span>Searching</span>
              </>
            ) : (
              <span>Explore</span>
            )}
            <div className="pp-btn-glow"></div>
          </button>
        </form>

        {error && (
          <div className="pp-error">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            {error}
          </div>
        )}

        {/* RESULTS CARD */}
        {player && (
          <div className="pp-result-card">
            <div className="pp-result-backdrop"></div>
            
            <div className="pp-avatar-section">
              <div className="pp-avatar-ring">
                {player.avatarImage ? (
                  <img 
                    src={proxiedWosAvatarUrl(player.avatarImage)} 
                    alt={`${player.nickname}'s avatar`} 
                    className="pp-avatar"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div className="pp-avatar-fallback">No Avatar</div>
                )}
              </div>
            </div>
            
            <div className="pp-info-section">
              <div className="pp-name-wrapper">
                <h2 className="pp-name">{player.nickname}</h2>
                <span className="pp-id-badge">#{player.playerId}</span>
              </div>
              
              <div className="pp-stats-grid">
                <div className="pp-stat-box">
                  <span className="pp-stat-label">State</span>
                  <span className="pp-stat-value">{player.stateId ? `#${player.stateId}` : "Unknown"}</span>
                </div>
                <div className="pp-stat-box pp-stat-box-highlight">
                  <span className="pp-stat-label">Furnace Level</span>
                  <span className="pp-stat-value">
                    {player.furnaceLevelFormatted || player.furnaceLevel || "Unknown"}
                  </span>
                </div>
              </div>

                {player.avatarImage && (
                  <button className="pp-download-btn" onClick={handleDownload}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    Download HD Avatar
                  </button>
                )}
                
                {verificationSuccess ? (
                  <div className="pp-verification-success">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    Account Verified & Linked!
                  </div>
                ) : verificationMode ? (
                  <form className="pp-verify-form" onSubmit={handleVerifyCode}>
                    <p className="pp-verify-info">Code sent to your in-game mail.</p>
                    <div className="pp-verify-input-group">
                      <input 
                        type="text" 
                        maxLength={6} 
                        placeholder="6-digit code" 
                        value={verificationCode}
                        onChange={e => setVerificationCode(e.target.value)}
                        disabled={verifying}
                      />
                      <button type="submit" disabled={verifying || verificationCode.length !== 6}>
                        {verifying ? "Verifying..." : "Verify Code"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <button className="pp-verify-btn" onClick={handleSendVerification} disabled={verifying}>
                    {verifying ? "Sending..." : "Verify Ownership"}
                  </button>
                )}
            </div>
          </div>
        )}

        {/* FAQ SECTION */}
        <div className="pp-section pp-faq">
          <h3 className="pp-section-title">Frequently Asked Questions</h3>
          <div className="pp-faq-list">
            {faqs.map((faq, idx) => (
              <div 
                key={idx} 
                className={`pp-faq-item ${activeFaq === idx ? "active" : ""}`}
                onClick={() => toggleFaq(idx)}
              >
                <div className="pp-faq-q">
                  {faq.question}
                  <svg className="pp-faq-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
                <div className="pp-faq-a">
                  <p>{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SCREENSHOTS SECTION */}
        <div className="pp-section pp-screenshots">
          <h3 className="pp-section-title">Explore Game & Bot Features</h3>
          <p className="pp-section-subtitle">A glimpse into what we offer</p>
          <div className="pp-gallery">
            {screenshots.map((shot, idx) => (
              <div key={idx} className="pp-gallery-item">
                <img src={shot.src} alt={shot.alt} loading="lazy" />
                <div className="pp-gallery-overlay">
                  <span>{shot.alt}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
