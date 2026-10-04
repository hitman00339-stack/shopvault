"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { formatINR, getPlatformConfig, formatDateTime } from "@/lib/utils";

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
  createdAt: string;
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
      if (data.success) setMySubmissions(data.data);
    } catch {}
  };

  const handleSubmit = async (formType: "FORM1" | "FORM2") => {
    const formData = formType === "FORM1" ? form1Data : form2Data;
    const template = formType === "FORM1" ? deal?.form1 : deal?.form2;

    if (!template) {
      toast.error("Form not configured for this deal");
      return;
    }

    // Validate required fields
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

      // Switch to instructions tab after successful submission
      setActiveTab("instructions");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Dynamic Form Field Renderer ───
  const renderField = (
    field: FormField,
    formData: Record<string, string>,
    setFormData: React.Dispatch<React.SetStateAction<Record<string, string>>>
  ) => {
    const value = formData[field.label] || "";
    const update = (val: string) => setFormData((prev) => ({ ...prev, [field.label]: val }));

    const baseInputClass = `w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm
      focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400
      transition-all duration-200 placeholder:text-gray-400 hover:border-gray-300`;

    switch (field.fieldType) {
      case "SHORT_ANSWER":
      case "EMAIL":
      case "PHONE":
      case "URL":
        return (
          <input
            type={field.fieldType === "EMAIL" ? "email" : field.fieldType === "PHONE" ? "tel" : "text"}
            value={value}
            onChange={(e) => update(e.target.value)}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            className={baseInputClass}
          />
        );

      case "NUMBER":
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => update(e.target.value)}
            placeholder={field.placeholder || "0"}
            className={baseInputClass}
          />
        );

      case "DATE":
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => update(e.target.value)}
            className={baseInputClass}
          />
        );

      case "LONG_ANSWER":
        return (
          <textarea
            value={value}
            onChange={(e) => update(e.target.value)}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            rows={4}
            className={`${baseInputClass} resize-none`}
          />
        );

      case "DROPDOWN":
        const options = field.options ? JSON.parse(field.options) : [];
        return (
          <select
            value={value}
            onChange={(e) => update(e.target.value)}
            className={baseInputClass}
          >
            <option value="">Select {field.label}</option>
            {options.map((opt: string) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );

      case "FILE_UPLOAD":
        return (
          <div className="relative">
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  if (file.size > 5 * 1024 * 1024) {
                    toast.error("File must be under 5MB");
                    return;
                  }
                  // Convert to base64 for simple storage (in production, use Cloudinary)
                  const reader = new FileReader();
                  reader.onload = () => update(reader.result as string);
                  reader.readAsDataURL(file);
                }
              }}
              className="hidden"
              id={`file-${field.id}`}
            />
            <label
              htmlFor={`file-${field.id}`}
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl
                hover:border-brand-400 hover:bg-brand-50/50 cursor-pointer transition-all duration-200"
            >
              {value ? (
                <div className="text-center">
                  <p className="text-sm font-semibold text-green-600">✅ File uploaded</p>
                  <p className="text-xs text-gray-400 mt-1">Click to change</p>
                </div>
              ) : (
                <div className="text-center">
                  <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-sm text-gray-500 font-medium">Click to upload screenshot</p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
                </div>
              )}
            </label>
          </div>
        );

      default:
        return <input type="text" value={value} onChange={(e) => update(e.target.value)} className={baseInputClass} />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <svg className="animate-spin w-8 h-8 text-brand-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
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
    <div className="animate-fade-in max-w-4xl mx-auto">
      {/* Back Link */}
      <Link href="/deals" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand-600 mb-6 transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Deals
      </Link>

      {/* ─── DEAL HEADER CARD ─── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm mb-6">
        <div className="flex flex-col md:flex-row">
          {/* Image */}
          <div className="md:w-80 h-64 md:h-auto bg-gradient-to-br from-gray-50 to-gray-100 flex-shrink-0 relative">
            {deal.imageUrl ? (
              <img src={deal.imageUrl} alt={deal.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-7xl">{platform.icon}</div>
            )}
            <div className={`absolute top-3 left-3 px-3 py-1.5 rounded-lg text-xs font-bold border ${platform.bgColor} ${platform.color}`}>
              {platform.label}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 p-6 sm:p-8">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">{deal.title}</h1>
            <p className="text-sm text-gray-400 mt-1">{deal.brandName}</p>

            <div className="flex flex-wrap items-center gap-4 mt-4">
              <div>
                <p className="text-2xl font-bold text-gray-900">{formatINR(deal.productPrice)}</p>
                <p className="text-xs text-green-600 font-bold">100% Refund Guaranteed</p>
              </div>
              {deal.cashbackAmount > 0 && (
                <div className="px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm font-bold text-green-700">+ {formatINR(deal.cashbackAmount)} Bonus</p>
                </div>
              )}
            </div>

            {deal.searchKeyword && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-xs font-semibold text-amber-700">🔍 Search this keyword on {platform.label}:</p>
                <p className="text-sm font-bold text-amber-900 mt-1">"{deal.searchKeyword}"</p>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 mt-5">
              <a
                href={deal.productUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 bg-gradient-to-r from-brand-600 to-brand-700 text-white text-sm font-semibold rounded-xl
                  shadow-lg shadow-brand-500/20 hover:shadow-xl active:scale-[0.98] transition-all"
              >
                🛒 Buy on {platform.label}
              </a>
              <div className={`px-3 py-2 rounded-xl text-xs font-bold border ${
                slotsLeft <= 0 ? "bg-red-50 text-red-600 border-red-200" : "bg-green-50 text-green-600 border-green-200"
              }`}>
                {slotsLeft <= 0 ? "❌ Slots Full" : `✅ ${slotsLeft}/${deal.totalSlots} slots left`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── MY SUBMISSIONS STATUS ─── */}
      {mySubmissions.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-3">📋 Your Submission Status</h3>
          <div className="space-y-2">
            {mySubmissions.map((sub) => (
              <div key={sub.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                <div>
                  <p className="text-sm font-semibold text-gray-700">
                    {sub.formType === "FORM1" ? "📦 Order Details" : "⭐ Review Proof"}
                  </p>
                  <p className="text-xs text-gray-400">{formatDateTime(sub.createdAt)}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  sub.status === "APPROVED" ? "bg-green-100 text-green-700" :
                  sub.status === "REJECTED" ? "bg-red-100 text-red-700" :
                  sub.status === "UNDER_REVIEW" ? "bg-blue-100 text-blue-700" :
                  "bg-amber-100 text-amber-700"
                }`}>
                  {sub.status.replace("_", " ")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── TABS: Instructions | Form 1 | Form 2 ─── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        {/* Tab Headers */}
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {[
            { key: "instructions" as const, label: "📖 Instructions", always: true },
            { key: "form1" as const, label: "📦 Step 1: Order Details", always: true },
            { key: "form2" as const, label: "⭐ Step 2: Review Proof", always: true },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-4 text-sm font-semibold whitespace-nowrap border-b-2 transition-all ${
                activeTab === tab.key
                  ? "border-brand-600 text-brand-600 bg-brand-50/50"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              {tab.label}
              {tab.key === "form1" && hasForm1Submission && <span className="ml-1.5 text-green-500">✓</span>}
              {tab.key === "form2" && hasForm2Submission && <span className="ml-1.5 text-green-500">✓</span>}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6 sm:p-8">
          {/* ─── INSTRUCTIONS TAB ─── */}
          {activeTab === "instructions" && (
            <div className="space-y-6 animate-fade-in">
              <div className="p-5 bg-red-50 border border-red-200 rounded-xl">
                <h3 className="font-bold text-red-800 flex items-center gap-2">
                  <span className="text-lg">⚠️</span> STRICT INSTRUCTIONS — READ CAREFULLY
                </h3>
                <p className="text-sm text-red-700 mt-2">
                  Failure to follow these steps exactly may result in rejection of your submission.
                </p>
              </div>

              {deal.instructions ? (
                <div className="prose prose-sm max-w-none">
                  {deal.instructions.split("\n").map((line, i) => (
                    <p key={i} className="text-gray-700 text-sm leading-relaxed">{line}</p>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {[
                    { step: "1", title: "Search on " + platform.label, desc: `Open ${platform.label} app and search: "${deal.searchKeyword || deal.title}". Do NOT use direct link.` },
                    { step: "2", title: "Find the correct product", desc: `Look for brand "${deal.brandName}"${deal.sellerName ? ` and seller "${deal.sellerName}"` : ""}. Verify the price matches ${formatINR(deal.productPrice)}.` },
                    { step: "3", title: "Place order (Prepaid only)", desc: "Add to cart and pay using UPI/Card. COD orders will be rejected." },
                    { step: "4", title: "Submit Order Details", desc: "Come back here → Go to 'Step 1: Order Details' tab → Fill the form with your Order ID and screenshot." },
                    { step: "5", title: "Wait for delivery", desc: "Once product arrives, post a 5-star review with photos on " + platform.label + "." },
                    { step: "6", title: "Submit Review Proof", desc: "Go to 'Step 2: Review Proof' tab → Submit review link and screenshot." },
                  ].map((item) => (
                    <div key={item.step} className="flex gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="w-8 h-8 bg-brand-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {item.step}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm">{item.title}</h4>
                        <p className="text-sm text-gray-500 mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setActiveTab("form1")}
                  className="flex-1 py-3 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-all text-sm"
                >
                  Go to Step 1: Order Details →
                </button>
              </div>
            </div>
          )}

          {/* ─── FORM 1: ORDER DETAILS ─── */}
          {activeTab === "form1" && (
            <div className="animate-fade-in">
              {hasForm1Submission ? (
                <div className="text-center py-10">
                  <div className="text-5xl mb-3">✅</div>
                  <h3 className="text-lg font-bold text-gray-900">Order Details Already Submitted</h3>
                  <p className="text-sm text-gray-500 mt-1">Your submission is being reviewed by our team.</p>
                  <button
                    onClick={() => setActiveTab("form2")}
                    className="mt-4 px-6 py-2.5 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 transition-all"
                  >
                    Go to Step 2: Review Proof →
                  </button>
                </div>
              ) : deal.form1 && deal.form1.fields.length > 0 ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{deal.form1.name}</h3>
                    {deal.form1.description && (
                      <p className="text-sm text-gray-500 mt-1">{deal.form1.description}</p>
                    )}
                  </div>

                  {deal.form1.fields.map((field) => (
                    <div key={field.id} className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                        {field.label}
                        {field.isRequired && <span className="text-red-500">*</span>}
                      </label>
                      {renderField(field, form1Data, setForm1Data)}
                      {field.helpText && (
                        <p className="text-xs text-gray-400">{field.helpText}</p>
                      )}
                    </div>
                  ))}

                  <button
                    onClick={() => handleSubmit("FORM1")}
                    disabled={submitting}
                    className="w-full py-3.5 bg-gradient-to-r from-brand-600 to-brand-700 text-white font-semibold rounded-xl
                      shadow-lg shadow-brand-500/20 hover:shadow-xl active:scale-[0.98]
                      disabled:opacity-60 disabled:cursor-not-allowed transition-all text-sm"
                  >
                    {submitting ? "Submitting..." : "📦 Submit Order Details"}
                  </button>
                </div>
              ) : (
                <div className="text-center py-10 text-gray-500">
                  <p className="text-lg">📝 Form not configured yet</p>
                  <p className="text-sm mt-1">Please contact admin</p>
                </div>
              )}
            </div>
          )}

          {/* ─── FORM 2: REVIEW PROOF ─── */}
          {activeTab === "form2" && (
            <div className="animate-fade-in">
              {hasForm2Submission ? (
                <div className="text-center py-10">
                  <div className="text-5xl mb-3">🎉</div>
                  <h3 className="text-lg font-bold text-gray-900">Review Proof Submitted!</h3>
                  <p className="text-sm text-gray-500 mt-1">We'll verify and process your refund within 24-48 hours.</p>
                </div>
              ) : !hasForm1Submission ? (
                <div className="text-center py-10">
                  <div className="text-5xl mb-3">🔒</div>
                  <h3 className="text-lg font-bold text-gray-900">Complete Step 1 First</h3>
                  <p className="text-sm text-gray-500 mt-1">Submit your order details before submitting review proof.</p>
                  <button
                    onClick={() => setActiveTab("form1")}
                    className="mt-4 px-6 py-2.5 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 transition-all"
                  >
                    ← Go to Step 1
                  </button>
                </div>
              ) : deal.form2 && deal.form2.fields.length > 0 ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{deal.form2.name}</h3>
                    {deal.form2.description && (
                      <p className="text-sm text-gray-500 mt-1">{deal.form2.description}</p>
                    )}
                  </div>

                  {deal.form2.fields.map((field) => (
                    <div key={field.id} className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                        {field.label}
                        {field.isRequired && <span className="text-red-500">*</span>}
                      </label>
                      {renderField(field, form2Data, setForm2Data)}
                      {field.helpText && (
                        <p className="text-xs text-gray-400">{field.helpText}</p>
                      )}
                    </div>
                  ))}

                  <button
                    onClick={() => handleSubmit("FORM2")}
                    disabled={submitting}
                    className="w-full py-3.5 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-xl
                      shadow-lg shadow-green-500/20 hover:shadow-xl active:scale-[0.98]
                      disabled:opacity-60 disabled:cursor-not-allowed transition-all text-sm"
                  >
                    {submitting ? "Submitting..." : "⭐ Submit Review Proof"}
                  </button>
                </div>
              ) : (
                <div className="text-center py-10 text-gray-500">
                  <p className="text-lg">📝 Form not configured yet</p>
                  <p className="text-sm mt-1">Please contact admin</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}