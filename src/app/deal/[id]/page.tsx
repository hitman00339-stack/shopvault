"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { formatINR, getPlatformConfig } from "@/lib/utils";

interface FormField {
  id: string;
  label: string;
  fieldType: string;
  placeholder: string | null;
  helpText: string | null;
  isRequired: boolean;
  options: string | null;
  sortOrder: number;
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

export default function DealDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dealId = params.id as string;

  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"instructions" | "form1" | "form2">("instructions");
  const [form1Data, setForm1Data] = useState<Record<string, string>>({});
  const [form2Data, setForm2Data] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [mySubmissions, setMySubmissions] = useState<any[]>([]);

  useEffect(() => {
    fetchDeal();
    fetchMySubmissions();
  }, [dealId]);

  const fetchDeal = async () => {
    try {
      const res = await fetch(`/api/deals`);
      const data = await res.json();
      if (data.success) {
        const found = data.data.find((d: Deal) => d.id === dealId);
        if (found) setDeal(found);
        else toast.error("Deal not found");
      }
    } catch {
      toast.error("Failed to load deal");
    } finally {
      setLoading(false);
    }
  };

  const fetchMySubmissions = async () => {
    try {
      const res = await fetch(`/api/submissions?dealId=${dealId}`);
      const data = await res.json();
      if (data.success) setMySubmissions(data.data || []);
    } catch {}
  };

  const handleSubmit = async (formType: "FORM1" | "FORM2") => {
    const formData = formType === "FORM1" ? form1Data : form2Data;
    const template = formType === "FORM1" ? deal?.form1 : deal?.form2;

    if (!template) {
      toast.error("Form not configured for this deal");
      return;
    }

    for (const field of template.fields) {
      if (field.isRequired && !formData[field.label]?.trim()) {
        toast.error(`"${field.label}" is required`);
        return;
      }
    }

    setSubmitting(true);

    try {
      const submissionData = template.fields.map((field) => ({
        fieldLabel: field.label,
        fieldType: field.fieldType,
        value: formData[field.label] || "",
      }));

      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dealId,
          formType,
          formData: submissionData,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Submission failed");
        return;
      }

      toast.success(data.message || "Submitted successfully! 🎉");
      fetchMySubmissions();
      setActiveTab("instructions");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-gray-400">Loading deal details...</div>;
  }

  if (!deal) {
    return (
      <div className="text-center py-20">
        <p className="text-lg font-semibold text-gray-700">Deal not found</p>
        <Link href="/deals" className="text-brand-600 text-sm mt-2 inline-block hover:underline">← Back to deals</Link>
      </div>
    );
  }

  const platform = getPlatformConfig(deal.platform);
  const slotsLeft = deal.totalSlots - deal.usedSlots;
  const hasForm1Submission = mySubmissions.some((s) => s.formType === "FORM1" && s.status !== "REJECTED");
  const hasForm2Submission = mySubmissions.some((s) => s.formType === "FORM2" && s.status !== "REJECTED");

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/deals" className="inline-block text-sm text-gray-500 hover:text-brand-600 mb-6">
          ← Back to Deals
        </Link>

