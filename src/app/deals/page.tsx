"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import CustomerSupportButton from "@/components/CustomerSupportButton";
import { formatINR, getPlatformConfig } from "@/lib/utils";

interface Deal {
  id: string;
  title: string;
  brandName: string;
  platform: string;
  imageUrl: string | null;
  productPrice: number;
  cashbackAmount: number;
  totalSlots: number;
  usedSlots: number;
  status: string;
}

const PLATFORMS = ["ALL", "AMAZON", "FLIPKART", "MYNTRA", "MEESHO", "NYKAA", "AJIO"];

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePlatform, setActivePlatform] = useState("ALL");
  const [search, setSearch] = useState("");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch("/api/auth?action=me")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setUser(data.data);
      })
      .catch(() => {});
    fetchDeals();
  }, [activePlatform]);

  const fetchDeals = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (activePlatform !== "ALL") params.set("platform", activePlatform);
      if (search.trim()) params.set("search", search.trim());
      const res = await fetch(`/api/deals?${params}`);
      const data = await res.json();
      if (data.success) setDeals(data.data || []);
    } catch {
      // Handle gracefully
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-obsidian-deep pb-24 md:pb-16">
      {/* ─── TOP NAVIGATION ─── */}
      <Navbar user={user} />

      {/* ─── HERO SECTION (Opulent, Airy & Spacious) ─── */}
      <section className="relative py-14 sm:py-20 lg:py-24 px-4 sm:px-8 overflow-hidden">
        {/* Ambient gold glow orbs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] sm:w-[900px] h-[350px] bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-10 w-72 h-72 bg-gold-600/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-72 h-72 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10 text-center space-y-6">
          {/* VIP Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full badge-gold text-xs font-black uppercase tracking-[0.2em] shadow-gold-sm animate-gold-pulse">
            <span>🛡️</span>
            <span>Verified 100% Refund Campaigns</span>
          </div>

          {/* Main Title with Breathing Room */}
          <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.08] max-w-4xl mx-auto">
            <span className="text-silver-gradient block">Shop Top Brands.</span>
            <span className="text-gold-gradient block mt-1">Get 100% Refund + Bonus.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-silver-400 text-sm sm:text-base lg:text-lg max-w-2xl mx-auto font-medium leading-relaxed">
            India's premier review marketplace. Claim exclusive prepaid campaigns from verified sellers across Amazon, Flipkart, Myntra, and Nykaa.
          </p>

          {/* Value Proposition Pills */}
          <div className="pt-4 flex flex-wrap justify-center gap-3 sm:gap-6">
            <div className="glass-dark px-4 py-2 rounded-2xl border border-silver-800/80 flex items-center gap-2 text-xs font-bold text-silver-200">
              <span className="text-emerald-400 text-sm">✓</span> 100% Guaranteed Refund
            </div>
            <div className="glass-dark px-4 py-2 rounded-2xl border border-silver-800/80 flex items-center gap-2 text-xs font-bold text-silver-200">
              <span className="text-gold-400 text-sm">⚡</span> Direct UPI Payouts
            </div>
            <div className="glass-dark px-4 py-2 rounded-2xl border border-silver-800/80 flex items-center gap-2 text-xs font-bold text-silver-200">
              <span className="text-gold-400 text-sm">🔒</span> Bank-Grade Security
            </div>
          </div>
        </div>
      </section>

      {/* ─── SEARCH & PLATFORM FILTERS (De-congested Layout) ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 mb-10">
        <div className="glass-vault p-4 sm:p-6 rounded-3xl border border-gold-500/20 space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-400 text-sm">🔍</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchDeals()}
                placeholder="Search campaigns, brands, or products..."
                className="input-premium w-full pl-11 pr-4 py-3.5 rounded-2xl text-xs sm:text-sm font-medium"
              />
            </div>

            {/* Quick Refresh / Status Counter */}
            <div className="flex items-center justify-between md:justify-end gap-3 text-xs text-silver-400 font-semibold px-1">
              <span>Showing: <strong className="text-gold-400">{deals.length}</strong> active deals</span>
              <button
                onClick={fetchDeals}
                className="btn-silver px-3.5 py-2 rounded-xl text-xs font-bold hover:text-gold-400 transition-colors"
                title="Refresh campaigns"
              >
                ↻ Refresh
              </button>
            </div>
          </div>

          {/* Platform Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1 pb-1">
            {PLATFORMS.map((p) => {
              const config = p === "ALL" ? { label: "All Stores", icon: "💎" } : getPlatformConfig(p);
              const isActive = activePlatform === p;
              return (
                <button
                  key={p}
                  onClick={() => setActivePlatform(p)}
                  className={`px-4 sm:px-5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                    isActive
                      ? "btn-gold shadow-gold-sm"
                      : "btn-silver"
                  }`}
                >
                  <span>{config.icon}</span>
                  <span>{p === "ALL" ? "All Stores" : config.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── DEALS GRID (Roomy, Luxurious & Responsive) ─── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-7">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="card-luxury rounded-3xl p-6 space-y-4">
                <div className="h-48 rounded-2xl shimmer" />
                <div className="h-4 rounded-lg shimmer w-3/4" />
                <div className="h-3 rounded-lg shimmer w-1/2" />
                <div className="h-10 rounded-xl shimmer mt-4" />
              </div>
            ))}
          </div>
        ) : deals.length === 0 ? (
          <div className="card-luxury rounded-3xl p-12 sm:p-20 text-center max-w-lg mx-auto border border-silver-800">
            <div className="text-6xl mb-4 opacity-75">🏷️</div>
            <h3 className="font-display text-2xl font-black text-silver-100 mb-2">
              No Campaigns in This Category
            </h3>
            <p className="text-silver-400 text-sm font-medium leading-relaxed mb-6">
              Verified campaigns sell out rapidly. Try selecting another store or clear your search filter.
            </p>
            <button
              onClick={() => {
                setActivePlatform("ALL");
                setSearch("");
              }}
              className="btn-gold px-6 py-3 rounded-xl text-xs font-bold inline-block"
            >
              Show All Campaigns
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-7">
            {deals.map((deal, idx) => {
              const platform = getPlatformConfig(deal.platform);
              const slotsLeft = deal.totalSlots - deal.usedSlots;
              const isFull = slotsLeft <= 0;
              const isHot = slotsLeft <= 5 && !isFull;

              return (
                <Link
                  key={deal.id}
                  href={`/deal/${deal.id}`}
                  className={`card-luxury rounded-3xl p-6 flex flex-col justify-between group transition-all duration-300 ${
                    isFull ? "opacity-60" : ""
                  }`}
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  <div>
                    {/* Header Badges */}
                    <div className="flex justify-between items-center gap-2 mb-4">
                      <span
                        className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                          deal.platform === "AMAZON"
                            ? "platform-amazon"
                            : deal.platform === "FLIPKART"
                            ? "platform-flipkart"
                            : deal.platform === "MYNTRA"
                            ? "platform-myntra"
                            : "badge-silver"
                        }`}
                      >
                        {platform.icon} {platform.label}
                      </span>

                      <span
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase ${
                          isFull
                            ? "badge-danger"
                            : isHot
                            ? "badge-gold animate-pulse"
                            : "badge-success"
                        }`}
                      >
                        {isFull ? "FULL" : isHot ? `🔥 ${slotsLeft} LEFT` : `${slotsLeft} slots`}
                      </span>
                    </div>

                    {/* Image Showcase Container */}
                    <div className="h-48 sm:h-52 rounded-2xl mb-5 overflow-hidden relative bg-gradient-to-br from-obsidian-800 to-obsidian-950 border border-silver-800/80 flex items-center justify-center p-3 group-hover:border-gold-500/30 transition-colors">
                      {deal.imageUrl ? (
                        <img
                          src={deal.imageUrl}
                          alt={deal.title}
                          className="w-full h-full object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <span className="text-6xl opacity-30">{platform.icon}</span>
                      )}

                      {/* Cash Bonus Badge */}
                      {deal.cashbackAmount > 0 && (
                        <div className="absolute bottom-3 left-3 badge-gold px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-gold-sm">
                          + {formatINR(deal.cashbackAmount)} CASH BONUS
                        </div>
                      )}
                    </div>

                    {/* Brand & Title */}
                    <div className="space-y-1.5 mb-4">
                      <p className="text-[11px] text-gold-500 font-bold uppercase tracking-wider">
                        {deal.brandName}
                      </p>
                      <h3 className="font-bold text-silver-100 text-sm leading-snug line-clamp-2 group-hover:text-gold-400 transition-colors">
                        {deal.title}
                      </h3>
                    </div>
                  </div>

                  {/* Pricing & Claim Button (Spacious Footer) */}
                  <div className="pt-4 border-t border-silver-800/80 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-[10px] text-silver-500 font-bold uppercase tracking-wider">
                        Order Price
                      </p>
                      <p className="font-display text-xl sm:text-2xl font-black text-silver-100">
                        {formatINR(deal.productPrice)}
                      </p>
                      <p className="text-[10px] font-bold text-emerald-400 tracking-tight">
                        100% Refund Guaranteed
                      </p>
                    </div>

                    <span className="btn-gold px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider group-hover:shadow-gold-md transition-all whitespace-nowrap">
                      Claim Deal →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      {/* ─── FLOATING TELEGRAM CUSTOMER SUPPORT ─── */}
      <CustomerSupportButton />
    </div>
  );
}
