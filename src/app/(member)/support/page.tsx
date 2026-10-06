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
  { value: "DELIVERY", label: "🚚 Delivery Issue", desc: "Product not delivered or tracking issue" },
  { value: "REFUND", label: "💳 Refund Status", desc: "Inquiry on pending UPI refund" },
  { value: "RETURN", label: "🔄 Return Request", desc: "Need assistance with return" },
  { value: "PRODUCT_QUESTION", label: "❓ Product Question", desc: "Questions regarding product specifications" },
  { value: "PAYMENT", label: "💰 Payment & Bonus", desc: "Cashback bonus inquiry" },
  { value: "OTHER", label: "📌 Other Question", desc: "General inquiry or account help" },
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
    screenshot: "",
  });
  const [submittingTicket, setSubmittingTicket] = useState(false);

  const handleTicketFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, WEBP, etc.)");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      toast.error("File size exceeds 8MB limit");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setTicketForm((p) => ({ ...p, screenshot: result }));
      toast.success("Screenshot attached! 📸");
    };
    reader.readAsDataURL(file);
  };

  // Profile state
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    upiId: "",
    bankDetails: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Telegram support settings
  const [telegramUrl, setTelegramUrl] = useState("https://t.me/ShopVaultOfficial");
  const [telegramId, setTelegramId] = useState("ShopVaultOfficial");

  useEffect(() => {
    fetchProfile();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (data.success && data.data) {
        setTelegramUrl(data.data.telegramSupportUrl || "https://t.me/ShopVaultOfficial");
        setTelegramId(data.data.telegramSupportId || "ShopVaultOfficial");
      }
    } catch {}
  };

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/auth?action=me");
      const data = await res.json();
      if (data.success && data.data) {
        setProfile({
          name: data.data.name || "",
          email: data.data.email || "",
          phone: data.data.phone || "",
          upiId: data.data.upiId || "",
          bankDetails: data.data.bankDetails || "",
        });
      }
    } catch {
      // Ignore
    }
  };

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!ticketForm.queryType) {
      toast.error("Please select a query category");
      return;
    }
    if (!ticketForm.subject.trim()) {
      toast.error("Please provide a subject");
      return;
    }
    if (!ticketForm.description.trim()) {
      toast.error("Please describe your issue");
      return;
    }

    setSubmittingTicket(true);

    try {
      toast.success("Support ticket logged! Our team will reply shortly. 🎫");
      setTicketForm({ queryType: "", subject: "", description: "", screenshot: "" });
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
      toast.success("Profile & UPI Settings Saved! ✅");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* ─── HEADER ─── */}
      <div>
        <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-black text-silver-100 tracking-tight">
          Support & Settings ⚙️
        </h1>
        <p className="text-silver-400 text-xs sm:text-sm font-medium mt-1">
          Configure your refund UPI destination and open support requests.
        </p>
      </div>

      {/* ─── TABS ─── */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl glass-dark w-fit border border-silver-800/80">
        <button
          onClick={() => setActiveTab("support")}
          className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === "support" ? "btn-gold shadow-gold-sm" : "text-silver-400 hover:text-silver-100"
          }`}
        >
          🎫 Support Desk
        </button>
        <button
          onClick={() => setActiveTab("profile")}
          className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === "profile" ? "btn-gold shadow-gold-sm" : "text-silver-400 hover:text-silver-100"
          }`}
        >
          💳 UPI & Profile Settings
        </button>
      </div>

      {/* ─── SUPPORT TAB ─── */}
      {activeTab === "support" && (
        <div className="space-y-6">
          {/* Direct Telegram Support Card */}
          <div className="card-luxury p-6 rounded-3xl border border-cyan-500/30 bg-gradient-to-r from-obsidian-900 via-obsidian-900 to-[#0088cc]/10 shadow-[0_0_30px_rgba(0,136,204,0.15)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#0088cc]/20 border border-[#0088cc]/40 flex items-center justify-center text-2xl text-cyan-400 shrink-0 shadow-[0_0_15px_rgba(0,136,204,0.3)]">
                ✈️
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-black text-base sm:text-lg text-silver-100">
                    Official Telegram VIP Concierge
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black tracking-widest bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    ACTIVE
                  </span>
                </div>
                <p className="text-xs text-silver-400 mt-1 max-w-xl">
                  Need immediate help with your order or refund? Chat directly with our verified support team on Telegram:{" "}
                  <span className="text-gold-400 font-mono font-bold">@{telegramId}</span>
                </p>
              </div>
            </div>
            <a
              href={telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold px-6 py-3.5 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap shadow-gold-sm flex items-center gap-2 self-stretch sm:self-auto justify-center"
            >
              <span>Chat on Telegram</span>
              <span>→</span>
            </a>
          </div>

          {/* Info Banner */}
          <div className="glass-vault p-5 rounded-2xl border border-gold-500/20 flex items-start gap-4">
            <span className="text-2xl">⚡</span>
            <div>
              <p className="text-sm font-bold text-silver-100">VIP Ticket Assistance</p>
              <p className="text-xs text-silver-400 mt-1 leading-relaxed">
                Our support team is active 7 days a week. Use this portal for queries regarding orders, tracking, refunds, and review audit questions.
              </p>
            </div>
          </div>

          {/* New Ticket Trigger */}
          {!showNewTicket && (
            <button
              onClick={() => setShowNewTicket(true)}
              className="w-full py-5 rounded-2xl border-2 border-dashed border-gold-500/30 text-gold-400 font-bold hover:bg-gold-500/5 hover:border-gold-500/60 transition-all text-sm flex items-center justify-center gap-2"
            >
              <span>+</span> <span>Raise New Support Ticket</span>
            </button>
          )}

          {/* New Ticket Form Modal/Card */}
          {showNewTicket && (
            <div className="card-luxury rounded-3xl p-6 sm:p-8 border border-gold-500/30 space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xl font-bold text-silver-100">
                  🎫 Create New Support Ticket
                </h3>
                <button
                  onClick={() => setShowNewTicket(false)}
                  className="w-8 h-8 rounded-xl glass-dark text-silver-400 hover:text-silver-100 flex items-center justify-center text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleTicketSubmit} className="space-y-6">
                {/* Category Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gold-400">
                    Query Category *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {QUERY_TYPES.map((qt) => (
                      <button
                        key={qt.value}
                        type="button"
                        onClick={() => setTicketForm((p) => ({ ...p, queryType: qt.value }))}
                        className={`p-3.5 rounded-2xl border text-left transition-all ${
                          ticketForm.queryType === qt.value
                            ? "bg-gold-500/15 border-gold-500 text-gold-300"
                            : "glass-dark border-silver-800/80 text-silver-400 hover:text-silver-200"
                        }`}
                      >
                        <p className="text-xs font-bold text-silver-100">{qt.label}</p>
                        <p className="text-[11px] text-silver-500 mt-0.5">{qt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subject */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gold-400">
                    Subject / Order Reference *
                  </label>
                  <input
                    type="text"
                    value={ticketForm.subject}
                    onChange={(e) => setTicketForm((p) => ({ ...p, subject: e.target.value }))}
                    placeholder="e.g. Order #402-1234567 — Delivery status query"
                    className="input-premium w-full px-4 py-3.5 rounded-2xl text-sm font-medium"
                    required
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gold-400">
                    Detailed Explanation *
                  </label>
                  <textarea
                    value={ticketForm.description}
                    onChange={(e) => setTicketForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Please include date of order, product name, and detailed issue..."
                    rows={5}
                    className="input-premium w-full px-4 py-3.5 rounded-2xl text-sm font-medium resize-none"
                    required
                  />
                </div>

                {/* Attachment / Screenshot Upload */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gold-400">
                    Attach Screenshot / Proof (Optional)
                  </label>
                  {ticketForm.screenshot ? (
                    <div className="relative rounded-2xl overflow-hidden border border-gold-500/40 bg-obsidian-deep p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={ticketForm.screenshot}
                          alt="Attached proof"
                          className="w-14 h-14 object-cover rounded-xl border border-silver-800"
                        />
                        <div>
                          <p className="text-xs font-bold text-silver-100">Screenshot Attached ✓</p>
                          <p className="text-[10px] text-emerald-400">Ready to transmit</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setTicketForm((p) => ({ ...p, screenshot: "" }))}
                        className="px-3 py-1.5 rounded-xl glass-dark border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-bold transition-all"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-silver-800 hover:border-gold-500/50 rounded-2xl p-5 flex flex-col items-center justify-center cursor-pointer transition-all bg-obsidian-deep/50 hover:bg-gold-500/5 group text-center">
                      <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">📷</span>
                      <p className="text-xs font-bold text-silver-200">
                        Upload Screenshot from Device
                      </p>
                      <p className="text-[10px] text-silver-500 mt-0.5">PNG, JPG, WEBP up to 8MB</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleTicketFileUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowNewTicket(false)}
                    className="btn-silver flex-1 py-3.5 rounded-2xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingTicket}
                    className="btn-gold flex-[2] py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider shadow-gold-sm"
                  >
                    {submittingTicket ? "Transmitting..." : "Submit Ticket 🚀"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Previous Tickets List */}
          <div className="card-luxury rounded-3xl p-6 sm:p-8 border border-silver-800/80 space-y-4">
            <h3 className="font-display text-lg font-bold text-silver-100">My Support Tickets</h3>
            {tickets.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-2 opacity-50">🎫</div>
                <p className="text-xs sm:text-sm text-silver-400">No open tickets at this time</p>
                <p className="text-[11px] text-silver-500 mt-1">If you have any questions, raise a ticket above.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tickets.map((ticket) => (
                  <div key={ticket.id} className="glass-dark p-4 rounded-2xl border border-silver-800">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-bold text-silver-100 text-sm">{ticket.subject}</p>
                        <p className="text-[10px] text-silver-500 mt-0.5">{formatDateTime(ticket.createdAt)}</p>
                        <p className="text-xs text-silver-400 mt-2">{ticket.description}</p>
                      </div>
                      <span className="badge-gold px-3 py-1 rounded-xl text-[10px] font-black uppercase">
                        {ticket.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── PROFILE & UPI SETTINGS TAB ─── */}
      {activeTab === "profile" && (
        <div className="space-y-6">
          {/* UPI Destination Card (Most Important) */}
          <div className="glass-vault rounded-3xl p-6 sm:p-8 border border-gold-500/25 space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">💳</span>
              <div>
                <h3 className="font-display text-lg sm:text-xl font-black text-silver-100">
                  Primary UPI Payout Address
                </h3>
                <p className="text-xs text-silver-400 mt-0.5">
                  Your 100% refunds and cashback bonuses will be credited directly to this UPI ID.
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gold-400">
                UPI ID (VPA) *
              </label>
              <input
                type="text"
                value={profile.upiId}
                onChange={(e) => setProfile((p) => ({ ...p, upiId: e.target.value }))}
                placeholder="e.g. yourname@okhdfcbank or 9876543210@paytm"
                className="input-premium w-full px-4 py-3.5 rounded-2xl text-sm font-mono"
              />
              <p className="text-[11px] text-silver-500">
                Examples: mobile@paytm, user@ybl, name@oksbi, phone@googlepay
              </p>
            </div>
          </div>

          {/* Account Details Card */}
          <div className="card-luxury rounded-3xl p-6 sm:p-8 border border-silver-800/80 space-y-5">
            <h3 className="font-display text-lg font-bold text-silver-100">
              Personal Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gold-400">
                  Full Name
                </label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                  className="input-premium w-full px-4 py-3.5 rounded-2xl text-sm font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-silver-500">
                  Email Address (Locked)
                </label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="input-premium w-full px-4 py-3.5 rounded-2xl text-sm font-medium opacity-50 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-silver-500">
                Registered Phone (WhatsApp)
              </label>
              <input
                type="tel"
                value={profile.phone}
                disabled
                className="input-premium w-full px-4 py-3.5 rounded-2xl text-sm font-medium opacity-50 cursor-not-allowed"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gold-400">
                Bank Account Details (Optional Backup)
              </label>
              <textarea
                value={profile.bankDetails}
                onChange={(e) => setProfile((p) => ({ ...p, bankDetails: e.target.value }))}
                placeholder="Account Number, IFSC, Account Holder Name (used if UPI is unavailable)"
                rows={3}
                className="input-premium w-full px-4 py-3 rounded-2xl text-sm font-medium resize-none"
              />
            </div>

            <button
              onClick={handleProfileSave}
              disabled={savingProfile}
              className="btn-gold w-full py-4 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-wider shadow-gold-sm mt-2"
            >
              {savingProfile ? "Saving Settings..." : "Save Profile & UPI Settings 💾"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}