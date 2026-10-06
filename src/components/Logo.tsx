"use client";

import Link from "next/link";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  showSubtitle?: boolean;
  href?: string;
  className?: string;
}

export default function Logo({
  size = "md",
  showText = true,
  showSubtitle = true,
  href = "/deals",
  className = "",
}: LogoProps) {
  const sizeMap = {
    sm: { img: "w-8 h-8", title: "text-base", sub: "text-[8px]" },
    md: { img: "w-10 h-10 sm:w-11 sm:h-11", title: "text-lg sm:text-xl", sub: "text-[9px] sm:text-[10px]" },
    lg: { img: "w-14 h-14 sm:w-16 sm:h-16", title: "text-2xl sm:text-3xl", sub: "text-xs" },
    xl: { img: "w-24 h-24 sm:w-28 sm:h-28", title: "text-3xl sm:text-4xl", sub: "text-xs sm:text-sm" },
  };

  const currentSize = sizeMap[size];

  const content = (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* 3D Shield Padlock Emblem */}
      <div className="relative flex-shrink-0 group">
        <div className="absolute inset-0 bg-gold-500/20 rounded-full blur-md group-hover:bg-gold-500/35 transition-all duration-300" />
        <img
          src="/logo.png"
          alt="ShopVault"
          className={`${currentSize.img} object-contain relative z-10 drop-shadow-[0_4px_16px_rgba(245,166,35,0.45)] transition-transform duration-300 group-hover:scale-105`}
        />
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className={`font-display font-black tracking-tight leading-none ${currentSize.title}`}>
            <span className="text-silver-gradient">SHOP</span>
            <span className="text-gold-gradient ml-0.5">VAULT</span>
          </div>
          {showSubtitle && (
            <span className={`text-gold-500 font-bold uppercase tracking-[0.22em] mt-1 ${currentSize.sub}`}>
              Verified Review Deals
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return <Link href={href} className="inline-block transition-opacity hover:opacity-95">{content}</Link>;
  }

  return content;
}
