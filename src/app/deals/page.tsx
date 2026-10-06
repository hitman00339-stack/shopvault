"use client";

import { useState, useEffect, useMemo } from "react";
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
  sellerName?: string | null;
}

const PLATFORMS = [
  { id: "ALL", label: "All Stores", icon: "💎", color: "from-amber-400 to-amber-600" },
  { id: "AMAZON", label: "Amazon", icon: "🛒", color: "from-amber-500 to-orange-600" },
  { id: "FLIPKART", label: "Flipkart", icon: "🛍️", color: "from-blue-500 to-indigo-600" },
  { id: "MYNTRA", label: "Myntra", icon: "👗", color: "from-pink-500 to-rose-600" },
  { id: "MEESHO", label: "Meesho", icon: "📦", color: "from-purple-500 to-violet-600" },
  { id: "NYKAA", label: "Nykaa", icon: "💄", color: "from-rose-500 to-pink-600" },
  { id: "AJIO", label: "Ajio", icon: "👔", color: "from-teal-500 to-emerald-600" },
];

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePlatform, setActivePlatform] = useState("ALL");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"featured" | "bonus" | "price-asc" | "slots">("featured");
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
      const params = new URLSearchParams({ limit: "60" });
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

  // Filtered and Sorted Deals
  const processedDeals = useMemo(() => {
    let list = [...deals];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.brandName.toLowerCase().includes(q) ||
          d.platform.toLowerCase().includes(q)
      );
    }

    if (sortBy === "bonus") {
      list.sort((a, b) => b.cashbackAmount - a.cashbackAmount);
    } else if (sortBy === "price-asc") {
      list.sort((a, b) => a.productPrice - b.productPrice);
    } else if (sortBy === "slots") {
      list.sort((a, b) => (a.totalSlots - a.usedSlots) - (b.totalSlots - b.usedSlots));
    }

    return list;
  }, [deals, search, sortBy]);

  // Compute platform counts
  const platformCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: deals.length };
    deals.forEach((d) => {
      counts[d.platform] = (counts[d.platform] || 0) + 1;
    });
    return counts;
  }, [deals]);

  return (
    <div className="min-h-screen bg-[#08090e] text-silver-100 pb-28 md:pb-20 relative selection:bg-amber-500/30 selection:text-amber-200">
      {/* ─── TOP NAVIGATION ─── */}
      <Navbar user={user} />

      {/* ─── HERO SECTION (Opulent, Cinematic & PHD Modern) ─── */}
      <section className="relative pt-12 sm:pt-20 pb-12 sm:pb-16 px-4 sm:px-8 overflow-hidden">
        {/* Ambient Atmospheric Lights */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] sm:w-[900px] h-[380px] bg-amber-500/[0.12] rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/4 left-10 w-80 h-80 bg-indigo-600/[0.08] rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-80 h-80 bg-emerald-500/[0.06] rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10 text-center space-y-6 sm:space-y-7">
          {/* VIP Announcement Pill */}
          <div className="inline-flex items-center gap-2.5 px-4 sm:px-5 py-2 rounded-full bg-amber-400/[0.08] border border-amber-400/25 text-amber-300 text-xs sm:text-sm font-bold shadow-[0_0_25px_rgba(245,166,35,0.15)] animate-gold-pulse">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span className="tracking-wide">INVITE-ONLY VERIFIED REVIEW CAMPAIGNS • 100% UPI REFUND</span>
          </div>

          {/* Majestic Hero Headline */}
          <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.08] max-w-4xl mx-auto">
            <span className="text-silver-gradient block">Shop Top Brands.</span>
            <span className="text-gold-gradient block mt-1 sm:mt-2">
              Pay ₹0. Earn Real Cash.
            </span>
          </h1>

          {/* Subtitle with High-Aesthetic Layout */}
          <p className="text-silver-300/90 text-sm sm:text-base lg:text-lg max-w-2xl mx-auto font-medium leading-relaxed">
            Order genuine products from Amazon, Flipkart, Myntra & Nykaa. Post a verified 5-star review after delivery, and get <span className="text-amber-300 font-bold">100% order cost refunded</span> directly to your UPI ID + guaranteed cash rewards.
          </p>

          {/* Interactive Live Trust Ribbon */}
          <div className="pt-2 sm:pt-4 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto">
            <div className="glass-dark p-3.5 sm:p-4 rounded-2xl border border-white/[0.08] text-center hover:border-amber-400/30 transition-all">
              <p className="text-lg sm:text-xl font-black text-amber-300 font-display">₹14.8L+</p>
              <p className="text-[11px] sm:text-xs text-silver-400 font-semibold mt-0.5">UPI Refunds Disbursed</p>
            </div>
            <div className="glass-dark p-3.5 sm:p-4 rounded-2xl border border-white/[0.08] text-center hover:border-emerald-400/30 transition-all">
              <p className="text-lg sm:text-xl font-black text-emerald-400 font-display">100% FREE</p>
              <p className="text-[11px] sm:text-xs text-silver-400 font-semibold mt-0.5">Net Cost to Reviewer</p>
            </div>
            <div className="glass-dark p-3.5 sm:p-4 rounded-2xl border border-white/[0.08] text-center hover:border-cyan-400/30 transition-all">
              <p className="text-lg sm:text-xl font-black text-cyan-300 font-display">24–48 Hrs</p>
              <p className="text-[11px] sm:text-xs text-silver-400 font-semibold mt-0.5">Fast UPI Payouts</p>
            </div>
            <div className="glass-dark p-3.5 sm:p-4 rounded-2xl border border-white/[0.08] text-center hover:border-amber-400/30 transition-all">
              <p className="text-lg sm:text-xl font-black text-amber-300 font-display">4.9 / 5.0 ★</p>
              <p className="text-[11px] sm:text-xs text-silver-400 font-semibold mt-0.5">12,500+ Happy Reviewers</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SEARCH, FILTERS & DOCK (Ultra-Modern Glass Dock) ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 mb-10 sticky top-[68px] z-30">
        <div className="glass-vault p-3 sm:p-4 rounded-3xl border border-white/[0.1] shadow-[0_20px_50px_rgba(0,0,0,0.7)] backdrop-blur-3xl space-y-3">
          {/* Top Bar: Search + Sort + Live Counter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-lg">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-400 text-sm">🔍</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search campaigns, smartwatches, earbuds, brands..."
                className="input-premium w-full pl-11 pr-10 py-3 rounded-2xl text-xs sm:text-sm font-medium border-white/[0.08]"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-silver-400 hover:text-white text-xs p-1"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Sort & Live Counter */}
            <div className="flex items-center justify-between sm:justify-end gap-3 text-xs">
              <div className="flex items-center gap-1.5 bg-[#121422] px-3 py-2 rounded-xl border border-white/[0.08]">
                <span className="text-silver-400 text-[11px] font-semibold hidden md:inline">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="bg-transparent text-silver-200 font-bold focus:outline-none cursor-pointer text-xs"
                >
                  <option value="featured" className="bg-[#10121d]">🔥 Featured Deals</option>
                  <option value="bonus" className="bg-[#10121d]">💰 Highest Bonus Cash</option>
                  <option value="slots" className="bg-[#10121d]">⚡ Almost Sold Out</option>
                  <option value="price-asc" className="bg-[#10121d]">🏷️ Lowest Product Price</option>
                </select>
              </div>

              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-400/[0.08] border border-amber-400/20 text-amber-300 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{processedDeals.length} Live Deals</span>
              </div>
            </div>
          </div>

          {/* Store Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1 pb-1">
            {PLATFORMS.map((p) => {
              const isActive = activePlatform === p.id;
              const count = platformCounts[p.id] ?? 0;
              return (
                <button
                  key={p.id}
                  onClick={() => setActivePlatform(p.id)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all duration-200 flex items-center gap-2 ${
                    isActive
                      ? "bg-amber-400/15 border border-amber-400/50 text-amber-300 shadow-[0_0_20px_rgba(245,166,35,0.2)]"
                      : "bg-[#121420]/80 border border-white/[0.06] text-silver-300 hover:text-white hover:border-white/[0.15] hover:bg-white/[0.04]"
                  }`}
                >
                  <span className="text-sm">{p.icon}</span>
                  <span>{p.label}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      isActive
                        ? "bg-amber-400/25 text-amber-200"
                        : "bg-white/[0.06] text-silver-400"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── DEALS GRID (PHD Ultra-Aesthetic Showcase) ─── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-7">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="card-luxury rounded-3xl p-5 space-y-4">
                <div className="h-56 rounded-2xl shimmer" />
                <div className="h-4 rounded-lg shimmer w-3/4" />
                <div className="h-3 rounded-lg shimmer w-1/2" />
                <div className="h-10 rounded-xl shimmer mt-4" />
              </div>
            ))}
          </div>
        ) : processedDeals.length === 0 ? (
          <div className="card-luxury rounded-3xl p-12 sm:p-20 text-center max-w-lg mx-auto border border-white/[0.1]">
            <div className="text-6xl mb-4 opacity-75">🏷️</div>
            <h3 className="font-display text-2xl font-black text-silver-100 mb-2">
              No Campaigns Matching Search
            </h3>
            <p className="text-silver-400 text-sm font-medium leading-relaxed mb-6">
              Verified review deals sell out quickly. Try clearing your search keyword or switching stores.
            </p>
            <button
              onClick={() => {
                setActivePlatform("ALL");
                setSearch("");
              }}
              className="btn-gold px-6 py-3 rounded-xl text-xs font-bold inline-block"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-7">
            {processedDeals.map((deal, idx) => {
              const platform = getPlatformConfig(deal.platform);
              const slotsLeft = deal.totalSlots - deal.usedSlots;
              const isFull = slotsLeft <= 0;
              const isHot = slotsLeft <= 5 && !isFull;

              return (
                <Link
                  key={deal.id}
                  href={`/deal/${deal.id}`}
                  className={`card-luxury rounded-3xl p-5 sm:p-6 flex flex-col justify-between group transition-all duration-300 relative ${
                    isFull ? "opacity-60 pointer-events-none" : ""
                  }`}
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  <div>
                    {/* ─── Product Image Showcase Canvas ─── */}
                    <div className="h-56 sm:h-64 rounded-2xl mb-4 overflow-hidden relative bg-gradient-to-b from-white/[0.03] to-[#0a0c16] border border-white/[0.08] flex items-center justify-center p-4 group-hover:border-amber-400/40 transition-all shadow-inner">
                      {/* Ambient Radial Spotlight */}
                      <div className="absolute inset-0 bg-gradient-radial from-amber-400/[0.07] via-transparent to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />

                      {/* Product Image */}
                      {deal.imageUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={deal.imageUrl}
                          alt={deal.title}
                          className="w-full h-full object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.6)] group-hover:scale-108 transition-transform duration-500 ease-out relative z-10"
                        />
                      ) : (
                        <span className="text-6xl opacity-30 relative z-10">{platform.icon}</span>
                      )}

                      {/* Top Overlay: Platform Badge */}
                      <div className="absolute top-3 left-3 z-20">
                        <span
                          className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-md flex items-center gap-1.5 ${
                            deal.platform === "AMAZON"
                              ? "platform-amazon"
                              : deal.platform === "FLIPKART"
                              ? "platform-flipkart"
                              : deal.platform === "MYNTRA"
                              ? "platform-myntra"
                              : "badge-silver"
                          }`}
                        >
                          <span>{platform.icon}</span>
                          <span>{platform.label}</span>
                        </span>
                      </div>

                      {/* Top Overlay: Scarcity Pill */}
                      <div className="absolute top-3 right-3 z-20">
                        <span
                          className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase backdrop-blur-md flex items-center gap-1.5 shadow-md ${
                            isFull
                              ? "badge-danger"
                              : isHot
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse"
                              : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isHot ? "bg-amber-400" : "bg-emerald-400"}`} />
                          <span>{isFull ? "FULL" : isHot ? `🔥 ${slotsLeft} LEFT` : `${slotsLeft} slots`}</span>
                        </span>
                      </div>

                      {/* Bottom Overlay: Cash Bonus Tag */}
                      {deal.cashbackAmount > 0 && (
                        <div className="absolute bottom-3 inset-x-3 z-20 flex justify-center">
                          <div className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-obsidian-deep px-3.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1.5">
                            <span>✨</span>
                            <span>+ {formatINR(deal.cashbackAmount)} CASH BONUS</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ─── Brand & Title ─── */}
                    <div className="space-y-1.5 mb-4">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] text-amber-400 font-extrabold uppercase tracking-[0.18em]">
                          {deal.brandName}
                        </p>
                        <span className="text-[10px] text-silver-500 font-medium">Verified Seller ✓</span>
                      </div>
                      <h3 className="font-bold text-silver-100 text-sm sm:text-base leading-snug line-clamp-2 group-hover:text-amber-300 transition-colors">
                        {deal.title}
                      </h3>
                    </div>
                  </div>

                  {/* ─── Pricing & Claim Action (The Game Changer) ─── */}
                  <div className="pt-4 border-t border-white/[0.08] space-y-3">
                    <div className="flex items-end justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-silver-500 line-through text-[11px]">
                            M.R.P. {formatINR(deal.productPrice)}
                          </span>
                        </div>
                        <div className="flex items-baseline gap-2 mt-0.5">
                          <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-display tracking-tight">
                            ₹0
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-black uppercase tracking-wider">
                            100% FREE
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-[10px] text-silver-400 font-bold uppercase tracking-wider">
                          UPI Payout
                        </p>
                        <p className="text-xs font-bold text-amber-300">
                          {formatINR(deal.productPrice + deal.cashbackAmount)}
                        </p>
                      </div>
                    </div>

                    {/* Full-Width Claim Button */}
                    <span className="btn-gold w-full py-3 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 group-hover:gap-3 transition-all shadow-gold-sm">
                      <span>Claim Free Deal</span>
                      <span>→</span>
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      {/* ─── FLOATING TELEGRAM CUSTOMER SUPPORT CONCIERGE ─── */}
      <CustomerSupportButton />
    </div>
  );
}
