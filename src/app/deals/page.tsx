"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { formatINR, getPlatformConfig } from "@/lib/utils";

interface Deal {
  id: string; title: string; brandName: string; platform: string;
  imageUrl: string | null; productPrice: number; cashbackAmount: number;
  totalSlots: number; usedSlots: number; status: string;
}

const PLATFORMS = ["ALL", "AMAZON", "FLIPKART", "MYNTRA", "MEESHO", "NYKAA", "AJIO"];

export default function DealsPage() {
  const router = useRouter();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePlatform, setActivePlatform] = useState("ALL");
  const [search, setSearch] = useState("");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch("/api/auth?action=me").then((r) => r.json()).then((data) => { if (data.success) setUser(data.data); });
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
    } finally { setLoading(false); }
  };

  const handleLogout = async () => {
    await fetch("/api/auth?action=logout", { method: "POST" });
    toast.success("Signed out");
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-obsidian-deep">
      {/* NAVBAR */}
      <header className="sticky top-0 z-50 glass-dark border-b border-gold-500/20 px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/deals" className="flex items-center gap-3">
            <img src="/logo.png" alt="ShopVault" className="w-10 h-10 object-contain drop-shadow-[0_0_15px_rgba(245,166,35,0.5)]" />
            <div>
              <div className="font-display text-lg font-black leading-none">
                <span className="text-silver-gradient">SHOP</span>
                <span className="text-gold-gradient">VAULT</span>
              </div>
              <span className="text-[9px] text-gold-500 font-bold uppercase tracking-widest">Members Portal</span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            {user?.role === "ADMIN" && (
              <Link href="/admin" className="btn-gold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5">
                👑 <span className="hidden sm:inline">Admin Panel</span>
              </Link>
            )}
            <button onClick={handleLogout} className="btn-silver px-4 py-2 rounded-xl text-xs font-bold">
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative py-16 px-4 sm:px-8 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <span className="inline-block px-4 py-1.5 badge-gold rounded-full text-xs font-black uppercase tracking-widest mb-6 animate-gold-pulse">
            ⚡ Verified Premium Campaigns
          </span>
          <h1 className="font-display text-4xl sm:text-6xl font-black tracking-tight leading-none mb-4">
            <span className="text-silver-gradient block">Shop. Review.</span>
            <span className="text-gold-gradient block">Get 100% Refund.</span>
          </h1>
          <p className="text-silver-400 text-sm sm:text-base max-w-2xl mx-auto font-medium">
            India's premium deals marketplace. Verified campaigns from top sellers on Amazon, Flipkart, Myntra & Nykaa.
          </p>
        </div>
      </section>

      {/* FILTERS */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pb-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-500">🔍</span>
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchDeals()}
              placeholder="Search premium deals..."
              className="input-premium w-full pl-11 pr-4 py-3.5 rounded-xl text-sm font-medium"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {PLATFORMS.map((p) => {
              const config = p === "ALL" ? { label: "All", icon: "🔥" } : getPlatformConfig(p);
              const isActive = activePlatform === p;
              return (
                <button key={p} onClick={() => setActivePlatform(p)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    isActive ? "btn-gold" : "btn-silver"
                  }`}>
                  <span className="mr-1">{config.icon}</span>
                  {p === "ALL" ? "All" : config.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* DEALS GRID */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 pb-16">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="card-luxury rounded-2xl p-5 space-y-3">
                <div className="h-44 rounded-xl shimmer" />
                <div className="h-4 rounded shimmer w-3/4" />
                <div className="h-3 rounded shimmer w-1/2" />
              </div>
            ))}
          </div>
        ) : deals.length === 0 ? (
          <div className="card-luxury rounded-3xl p-16 text-center max-w-md mx-auto">
            <div className="text-6xl mb-4 opacity-60">🏷️</div>
            <h3 className="font-display text-2xl font-black text-silver-gradient mb-2">No Deals Available</h3>
            <p className="text-silver-500 text-sm font-medium">New campaigns launching soon. Check back shortly!</p>
            {user?.role === "ADMIN" && (
              <Link href="/admin" className="btn-gold mt-6 inline-block px-6 py-3 rounded-xl text-xs">
                Create First Deal →
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {deals.map((deal, idx) => {
              const platform = getPlatformConfig(deal.platform);
              const slotsLeft = deal.totalSlots - deal.usedSlots;
              const isFull = slotsLeft <= 0;
              const isHot = slotsLeft <= 5 && !isFull;

              return (
                <Link key={deal.id} href={`/deal/${deal.id}`}
                  className={`card-luxury rounded-2xl p-5 flex flex-col ${isFull ? "opacity-60" : ""} animate-fade-in-up`}
                  style={{ animationDelay: `${idx * 50}ms` }}>
                  {/* Badges */}
                  <div className="flex justify-between items-start mb-3">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                      deal.platform === "AMAZON" ? "platform-amazon" :
                      deal.platform === "FLIPKART" ? "platform-flipkart" :
                      deal.platform === "MYNTRA" ? "platform-myntra" : "badge-silver"
                    }`}>
                      {platform.icon} {platform.label}
                    </span>
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${
                      isFull ? "badge-danger" : isHot ? "badge-gold animate-pulse" : "badge-success"
                    }`}>
                      {isFull ? "FULL" : isHot ? `🔥 ${slotsLeft} LEFT` : `${slotsLeft} slots`}
                    </span>
                  </div>

                  {/* Image */}
                  <div className="h-44 rounded-xl mb-4 overflow-hidden relative bg-gradient-to-br from-silver-900 to-obsidian-900 flex items-center justify-center">
                    {deal.imageUrl ? (
                      <img src={deal.imageUrl} alt={deal.title} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-6xl opacity-30">{platform.icon}</span>
                    )}
                    {deal.cashbackAmount > 0 && (
                      <div className="absolute bottom-2 left-2 badge-gold px-2.5 py-1 rounded-lg text-[9px] font-black uppercase">
                        + {formatINR(deal.cashbackAmount)} BONUS
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <h3 className="font-bold text-silver-100 text-sm leading-snug line-clamp-2 flex-1">{deal.title}</h3>
                  <p className="text-[11px] text-silver-500 font-semibold mt-1">by {deal.brandName}</p>

                  {/* Footer */}
                  <div className="pt-4 mt-4 border-t border-silver-800 flex justify-between items-end">
                    <div>
                      <p className="text-[10px] text-silver-500 font-bold uppercase">Buy Price</p>
                      <p className="font-display text-xl font-black text-gold-gradient">{formatINR(deal.productPrice)}</p>
                    </div>
                    <span className="btn-gold px-3 py-1.5 rounded-lg text-[11px]">
                      Claim →
                    </span>
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
