"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePlatform, setActivePlatform] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchDeals = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: "12" });
      if (activePlatform !== "ALL") params.set("platform", activePlatform);
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/deals?${params}`);
      const data = await res.json();

      if (data.success) {
        setDeals(data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error("Failed to fetch deals:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, [activePlatform, page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchDeals();
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const getSlotsColor = (used: number, total: number) => {
    const pct = (used / total) * 100;
    if (pct >= 90) return "text-red-600 bg-red-50 border-red-200";
    if (pct >= 70) return "text-orange-600 bg-orange-50 border-orange-200";
    return "text-green-600 bg-green-50 border-green-200";
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Active Review Deals 🏷️
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              Buy products, post reviews on Amazon/Flipkart, and get reimbursed
            </p>
          </div>
          <Link
            href="/admin"
            className="px-4 py-2 bg-brand-600 text-white text-xs font-semibold rounded-xl hover:bg-brand-700 shadow-sm transition-all"
          >
            🔑 Admin Panel
          </Link>
        </div>

        {/* SEARCH BAR */}
        <div className="mb-6 max-w-xl">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search deals by product name or brand..."
            className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 shadow-sm"
          />
        </div>

        {/* PLATFORM FILTERS */}
        <div className="mb-8 flex gap-2 overflow-x-auto pb-2">
          {PLATFORMS.map((p) => {
            const config = p === "ALL" ? { label: "All Deals", icon: "🔥", bgColor: "", color: "" } : getPlatformConfig(p);
            const isActive = activePlatform === p;
            return (
              <button
                key={p}
                onClick={() => { setActivePlatform(p); setPage(1); }}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all ${
                  isActive
                    ? "bg-brand-600 text-white border-brand-600"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
              >
                {config.icon} {p === "ALL" ? "All Deals" : config.label}
              </button>
            );
          })}
        </div>

        {/* DEALS GRID */}
        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading deals...</div>
        ) : deals.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <div className="text-5xl mb-3">🏷️</div>
            <h3 className="text-lg font-bold text-gray-700">No deals active yet</h3>
            <p className="text-sm text-gray-400 mt-1">Log into Admin Panel to create your first deal!</p>
            <Link
              href="/admin"
              className="mt-4 inline-block px-5 py-2.5 bg-brand-600 text-white text-xs font-bold rounded-xl"
            >
              Go to Admin Panel →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {deals.map((deal) => {
              const platform = getPlatformConfig(deal.platform);
              const slotsLeft = deal.totalSlots - deal.usedSlots;
              return (
                <Link
                  key={deal.id}
                  href={`/deal/${deal.id}`}
                  className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all p-5"
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${platform.bgColor} ${platform.color}`}>
                      {platform.label}
                    </span>
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${getSlotsColor(deal.usedSlots, deal.totalSlots)}`}>
                      {slotsLeft <= 0 ? "FULL" : `${slotsLeft} slots left`}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm line-clamp-2">{deal.title}</h3>
                  <p className="text-xs text-gray-400 mt-1">{deal.brandName}</p>
                  <div className="mt-4 flex justify-between items-center">
                    <div>
                      <p className="text-lg font-bold text-gray-900">{formatINR(deal.productPrice)}</p>
                      <p className="text-[10px] text-green-600 font-bold">100% Refund</p>
                    </div>
                    <span className="text-xs font-bold text-brand-600">View Deal →</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
