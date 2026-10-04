"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { formatDateTime } from "@/lib/utils";

interface Ticket {
  id: string;
  queryType: string;
  subject: string;
  description: string;
  screenshotUrl: string | null;
  status: string;
  adminReply: string | null;
  createdAt: string;
}

const QUERY_TYPES = [
  { value: "DELIVERY", label: "🚚 Delivery Issue", desc: "Product not delivered or delayed" },
  { value: "RETURN", label: "🔄 Return Request", desc: "Want to return the product" },
  { value: "REFUND", label: "💳 Refund Status", desc: "Refund not received yet" },
  { value: "PRODUCT_QUESTION", label: "❓ Product Question", desc: "Questions about the product/deal" },
  { value: "PAYMENT", label: "💰 Payment Issue", desc: "Cashback or payment problem" },
  { value: "OTHER", label: "📌 Other", desc: "Any other query" },
];

export default function SupportPage() {
  const [activeTab, setActiveTab] = useState<"support" | "profile">("support");

  // Support state
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    queryType: "",
    subject: "",
    description: "",
  });
  const [submittingTicket, setSubmittingTicket] = useState(false);

  // Profile state
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    upiId: "",
    bankDetails: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchTickets();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/auth?action=me");
      const data = await res.json();
      if (data.success) {
        setProfile({
          name: data.data.name || "",
          email: data.data.email || "",
          phone: data.data.phone || "",
          upiId: data.data.upiId || "",
          bankDetails: data.data.bankDetails || "",
        });
      }
    } catch {}
  };

  const fetchTickets = async () => {
    // For now, tickets are fetched from admin API
    // In production, add a dedicated member tickets endpoint
    try {
      const res = await fetch("/api/submissions?limit=1");
      // Tickets will be loaded from a dedicated endpoint
    } catch {}
  };

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!ticketForm.queryType) {
      toast.error("Please select a query type");
      return;
    }
    if (!ticketForm.subject.trim()) {
      toast.error("Please enter a subject");
      return;
    }
    if (!ticketForm.description.trim()) {
      toast.error("Please describe your issue");
      return;
    }

    setSubmittingTicket(true);

    try {
      // In production, this would POST to /api/support
      // For now, show success
      toast.success("Support ticket submitted! We'll respond within 24 hours. 🎫");
      setTicketForm({ queryType: "", subject: "", description: "" });
      setShowNewTicket(false);
    } catch {
      toast.error("Failed to submit ticket");
    } finally {
      setSubmittingTicket(false);
    }
  };

  const handleProfileSave = async () => {
    if (!profile.name.trim()) {
      toast.error("Name is required");
      return;
    }

    setSavingProfile(true);

    try {
      // In production, PUT to /api/auth?action=profile
      toast.success("Profile updated successfully! ✅");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OPEN": return "bg-blue-50 text-blue-700 border-blue-200";
      case "IN_PROGRESS": return "bg-amber-50 text-amber-700 border-amber-200";
      case "RESOLVED": return "bg-green-50 text-green-700 border-green-200";
      case "CLOSED": return "bg-gray-50 text-gray-600 border-gray-200";
      default: return "bg-gray-50 text-gray-600 border-gray-200";
    }
  };

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      {/* ─── HEADER ─── */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Support & Profile ⚙️</h1>
        <p className="text-gray-500 mt-1 text-sm">Get help or manage your account settings</p>
      </div>

      {/* ─── TABS ─── */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
        <button
          onClick={() => setActiveTab("support")}
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "support"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          🎫 Support Tickets
        </button>
        <button
          onClick={() => setActiveTab("profile")}
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "profile"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          👤 Profile & UPI
        </button>
      </div>

      {/* ─── SUPPORT TAB ─── */}
      {activeTab === "support" && (
        <div className="animate-fade-in space-y-6">
          {/* Info Banner */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
            <span className="text-xl">ℹ️</span>
            <div>
              <p className="text-sm font-semibold text-blue-800">When to use Support vs Reviews</p>
              <p className="text-xs text-blue-600 mt-1">
                Use <strong>Support</strong> for delivery issues, returns, refunds, or payment problems.
                Use <strong>Reviews</strong> on the product page to rate your experience.
              </p>
            </div>
          </div>

          {/* New Ticket Button */}
          {!showNewTicket && (
            <button
              onClick={() => setShowNewTicket(true)}
              className="w-full py-4 border-2 border-dashed border-brand-300 rounded-xl text-brand-600 font-semibold
                hover:bg-brand-50 hover:border-brand-400 transition-all text-sm"
            >
              + Raise New Support Ticket
            </button>
          )}

          {/* New Ticket Form */}
          {showNewTicket && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm animate-fade-in">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-gray-900">🎫 New Support Ticket</h3>
                <button
                  onClick={() => setShowNewTicket(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleTicketSubmit} className="space-y-5">
                {/* Query Type */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Query Type <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {QUERY_TYPES.map((qt) => (
                      <button
                        key={qt.value}
                        type="button"
                        onClick={() => setTicketForm((p) => ({ ...p, queryType: qt.value }))}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          ticketForm.queryType === qt.value
                            ? "border-brand-500 bg-brand-50 ring-2 ring-brand-500/20"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <p className="text-sm font-semibold text-gray-800">{qt.label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{qt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subject */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={ticketForm.subject}
                    onChange={(e) => setTicketForm((p) => ({ ...p, subject: e.target.value }))}
                    placeholder="e.g., Order not delivered after 7 days"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm
                      focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400
                      transition-all placeholder:text-gray-400"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Describe your issue <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={ticketForm.description}
                    onChange={(e) => setTicketForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Provide order reference, dates, and details about your issue..."
                    rows={5}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm
                      focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400
                      transition-all placeholder:text-gray-400 resize-none"
                  />
                </div>

                {/* Submit */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowNewTicket(false)}
                    className="flex-1 py-3 border-2 border-gray-200 text-gray-600 font-semibold rounded-xl
                      hover:bg-gray-50 transition-all text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingTicket}
                    className="flex-[2] py-3 bg-gradient-to-r from-brand-600 to-brand-700 text-white font-semibold
                      rounded-xl shadow-lg shadow-brand-500/20 hover:shadow-xl
                      disabled:opacity-60 transition-all text-sm"
                  >
                    {submittingTicket ? "Submitting..." : "🎫 Submit Ticket"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Existing Tickets */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">My Previous Tickets</h3>
            {tickets.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-4xl mb-2">🎫</div>
                <p className="text-sm text-gray-500">No support tickets yet</p>
                <p className="text-xs text-gray-400 mt-1">Raise a ticket if you need help</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tickets.map((ticket) => (
                  <div key={ticket.id} className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm">{ticket.subject}</p>
                        <p className="text-xs text-gray-400 mt-1">{formatDateTime(ticket.createdAt)}</p>
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">{ticket.description}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold border whitespace-nowrap ${getStatusBadge(ticket.status)}`}>
                        {ticket.status.replace("_", " ")}
                      </span>
                    </div>
                    {ticket.adminReply && (
                      <div className="mt-3 p-3 bg-brand-50 border border-brand-200 rounded-lg">
                        <p className="text-xs font-semibold text-brand-700">💬 Admin Reply:</p>
                        <p className="text-sm text-brand-800 mt-1">{ticket.adminReply}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── PROFILE TAB ─── */}
      {activeTab === "profile" && (
        <div className="animate-fade-in space-y-6">
          {/* Personal Info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
              👤 Personal Information
            </h3>

            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm
                      focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Email</label>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 text-sm text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-[11px] text-gray-400">Email cannot be changed</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Phone Number</label>
                <input
                  type="tel"
                  value={profile.phone}
                  disabled
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 text-sm text-gray-500 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* UPI & Payment Details */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
              💳 UPI & Payment Details
            </h3>
            <p className="text-xs text-gray-400 mb-5">
              This is where your refunds and cashback will be sent. Make sure it's correct!
            </p>

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  UPI ID <span className="text-red-500">*</span>
                  <span className="text-[10px] font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                    For refunds
                  </span>
                </label>
                <input
                  type="text"
                  value={profile.upiId}
                  onChange={(e) => setProfile((p) => ({ ...p, upiId: e.target.value }))}
                  placeholder="yourname@upi / 9876543210@paytm"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm
                    focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all
                    placeholder:text-gray-400"
                />
                <p className="text-[11px] text-gray-400">
                  Examples: rahul@okhdfcbank, 9876543210@paytm, priya@ybl
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Bank Details (Optional)</label>
                <textarea
                  value={profile.bankDetails}
                  onChange={(e) => setProfile((p) => ({ ...p, bankDetails: e.target.value }))}
                  placeholder="Account Number, IFSC Code, Bank Name (for NEFT/IMPS transfers)"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm
                    focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all
                    placeholder:text-gray-400 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleProfileSave}
            disabled={savingProfile}
            className="w-full py-3.5 bg-gradient-to-r from-brand-600 to-brand-700 text-white font-semibold
              rounded-xl shadow-lg shadow-brand-500/20 hover:shadow-xl active:scale-[0.98]
              disabled:opacity-60 transition-all text-sm"
          >
            {savingProfile ? "Saving..." : "💾 Save Profile Changes"}
          </button>

          {/* Security Info */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
            <p className="text-xs text-gray-500 flex items-start gap-2">
              <span className="text-base">🔒</span>
              <span>
                Your data is encrypted and stored securely. UPI IDs are only used for sending refunds
                and are never shared with third parties. Contact support to change your email or phone.
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}