        {/* DEAL CARD */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${platform.bgColor} ${platform.color}`}>
                {platform.label}
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mt-3">{deal.title}</h1>
              <p className="text-sm text-gray-400">{deal.brandName}</p>

              <div className="mt-4 flex items-center gap-4">
                <span className="text-2xl font-bold text-gray-900">{formatINR(deal.productPrice)}</span>
                <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
                  100% Refund{deal.cashbackAmount > 0 ? ` + ${formatINR(deal.cashbackAmount)} Bonus` : ""}
                </span>
              </div>
            </div>

            <a
              href={deal.productUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 bg-brand-600 text-white font-semibold rounded-xl text-sm hover:bg-brand-700 shadow-md transition-all whitespace-nowrap"
            >
              🛒 Buy on {platform.label}
            </a>
          </div>

          {deal.searchKeyword && (
            <div className="mt-5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-xs font-semibold text-amber-800">🔍 Search keyword on {platform.label}:</p>
              <p className="text-sm font-bold text-amber-950 mt-0.5">"{deal.searchKeyword}"</p>
            </div>
          )}
        </div>

        {/* TABS */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="flex border-b border-gray-100 overflow-x-auto">
            {[
              { key: "instructions" as const, label: "📖 Instructions" },
              { key: "form1" as const, label: "📦 Step 1: Order Details" },
              { key: "form2" as const, label: "⭐ Step 2: Review Proof" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-5 py-4 text-sm font-semibold whitespace-nowrap border-b-2 transition-all ${
                  activeTab === tab.key
                    ? "border-brand-600 text-brand-600 bg-brand-50/50"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
                {tab.key === "form1" && hasForm1Submission && " ✓"}
                {tab.key === "form2" && hasForm2Submission && " ✓"}
              </button>
            ))}
          </div>

          <div className="p-6 sm:p-8">
            {activeTab === "instructions" && (
              <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
                <p className="font-bold text-red-600">⚠️ READ CAREFULLY BEFORE BUYING:</p>
                <p>1. Open {platform.label} app and search: <strong>"{deal.searchKeyword || deal.title}"</strong>.</p>
                <p>2. Find brand <strong>"{deal.brandName}"</strong>.</p>
                <p>3. Buy using Prepaid payment methods only.</p>
                <p>4. Submit Order Details in Step 1 tab after ordering.</p>
                <p>5. Submit Review Proof in Step 2 tab after posting 5-star review.</p>

                <button
                  onClick={() => setActiveTab("form1")}
                  className="mt-4 px-5 py-2.5 bg-brand-600 text-white font-semibold text-xs rounded-xl"
                >
                  Proceed to Step 1: Order Details →
                </button>
              </div>
            )}

            {activeTab === "form1" && (
              <div>
                {hasForm1Submission ? (
                  <p className="text-center py-8 text-green-600 font-bold">✅ Order Details Already Submitted!</p>
                ) : deal.form1?.fields?.length ? (
                  <div className="space-y-4">
                    {deal.form1.fields.map((f) => (
                      <div key={f.id} className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-700">{f.label} {f.isRequired && "*"}</label>
                        <input
                          type="text"
                          onChange={(e) => setForm1Data((p) => ({ ...p, [f.label]: e.target.value }))}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm"
                          placeholder={f.placeholder || ""}
                        />
                      </div>
                    ))}
                    <button
                      onClick={() => handleSubmit("FORM1")}
                      disabled={submitting}
                      className="w-full py-3 bg-brand-600 text-white font-semibold rounded-xl text-sm"
                    >
                      {submitting ? "Submitting..." : "Submit Order Details"}
                    </button>
                  </div>
                ) : (
                  <p className="text-center py-8 text-gray-400">Form not configured for this deal</p>
                )}
              </div>
            )}

            {activeTab === "form2" && (
              <div>
                {hasForm2Submission ? (
                  <p className="text-center py-8 text-green-600 font-bold">⭐ Review Proof Already Submitted!</p>
                ) : deal.form2?.fields?.length ? (
                  <div className="space-y-4">
                    {deal.form2.fields.map((f) => (
                      <div key={f.id} className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-700">{f.label} {f.isRequired && "*"}</label>
                        <input
                          type="text"
                          onChange={(e) => setForm2Data((p) => ({ ...p, [f.label]: e.target.value }))}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm"
                          placeholder={f.placeholder || ""}
                        />
                      </div>
                    ))}
                    <button
                      onClick={() => handleSubmit("FORM2")}
                      disabled={submitting}
                      className="w-full py-3 bg-green-600 text-white font-semibold rounded-xl text-sm"
                    >
                      {submitting ? "Submitting..." : "Submit Review Proof"}
                    </button>
                  </div>
                ) : (
                  <p className="text-center py-8 text-gray-400">Form not configured for this deal</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
