"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { formatINR, formatDateTime, formatDate } from "@/lib/utils";

// ─── TYPES ───
interface Deal {
  id: string; title: string; description: string | null; brandName: string;
  platform: string; productUrl: string; imageUrl: string | null;
  productPrice: number; cashbackAmount: number; searchKeyword: string | null;
  sellerName: string | null; totalSlots: number; usedSlots: number;
  instructions: string | null; status: string; isVisible: boolean;
  form1Id: string | null; form2Id: string | null;
  form1: FormTemplate | null; form2: FormTemplate | null;
  createdAt: string;
}

interface FormTemplate {
  id: string; name: string; description: string | null;
  fields: FormField[]; createdAt: string;
}

interface FormField {
  id: string; label: string; fieldType: string; placeholder: string | null;
  helpText: string | null; isRequired: boolean; options: string | null; sortOrder: number;
}

interface Submission {
  id: string; formType: string; status: string; adminNotes: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string; phone: string; upiId: string | null };
  deal: { id: string; title: string; brandName: string; platform: string; productPrice: number; cashbackAmount: number };
  formData: { id: string; fieldLabel: string; fieldType: string; value: string }[];
}

interface UserData {
  id: string; name: string; email: string; phone: string; upiId: string | null;
  isActive: boolean; createdAt: string;
  totalOrders: number; totalSpent: number; totalCashback: number; pendingCount: number;
  _count: { submissions: number; supportTickets: number };
}

type AdminTab = "dashboard" | "deals" | "forms" | "submissions" | "users" | "export" | "support";

const FIELD_TYPES = [
  { value: "SHORT_ANSWER", label: "Short Answer" },
  { value: "LONG_ANSWER", label: "Long Answer" },
  { value: "NUMBER", label: "Number" },
  { value: "DATE", label: "Date Picker" },
  { value: "FILE_UPLOAD", label: "File / Screenshot Upload" },
  { value: "DROPDOWN", label: "Dropdown Select" },
  { value: "EMAIL", label: "Email" },
  { value: "PHONE", label: "Phone" },
  { value: "URL", label: "URL / Link" },
];

const PLATFORMS = ["AMAZON", "FLIPKART", "MYNTRA", "MEESHO", "NYKAA", "AJIO", "OTHER"];

