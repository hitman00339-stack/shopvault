"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import Navbar from "@/components/Navbar";
import CustomerSupportButton from "@/components/CustomerSupportButton";
import { formatINR, getPlatformConfig } from "@/lib/utils";

interface FormField {
  id: string;
  label: string;
  fieldType: string;
  placeholder: string | null;
  helpText: string | null;
  isRequired: boolean;
  options: string | null;
}

interface FormTemplate {
  id: string;
  name: string;
  description: string | null;
  fields: FormField[];
}

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
  sellerName: string | null;
  totalSlots: number;
  usedSlots: number;
  instructions: string | null;
  status: string;
  form1: FormTemplate | null;
  form2: FormTemplate | null;
}

interface Submission {
  id: string;
  formType: "FORM1" | "FORM2";
  status: string;
  adminNotes: string | null;
  createdAt: string;
}

export default function DealDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dealId = params?.id as string;

  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"instructions" | "form1" | "form2">("instructions");
  const [mySubmissions, setMySubmissions] = useState<Submission[]>([]);
  const [form1Data, setForm1Data] = useState<Record<string, string>>({});
  const [form2Data, setForm2Data] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [copiedKeyword, setCopiedKeyword] = useState(false);

  useEffect(() => {
    if (dealId) {
      fetchDeal();
      fetchMySubmissions();
    }
  }, [dealId]);

  const fetchDeal = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/deals?id=${dealId}`);
      const data = await res.json();
      if (data.success && data.data?.length > 0) {
        setDeal(data.data[0]);
      } else {
        toast.error("Deal not found");
      }
    } catch {
      toast.error("Failed to load deal");
    } finally {
      setLoading(false);
    }
  };

  const fetchMySubmissions = async () => {
    try {
      const res = await fetch("/api/submissions");
      const data = await res.json();
      if (data.success && data.data) {
        setMySubmissions(data.data.filter((s: any) => s.deal?.id === dealId));
      }
    } catch {
      // User might be unauthenticated
    }
  };

  const copyKeyword = (keyword: string) => {
    navigator.clipboard.writeText(keyword);
    setCopiedKeyword(true);
    toast.success("Keyword copied to clipboard!");
    setTimeout(() => setCopiedKeyword(false), 2000);
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    targetForm: "form1" | "form2",
    fieldKey: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error("File size must be under 8MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (targetForm === "form1") {
        setForm1Data((p) => ({ ...p, [fieldKey]: dataUrl }));
      } else {
        setForm2Data((p) => ({ ...p, [fieldKey]: dataUrl }));
      }
      toast.success("File / Screenshot uploaded! 📸");
    };
    reader.onerror = () => {
      toast.error("Failed to read file");
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (formType: "FORM1" | "FORM2") => {
    const targetForm = formType === "FORM1" ? deal?.form1 : deal?.form2;
    const currentValues = formType === "FORM1" ? form1Data : form2Data;

    if (!targetForm) return;

    // Validate required fields
    for (const field of targetForm.fields) {
      if (field.isRequired && !currentValues[field.label]?.trim()) {
        toast.error(`Please fill in "${field.label}"`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const formattedData = targetForm.fields.map((f) => ({
        fieldLabel: f.label,
        fieldType: f.fieldType,
        value: currentValues[f.label] || "",
      }));

      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dealId,
          formType,
          formData: formattedData,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Submission failed");
        return;
      }

      toast.success(
        formType === "FORM1"
          ? "Step 1: Order Details submitted! 🚀"
          : "Step 2: Review Proof submitted! 🌟"
      );
      fetchMySubmissions();
      setActiveTab(formType === "FORM1" ? "form2" : "instructions");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-obsidian-deep">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-24 text-center">
          <div className="w-12 h-12 border-4 border-gold-500/30 border-t-gold-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-silver-400 text-sm font-semibold tracking-wide">Loading exclusive campaign details...</p>
        </div>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="min-h-screen bg-obsidian-deep">
        <Navbar />
        <div className="max-w-md mx-auto px-4 py-28 text-center">
          <div className="text-6xl mb-4">🏷️</div>
          <h2 className="font-display text-2xl font-black text-silver-100 mb-2">Deal Not Found</h2>
          <p className="text-silver-400 text-sm mb-6">This campaign may have ended or is currently inactive.</p>
          <Link href="/deals" className="btn-gold px-6 py-3 rounded-xl text-xs font-bold inline-block">
            ← Explore Active Deals
          </Link>
        </div>
      </div>
    );
  }

  const platform = getPlatformConfig(deal.platform);
  const slotsLeft = deal.totalSlots - deal.usedSlots;
  const isFull = slotsLeft <= 0;
  const form1Submission = mySubmissions.find((s) => s.formType === "FORM1");
  const form2Submission = mySubmissions.find((s) => s.formType === "FORM2");

  return (
    <div className="min-h-screen bg-obsidian-deep pb-24 md:pb-16">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Back Link */}
        <Link
          href="/deals"
          className="inline-flex items-center gap-2 text-xs font-bold text-silver-400 hover:text-gold-400 mb-8 transition-colors"
        >
          <span>←</span> <span>Back to All Campaigns</span>
        </Link>

        {/* ─── MAIN HERO CARD (Roomy & Ultra-Professional) ─── */}
        <div className="card-luxury rounded-3xl p-6 sm:p-10 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Image Column */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="w-full aspect-square max-w-[380px] rounded-2xl bg-gradient-to-br from-obsidian-800 to-obsidian-950 border border-silver-800/80 p-6 flex items-center justify-center relative overflow-hidden group shadow-2xl">
                {deal.imageUrl ? (
                  <img
                    src={deal.imageUrl}
                    alt={deal.title}
                    className="w-full h-full object-contain drop-shadow-2xl transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <span className="text-8xl opacity-30">{platform.icon}</span>
                )}

                {deal.cashbackAmount > 0 && (
                  <div className="absolute top-4 left-4 badge-gold px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-gold-sm">
                    + {formatINR(deal.cashbackAmount)} CASH BONUS
                  </div>
                )}
              </div>

              {/* Verified Trust Badges */}
              <div className="grid grid-cols-2 gap-3 w-full max-w-[380px] mt-4">
                <div className="glass-dark p-3 rounded-xl border border-silver-800/80 text-center">
                  <p className="text-[10px] text-silver-500 font-bold uppercase">Refund Guarantee</p>
                  <p className="text-xs font-bold text-emerald-400 mt-0.5">100% Protected</p>
                </div>
                <div className="glass-dark p-3 rounded-xl border border-silver-800/80 text-center">
                  <p className="text-[10px] text-silver-500 font-bold uppercase">Payout Method</p>
                  <p className="text-xs font-bold text-gold-400 mt-0.5">Direct UPI</p>
                </div>
              </div>
            </div>

            {/* Details Column */}
            <div className="lg:col-span-7 flex flex-col justify-between h-full space-y-6">
              <div>
                <div className="flex flex-wrap items-center gap-2.5 mb-4">
                  <span
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider ${
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
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider ${
                      isFull ? "badge-danger" : slotsLeft <= 5 ? "badge-gold animate-pulse" : "badge-success"
                    }`}
                  >
                    {isFull ? "CAMPAIGN FULL" : `⚡ ${slotsLeft} OF ${deal.totalSlots} SLOTS LEFT`}
                  </span>
                </div>

                <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-black text-silver-100 tracking-tight leading-snug">
                  {deal.title}
                </h1>
                <p className="text-xs sm:text-sm text-silver-400 font-semibold mt-2">
                  Sold & Verified by: <span className="text-gold-400">{deal.brandName}</span>
                  {deal.sellerName && <span className="text-silver-500 ml-2">({deal.sellerName})</span>}
                </p>
              </div>

              {/* Price Breakdown Box */}
              <div className="glass-vault rounded-2xl p-5 border border-gold-500/25">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-center sm:text-left">
                  <div>
                    <p className="text-[10px] text-silver-500 font-bold uppercase tracking-wider">Order Amount</p>
                    <p className="font-display text-xl sm:text-2xl font-black text-silver-100 mt-0.5">
                      {formatINR(deal.productPrice)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-silver-500 font-bold uppercase tracking-wider">Refund Amount</p>
                    <p className="font-display text-xl sm:text-2xl font-black text-emerald-400 mt-0.5">
                      100% ({formatINR(deal.productPrice)})
                    </p>
                  </div>
                  <div className="col-span-2 sm:col-span-1 border-t sm:border-t-0 sm:border-l border-silver-800/80 pt-3 sm:pt-0 sm:pl-4">
                    <p className="text-[10px] text-gold-500 font-bold uppercase tracking-wider">Your Net Cost</p>
                    <p className="font-display text-2xl font-black text-gold-gradient mt-0.5">
                      {deal.cashbackAmount > 0 ? `+${formatINR(deal.cashbackAmount)} Profit` : "₹0 (FREE)"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Keyword Search Banner */}
              {deal.searchKeyword && (
                <div className="p-4 sm:p-5 rounded-2xl bg-gold-500/10 border border-gold-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] text-gold-400 font-black uppercase tracking-wider">
                      🔍 Required Search Keyword on {platform.label}:
                    </p>
                    <p className="text-sm sm:text-base font-bold text-silver-100 font-mono mt-0.5">
                      "{deal.searchKeyword}"
                    </p>
                  </div>
                  <button
                    onClick={() => copyKeyword(deal.searchKeyword!)}
                    className="btn-silver px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap self-stretch sm:self-auto"
                  >
                    {copiedKeyword ? "Copied! ✓" : "Copy Keyword 📋"}
                  </button>
                </div>
              )}

              {/* Buy CTA */}
              <div className="pt-2">
                <a
                  href={deal.productUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-gold w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-wider"
                >
                  <span>🛒 Open & Buy on {platform.label}</span>
                  <span>→</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* ─── TABS & SUBMISSION WORKFLOW ─── */}
        <div className="card-luxury rounded-3xl overflow-hidden border border-silver-800">
          {/* Tab Navigation */}
          <div className="flex border-b border-silver-800/80 overflow-x-auto no-scrollbar bg-obsidian-900/60 p-2 gap-2">
            {[
              { key: "instructions" as const, label: "📖 How It Works & Rules", badge: null },
              {
                key: "form1" as const,
                label: "📦 Step 1: Submit Order Details",
                badge: form1Submission
                  ? form1Submission.status === "APPROVED"
                    ? "✓ Approved"
                    : "⏳ Submitted"
                  : null,
              },
              {
                key: "form2" as const,
                label: "⭐ Step 2: Submit Review Proof",
                badge: form2Submission
                  ? form2Submission.status === "APPROVED"
                    ? "✓ Approved"
                    : "⏳ Submitted"
                  : null,
              },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-3.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                  activeTab === tab.key
                    ? "btn-gold shadow-gold-sm"
                    : "text-silver-400 hover:text-silver-100 hover:bg-white/5"
                }`}
              >
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-obsidian-950/70 border border-white/20 text-silver-200">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab Contents */}
          <div className="p-6 sm:p-10">
            {/* 1. INSTRUCTIONS TAB */}
            {activeTab === "instructions" && (
              <div className="space-y-8">
                <div className="space-y-4">
                  <h3 className="font-display text-xl sm:text-2xl font-black text-silver-100">
                    Step-by-Step Campaign Guide
                  </h3>
                  <p className="text-silver-400 text-sm leading-relaxed">
                    Follow these guidelines closely to ensure your 100% refund and cashback bonus are approved promptly without delays.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="glass-dark p-5 rounded-2xl border border-silver-800/70 space-y-2">
                    <div className="w-8 h-8 rounded-xl bg-gold-500/15 border border-gold-500/30 flex items-center justify-center text-gold-400 font-bold text-xs">
                      1
                    </div>
                    <h4 className="font-bold text-silver-100 text-sm">Search on {platform.label}</h4>
                    <p className="text-xs text-silver-400 leading-relaxed">
                      {deal.searchKeyword ? (
                        <>
                          Search for <strong className="text-gold-400">"{deal.searchKeyword}"</strong> and locate product by brand <strong className="text-silver-200">{deal.brandName}</strong>.
                        </>
                      ) : (
                        `Locate the product by brand ${deal.brandName} on ${platform.label}.`
                      )}
                    </p>
                  </div>

                  <div className="glass-dark p-5 rounded-2xl border border-silver-800/70 space-y-2">
                    <div className="w-8 h-8 rounded-xl bg-gold-500/15 border border-gold-500/30 flex items-center justify-center text-gold-400 font-bold text-xs">
                      2
                    </div>
                    <h4 className="font-bold text-silver-100 text-sm">Prepaid Order Only</h4>
                    <p className="text-xs text-silver-400 leading-relaxed">
                      Place the order using prepaid methods (UPI, Card, Netbanking). Cash on Delivery is strictly prohibited for cashback deals.
                    </p>
                  </div>

                  <div className="glass-dark p-5 rounded-2xl border border-silver-800/70 space-y-2">
                    <div className="w-8 h-8 rounded-xl bg-gold-500/15 border border-gold-500/30 flex items-center justify-center text-gold-400 font-bold text-xs">
                      3
                    </div>
                    <h4 className="font-bold text-silver-100 text-sm">Submit Order Details Immediately</h4>
                    <p className="text-xs text-silver-400 leading-relaxed">
                      Go to Step 1 tab and submit your Order ID within 30 minutes of purchase so our admin team can verify your slot.
                    </p>
                  </div>

                  <div className="glass-dark p-5 rounded-2xl border border-silver-800/70 space-y-2">
                    <div className="w-8 h-8 rounded-xl bg-gold-500/15 border border-gold-500/30 flex items-center justify-center text-gold-400 font-bold text-xs">
                      4
                    </div>
                    <h4 className="font-bold text-silver-100 text-sm">5-Star Review & Instant Refund</h4>
                    <p className="text-xs text-silver-400 leading-relaxed">
                      After receiving the product, write a genuine 5-star review, upload screenshot in Step 2, and receive 100% refund into your UPI.
                    </p>
                  </div>
                </div>

                <div className="pt-4 flex flex-wrap gap-4">
                  <button
                    onClick={() => setActiveTab("form1")}
                    className="btn-gold px-6 py-3 rounded-xl text-xs font-bold"
                  >
                    Proceed to Step 1: Order Details →
                  </button>
                  <a
                    href={deal.productUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-silver px-6 py-3 rounded-xl text-xs font-bold"
                  >
                    Open Product Page ↗
                  </a>
                </div>
              </div>
            )}

            {/* 2. FORM 1 TAB */}
            {activeTab === "form1" && (
              <div className="space-y-6 max-w-2xl">
                <div>
                  <h3 className="font-display text-xl sm:text-2xl font-black text-silver-100">
                    Step 1: Order Details
                  </h3>
                  <p className="text-silver-400 text-xs sm:text-sm mt-1">
                    Enter the purchase details from your {platform.label} order confirmation.
                  </p>
                </div>

                {form1Submission ? (
                  <div className="glass-vault p-6 rounded-2xl border border-emerald-500/30 text-center space-y-3">
                    <div className="text-4xl">✅</div>
                    <h4 className="text-base font-bold text-silver-100">Order Details Submitted</h4>
                    <p className="text-xs text-silver-400">
                      Status: <span className="font-bold text-emerald-400">{form1Submission.status}</span>. You can submit review proof once delivered.
                    </p>
                    <button
                      onClick={() => setActiveTab("form2")}
                      className="btn-gold px-6 py-2.5 rounded-xl text-xs font-bold mt-2"
                    >
                      Go to Step 2: Review Proof →
                    </button>
                  </div>
                ) : deal.form1?.fields && deal.form1.fields.length > 0 ? (
                  <div className="space-y-4">
                    {deal.form1.fields.map((field) => (
                      <div key={field.id} className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-gold-400">
                          {field.label} {field.isRequired && <span className="text-red-400">*</span>}
                        </label>
                        {field.fieldType === "FILE_UPLOAD" ? (
                          form1Data[field.label] ? (
                            <div className="p-3.5 rounded-xl bg-black/40 border border-gold-500/30 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <img
                                  src={form1Data[field.label]}
                                  alt=""
                                  className="w-12 h-12 object-cover rounded-lg border border-silver-700"
                                />
                                <div>
                                  <p className="text-xs font-bold text-silver-100">File Attached ✓</p>
                                  <p className="text-[10px] text-emerald-400">Ready for submission</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setForm1Data((p) => ({ ...p, [field.label]: "" }))}
                                className="text-xs text-red-400 hover:text-red-300 font-bold"
                              >
                                ✕ Remove
                              </button>
                            </div>
                          ) : (
                            <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-gold-500/30 hover:border-gold-500/60 rounded-xl bg-black/20 hover:bg-gold-500/5 cursor-pointer transition-all">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileUpload(e, "form1", field.label)}
                                className="hidden"
                              />
                              <span className="text-xl">📁</span>
                              <span className="text-xs font-bold text-silver-200 mt-1">
                                Click to Upload {field.label}
                              </span>
                              <span className="text-[10px] text-silver-500">
                                Upload image directly from your device (Max 8MB)
                              </span>
                            </label>
                          )
                        ) : (
                          <input
                            type={field.fieldType === "NUMBER" ? "number" : "text"}
                            placeholder={field.placeholder || `Enter ${field.label}`}
                            value={form1Data[field.label] || ""}
                            onChange={(e) => setForm1Data((p) => ({ ...p, [field.label]: e.target.value }))}
                            className="input-premium w-full px-4 py-3.5 rounded-xl text-sm font-medium"
                            required={field.isRequired}
                          />
                        )}
                        {field.helpText && <p className="text-[11px] text-silver-500">{field.helpText}</p>}
                      </div>
                    ))}

                    <button
                      onClick={() => handleSubmit("FORM1")}
                      disabled={submitting}
                      className="btn-gold w-full py-4 rounded-xl text-xs font-bold uppercase tracking-wider mt-4"
                    >
                      {submitting ? "Submitting Order Details..." : "Submit Order Details 🚀"}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-gold-400">
                        {platform.label} Order ID *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 402-1234567-8901234"
                        value={form1Data["Order ID"] || ""}
                        onChange={(e) => setForm1Data((p) => ({ ...p, "Order ID": e.target.value }))}
                        className="input-premium w-full px-4 py-3.5 rounded-xl text-sm font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-gold-400">
                        Purchase Amount Paid (₹) *
                      </label>
                      <input
                        type="number"
                        placeholder={String(deal.productPrice)}
                        value={form1Data["Amount Paid"] || ""}
                        onChange={(e) => setForm1Data((p) => ({ ...p, "Amount Paid": e.target.value }))}
                        className="input-premium w-full px-4 py-3.5 rounded-xl text-sm font-medium"
                      />
                    </div>
                    <button
                      onClick={() => handleSubmit("FORM1")}
                      disabled={submitting}
                      className="btn-gold w-full py-4 rounded-xl text-xs font-bold uppercase tracking-wider mt-4"
                    >
                      {submitting ? "Submitting..." : "Submit Order Details 🚀"}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 3. FORM 2 TAB */}
            {activeTab === "form2" && (
              <div className="space-y-6 max-w-2xl">
                <div>
                  <h3 className="font-display text-xl sm:text-2xl font-black text-silver-100">
                    Step 2: Submit Review Proof
                  </h3>
                  <p className="text-silver-400 text-xs sm:text-sm mt-1">
                    Upload your 5-star rating screenshot proof directly after your review is posted.
                  </p>
                </div>

                {form2Submission ? (
                  <div className="glass-vault p-6 rounded-2xl border border-emerald-500/30 text-center space-y-3">
                    <div className="text-4xl">🎉</div>
                    <h4 className="text-base font-bold text-silver-100">Review Proof Submitted</h4>
                    <p className="text-xs text-silver-400">
                      Our verification team is auditing your review. Once approved, your refund of{" "}
                      <span className="text-emerald-400 font-bold">{formatINR(deal.productPrice)}</span> will be dispatched.
                    </p>
                    <Link href="/my-orders" className="btn-gold px-6 py-2.5 rounded-xl text-xs font-bold mt-2 inline-block">
                      View Order Status 📋
                    </Link>
                  </div>
                ) : deal.form2?.fields && deal.form2.fields.length > 0 ? (
                  <div className="space-y-4">
                    {deal.form2.fields.map((field) => (
                      <div key={field.id} className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-gold-400">
                          {field.label} {field.isRequired && <span className="text-red-400">*</span>}
                        </label>
                        {field.fieldType === "FILE_UPLOAD" ? (
                          form2Data[field.label] ? (
                            <div className="p-3.5 rounded-xl bg-black/40 border border-gold-500/30 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <img
                                  src={form2Data[field.label]}
                                  alt=""
                                  className="w-12 h-12 object-cover rounded-lg border border-silver-700"
                                />
                                <div>
                                  <p className="text-xs font-bold text-silver-100">Screenshot Attached ✓</p>
                                  <p className="text-[10px] text-emerald-400">Ready to submit</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setForm2Data((p) => ({ ...p, [field.label]: "" }))}
                                className="text-xs text-red-400 hover:text-red-300 font-bold"
                              >
                                ✕ Remove
                              </button>
                            </div>
                          ) : (
                            <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-gold-500/30 hover:border-gold-500/60 rounded-xl bg-black/20 hover:bg-gold-500/5 cursor-pointer transition-all">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileUpload(e, "form2", field.label)}
                                className="hidden"
                              />
                              <span className="text-xl">📸</span>
                              <span className="text-xs font-bold text-silver-200 mt-1">
                                Click to Upload {field.label}
                              </span>
                              <span className="text-[10px] text-silver-500">
                                Direct image upload from device
                              </span>
                            </label>
                          )
                        ) : (
                          <input
                            type="text"
                            placeholder={field.placeholder || `Enter ${field.label}`}
                            value={form2Data[field.label] || ""}
                            onChange={(e) => setForm2Data((p) => ({ ...p, [field.label]: e.target.value }))}
                            className="input-premium w-full px-4 py-3.5 rounded-xl text-sm font-medium"
                            required={field.isRequired}
                          />
                        )}
                        {field.helpText && <p className="text-[11px] text-silver-500">{field.helpText}</p>}
                      </div>
                    ))}

                    <button
                      onClick={() => handleSubmit("FORM2")}
                      disabled={submitting}
                      className="btn-gold w-full py-4 rounded-xl text-xs font-bold uppercase tracking-wider mt-4"
                    >
                      {submitting ? "Submitting Review..." : "Submit Review Proof 🌟"}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-gold-400">
                        Review Profile Name / Reviewer Handle *
                      </label>
                      <input
                        type="text"
                        placeholder="Name shown on your review profile"
                        value={form2Data["Reviewer Name"] || ""}
                        onChange={(e) => setForm2Data((p) => ({ ...p, "Reviewer Name": e.target.value }))}
                        className="input-premium w-full px-4 py-3.5 rounded-xl text-sm font-medium"
                      />
                    </div>

                    {/* Direct Image File Upload for Review Screenshot */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-gold-400">
                        Review Screenshot Proof (Upload Image) *
                      </label>
                      {form2Data["Screenshot URL"] ? (
                        <div className="p-3.5 rounded-2xl bg-black/40 border border-gold-500/30 flex items-center justify-between">
                          <div className="flex items-center gap-3.5">
                            <img
                              src={form2Data["Screenshot URL"]}
                              alt="Review Proof"
                              className="w-14 h-14 object-cover rounded-xl border border-silver-700 bg-obsidian-deep"
                            />
                            <div>
                              <p className="text-xs font-bold text-silver-100 flex items-center gap-1">
                                <span className="text-emerald-400">✓</span> Review Proof Attached
                              </p>
                              <p className="text-[10px] text-silver-400 mt-0.5">
                                Direct image upload from device
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setForm2Data((p) => ({ ...p, "Screenshot URL": "" }))}
                            className="text-xs text-red-400 hover:text-red-300 font-bold hover:underline px-2"
                          >
                            ✕ Remove
                          </button>
                        </div>
                      ) : (
                        <label className="group flex flex-col items-center justify-center p-6 border-2 border-dashed border-gold-500/30 hover:border-gold-500/60 rounded-2xl bg-black/20 hover:bg-gold-500/5 cursor-pointer transition-all">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, "form2", "Screenshot URL")}
                            className="hidden"
                          />
                          <div className="w-12 h-12 rounded-2xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-2xl text-gold-400 group-hover:scale-110 transition-transform">
                            📸
                          </div>
                          <span className="text-xs font-bold text-silver-200 mt-2">
                            Click to Select Review Screenshot
                          </span>
                          <span className="text-[10px] text-silver-500 mt-0.5">
                            Upload directly from your gallery/device — No image URL needed
                          </span>
                        </label>
                      )}
                    </div>

                    <button
                      onClick={() => handleSubmit("FORM2")}
                      disabled={submitting}
                      className="btn-gold w-full py-4 rounded-xl text-xs font-bold uppercase tracking-wider mt-4"
                    >
                      {submitting ? "Submitting..." : "Submit Review Proof 🌟"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ─── FLOATING TELEGRAM CUSTOMER SUPPORT ─── */}
      <CustomerSupportButton />
    </div>
  );
}
