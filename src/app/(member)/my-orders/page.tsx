"use client";

import { useState, useEffect } from "react";
import { formatINR, formatDateTime, formatDate, getPlatformConfig, getStatusConfig } from "@/lib/utils";

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
        setSubmissions(data.data);
        setStats(data.memberStats);
      }
    } catch (error) {
      console.error("Failed to fetch:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSubmissions = filterStatus === "ALL"
    ? submissions
    : submissions.filter((s) => s.status === filterStatus);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "APPROVED": return "✅";
      case "REJECTED": return "❌";
      case "UNDER_REVIEW": return "🔍";
      case "PENDING": return "⏳";
      default: return "📋";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED": return "bg-green-50 text-green-700 border-green-200";
      case "REJECTED": return "bg-red-50 text-red-700 border-red-200";
      case "UNDER_REVIEW": return "bg-blue-50 text-blue-700 border-blue-200";
      case "PENDING": return "bg-amber-50 text-amber-700 border-amber-200";
      default: return "bg-gray-50 text-gray-700 border-gray-200";
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
    <div className="animate-fade-in">
      {/* ─── HEADER ─── */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Orders & History 📋</h1>
        <p className="text-gray-500 mt-1 text-sm">Track all your submissions, refunds, and earnings</p>
      </div>

      {/* ─── STATS CARDS (Always Visible) ─── */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {[
            { label: "Total Orders", value: stats.totalSubmissions, icon: "📦", color: "from-blue-500 to-blue-600" },
            { label: "Pending", value: stats.pending, icon: "⏳", color: "from-amber-500 to-amber-600" },
            { label: "Approved", value: stats.approved, icon: "✅", color: "from-green-500 to-green-600" },
            { label: "Rejected", value: stats.rejected, icon: "❌", color: "from-red-500 to-red-600" },
            { label: "Total Spent", value: formatINR(stats.totalSpent), icon: "💳", color: "from-purple-500 to-purple-600" },
            { label: "Cashback Earned", value: formatINR(stats.totalCashback), icon: "💰", color: "from-emerald-500 to-emerald-600" },
          ].map((stat, i) => (
            <div key={i} className="stat-card">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg">{stat.icon}</span>
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${stat.color} opacity-10`} />
                </div>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── TABS ─── */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
        <button
          onClick={() => setActiveTab("orders")}
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "orders"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          📋 All Submissions
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "history"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          📊 Deal Timeline
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* ─── ORDERS TAB ─── */}
          {activeTab === "orders" && (
            <div className="animate-fade-in">
              {/* Status Filter */}
              <div className="flex gap-2 mb-5 overflow-x-auto no-scrollbar pb-2">
                {["ALL", "PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setFilterStatus(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border transition-all ${
                      filterStatus === s
                        ? "bg-brand-600 text-white border-brand-600"
                        : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {s === "ALL" ? "All" : s.replace("_", " ")}
                    {s !== "ALL" && (
                      <span className="ml-1 opacity-70">
                        ({submissions.filter((sub) => sub.status === s).length})
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {filteredSubmissions.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                  <div className="text-5xl mb-3">📭</div>
                  <h3 className="text-lg font-semibold text-gray-700">No submissions yet</h3>
                  <p className="text-sm text-gray-400 mt-1">Grab a deal and submit your order details</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredSubmissions.map((sub) => {
                    const platform = getPlatformConfig(sub.deal.platform);
                    const isExpanded = expandedId === sub.id;

                    return (
                      <div
                        key={sub.id}
                        className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all"
                      >
                        {/* Main Row */}
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : sub.id)}
                          className="w-full flex items-center gap-4 p-4 sm:p-5 text-left"
                        >
                          {/* Platform Icon */}
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0 border ${platform.bgColor}`}>
                            {platform.icon}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-gray-900 text-sm truncate">{sub.deal.title}</h3>
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                sub.formType === "FORM1"
                                  ? "bg-blue-50 text-blue-600 border-blue-200"
                                  : "bg-purple-50 text-purple-600 border-purple-200"
                              }`}>
                                {sub.formType === "FORM1" ? "ORDER" : "REVIEW"}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-gray-400">{formatDateTime(sub.createdAt)}</span>
                              <span className="text-xs font-semibold text-gray-600">{formatINR(sub.deal.productPrice)}</span>
                            </div>
                          </div>

                          {/* Status Badge */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${getStatusColor(sub.status)}`}>
                              {getStatusIcon(sub.status)} {sub.status.replace("_", " ")}
                            </span>
                            <svg
                              className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </button>

                        {/* Expanded Details */}
                        {isExpanded && (
                          <div className="px-5 pb-5 border-t border-gray-50 animate-fade-in">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                              {sub.formData.map((fd) => (
                                <div key={fd.id} className="p-3 bg-gray-50 rounded-lg">
                                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{fd.fieldLabel}</p>
                                  {fd.fieldType === "FILE_UPLOAD" ? (
                                    fd.value.startsWith("data:") ? (
                                      <img src={fd.value} alt={fd.fieldLabel} className="mt-2 max-h-40 rounded-lg border border-gray-200 cursor-pointer hover:opacity-80" onClick={() => window.open(fd.value)} />
                                    ) : (
                                      <p className="text-sm text-brand-600 mt-1 font-medium">📎 File attached</p>
                                    )
                                  ) : fd.fieldType === "URL" ? (
                                    <a href={fd.value} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-600 mt-1 font-medium hover:underline block truncate">
                                      {fd.value}
                                    </a>
                                  ) : (
                                    <p className="text-sm text-gray-800 mt-1 font-medium">{fd.value || "—"}</p>
                                  )}
                                </div>
                              ))}
                            </div>

                            {sub.adminNotes && (
                              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                <p className="text-xs font-semibold text-amber-700">💬 Admin Note:</p>
                                <p className="text-sm text-amber-800 mt-1">{sub.adminNotes}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ─── HISTORY / TIMELINE TAB ─── */}
          {activeTab === "history" && (
            <div className="animate-fade-in space-y-4">
              {Object.keys(groupedByDeal).length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                  <div className="text-5xl mb-3">📊</div>
                  <h3 className="text-lg font-semibold text-gray-700">No deal history yet</h3>
                </div>
              ) : (
                Object.values(groupedByDeal).map((group) => {
                  const platform = getPlatformConfig(group.deal.platform);

                  return (
                    <div key={group.deal.id} className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm">
                      {/* Deal Header */}
                      <div className="flex items-start gap-4 mb-5">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl border ${platform.bgColor}`}>
                          {platform.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900">{group.deal.title}</h3>
                          <p className="text-xs text-gray-400 mt-0.5">{group.deal.brandName} · {platform.label}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-sm font-bold text-gray-900">{formatINR(group.deal.productPrice)}</span>
                            {group.deal.cashbackAmount > 0 && (
                              <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">
                                + {formatINR(group.deal.cashbackAmount)} bonus
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Progress Timeline */}
                      <div className="relative pl-6 space-y-6">
                        {/* Vertical Line */}
                        <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gray-200" />

                        {/* Step 1: Order */}
                        <div className="relative flex items-start gap-4">
                          <div className={`absolute -left-6 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                            group.form1
                              ? group.form1.status === "APPROVED"
                                ? "bg-green-500 border-green-500 text-white"
                                : group.form1.status === "REJECTED"
                                ? "bg-red-500 border-red-500 text-white"
                                : "bg-amber-500 border-amber-500 text-white"
                              : "bg-white border-gray-300 text-gray-400"
                          }`}>
                            {group.form1 ? (group.form1.status === "APPROVED" ? "✓" : group.form1.status === "REJECTED" ? "✗" : "⏳") : "1"}
                          </div>
                          <div className="flex-1 pb-2">
                            <p className="text-sm font-semibold text-gray-900">📦 Order Details</p>
                            {group.form1 ? (
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusColor(group.form1.status)}`}>
                                  {group.form1.status.replace("_", " ")}
                                </span>
                                <span className="text-xs text-gray-400">{formatDate(group.form1.createdAt)}</span>
                              </div>
                            ) : (
                              <p className="text-xs text-gray-400 mt-1">Not submitted yet</p>
                            )}
                          </div>
                        </div>

                        {/* Step 2: Review */}
                        <div className="relative flex items-start gap-4">
                          <div className={`absolute -left-6 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                            group.form2
                              ? group.form2.status === "APPROVED"
                                ? "bg-green-500 border-green-500 text-white"
                                : group.form2.status === "REJECTED"
                                ? "bg-red-500 border-red-500 text-white"
                                : "bg-amber-500 border-amber-500 text-white"
                              : "bg-white border-gray-300 text-gray-400"
                          }`}>
                            {group.form2 ? (group.form2.status === "APPROVED" ? "✓" : group.form2.status === "REJECTED" ? "✗" : "⏳") : "2"}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900">⭐ Review Proof</p>
                            {group.form2 ? (
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusColor(group.form2.status)}`}>
                                  {group.form2.status.replace("_", " ")}
                                </span>
                                <span className="text-xs text-gray-400">{formatDate(group.form2.createdAt)}</span>
                              </div>
                            ) : (
                              <p className="text-xs text-gray-400 mt-1">Not submitted yet</p>
                            )}
                          </div>
                        </div>

                        {/* Step 3: Refund */}
                        <div className="relative flex items-start gap-4">
                          <div className={`absolute -left-6 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                            group.form2?.status === "APPROVED"
                              ? "bg-green-500 border-green-500 text-white"
                              : "bg-white border-gray-300 text-gray-400"
                          }`}>
                            {group.form2?.status === "APPROVED" ? "✓" : "3"}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900">💰 Refund & Cashback</p>
                            {group.form2?.status === "APPROVED" ? (
                              <p className="text-xs text-green-600 font-semibold mt-1">
                                {formatINR(group.deal.productPrice + group.deal.cashbackAmount)} — Processing
                              </p>
                            ) : (
                              <p className="text-xs text-gray-400 mt-1">Waiting for review approval</p>
                            )}
                          </div>
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