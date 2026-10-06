"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatINR, formatDateTime, formatDate, getPlatformConfig } from "@/lib/utils";

interface Submission {
  id: string;
  formType: "FORM1" | "FORM2";
  status: string;
  adminNotes: string | null;
  createdAt: string;
  deal: {
    id: string;
    title: string;
    brandName: string;
    platform: string;
    productPrice: number;
    cashbackAmount: number;
  };
  formData: {
    id: string;
    fieldLabel: string;
    fieldType: string;
    value: string;
  }[];
}

interface MemberStats {
  totalSubmissions: number;
  pending: number;
  approved: number;
  rejected: number;
  totalSpent: number;
  totalCashback: number;
}

export default function MyOrdersPage() {
  const [activeTab, setActiveTab] = useState<"orders" | "history">("orders");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [stats, setStats] = useState<MemberStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/submissions?limit=100");
      const data = await res.json();
      if (data.success) {
        setSubmissions(data.data || []);
        setStats(data.memberStats || null);
      }
    } catch {
      // Handle error gracefully
    } finally {
      setLoading(false);
    }
  };

  const filteredSubmissions = filterStatus === "ALL"
    ? submissions
    : submissions.filter((s) => s.status === filterStatus);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return { label: "Approved ✓", cls: "badge-success" };
      case "REJECTED":
        return { label: "Rejected ✕", cls: "badge-danger" };
      case "UNDER_REVIEW":
        return { label: "Under Review 🔍", cls: "badge-silver" };
      case "PENDING":
        return { label: "Pending ⏳", cls: "badge-gold animate-pulse" };
      default:
        return { label: status, cls: "badge-silver" };
    }
  };

  // Group submissions by deal for timeline view
  const groupedByDeal = submissions.reduce((acc, sub) => {
    const dealId = sub.deal.id;
    if (!acc[dealId]) {
      acc[dealId] = { deal: sub.deal, form1: null, form2: null };
    }
    if (sub.formType === "FORM1") acc[dealId].form1 = sub;
    if (sub.formType === "FORM2") acc[dealId].form2 = sub;
    return acc;
  }, {} as Record<string, { deal: Submission["deal"]; form1: Submission | null; form2: Submission | null }>);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ─── HEADER ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-black text-silver-100 tracking-tight">
            My Orders & Payouts 📋
          </h1>
          <p className="text-silver-400 text-xs sm:text-sm font-medium mt-1">
            Track verification stages, refunds, and cashback deposits in real-time.
          </p>
        </div>

        <Link
          href="/deals"
          className="btn-gold px-5 py-2.5 rounded-2xl text-xs font-bold self-start sm:self-auto"
        >
          Explore More Deals +
        </Link>
      </div>

      {/* ─── STATS CARDS (Spacious & Glowing) ─── */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {[
            { label: "Total Orders", value: stats.totalSubmissions, icon: "📦", color: "text-silver-200" },
            { label: "Pending Audit", value: stats.pending, icon: "⏳", color: "text-gold-400" },
            { label: "Approved", value: stats.approved, icon: "✅", color: "text-emerald-400" },
            { label: "Rejected", value: stats.rejected, icon: "✕", color: "text-red-400" },
            { label: "Total Spent", value: formatINR(stats.totalSpent), icon: "💳", color: "text-silver-100" },
            { label: "Cashback Earned", value: formatINR(stats.totalCashback), icon: "💰", color: "text-gold-gradient" },
          ].map((stat, i) => (
            <div
              key={i}
              className="card-luxury p-4 sm:p-5 rounded-2xl border border-silver-800/80 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between text-base mb-2">
                <span>{stat.icon}</span>
                <span className="w-2 h-2 rounded-full bg-gold-500/30" />
              </div>
              <div>
                <p className={`font-display text-lg sm:text-xl font-black ${stat.color}`}>
                  {stat.value}
                </p>
                <p className="text-[10px] text-silver-400 font-bold uppercase tracking-wider mt-0.5">
                  {stat.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── TABS ─── */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl glass-dark w-fit border border-silver-800/80">
        <button
          onClick={() => setActiveTab("orders")}
          className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === "orders" ? "btn-gold shadow-gold-sm" : "text-silver-400 hover:text-silver-100"
          }`}
        >
          📋 All Submissions ({submissions.length})
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === "history" ? "btn-gold shadow-gold-sm" : "text-silver-400 hover:text-silver-100"
          }`}
        >
          📊 Deal Timelines
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card-luxury p-6 rounded-2xl space-y-3">
              <div className="h-5 rounded shimmer w-1/3" />
              <div className="h-4 rounded shimmer w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* ─── ORDERS TAB ─── */}
          {activeTab === "orders" && (
            <div className="space-y-6">
              {/* Status Filter Chips */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {["ALL", "PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED"].map((s) => {
                  const count = s === "ALL" ? submissions.length : submissions.filter((sub) => sub.status === s).length;
                  return (
                    <button
                      key={s}
                      onClick={() => setFilterStatus(s)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                        filterStatus === s
                          ? "btn-gold shadow-gold-sm border-gold-400"
                          : "btn-silver border-silver-800"
                      }`}
                    >
                      {s === "ALL" ? "All Submissions" : s.replace("_", " ")}
                      <span className="ml-1.5 opacity-70">({count})</span>
                    </button>
                  );
                })}
              </div>

              {filteredSubmissions.length === 0 ? (
                <div className="card-luxury rounded-3xl p-12 sm:p-16 text-center border border-silver-800">
                  <div className="text-5xl mb-3">📭</div>
                  <h3 className="font-display text-xl font-black text-silver-100 mb-1">
                    No Submissions Found
                  </h3>
                  <p className="text-silver-400 text-xs sm:text-sm font-medium mb-6">
                    Claim a deal from the marketplace and submit your order details to begin earning.
                  </p>
                  <Link href="/deals" className="btn-gold px-6 py-3 rounded-xl text-xs font-bold inline-block">
                    Browse Active Deals →
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredSubmissions.map((sub) => {
                    const platform = getPlatformConfig(sub.deal.platform);
                    const isExpanded = expandedId === sub.id;
                    const badge = getStatusBadge(sub.status);

                    return (
                      <div
                        key={sub.id}
                        className="card-luxury rounded-2xl border border-silver-800/80 overflow-hidden transition-all duration-200"
                      >
                        {/* Main Summary Header */}
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : sub.id)}
                          className="w-full flex items-center gap-4 p-5 sm:p-6 text-left hover:bg-white/[0.02] transition-colors"
                        >
                          {/* Platform Badge */}
                          <div className="w-12 h-12 rounded-xl glass-dark border border-silver-800/80 flex items-center justify-center text-xl flex-shrink-0">
                            {platform.icon}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-bold text-silver-100 text-sm truncate max-w-md">
                                {sub.deal.title}
                              </h3>
                              <span
                                className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                                  sub.formType === "FORM1" ? "badge-gold" : "badge-success"
                                }`}
                              >
                                {sub.formType === "FORM1" ? "Step 1: Order" : "Step 2: Review"}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-xs text-silver-400">
                              <span>Brand: <strong className="text-silver-300">{sub.deal.brandName}</strong></span>
                              <span>•</span>
                              <span>{formatDateTime(sub.createdAt)}</span>
                              <span>•</span>
                              <span className="text-gold-400 font-bold">{formatINR(sub.deal.productPrice)}</span>
                            </div>
                          </div>

                          {/* Status Badge */}
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider ${badge.cls}`}>
                              {badge.label}
                            </span>
                            <span className={`text-silver-400 text-sm transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}>
                              ▾
                            </span>
                          </div>
                        </button>

                        {/* Expanded Submission Details */}
                        {isExpanded && (
                          <div className="px-5 sm:px-6 pb-6 pt-2 border-t border-silver-800/80 bg-obsidian-950/40 space-y-4 animate-fade-in">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                              {sub.formData.map((fd) => (
                                <div key={fd.id} className="glass-dark p-3.5 rounded-xl border border-silver-800/80 space-y-1">
                                  <p className="text-[10px] font-bold text-gold-500 uppercase tracking-wider">
                                    {fd.fieldLabel}
                                  </p>
                                  {fd.fieldType === "FILE_UPLOAD" ? (
                                    fd.value.startsWith("data:") ? (
                                      <img
                                        src={fd.value}
                                        alt={fd.fieldLabel}
                                        className="mt-2 max-h-48 rounded-xl border border-silver-800 cursor-pointer hover:opacity-90"
                                        onClick={() => window.open(fd.value)}
                                      />
                                    ) : (
                                      <p className="text-xs text-gold-400 mt-1 font-mono">📎 File attached</p>
                                    )
                                  ) : fd.fieldType === "URL" ? (
                                    <a
                                      href={fd.value}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-gold-400 font-mono hover:underline block truncate"
                                    >
                                      {fd.value}
                                    </a>
                                  ) : (
                                    <p className="text-xs text-silver-200 font-medium font-mono">{fd.value || "—"}</p>
                                  )}
                                </div>
                              ))}
                            </div>

                            {sub.adminNotes && (
                              <div className="p-4 rounded-xl bg-gold-500/10 border border-gold-500/30">
                                <p className="text-xs font-bold text-gold-400">💬 Admin Feedback / Verification Note:</p>
                                <p className="text-xs text-silver-200 mt-1">{sub.adminNotes}</p>
                              </div>
                            )}

                            <div className="flex justify-end pt-2">
                              <Link
                                href={`/deal/${sub.deal.id}`}
                                className="btn-silver px-4 py-2 rounded-xl text-xs font-bold"
                              >
                                View Deal Details ↗
                              </Link>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ─── TIMELINE TAB ─── */}
          {activeTab === "history" && (
            <div className="space-y-6">
              {Object.keys(groupedByDeal).length === 0 ? (
                <div className="card-luxury rounded-3xl p-16 text-center border border-silver-800">
                  <div className="text-5xl mb-3">📊</div>
                  <h3 className="font-display text-xl font-black text-silver-100">
                    No Deal History Yet
                  </h3>
                  <p className="text-silver-400 text-xs sm:text-sm mt-1">
                    Your active deal timeline will appear here once you claim a deal.
                  </p>
                </div>
              ) : (
                Object.values(groupedByDeal).map((group) => {
                  const platform = getPlatformConfig(group.deal.platform);

                  return (
                    <div
                      key={group.deal.id}
                      className="card-luxury rounded-3xl p-6 sm:p-8 border border-silver-800/80 space-y-6"
                    >
                      {/* Deal Header */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl glass-dark border border-silver-800 flex items-center justify-center text-xl">
                            {platform.icon}
                          </div>
                          <div>
                            <h3 className="font-bold text-silver-100 text-base">{group.deal.title}</h3>
                            <p className="text-xs text-silver-400 mt-0.5">
                              {group.deal.brandName} • {platform.label}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="font-display text-lg font-black text-silver-100">
                            {formatINR(group.deal.productPrice)}
                          </p>
                          <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                            100% Refund
                          </p>
                        </div>
                      </div>

                      {/* Stepper Timeline */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-silver-800/80">
                        {/* Step 1 */}
                        <div className="glass-dark p-4 rounded-2xl border border-silver-800/80 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-silver-300">1. Order Details</span>
                            <span className="text-sm">
                              {group.form1?.status === "APPROVED" ? "✅" : group.form1 ? "⏳" : "⚪"}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-gold-400">
                            {group.form1 ? group.form1.status : "Pending Submission"}
                          </p>
                          {group.form1 && (
                            <p className="text-[10px] text-silver-500">{formatDate(group.form1.createdAt)}</p>
                          )}
                        </div>

                        {/* Step 2 */}
                        <div className="glass-dark p-4 rounded-2xl border border-silver-800/80 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-silver-300">2. Review Proof</span>
                            <span className="text-sm">
                              {group.form2?.status === "APPROVED" ? "✅" : group.form2 ? "⏳" : "⚪"}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-gold-400">
                            {group.form2 ? group.form2.status : "Waiting for delivery"}
                          </p>
                          {group.form2 && (
                            <p className="text-[10px] text-silver-500">{formatDate(group.form2.createdAt)}</p>
                          )}
                        </div>

                        {/* Step 3 */}
                        <div className="glass-dark p-4 rounded-2xl border border-silver-800/80 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-silver-300">3. Refund Payout</span>
                            <span className="text-sm">
                              {group.form2?.status === "APPROVED" ? "💰" : "🔒"}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-emerald-400">
                            {group.form2?.status === "APPROVED"
                              ? `${formatINR(group.deal.productPrice + group.deal.cashbackAmount)} Paid`
                              : "Unlocks after review approval"}
                          </p>
                          <p className="text-[10px] text-silver-500">Transferred via UPI</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}