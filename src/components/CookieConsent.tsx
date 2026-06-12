"use client";

import { useEffect, useState } from "react";

export function CookieConsent() {
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem("cookie_consent");
      if (!consent) {
        setShowConsent(true);
      }
    } catch (e) {
      // In case localStorage is blocked
      console.error("localStorage is not available", e);
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem("cookie_consent", "accepted");
    } catch (e) {
      console.error("localStorage error", e);
    }
    setShowConsent(false);
  };

  const handleDecline = () => {
    try {
      localStorage.setItem("cookie_consent", "declined");
    } catch (e) {
      console.error("localStorage error", e);
    }
    setShowConsent(false);
  };

  if (!showConsent) return null;

  return (
    <div className="fixed max-md:bottom-[calc(var(--mobile-nav-height,64px)+env(safe-area-inset-bottom)+16px)] left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:w-[420px] z-50 bg-[#161616] border border-[#2a2a2a] rounded-2xl shadow-2xl p-4 md:p-6 text-white font-sans animate-in slide-in-from-bottom-8 fade-in duration-500">
      <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3">We value your privacy</h3>
      <p className="text-xs md:text-sm text-gray-400 mb-4 md:mb-6 leading-relaxed">
        We use cookies to enhance your browsing experience, serve personalized
        content, and analyze our traffic. By clicking &quot;Accept All&quot;, you consent to
        our use of cookies.
      </p>
      <div className="flex gap-2 md:gap-3 justify-end">
        <button
          onClick={handleDecline}
          className="px-4 py-2 md:px-6 md:py-2.5 rounded-full border border-[#3a3a3a] bg-transparent hover:bg-[#2a2a2a] transition-colors text-xs md:text-sm font-medium text-white"
        >
          Decline
        </button>
        <button
          onClick={handleAccept}
          className="px-4 py-2 md:px-6 md:py-2.5 rounded-full bg-[#f4b584] hover:bg-[#e0a273] transition-colors text-xs md:text-sm font-semibold text-black"
        >
          Accept All
        </button>
      </div>
    </div>
  );
}
