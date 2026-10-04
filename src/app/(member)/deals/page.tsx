"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatINR, getPlatformConfig, formatDate } from "@/lib/utils";

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
        setDeals(data.data);
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
    <div className="animate-fade-in">
      {/* ─── HEADER ─── */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Active Review Deals 🏷️
        </h1>
        <p className="text-gray-500 mt-1 text-sm sm:text-base">
          Buy products, post reviews on Amazon/Flipkart, and get reimbursed
        </p>
      </div>

      {/* ─── SEARCH BAR ─── */}
      <div className="mb-6">
        <div className="relative max-w-xl">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search deals by product name or brand..."
            className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 bg-white text-sm
              focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400
              shadow-sm hover:shadow-md transition-all duration-200"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ─── PLATFORM FILTER TABS ─── */}
      <div className="mb-8 overflow-x-auto no-scrollbar">
        <div className="flex gap-2 pb-2 min-w-max">
          {PLATFORMS.map((p) => {
            const config = p === "ALL" ? { label: "All Deals", icon: "🔥", bgColor: "", color: "" } : getPlatformConfig(p);
            const isActive = activePlatform === p;
            return (
              <button
                key={p}
                onClick={() => { setActivePlatform(p); setPage(1); }}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 border ${
                  isActive
                    ? p === "ALL"
                      ? "bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-500/20"
                      : `${config.bgColor} ${config.color} shadow-sm`
                    : "bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <span className="mr-1.5">{p === "ALL" ? "🔥" : config.icon}</span>
                {p === "ALL" ? "All Deals" : config.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── DEALS GRID ─── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
              <div className="h-48 bg-gray-100" />
              <div className="p-5 space-y-3">
                <div className="h-4 bg-gray-100 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
                <div className="h-8 bg-gray-100 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : deals.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold text-gray-700">No deals found</h3>
          <p className="text-gray-400 text-sm mt-1">Try a different search or filter</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {deals.map((deal) => {
              const platform = getPlatformConfig(deal.platform);
              const slotsLeft = deal.totalSlots - deal.usedSlots;
              const slotsFull = slotsLeft <= 0;

              return (
                <Link
                  key={deal.id}
                  href={`/deal/${deal.id}`}
                  className={`group bg-white rounded-2xl border border-gray-100 overflow-hidden card-hover ${
                    slotsFull ? "opacity-60" : ""
                  }`}
                >
                  {/* Image */}
                  <div className="relative h-48 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                    {deal.imageUrl ? (
                      <img
                        src={deal.imageUrl}
                        alt={deal.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl">
                        {platform.icon}
                      </div>
                    )}

                    {/* Platform Badge */}
                    <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${platform.bgColor} ${platform.color}`}>
                      {platform.label}
                    </div>

                    {/* Slots Badge */}
                    <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${getSlotsColor(deal.usedSlots, deal.totalSlots)}`}>
                      {slotsFull ? "FULL" : `${slotsLeft} slots left`}
                    </div>

                    {/* Cashback Badge */}
                    {deal.cashbackAmount > 0 && (
                      <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-green-500 text-white shadow-lg">
                        + {formatINR(deal.cashbackAmount)} BONUS
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-brand-600 transition-colors">
                      {deal.title}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">{deal.brandName}</p>

                    <div className="flex items-center justify-between mt-4">
                      <div>
                        <p className="text-lg font-bold text-gray-900">{formatINR(deal.productPrice)}</p>
                        <p className="text-[11px] text-green-600 font-semibold">
                          100% Refund{deal.cashbackAmount > 0 ? ` + Bonus` : ""}
                        </p>
                      </div>
                      <div className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                        slotsFull
                          ? "bg-gray-100 text-gray-400"
                          : "bg-brand-50 text-brand-600 group-hover:bg-brand-600 group-hover:text-white transition-all"
                      }`}>
                        {slotsFull ? "Full" : "View Deal →"}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                        <span>{deal.usedSlots} claimed</span>
                        <span>{deal.totalSlots} total</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            (deal.usedSlots / deal.totalSlots) >= 0.9
                              ? "bg-red-500"
                              : (deal.usedSlots / deal.totalSlots) >= 0.7
                              ? "bg-orange-500"
                              : "bg-green-500"
                          }`}
                          style={{ width: `${Math.min((deal.usedSlots / deal.totalSlots) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-all"
              >
                ← Prev
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`w-10 h-10 rounded-lg text-sm font-semibold transition-all ${
                    page === i + 1
                      ? "bg-brand-600 text-white shadow-md"
                      : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-all"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
