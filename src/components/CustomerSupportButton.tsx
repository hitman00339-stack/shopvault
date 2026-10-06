"use client";

import { useEffect, useState } from "react";

export default function CustomerSupportButton() {
  const [telegramUrl, setTelegramUrl] = useState("https://t.me/ShopVaultOfficial");
  const [telegramId, setTelegramId] = useState("ShopVaultOfficial");
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (data.success && data.data) {
        setTelegramUrl(data.data.telegramSupportUrl || "https://t.me/ShopVaultOfficial");
        setTelegramId(data.data.telegramSupportId || "ShopVaultOfficial");
      }
    } catch {
      // Keep defaults
    }
  };

  return (
    <aside aria-label="Customer Support" className="fixed bottom-24 sm:bottom-8 right-4 sm:right-8 z-40 flex items-center group">
      {/* Tooltip on desktop */}
      <div
        className={`hidden md:flex items-center gap-2 mr-3 px-3.5 py-2 rounded-2xl glass-dark border border-gold-500/30 shadow-[0_0_20px_rgba(245,166,35,0.15)] text-xs font-bold text-silver-100 transition-all duration-300 pointer-events-none ${
          isHovered ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2"
        }`}
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
        <span>Need Help? Chat on Telegram</span>
        <span className="text-gold-400 font-mono">@{telegramId}</span>
      </div>

      {/* Floating Action Button */}
      <a
        href={telegramUrl}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-[#0088cc] via-[#24A1DE] to-[#29b6f6] text-white shadow-[0_4px_25px_rgba(0,136,204,0.5),0_0_15px_rgba(245,166,35,0.3)] hover:shadow-[0_6px_35px_rgba(0,136,204,0.7),0_0_25px_rgba(245,166,35,0.5)] border-2 border-gold-400/40 hover:border-gold-400 transition-all duration-300 hover:scale-110 active:scale-95 group"
        aria-label="Telegram Customer Support"
      >
        {/* Ambient Ring Glow */}
        <span className="absolute inset-0 rounded-full bg-cyan-400/20 blur-md group-hover:bg-cyan-400/40 transition-colors" />

        {/* Telegram Paper Plane SVG */}
        <svg
          className="w-7 h-7 sm:w-8 sm:h-8 fill-current drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] translate-x-[-1px] translate-y-[-1px]"
          viewBox="0 0 24 24"
        >
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .37z" />
        </svg>

        {/* Live Status Indicator */}
        <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-obsidian-deep flex items-center justify-center shadow-[0_0_8px_#10b981]">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
        </span>
      </a>
    </aside>
  );
}