// Helper for sleek status badges
const getStatusBadge = (status: string) => {
  switch (status) {
    case "APPROVED": return "badge-success";
    case "REJECTED": return "badge-danger";
    case "PENDING": return "badge-gold animate-pulse";
    case "UNDER_REVIEW": return "badge-silver";
    case "ACTIVE": return "badge-success";
    case "EXPIRED": return "badge-danger";
    default: return "badge-silver";
  }
};

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  const [stats, setStats] = useState<any>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [forms, setForms] = useState<FormTemplate[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);

  const [editingForm, setEditingForm] = useState<FormTemplate | null>(null);
  const [formBuilderFields, setFormBuilderFields] = useState<Partial<FormField>[]>([]);
  const [formBuilderName, setFormBuilderName] = useState("");
  const [formBuilderDesc, setFormBuilderDesc] = useState("");
  const [showFormBuilder, setShowFormBuilder] = useState(false);

  const [showDealEditor, setShowDealEditor] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [dealForm, setDealForm] = useState<any>({});

  const [subFilter, setSubFilter] = useState("ALL");
  const [exportType, setExportType] = useState("FULL");
  const [exportPlatform, setExportPlatform] = useState("");
  const [exportDateFrom, setExportDateFrom] = useState("");
  const [exportDateTo, setExportDateTo] = useState("");

  useEffect(() => { checkAuth(); }, []);
  useEffect(() => { loadTabData(); }, [activeTab]);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/auth?action=me");
      const data = await res.json();
      if (!data.success || data.data?.role !== "ADMIN") { router.push("/login"); return; }
      setUser(data.data);
    } catch { router.push("/login"); }
  };

  const loadTabData = async () => {
    try {
      if (activeTab === "dashboard") {
        const res = await fetch("/api/admin?action=stats");
        const data = await res.json();
        if (data.success) setStats(data.data);
      }
      if (activeTab === "deals") {
        const res = await fetch("/api/deals?limit=100");
        const data = await res.json();
        if (data.success) setDeals(data.data);
      }
      if (activeTab === "forms") {
        const res = await fetch("/api/admin?action=forms");
        const data = await res.json();
        if (data.success) setForms(data.data);
      }
      if (activeTab === "submissions") {
        const params = new URLSearchParams({ limit: "100" });
        if (subFilter !== "ALL") params.set("status", subFilter);
        const res = await fetch(`/api/submissions?${params}`);
        const data = await res.json();
        if (data.success) setSubmissions(data.data);
      }
      if (activeTab === "users") {
        const res = await fetch("/api/admin?action=users&limit=100");
        const data = await res.json();
        if (data.success) setUsers(data.data);
      }
    } catch (error) { console.error("Failed to load data:", error); }
  };

  const openDealEditor = (deal?: Deal) => {
    if (deal) {
      setEditingDeal(deal);
      setDealForm({ ...deal });
    } else {
      setEditingDeal(null);
      setDealForm({ platform: "AMAZON", productPrice: "", cashbackAmount: "0", totalSlots: "50" });
    }
    setShowDealEditor(true);
  };

  const saveDeal = async () => {
    if (!dealForm.title || !dealForm.brandName || !dealForm.productUrl || !dealForm.productPrice) {
      toast.error("Required fields missing"); return;
    }
    try {
      const url = editingDeal ? `/api/deals?id=${editingDeal.id}` : "/api/deals";
      const method = editingDeal ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...dealForm,
          productPrice: parseFloat(dealForm.productPrice),
          cashbackAmount: parseFloat(dealForm.cashbackAmount || "0"),
          totalSlots: parseInt(dealForm.totalSlots || "50"),
          form1Id: dealForm.form1Id || null,
          form2Id: dealForm.form2Id || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success(editingDeal ? "Deal Updated 🌟" : "Deal Created 🌟");
      setShowDealEditor(false);
      loadTabData();
    } catch { toast.error("Failed to save deal"); }
  };

  const toggleDealVisibility = async (deal: Deal) => {
    try {
      await fetch(`/api/deals?id=${deal.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVisible: !deal.isVisible, status: deal.isVisible ? "EXPIRED" : "ACTIVE" }),
      });
      toast.success(deal.isVisible ? "Deal Hidden" : "Deal Restored");
      loadTabData();
    } catch { toast.error("Failed"); }
  };

  const openFormBuilder = (form?: FormTemplate) => {
    if (form) {
      setEditingForm(form); setFormBuilderName(form.name); setFormBuilderDesc(form.description || "");
      setFormBuilderFields(form.fields.map((f) => ({ ...f, options: f.options ? JSON.parse(f.options) : [] })));
    } else {
      setEditingForm(null); setFormBuilderName(""); setFormBuilderDesc("");
      setFormBuilderFields([{ label: "", fieldType: "SHORT_ANSWER", isRequired: true, sortOrder: 0 }]);
    }
    setShowFormBuilder(true);
  };

  const addFormField = () => setFormBuilderFields((p) => [...p, { label: "", fieldType: "SHORT_ANSWER", isRequired: true, sortOrder: p.length }]);
  const removeFormField = (index: number) => setFormBuilderFields((p) => p.filter((_, i) => i !== index));
  const updateFormField = (index: number, key: string, value: any) => {
    setFormBuilderFields((p) => { const n = [...p]; n[index] = { ...n[index], [key]: value }; return n; });
  };
  const moveField = (idx: number, dir: "up" | "down") => {
    setFormBuilderFields((p) => {
      const n = [...p]; const tgt = dir === "up" ? idx - 1 : idx + 1;
      if (tgt < 0 || tgt >= n.length) return p;
      [n[idx], n[tgt]] = [n[tgt], n[idx]]; return n;
    });
  };

  const saveForm = async () => {
    if (!formBuilderName.trim() || formBuilderFields.length === 0) { toast.error("Name and fields required"); return; }
    try {
      const res = await fetch("/api/admin?action=form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingForm?.id, name: formBuilderName, description: formBuilderDesc,
          fields: formBuilderFields.map((f, i) => ({ ...f, sortOrder: i, options: f.options?.length ? f.options : null })),
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success("Form Saved 📝");
      setShowFormBuilder(false); loadTabData();
    } catch { toast.error("Failed to save"); }
  };

  const updateSubmissionStatus = async (id: string, status: string, notes?: string) => {
    try {
      const res = await fetch("/api/submissions", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, adminNotes: notes }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Marked as ${status}`);
      loadTabData();
    } catch { toast.error("Action failed"); }
  };

  const toggleUserActive = async (userId: string, isActive: boolean) => {
    try {
      await fetch("/api/admin?action=toggle-user", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isActive }),
      });
      toast.success(isActive ? "User Restored" : "User Banned");
      loadTabData();
    } catch { toast.error("Failed"); }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({ type: exportType });
      if (exportPlatform) params.set("platform", exportPlatform);
      if (exportDateFrom) params.set("dateFrom", exportDateFrom);
      if (exportDateTo) params.set("dateTo", exportDateTo);

      const res = await fetch(`/api/admin?action=export&${params}`);
      const data = await res.json();
      if (!data.success || !data.data?.length) { toast.error("No data found"); return; }

      const headers = Object.keys(data.data[0]);
      const csvRows = [headers.join(","), ...data.data.map((row: any) => headers.map((h) => `"${String(row[h] || "").replace(/"/g, '""')}"`).join(","))];
      const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a"); link.href = url;
      link.download = `ShopVault_Export_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      toast.success("Export Downloaded 📥");
    } catch { toast.error("Export Failed"); }
  };

  const navItems: { key: AdminTab; label: string; icon: string; badge?: number }[] = [
    { key: "dashboard", label: "Overview", icon: "📊" },
    { key: "deals", label: "Campaigns", icon: "🏷️", badge: deals.length },
    { key: "forms", label: "Form Builder", icon: "📝" },
    { key: "submissions", label: "Queue", icon: "⚡", badge: submissions.filter((s) => s.status === "PENDING").length },
    { key: "users", label: "Members", icon: "👥", badge: users.length },
    { key: "export", label: "Data Export", icon: "📤" },
    { key: "support", label: "Tickets", icon: "🎫" },
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-obsidian-deep flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidian-deep flex text-silver-100 font-sans">
      {/* ─── SIDEBAR ─── */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/80 z-40 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />}
      
      <aside className={`fixed lg:sticky top-0 left-0 z-50 lg:z-auto h-screen w-72 glass-dark border-r border-gold-500/20
        flex flex-col transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1) ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        
        {/* Sidebar Logo */}
        <div className="p-6 border-b border-silver-800/50">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="SV" className="w-12 h-12 object-contain drop-shadow-[0_0_15px_rgba(245,166,35,0.6)]" />
            <div>
              <h1 className="font-display font-black text-xl leading-none tracking-tight">
                <span className="text-silver-gradient">SHOP</span>
                <span className="text-gold-gradient">VAULT</span>
              </h1>
              <p className="text-[10px] text-gold-500 font-bold uppercase tracking-[0.2em] mt-1">Command Center</p>
            </div>
          </div>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto no-scrollbar">
          {navItems.map((item) => (
            <button key={item.key} onClick={() => { setActiveTab(item.key); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 ${
                activeTab === item.key ? "bg-gradient-to-r from-gold-500/20 to-transparent text-gold-400 border-l-2 border-gold-500" : "text-silver-500 hover:text-silver-200 hover:bg-white/5"
              }`}>
              <span className="text-xl drop-shadow-md">{item.icon}</span>
              <span className="flex-1 text-left tracking-wide">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className={`px-2.5 py-1 rounded-full text-[9px] font-black tracking-widest ${
                  item.key === "submissions" ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-white/10 text-silver-300"
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Sidebar User */}
        <div className="p-5 border-t border-silver-800/50 bg-black/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-500 to-gold-700 flex items-center justify-center text-obsidian-deep font-black text-sm shadow-[0_0_15px_rgba(245,166,35,0.3)]">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-silver-100 truncate">{user.name}</p>
              <p className="text-[10px] text-gold-500 font-bold uppercase tracking-widest">Super Admin</p>
            </div>
          </div>
          <button onClick={async () => { await fetch("/api/auth?action=logout", { method: "POST" }); router.push("/login"); }}
            className="w-full py-2.5 rounded-xl border border-silver-800 text-xs font-bold text-silver-400 hover:text-white hover:bg-white/5 transition-all">
            Secure Logout 🔒
          </button>
        </div>
      </aside>

      {/* ─── MAIN CONTENT ─── */}
      <main className="flex-1 min-w-0 relative">
        {/* Header */}
        <header className="sticky top-0 z-30 glass-dark border-b border-silver-800/50 px-6 lg:px-10 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-silver-400 hover:text-gold-400">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <h2 className="text-xl sm:text-2xl font-display font-black tracking-wide text-silver-100 flex items-center gap-3">
              {navItems.find((n) => n.key === activeTab)?.icon} {navItems.find((n) => n.key === activeTab)?.label}
            </h2>
          </div>
          <button onClick={loadTabData} className="btn-silver px-4 py-2 rounded-xl text-xs flex items-center gap-2">
            <span>⟳</span> <span className="hidden sm:inline">Sync Data</span>
          </button>
        </header>

        <div className="p-6 lg:p-10 space-y-8 pb-32">
          
          {/* ═════════ DASHBOARD ═════════ */}
          {activeTab === "dashboard" && stats && (
            <div className="animate-fade-in-up space-y-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                {[
                  { label: "Total Members", value: stats.totalUsers, icon: "👥" },
                  { label: "Active Deals", value: stats.activeDeals, icon: "🏷️" },
                  { label: "Total Submits", value: stats.totalSubmissions, icon: "⚡" },
                  { label: "Pending Queue", value: stats.pendingSubmissions, icon: "⏳", alert: true },
                  { label: "Total Spent", value: formatINR(stats.totalReportedSpend), icon: "💳" },
                  { label: "Cashback Due", value: formatINR(stats.totalCashbackDue), icon: "💰" },
                  { label: "Approved", value: stats.approvedSubmissions, icon: "✅" },
                  { label: "Rejected", value: stats.rejectedSubmissions, icon: "❌" },
                ].map((s, i) => (
                  <div key={i} className="glass-dark p-6 rounded-3xl relative overflow-hidden group hover:border-gold-500/50 transition-all duration-300">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gold-500/5 rounded-full blur-2xl group-hover:bg-gold-500/10 transition-colors" />
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-3xl drop-shadow-lg">{s.icon}</span>
                      {s.alert && s.value > 0 && <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping shadow-[0_0_10px_rgba(239,68,68,0.8)]" />}
                    </div>
                    <p className="text-3xl font-black text-silver-100 tracking-tight">{s.value}</p>
                    <p className="text-[11px] font-bold text-silver-500 uppercase tracking-widest mt-1">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Recent Activity Table */}
              <div className="glass-dark rounded-3xl overflow-hidden border border-silver-800/80">
                <div className="p-6 border-b border-silver-800/50 flex justify-between items-center bg-black/20">
                  <h3 className="font-bold text-lg text-silver-100 tracking-wide">Live Feed</h3>
                  <button onClick={() => setActiveTab("submissions")} className="text-xs font-bold text-gold-500 hover:text-gold-400 uppercase tracking-widest">View Queue →</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-black/40 text-[10px] font-black text-silver-500 uppercase tracking-[0.15em]">
                        <th className="p-4 pl-6">Member</th><th className="p-4">Campaign</th><th className="p-4">Type</th><th className="p-4">Amount</th><th className="p-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm font-medium text-silver-300 divide-y divide-silver-800/50">
                      {stats.recentSubmissions?.slice(0, 6).map((sub: any) => (
                        <tr key={sub.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-4 pl-6 text-silver-100">{sub.user.name}</td>
                          <td className="p-4 max-w-[200px] truncate text-silver-400">{sub.deal.title}</td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${sub.formType === "FORM1" ? "border-blue-500/30 text-blue-400 bg-blue-500/10" : "border-purple-500/30 text-purple-400 bg-purple-500/10"}`}>
                              {sub.formType === "FORM1" ? "Order" : "Review"}
                            </span>
                          </td>
                          <td className="p-4 font-bold text-gold-400">{formatINR(sub.deal.productPrice)}</td>
                          <td className="p-4"><span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${getStatusBadge(sub.status)}`}>{sub.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ═════════ DEALS ═════════ */}
          {activeTab === "deals" && (
            <div className="animate-fade-in-up space-y-6">
              <div className="flex justify-between items-center">
                <p className="text-xs font-bold text-silver-500 uppercase tracking-widest">{deals.length} Campaigns Live</p>
                <button onClick={() => openDealEditor()} className="btn-gold px-6 py-3 rounded-xl text-xs tracking-widest">
                  + New Campaign
                </button>
              </div>

              <div className="glass-dark rounded-3xl overflow-hidden border border-silver-800/80">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-black/40 text-[10px] font-black text-silver-500 uppercase tracking-[0.15em]">
                        <th className="p-4 pl-6">Campaign</th><th className="p-4">Platform</th><th className="p-4">Price</th><th className="p-4">Bonus</th><th className="p-4">Slots</th><th className="p-4">Status</th><th className="p-4 text-right pr-6">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm font-medium text-silver-300 divide-y divide-silver-800/50">
                      {deals.map((deal) => (
                        <tr key={deal.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-4 pl-6">
                            <p className="text-silver-100 font-bold max-w-[200px] truncate">{deal.title}</p>
                            <p className="text-[10px] text-silver-500 mt-0.5">{deal.brandName}</p>
                          </td>
                          <td className="p-4"><span className="px-2.5 py-1 rounded-md text-[9px] font-black border border-silver-700 bg-silver-900 text-silver-300">{deal.platform}</span></td>
                          <td className="p-4 font-bold text-silver-100">{formatINR(deal.productPrice)}</td>
                          <td className="p-4 font-bold text-emerald-400">+{formatINR(deal.cashbackAmount)}</td>
                          <td className="p-4 font-bold">{deal.usedSlots} / <span className="text-silver-500">{deal.totalSlots}</span></td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-md text-[9px] font-black tracking-widest border ${deal.isVisible ? "badge-success" : "badge-danger"}`}>
                              {deal.isVisible ? "LIVE" : "HIDDEN"}
                            </span>
                          </td>
                          <td className="p-4 pr-6 flex justify-end gap-2">
                            <button onClick={() => openDealEditor(deal)} className="btn-silver px-3 py-1.5 rounded-lg text-[10px] font-bold">Edit</button>
                            <button onClick={() => toggleDealVisibility(deal)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${deal.isVisible ? "bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"}`}>
                              {deal.isVisible ? "Hide" : "Publish"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Deal Editor Modal */}
          {showDealEditor && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in-up">
              <div className="glass-dark rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-gold-500/30 shadow-[0_0_50px_rgba(245,166,35,0.15)]">
                <div className="sticky top-0 bg-[#18181B]/95 backdrop-blur-md px-8 py-5 border-b border-silver-800 flex justify-between z-10">
                  <h3 className="text-xl font-display font-black text-gold-gradient">{editingDeal ? "Edit Campaign" : "New Campaign Generator"}</h3>
                  <button onClick={() => setShowDealEditor(false)} className="text-silver-500 hover:text-white">✕</button>
                </div>
                
                <div className="p-8 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2"><label className="text-[10px] font-bold text-silver-500 uppercase tracking-widest">Campaign Title</label>
                      <input value={dealForm.title} onChange={(e) => setDealForm((p: any) => ({ ...p, title: e.target.value }))} className="input-premium w-full px-4 py-3 rounded-xl text-sm" placeholder="Premium Headset..." /></div>
                    <div className="space-y-2"><label className="text-[10px] font-bold text-silver-500 uppercase tracking-widest">Brand Name</label>
                      <input value={dealForm.brandName} onChange={(e) => setDealForm((p: any) => ({ ...p, brandName: e.target.value }))} className="input-premium w-full px-4 py-3 rounded-xl text-sm" placeholder="Brand..." /></div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="space-y-2"><label className="text-[10px] font-bold text-silver-500 uppercase tracking-widest">Platform</label>
                      <select value={dealForm.platform} onChange={(e) => setDealForm((p: any) => ({ ...p, platform: e.target.value }))} className="input-premium w-full px-4 py-3 rounded-xl text-sm appearance-none">
                        {PLATFORMS.map(p => <option key={p} value={p} className="bg-obsidian-deep">{p}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2"><label className="text-[10px] font-bold text-silver-500 uppercase tracking-widest">Price (₹)</label>
                      <input type="number" value={dealForm.productPrice} onChange={(e) => setDealForm((p: any) => ({ ...p, productPrice: e.target.value }))} className="input-premium w-full px-4 py-3 rounded-xl text-sm" /></div>
                    <div className="space-y-2"><label className="text-[10px] font-bold text-gold-500 uppercase tracking-widest">Bonus (₹)</label>
                      <input type="number" value={dealForm.cashbackAmount} onChange={(e) => setDealForm((p: any) => ({ ...p, cashbackAmount: e.target.value }))} className="input-premium w-full px-4 py-3 rounded-xl text-sm border-gold-500/30 focus:border-gold-500" /></div>
                  </div>

                  <div className="space-y-2"><label className="text-[10px] font-bold text-silver-500 uppercase tracking-widest">Product URL</label>
                    <input value={dealForm.productUrl} onChange={(e) => setDealForm((p: any) => ({ ...p, productUrl: e.target.value }))} className="input-premium w-full px-4 py-3 rounded-xl text-sm" placeholder="https://" /></div>
                  
                  <div className="space-y-2"><label className="text-[10px] font-bold text-silver-500 uppercase tracking-widest">Image URL</label>
                    <input value={dealForm.imageUrl} onChange={(e) => setDealForm((p: any) => ({ ...p, imageUrl: e.target.value }))} className="input-premium w-full px-4 py-3 rounded-xl text-sm" placeholder="https://" /></div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2"><label className="text-[10px] font-bold text-silver-500 uppercase tracking-widest">Step 1 Form</label>
                      <select value={dealForm.form1Id} onChange={(e) => setDealForm((p: any) => ({ ...p, form1Id: e.target.value }))} className="input-premium w-full px-4 py-3 rounded-xl text-sm appearance-none">
                        <option value="" className="bg-obsidian-deep">-- Select Form --</option>
                        {forms.map((f) => <option key={f.id} value={f.id} className="bg-obsidian-deep">{f.name}</option>)}
                      </select></div>
                    <div className="space-y-2"><label className="text-[10px] font-bold text-silver-500 uppercase tracking-widest">Step 2 Form</label>
                      <select value={dealForm.form2Id} onChange={(e) => setDealForm((p: any) => ({ ...p, form2Id: e.target.value }))} className="input-premium w-full px-4 py-3 rounded-xl text-sm appearance-none">
                        <option value="" className="bg-obsidian-deep">-- Select Form --</option>
                        {forms.map((f) => <option key={f.id} value={f.id} className="bg-obsidian-deep">{f.name}</option>)}
                      </select></div>
                  </div>
                </div>

                <div className="sticky bottom-0 bg-[#18181B]/95 backdrop-blur-md px-8 py-5 border-t border-silver-800 flex gap-4">
                  <button onClick={() => setShowDealEditor(false)} className="btn-silver flex-1 py-3.5 rounded-xl text-xs">Cancel</button>
                  <button onClick={saveDeal} className="btn-gold flex-[2] py-3.5 rounded-xl text-xs uppercase tracking-widest">Deploy Campaign 🚀</button>
                </div>
              </div>
            </div>
          )}

          {/* ═════════ FORM BUILDER ═════════ */}
          {activeTab === "forms" && (
            <div className="animate-fade-in-up space-y-6">
              <div className="flex justify-between items-center">
                <p className="text-xs font-bold text-silver-500 uppercase tracking-widest">{forms.length} Templates</p>
                <button onClick={() => openFormBuilder()} className="btn-gold px-6 py-3 rounded-xl text-xs tracking-widest">+ New Template</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {forms.map((form) => (
                  <div key={form.id} className="glass-dark rounded-3xl p-6 border border-silver-800/80 hover:border-gold-500/30 transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-bold text-lg text-silver-100">{form.name}</h3>
                      <button onClick={() => openFormBuilder(form)} className="btn-silver px-4 py-2 rounded-lg text-[10px] font-bold">Edit</button>
                    </div>
                    <div className="space-y-2 mt-4">
                      {form.fields.map((f) => (
                        <div key={f.id} className="flex justify-between items-center p-2.5 bg-black/40 rounded-xl border border-silver-800/50">
                          <span className="text-xs font-semibold text-silver-300">{f.label}</span>
                          <span className="text-[9px] font-black uppercase tracking-widest text-gold-600 bg-gold-500/10 px-2 py-1 rounded">{f.fieldType.replace("_", " ")}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Builder Modal inside (similar stunning UI) */}
              {showFormBuilder && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in-up">
                  <div className="glass-dark rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gold-500/30 shadow-[0_0_50px_rgba(245,166,35,0.15)]">
                    <div className="sticky top-0 bg-[#18181B]/95 backdrop-blur-md px-8 py-5 border-b border-silver-800 flex justify-between z-10">
                      <h3 className="text-xl font-display font-black text-gold-gradient">Blueprint Builder</h3>
                      <button onClick={() => setShowFormBuilder(false)} className="text-silver-500 hover:text-white">✕</button>
                    </div>
                    
                    <div className="p-8 space-y-8">
                      <div className="space-y-2"><label className="text-[10px] font-bold text-silver-500 uppercase tracking-widest">Template Name</label>
                        <input value={formBuilderName} onChange={(e) => setFormBuilderName(e.target.value)} className="input-premium w-full px-4 py-3.5 rounded-xl text-sm font-bold text-gold-400 text-lg" placeholder="Order Proof Form" /></div>
                      
                      <div className="space-y-4">
                        <div className="flex justify-between items-center"><h4 className="text-sm font-bold text-silver-100 tracking-wide">Fields ({formBuilderFields.length})</h4>
                        <button onClick={addFormField} className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-lg hover:bg-emerald-500/20 transition-all">+ Add Block</button></div>
                        
                        {formBuilderFields.map((field, idx) => (
                          <div key={idx} className="p-5 bg-black/30 rounded-2xl border border-silver-800/80 space-y-4 relative group">
                            <div className="absolute top-4 right-4 flex gap-2">
                              <button onClick={() => moveField(idx, "up")} disabled={idx===0} className="text-silver-600 hover:text-white disabled:opacity-30">↑</button>
                              <button onClick={() => moveField(idx, "down")} disabled={idx===formBuilderFields.length-1} className="text-silver-600 hover:text-white disabled:opacity-30">↓</button>
                              <button onClick={() => removeFormField(idx)} className="text-red-500 hover:text-red-400 ml-2">✕</button>
                            </div>
                            <div className="grid grid-cols-2 gap-4 pr-20">
                              <div className="space-y-1"><label className="text-[9px] font-bold text-silver-500 uppercase tracking-widest">Label</label>
                                <input value={field.label||""} onChange={(e) => updateFormField(idx, "label", e.target.value)} className="input-premium w-full px-3 py-2 rounded-lg text-sm" placeholder="Order ID" /></div>
                              <div className="space-y-1"><label className="text-[9px] font-bold text-silver-500 uppercase tracking-widest">Type</label>
                                <select value={field.fieldType||"SHORT_ANSWER"} onChange={(e) => updateFormField(idx, "fieldType", e.target.value)} className="input-premium w-full px-3 py-2 rounded-lg text-sm appearance-none">
                                  {FIELD_TYPES.map(ft => <option key={ft.value} value={ft.value} className="bg-obsidian-deep">{ft.label}</option>)}
                                </select></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="sticky bottom-0 bg-[#18181B]/95 backdrop-blur-md px-8 py-5 border-t border-silver-800 flex gap-4">
                      <button onClick={saveForm} className="btn-gold w-full py-4 rounded-xl text-sm uppercase tracking-widest">Save Template 💾</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═════════ SUBMISSIONS ═════════ */}
          {activeTab === "submissions" && (
            <div className="animate-fade-in-up space-y-6">
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                {["ALL", "PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED"].map(s => (
                  <button key={s} onClick={() => setSubFilter(s)} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${subFilter === s ? "btn-gold" : "btn-silver"}`}>
                    {s.replace("_", " ")}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                {submissions.filter((s) => subFilter === "ALL" || s.status === subFilter).map((sub) => (
                  <div key={sub.id} className="glass-dark rounded-3xl p-6 border border-silver-800/80 hover:border-gold-500/30 transition-all shadow-lg">
                    <div className="flex flex-col lg:flex-row gap-6 justify-between">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getStatusBadge(sub.status)}`}>{sub.status.replace("_", " ")}</span>
                          <span className="text-[10px] text-silver-500 font-bold uppercase tracking-widest">{formatDateTime(sub.createdAt)}</span>
                        </div>
                        <h4 className="text-xl font-bold text-silver-100">{sub.deal.title}</h4>
                        <div className="flex flex-wrap gap-4 text-xs font-semibold text-silver-400 bg-black/30 p-3 rounded-xl border border-silver-800/50 inline-flex">
                          <span className="text-gold-400">👤 {sub.user.name}</span>
                          <span>📱 {sub.user.phone}</span>
                          <span className="text-emerald-400">💳 {sub.user.upiId || "No UPI"}</span>
                        </div>
                      </div>

                      <div className="flex lg:flex-col gap-3 justify-end min-w-[120px]">
                        {sub.status !== "APPROVED" && <button onClick={() => updateSubmissionStatus(sub.id, "APPROVED")} className="flex-1 px-4 py-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors">Approve</button>}
                        {sub.status !== "REJECTED" && <button onClick={() => { const notes = prompt("Reason:"); if(notes!==null) updateSubmissionStatus(sub.id, "REJECTED", notes); }} className="flex-1 px-4 py-2.5 bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors">Reject</button>}
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-silver-800/50 grid grid-cols-2 md:grid-cols-4 gap-4">
                      {sub.formData.map((fd) => (
                        <div key={fd.id} className="p-3 bg-black/40 rounded-xl border border-silver-800/30">
                          <p className="text-[9px] font-bold text-silver-500 uppercase tracking-widest mb-1">{fd.fieldLabel}</p>
                          {fd.fieldType === "FILE_UPLOAD" ? (
                            fd.value.startsWith("data:") ? <img src={fd.value} alt="" className="h-16 rounded-lg border border-silver-700 cursor-zoom-in" onClick={()=>window.open(fd.value)} /> : <a href={fd.value} target="_blank" className="text-gold-400 text-xs hover:underline">View File</a>
                          ) : fd.fieldType === "URL" ? <a href={fd.value} target="_blank" className="text-gold-400 text-xs hover:underline truncate block">{fd.value}</a>
                          : <p className="text-sm font-semibold text-silver-100 truncate">{fd.value}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═════════ USERS ═════════ */}
          {activeTab === "users" && (
            <div className="animate-fade-in-up glass-dark rounded-3xl border border-silver-800/80 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-black/40 text-[10px] font-black text-silver-500 uppercase tracking-[0.15em]">
                      <th className="p-5 pl-6">Member Details</th><th className="p-5">Spend</th><th className="p-5">Earnings</th><th className="p-5">Status</th><th className="p-5 text-right pr-6">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm font-medium text-silver-300 divide-y divide-silver-800/50">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-5 pl-6"><p className="font-bold text-silver-100">{u.name}</p><p className="text-xs text-silver-500 mt-0.5">{u.phone}</p></td>
                        <td className="p-5 font-bold text-silver-100">{formatINR(u.totalSpent)} <span className="text-[10px] text-silver-500 block">{u.totalOrders} Orders</span></td>
                        <td className="p-5 font-bold text-gold-400">{formatINR(u.totalCashback)}</td>
                        <td className="p-5"><span className={`px-2.5 py-1 rounded-md text-[9px] font-black tracking-widest border ${u.isActive ? "badge-success" : "badge-danger"}`}>{u.isActive ? "ACTIVE" : "BANNED"}</span></td>
                        <td className="p-5 pr-6 text-right"><button onClick={() => toggleUserActive(u.id, !u.isActive)} className="btn-silver px-3 py-1.5 rounded-lg text-[10px] font-bold">{u.isActive ? "Ban" : "Unban"}</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ═════════ EXPORT ═════════ */}
          {activeTab === "export" && (
            <div className="animate-fade-in-up max-w-xl glass-dark rounded-3xl border border-silver-800/80 p-8 space-y-8">
              <h3 className="text-2xl font-display font-black text-silver-gradient">Data Export Engine</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: "FULL", label: "Global Dump" },
                  { value: "SELLER_WISE", label: "Platform Specific" },
                  { value: "DATE_WISE", label: "Date Range" },
                ].map((t) => (
                  <button key={t.value} onClick={() => setExportType(t.value)} className={`p-4 rounded-2xl border text-left transition-all ${exportType === t.value ? "border-gold-500 bg-gold-500/10 text-gold-400" : "border-silver-800 bg-black/30 text-silver-500 hover:border-silver-600"}`}>
                    <p className="text-xs font-black uppercase tracking-widest">{t.label}</p>
                  </button>
                ))}
              </div>
              <button onClick={handleExport} className="btn-gold w-full py-4 rounded-xl text-sm font-black uppercase tracking-widest">Execute Download 📥</button>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
