"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { formatINR, getPlatformConfig } from "@/lib/utils";

interface Deal {
  id: string;
  title: string;
  description: string | null;
  brandName: string;
  platform: string;
  productUrl: string;
  imageUrl: string | null;
  productPrice: number;
  cashbackAmount: number;
  searchKeyword: string | null;
  totalSlots: number;
  usedSlots: number;
  status: string;
  instructions: string | null;
  createdAt: string;
}

const PLATFORMS = ["ALL", "AMAZON", "FLIPKART", "MYNTRA", "MEESHO", "NYKAA", "AJIO", "OTHER"];

export default function DealsPage() {
  const router = useRouter();
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

      if (data.success) {
        setDeals(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch deals:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth?action=logout", { method: "POST" });
    toast.success("Logged out");
    router.push("/login");
  };

  const getSlotsBadge = (used: number, total: number) => {
    const remaining = total - used;
    if (remaining <= 0) return { text: "FULL", cls: "bg-red-500/10 text-red-600 border-red-200" };
    if (remaining <= 5) return { text: `🔥 ${remaining} SLOTS LEFT`, cls: "bg-orange-500/10 text-orange-600 border-orange-200 animate-pulse" };
    return { text: `${remaining}/${total} Slots Available`, cls: "bg-emerald-500/10 text-emerald-600 border-emerald-200" };
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      {/* ─── NAVBAR ─── */}
      <header className="sticky top-0 z-50 glass-panel border-b border-gray-200/80 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-md shadow-brand-500/20 ring-2 ring-white">
              SV
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-gray-900 block leading-none">ShopVault</span>
              <span className="text-[10px] font-bold text-brand-600 uppercase tracking-widest">Deals Portal</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user?.role === "ADMIN" && (
              <Link
                href="/admin"
                className="px-4 py-2 bg-gradient-to-r from-gray-900 to-gray-800 text-white text-xs font-bold rounded-xl hover:shadow-lg transition-all flex items-center gap-1.5"
              >
                <span>🔑</span> Admin Command Center
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-200 transition-all"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* ─── HERO BANNER ─── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-brand-950 to-indigo-950 text-white py-12 px-4 sm:px-8 mb-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.2),transparent_50%)] pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <span className="inline-block px-3 py-1 bg-brand-500/20 border border-brand-400/30 rounded-full text-brand-300 text-xs font-bold uppercase tracking-wider mb-3">
              ⚡ Guaranteed Reimbursement
            </span>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Buy Products. Post Reviews. <br />
              <span className="bg-gradient-to-r from-brand-400 via-indigo-300 to-purple-300 bg-clip-text text-transparent">
                Get 100% Refund + Bonus.
              </span>
            </h1>
            <p className="text-gray-300 mt-3 text-sm sm:text-base max-w-xl font-medium">
              Verified campaigns from Amazon, Flipkart, Nykaa & Myntra sellers. Claim slots before they run out!
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center">
            <div>
              <p className="text-2xl font-black text-brand-400">100%</p>
              <p className="text-[11px] font-bold text-gray-300 uppercase">Product Refund</p>
            </div>
            <div className="w-px bg-white/10" />
            <div>
              <p className="text-2xl font-black text-emerald-400">₹0 Fee</p>
              <p className="text-[11px] font-bold text-gray-300 uppercase">To Join</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── MAIN CONTENT ─── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 pb-16">
        {/* SEARCH & FILTERS ROW */}
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 mb-8">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-base">🔍</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by product, keyword or brand..."
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-gray-200 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 shadow-sm transition-all"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {PLATFORMS.map((p) => {
              const config = p === "ALL" ? { label: "All Platforms", icon: "🔥", bgColor: "", color: "" } : getPlatformConfig(p);
              const isActive = activePlatform === p;
              return (
                <button
                  key={p}
                  onClick={() => setActivePlatform(p)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all duration-200 border ${
                    isActive
                      ? "bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-500/20 scale-105"
                      : "bg-white text-gray-600 border-gray-200/80 hover:bg-gray-50 hover:border-gray-300"
                  }`}
                >
                  <span className="mr-1.5">{config.icon}</span>
                  {p === "ALL" ? "All Platforms" : config.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* DEALS GRID */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-3xl border border-gray-100 p-5 space-y-4 shimmer-skeleton">
                <div className="h-44 bg-gray-200 rounded-2xl" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-10 bg-gray-200 rounded-xl w-full" />
              </div>
            ))}
          </div>
        ) : deals.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm max-w-md mx-auto">
            <div className="text-6xl mb-4">🛍️</div>
            <h3 className="text-xl font-black text-gray-900">No active deals found</h3>
            <p className="text-sm text-gray-400 mt-1 font-medium">
              Check back soon or try selecting a different platform above.
            </p>
            {user?.role === "ADMIN" && (
              <Link
                href="/admin"
                className="mt-6 inline-block px-6 py-3 bg-brand-600 text-white text-xs font-bold rounded-xl shadow-md hover:bg-brand-700"
              >
                Create Deal in Admin Panel →
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {deals.map((deal) => {
              const platform = getPlatformConfig(deal.platform);
              const badge = getSlotsBadge(deal.usedSlots, deal.totalSlots);
              const isFull = deal.usedSlots >= deal.totalSlots;

              return (
                <Link
                  key={deal.id}
                  href={`/deal/${deal.id}`}
                  className={`group bg-white rounded-3xl border border-gray-100/90 overflow-hidden shadow-sm card-hover flex flex-col justify-between relative ${
                    isFull ? "opacity-75" : ""
                  }`}
                >
                  {/* Card Top */}
                  <div className="p-5">
                    {/* Badges Bar */}
                    <div className="flex justify-between items-center gap-2 mb-3">
                      <span className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold border uppercase tracking-wider ${platform.bgColor} ${platform.color}`}>
                        {platform.icon} {platform.label}
                      </span>
                      <span className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold border ${badge.cls}`}>
                        {badge.text}
                      </span>
                    </div>

                    {/* Image Preview */}
                    <div className="h-44 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl mb-4 overflow-hidden relative flex items-center justify-center">
                      {deal.imageUrl ? (
                        <img
                          src={deal.imageUrl}
                          alt={deal.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <span className="text-5xl opacity-40">{platform.icon}</span>
                      )}

                      {deal.cashbackAmount > 0 && (
                        <div className="absolute bottom-2.5 left-2.5 px-3 py-1 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-md">
                          + {formatINR(deal.cashbackAmount)} CASH BONUS
                        </div>
                      )}
                    </div>

                    {/* Title & Brand */}
                    <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-brand-600 transition-colors">
                      {deal.title}
                    </h3>
                    <p className="text-xs font-semibold text-gray-400 mt-1">Brand: {deal.brandName}</p>
                  </div>

                  {/* Card Footer */}
                  <div className="p-5 pt-0">
                    <div className="pt-3 border-t border-gray-100 flex justify-between items-end">
                      <div>
                        <p className="text-xs text-gray-400 font-semibold">Buying Price</p>
                        <p className="text-xl font-black text-gray-900 leading-none mt-0.5">
                          {formatINR(deal.productPrice)}
                        </p>
                        <p className="text-[10px] text-emerald-600 font-black mt-1 uppercase tracking-wider">
                          100% Guaranteed Refund
                        </p>
                      </div>

                      <span className="px-4 py-2 bg-brand-50 text-brand-600 group-hover:bg-brand-600 group-hover:text-white rounded-xl text-xs font-bold transition-all duration-300">
                        Claim Deal →
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
