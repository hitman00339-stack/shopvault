"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

interface Seller {
  id: string;
  name: string;
  platform: string;
  contact?: string;
  notes?: string;
  createdAt: string;
}

type AdminTab = "dashboard" | "deals" | "sellers" | "forms" | "submissions" | "users" | "export" | "support";

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
  const [sellers, setSellers] = useState<Seller[]>([]);
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

  // Seller management state
  const [showSellerModal, setShowSellerModal] = useState(false);
  const [editingSeller, setEditingSeller] = useState<Seller | null>(null);
  const [sellerForm, setSellerForm] = useState({ name: "", platform: "AMAZON", contact: "", notes: "" });
  const [sellerSearch, setSellerSearch] = useState("");

  // Telegram support settings state
  const [telegramSupportId, setTelegramSupportId] = useState("ShopVaultOfficial");
  const [telegramSupportUrl, setTelegramSupportUrl] = useState("https://t.me/ShopVaultOfficial");
  const [savingSettings, setSavingSettings] = useState(false);
  const [imageUploadLoading, setImageUploadLoading] = useState(false);

  const [subFilter, setSubFilter] = useState("ALL");
  const [exportType, setExportType] = useState("FULL");
  const [exportPlatform, setExportPlatform] = useState("");
  const [exportSellerName, setExportSellerName] = useState("");
  const [exportDateFrom, setExportDateFrom] = useState("");
  const [exportDateTo, setExportDateTo] = useState("");

  useEffect(() => {
    checkAuth();
    fetchSellers();
    fetchSettings();
  }, []);

  useEffect(() => {
    loadTabData();
  }, [activeTab]);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/auth?action=me");
      const data = await res.json();
      if (!data.success || data.role !== "ADMIN") { router.push("/login"); return; }
      setUser(data);
    } catch { router.push("/login"); }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (data.success && data.data) {
        setTelegramSupportId(data.data.telegramSupportId || "ShopVaultOfficial");
        setTelegramSupportUrl(data.data.telegramSupportUrl || "https://t.me/ShopVaultOfficial");
      }
    } catch (e) {
      console.error("Failed to load settings:", e);
    }
  };

  const saveTelegramSupport = async () => {
    if (!telegramSupportId.trim()) {
      toast.error("Please enter a Telegram handle/ID");
      return;
    }
    setSavingSettings(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramSupportId: telegramSupportId.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to update Telegram settings");
        return;
      }
      setTelegramSupportId(data.data.telegramSupportId);
      setTelegramSupportUrl(data.data.telegramSupportUrl);
      toast.success("Telegram Support ID Updated & Active Across Site! ✈️");
    } catch {
      toast.error("Failed to save Telegram settings");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleDealImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image file should be under 8MB");
      return;
    }
    setImageUploadLoading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setDealForm((p: any) => ({ ...p, imageUrl: result }));
      setImageUploadLoading(false);
      toast.success("Product image uploaded! 📸");
    };
    reader.onerror = () => {
      setImageUploadLoading(false);
      toast.error("Failed to read image file");
    };
    reader.readAsDataURL(file);
  };

  const fetchSellers = async () => {
    try {
      const res = await fetch("/api/admin?action=sellers");
      const data = await res.json();
      if (data.success && data.data) setSellers(data.data);
    } catch (error) {
      console.error("Failed to load sellers:", error);
    }
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
        fetchSellers();
      }
      if (activeTab === "sellers") {
        fetchSellers();
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
      if (activeTab === "export") {
        fetchSellers();
      }
    } catch (error) { console.error("Failed to load data:", error); }
  };

  const openDealEditor = (deal?: Deal) => {
    if (deal) {
      setEditingDeal(deal);
      setDealForm({ ...deal, sellerName: deal.sellerName || "" });
    } else {
      setEditingDeal(null);
      setDealForm({ platform: "AMAZON", productPrice: "", cashbackAmount: "0", totalSlots: "50", sellerName: "" });
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
          sellerName: dealForm.sellerName?.trim() || null,
          productPrice: parseFloat(dealForm.productPrice),
          cashbackAmount: parseFloat(dealForm.cashbackAmount || "0"),
          totalSlots: parseInt(dealForm.totalSlots || "50"),
          form1Id: dealForm.form1Id || null,
          form2Id: dealForm.form2Id || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success(editingDeal ? "Campaign Updated 🌟" : "Campaign Launched 🚀");
      setShowDealEditor(false);
      loadTabData();
    } catch { toast.error("Failed to save campaign"); }
  };

  // Seller management handlers
  const openSellerModal = (seller?: Seller) => {
    if (seller) {
      setEditingSeller(seller);
      setSellerForm({
        name: seller.name || "",
        platform: seller.platform || "AMAZON",
        contact: seller.contact || "",
        notes: seller.notes || "",
      });
    } else {
      setEditingSeller(null);
      setSellerForm({ name: "", platform: "AMAZON", contact: "", notes: "" });
    }
    setShowSellerModal(true);
  };

  const saveSeller = async () => {
    if (!sellerForm.name.trim()) {
      toast.error("Seller name is required");
      return;
    }
    try {
      const res = await fetch("/api/admin?action=seller", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingSeller?.id,
          ...sellerForm,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to save seller");
        return;
      }
      toast.success(editingSeller ? "Seller Updated ✨" : "Seller Registered 🏪");
      setShowSellerModal(false);
      fetchSellers();
    } catch {
      toast.error("Failed to save seller");
    }
  };

  const deleteSeller = async (id: string) => {
    if (!confirm("Are you sure you want to remove this seller?")) return;
    try {
      const res = await fetch("/api/admin?action=delete-seller", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Seller Removed 🗑️");
        fetchSellers();
      } else {
        toast.error(data.error || "Failed to remove seller");
      }
    } catch {
      toast.error("Error deleting seller");
    }
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

  const handleExport = async (overrideSeller?: string) => {
    try {
      const targetSeller = overrideSeller !== undefined ? overrideSeller : exportSellerName;
      const params = new URLSearchParams({ type: exportType });
      if (exportPlatform) params.set("platform", exportPlatform);
      if (targetSeller && targetSeller !== "ALL") params.set("sellerName", targetSeller);
      if (exportDateFrom) params.set("dateFrom", exportDateFrom);
      if (exportDateTo) params.set("dateTo", exportDateTo);

      const res = await fetch(`/api/admin?action=export&${params}`);
      const data = await res.json();
      if (!data.success || !data.data?.length) { toast.error("No data found for this selection"); return; }

      const headers = Object.keys(data.data[0]);
      const csvRows = [headers.join(","), ...data.data.map((row: any) => headers.map((h) => `"${String(row[h] || "").replace(/"/g, '""')}"`).join(","))];
      const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a"); link.href = url;
      const safeName = targetSeller && targetSeller !== "ALL"
        ? `ShopVault_${targetSeller.replace(/[^a-zA-Z0-9]/g, "_")}_Export_${new Date().toISOString().split("T")[0]}.csv`
        : `ShopVault_Export_${new Date().toISOString().split("T")[0]}.csv`;
      link.download = safeName;
      link.click();
      toast.success(`Export Downloaded: ${data.data.length} records 📥`);
    } catch { toast.error("Export Failed"); }
  };

  const navItems: { key: AdminTab; label: string; icon: string; badge?: number }[] = [
    { key: "dashboard", label: "Overview", icon: "📊" },
    { key: "deals", label: "Campaigns", icon: "🏷️", badge: deals.length },
    { key: "sellers", label: "Sellers", icon: "🏪", badge: sellers.length },
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
          <button onClick={async () => {
            try { await fetch("/api/auth?action=logout", { method: "POST" }); } catch {}
            document.cookie = "shopvault_token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
            window.location.href = "/login";
          }}
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
          <div className="flex items-center gap-2.5">
            <Link
              href="/deals"
              className="btn-silver px-3.5 py-2 rounded-xl text-xs font-bold hover:text-gold-400 transition-colors flex items-center gap-1.5"
            >
              <span>🏷️</span> <span className="hidden sm:inline">Members Portal</span>
            </Link>
            <button onClick={loadTabData} className="btn-gold px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
              <span>⟳</span> <span className="hidden sm:inline">Sync Data</span>
            </button>
          </div>
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
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <span className="text-[10px] text-silver-400 font-medium">{deal.brandName}</span>
                              {deal.sellerName ? (
                                <span className="text-[9px] font-black tracking-wide text-gold-400 bg-gold-500/10 border border-gold-500/25 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                                  <span>🏪</span> {deal.sellerName}
                                </span>
                              ) : (
                                <span className="text-[9px] text-silver-500 italic">Direct / No Seller</span>
                              )}
                            </div>
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

                  {/* Seller / Merchant Selector */}
                  <div className="p-4 rounded-2xl bg-black/40 border border-gold-500/25 space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-gold-400 uppercase tracking-widest flex items-center gap-1.5">
                        <span>🏪</span> Assign Authorized Seller / Merchant
                      </label>
                      <button
                        type="button"
                        onClick={() => { setShowDealEditor(false); openSellerModal(); }}
                        className="text-[10px] font-black uppercase text-gold-400 hover:text-gold-300 tracking-wider hover:underline"
                      >
                        + Register New Seller
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <select
                        value={dealForm.sellerName || ""}
                        onChange={(e) => setDealForm((p: any) => ({ ...p, sellerName: e.target.value }))}
                        className="input-premium w-full px-4 py-3 rounded-xl text-sm appearance-none border-gold-500/40"
                      >
                        <option value="" className="bg-obsidian-deep">-- Choose Registered Seller --</option>
                        {sellers.map((s) => (
                          <option key={s.id} value={s.name} className="bg-obsidian-deep">
                            {s.name} ({s.platform})
                          </option>
                        ))}
                      </select>
                      <input
                        value={dealForm.sellerName || ""}
                        onChange={(e) => setDealForm((p: any) => ({ ...p, sellerName: e.target.value }))}
                        className="input-premium w-full px-4 py-3 rounded-xl text-sm"
                        placeholder="Or custom merchant name..."
                      />
                    </div>
                    <p className="text-[10px] text-silver-500">
                      Linking a seller allows one-click seller-wise CSV export and merchant reconciliation.
                    </p>
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
                  
                  {/* Direct Product Image Upload (No URL Required) */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-silver-400 uppercase tracking-widest flex items-center gap-1.5">
                        <span>📸</span> Product Image (Upload File)
                      </label>
                      {dealForm.imageUrl && (
                        <button
                          type="button"
                          onClick={() => setDealForm((p: any) => ({ ...p, imageUrl: "" }))}
                          className="text-[10px] text-red-400 hover:text-red-300 font-bold hover:underline"
                        >
                          ✕ Remove Image
                        </button>
                      )}
                    </div>

                    {dealForm.imageUrl ? (
                      <div className="p-4 rounded-2xl bg-black/40 border border-gold-500/30 flex items-center gap-4">
                        <img
                          src={dealForm.imageUrl}
                          alt="Product Preview"
                          className="w-20 h-20 object-contain rounded-xl bg-obsidian-deep border border-silver-800 p-1 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-silver-100 flex items-center gap-1.5">
                            <span className="text-emerald-400">✓</span> Image Attached
                          </p>
                          <p className="text-[10px] text-silver-500 mt-0.5 truncate">
                            {dealForm.imageUrl.startsWith("data:") ? "Direct device upload (Base64)" : dealForm.imageUrl}
                          </p>
                          <label className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-white/5 hover:bg-white/10 text-gold-400 border border-gold-500/30 cursor-pointer transition-all">
                            <span>🔄</span> Change Image
                            <input type="file" accept="image/*" onChange={handleDealImageUpload} className="hidden" />
                          </label>
                        </div>
                      </div>
                    ) : (
                      <label className="group relative flex flex-col items-center justify-center p-6 border-2 border-dashed border-gold-500/30 hover:border-gold-500/70 rounded-2xl bg-black/30 hover:bg-gold-500/5 cursor-pointer transition-all">
                        <input type="file" accept="image/*" onChange={handleDealImageUpload} className="hidden" />
                        <div className="w-12 h-12 rounded-2xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-2xl text-gold-400 group-hover:scale-110 transition-transform">
                          📁
                        </div>
                        <p className="text-xs font-bold text-silver-200 mt-2">
                          {imageUploadLoading ? "Reading Image..." : "Click or Drag to Upload Product Image"}
                        </p>
                        <p className="text-[10px] text-silver-500 mt-0.5">
                          Upload directly from your device (PNG, JPG, WEBP) — No image URL needed
                        </p>
                      </label>
                    )}
                  </div>

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

          {/* ═════════ SELLERS TAB ═════════ */}
          {activeTab === "sellers" && (
            <div className="animate-fade-in-up space-y-6">
              {/* Header and Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-display font-black text-silver-100 flex items-center gap-2">
                    <span>🏪</span> Authorized Seller Directory
                  </h3>
                  <p className="text-xs text-silver-400 mt-1">
                    Manage registered store sellers. Deals can be assigned to these merchants, and you can export seller-specific CSVs.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => openSellerModal()}
                    className="btn-gold px-6 py-3 rounded-xl text-xs font-black tracking-widest uppercase flex items-center gap-2 shadow-[0_0_20px_rgba(245,166,35,0.25)]"
                  >
                    <span>+</span> Register New Seller
                  </button>
                </div>
              </div>

              {/* Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="glass-dark p-5 rounded-2xl border border-gold-500/20">
                  <p className="text-[10px] font-bold text-silver-400 uppercase tracking-widest">Total Sellers</p>
                  <p className="text-2xl font-black text-gold-400 mt-1">{sellers.length}</p>
                </div>
                <div className="glass-dark p-5 rounded-2xl border border-silver-800">
                  <p className="text-[10px] font-bold text-silver-400 uppercase tracking-widest">Amazon Partners</p>
                  <p className="text-2xl font-black text-silver-100 mt-1">
                    {sellers.filter((s) => s.platform === "AMAZON").length}
                  </p>
                </div>
                <div className="glass-dark p-5 rounded-2xl border border-silver-800">
                  <p className="text-[10px] font-bold text-silver-400 uppercase tracking-widest">Flipkart Partners</p>
                  <p className="text-2xl font-black text-silver-100 mt-1">
                    {sellers.filter((s) => s.platform === "FLIPKART").length}
                  </p>
                </div>
                <div className="glass-dark p-5 rounded-2xl border border-silver-800">
                  <p className="text-[10px] font-bold text-silver-400 uppercase tracking-widest">Fashion & Beauty</p>
                  <p className="text-2xl font-black text-silver-100 mt-1">
                    {sellers.filter((s) => ["MYNTRA", "NYKAA", "AJIO"].includes(s.platform)).length}
                  </p>
                </div>
              </div>

              {/* Search Bar */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-silver-500 text-sm">🔍</span>
                  <input
                    value={sellerSearch}
                    onChange={(e) => setSellerSearch(e.target.value)}
                    placeholder="Search sellers by store name, platform, contact, or notes..."
                    className="input-premium w-full pl-11 pr-4 py-3 rounded-2xl text-xs"
                  />
                </div>
                {sellerSearch && (
                  <button
                    onClick={() => setSellerSearch("")}
                    className="text-xs text-silver-400 hover:text-white px-3 py-2"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Sellers Table */}
              <div className="glass-dark rounded-3xl overflow-hidden border border-silver-800/80 shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-black/40 text-[10px] font-black text-silver-500 uppercase tracking-[0.15em]">
                        <th className="p-4 pl-6">Seller / Merchant</th>
                        <th className="p-4">Platform</th>
                        <th className="p-4">Contact / Email</th>
                        <th className="p-4">Notes & Scope</th>
                        <th className="p-4 text-right pr-6">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm font-medium text-silver-300 divide-y divide-silver-800/50">
                      {sellers
                        .filter((s) => {
                          if (!sellerSearch) return true;
                          const q = sellerSearch.toLowerCase();
                          return (
                            s.name.toLowerCase().includes(q) ||
                            s.platform.toLowerCase().includes(q) ||
                            (s.contact && s.contact.toLowerCase().includes(q)) ||
                            (s.notes && s.notes.toLowerCase().includes(q))
                          );
                        })
                        .map((seller) => (
                          <tr key={seller.id} className="hover:bg-white/5 transition-colors">
                            <td className="p-4 pl-6">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-gold-400 font-bold text-sm">
                                  🏪
                                </div>
                                <div>
                                  <p className="text-silver-100 font-bold tracking-wide">{seller.name}</p>
                                  <p className="text-[10px] text-silver-500">ID: {seller.id}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className="px-2.5 py-1 rounded-md text-[9px] font-black border border-silver-700 bg-silver-900 text-silver-200">
                                {seller.platform}
                              </span>
                            </td>
                            <td className="p-4">
                              <p className="text-xs text-silver-300 font-medium">{seller.contact || "—"}</p>
                            </td>
                            <td className="p-4 max-w-[260px]">
                              <p className="text-xs text-silver-400 truncate" title={seller.notes || ""}>
                                {seller.notes || "—"}
                              </p>
                            </td>
                            <td className="p-4 pr-6">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleExport(seller.name)}
                                  className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-gold-500/10 text-gold-400 border border-gold-500/30 hover:bg-gold-500/20 transition-all flex items-center gap-1"
                                  title="Export orders & submissions for this seller"
                                >
                                  <span>📥</span> Export CSV
                                </button>
                                <button
                                  onClick={() => openSellerModal(seller)}
                                  className="btn-silver px-3 py-1.5 rounded-lg text-[10px] font-bold"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => deleteSeller(seller.id)}
                                  className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Seller Modal */}
          {showSellerModal && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in-up">
              <div className="glass-dark rounded-3xl w-full max-w-lg overflow-hidden border border-gold-500/30 shadow-[0_0_50px_rgba(245,166,35,0.2)]">
                <div className="bg-[#18181B]/95 px-6 py-5 border-b border-silver-800 flex justify-between items-center">
                  <h3 className="text-lg font-display font-black text-gold-gradient flex items-center gap-2">
                    <span>🏪</span> {editingSeller ? "Edit Seller Details" : "Register New Seller"}
                  </h3>
                  <button onClick={() => setShowSellerModal(false)} className="text-silver-500 hover:text-white">✕</button>
                </div>

                <div className="p-6 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-silver-400 uppercase tracking-widest">
                      Seller / Store Name *
                    </label>
                    <input
                      value={sellerForm.name}
                      onChange={(e) => setSellerForm((p) => ({ ...p, name: e.target.value }))}
                      className="input-premium w-full px-4 py-3 rounded-xl text-sm font-semibold"
                      placeholder="e.g. Noise Authorized Store, Cloudtail India..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-silver-400 uppercase tracking-widest">
                      Primary Platform
                    </label>
                    <select
                      value={sellerForm.platform}
                      onChange={(e) => setSellerForm((p) => ({ ...p, platform: e.target.value }))}
                      className="input-premium w-full px-4 py-3 rounded-xl text-sm appearance-none"
                    >
                      {PLATFORMS.map((plat) => (
                        <option key={plat} value={plat} className="bg-obsidian-deep">{plat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-silver-400 uppercase tracking-widest">
                      Contact Details (Email / Phone / WhatsApp)
                    </label>
                    <input
                      value={sellerForm.contact}
                      onChange={(e) => setSellerForm((p) => ({ ...p, contact: e.target.value }))}
                      className="input-premium w-full px-4 py-3 rounded-xl text-sm"
                      placeholder="seller-support@store.com or +91 9876543210"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-silver-400 uppercase tracking-widest">
                      Internal Notes / Guidelines
                    </label>
                    <textarea
                      value={sellerForm.notes}
                      onChange={(e) => setSellerForm((p) => ({ ...p, notes: e.target.value }))}
                      rows={3}
                      className="input-premium w-full px-4 py-3 rounded-xl text-sm resize-none"
                      placeholder="Reimbursement cadence, key brand contacts, review guidelines..."
                    />
                  </div>
                </div>

                <div className="bg-[#18181B]/95 px-6 py-4 border-t border-silver-800 flex gap-3">
                  <button
                    onClick={() => setShowSellerModal(false)}
                    className="btn-silver flex-1 py-3 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveSeller}
                    className="btn-gold flex-[2] py-3 rounded-xl text-xs font-black uppercase tracking-widest"
                  >
                    {editingSeller ? "Update Seller ✨" : "Save Seller 🏪"}
                  </button>
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
            <div className="animate-fade-in-up max-w-3xl glass-dark rounded-3xl border border-silver-800/80 p-8 space-y-8 shadow-2xl">
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-xl text-gold-400">
                    📤
                  </div>
                  <div>
                    <h3 className="text-2xl font-display font-black text-silver-gradient">
                      Enterprise Data Export Center
                    </h3>
                    <p className="text-xs text-silver-400 mt-0.5">
                      Generate verified CSV spreadsheets for merchant settlements, seller audits, and cashback reconciliation.
                    </p>
                  </div>
                </div>
              </div>

              {/* Export Mode Selection */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-silver-400 uppercase tracking-widest">
                  Export Scope / Mode
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { value: "FULL", label: "Global Dump", desc: "All deals & sellers" },
                    { value: "SELLER_WISE", label: "Seller-Wise", desc: "Filter by merchant" },
                    { value: "PLATFORM_WISE", label: "Platform-Wise", desc: "Amazon, Flipkart..." },
                    { value: "DATE_WISE", label: "Date Range", desc: "Timeline specific" },
                  ].map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setExportType(t.value)}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        exportType === t.value
                          ? "border-gold-500 bg-gold-500/10 text-gold-400 shadow-[0_0_20px_rgba(245,166,35,0.15)]"
                          : "border-silver-800 bg-black/30 text-silver-500 hover:border-silver-700 hover:text-silver-300"
                      }`}
                    >
                      <p className="text-xs font-black uppercase tracking-wider">{t.label}</p>
                      <p className="text-[10px] text-silver-500 mt-1">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Seller Selector Filter */}
              <div className="p-6 rounded-2xl bg-black/40 border border-silver-800/80 space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-gold-400 uppercase tracking-wider flex items-center gap-2">
                    <span>🏪</span> Select Target Seller / Merchant
                  </label>
                  {exportSellerName && (
                    <button
                      onClick={() => setExportSellerName("")}
                      className="text-[10px] text-silver-400 hover:text-white"
                    >
                      Reset Filter
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-silver-500 uppercase tracking-widest">
                      Registered Sellers List
                    </label>
                    <select
                      value={exportSellerName}
                      onChange={(e) => setExportSellerName(e.target.value)}
                      className="input-premium w-full px-4 py-3 rounded-xl text-sm appearance-none border-gold-500/40"
                    >
                      <option value="" className="bg-obsidian-deep">
                        -- All Sellers (No Filter) --
                      </option>
                      {sellers.map((s) => (
                        <option key={s.id} value={s.name} className="bg-obsidian-deep">
                          {s.name} ({s.platform})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-silver-500 uppercase tracking-widest">
                      Platform Filter
                    </label>
                    <select
                      value={exportPlatform}
                      onChange={(e) => setExportPlatform(e.target.value)}
                      className="input-premium w-full px-4 py-3 rounded-xl text-sm appearance-none"
                    >
                      <option value="" className="bg-obsidian-deep">All Marketplaces</option>
                      {PLATFORMS.map((p) => (
                        <option key={p} value={p} className="bg-obsidian-deep">{p}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Quick 1-Click Seller Export Chips */}
                {sellers.length > 0 && (
                  <div className="pt-2">
                    <p className="text-[10px] font-bold text-silver-500 uppercase tracking-widest mb-2">
                      ⚡ Quick 1-Click Seller Downloads:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {sellers.slice(0, 6).map((s) => (
                        <button
                          key={s.id}
                          onClick={() => {
                            setExportSellerName(s.name);
                            handleExport(s.name);
                          }}
                          className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-white/5 hover:bg-gold-500/20 text-silver-300 hover:text-gold-300 border border-silver-800 hover:border-gold-500/30 transition-all flex items-center gap-1.5"
                        >
                          <span>🏪</span> {s.name}
                          <span className="text-gold-500 text-[9px]">↓</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Date Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-silver-500 uppercase tracking-widest">
                    Start Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={exportDateFrom}
                    onChange={(e) => setExportDateFrom(e.target.value)}
                    className="input-premium w-full px-4 py-3 rounded-xl text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-silver-500 uppercase tracking-widest">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={exportDateTo}
                    onChange={(e) => setExportDateTo(e.target.value)}
                    className="input-premium w-full px-4 py-3 rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* Active Export Configuration Summary */}
              <div className="p-4 rounded-2xl bg-gold-500/5 border border-gold-500/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <p className="text-[10px] font-black text-gold-400 uppercase tracking-widest">Export Scope Summary</p>
                  <p className="text-xs text-silver-300 mt-0.5">
                    Target: <span className="font-bold text-white">{exportSellerName || "All Sellers"}</span> | Platform: <span className="font-bold text-white">{exportPlatform || "All Platforms"}</span>
                  </p>
                  <p className="text-[10px] text-silver-500 mt-1">
                    Columns: Submission ID, Order ID, Deal Title, Seller Name, Brand, Platform, Price, Cashback, Member Info, UPI ID, Status, Date
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2">
                <button
                  onClick={() => handleExport()}
                  className="btn-gold w-full py-4 rounded-xl text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(245,166,35,0.3)]"
                >
                  <span>📥</span> Download {exportSellerName ? `"${exportSellerName}" Data` : "Report"} (CSV)
                </button>
              </div>
            </div>
          )}

          {/* ═════════ CUSTOMER SUPPORT & TELEGRAM CENTER ═════════ */}
          {activeTab === "support" && (
            <div className="animate-fade-in-up max-w-4xl space-y-8">
              {/* Header */}
              <div>
                <h3 className="text-2xl font-display font-black text-silver-gradient flex items-center gap-3">
                  <span>✈️</span> Customer Support & Telegram Command Center
                </h3>
                <p className="text-xs text-silver-400 mt-1">
                  Configure the official Telegram support channel. Changes here immediately update the floating support button, member portal, and mobile concierge.
                </p>
              </div>

              {/* Telegram Channel Configuration Card */}
              <div className="glass-dark rounded-3xl border border-cyan-500/30 p-8 space-y-6 shadow-[0_0_40px_rgba(0,136,204,0.15)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#0088cc]/10 rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-silver-800/80 pb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#0088cc] to-[#29b6f6] flex items-center justify-center text-white text-3xl shadow-[0_0_20px_rgba(0,136,204,0.4)]">
                      ✈️
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-silver-100 flex items-center gap-2">
                        Official Telegram Support Handle
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          LIVE & ACTIVE
                        </span>
                      </h4>
                      <p className="text-xs text-silver-400 mt-0.5">
                        Current Live URL:{" "}
                        <a
                          href={telegramSupportUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-cyan-400 font-mono hover:underline font-bold"
                        >
                          {telegramSupportUrl}
                        </a>
                      </p>
                    </div>
                  </div>

                  <a
                    href={telegramSupportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-silver px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto hover:text-cyan-300"
                  >
                    <span>↗</span> Test Live Chat Link
                  </a>
                </div>

                {/* Edit Telegram Handle Form */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gold-400 uppercase tracking-widest flex items-center gap-2">
                      <span>✏️</span> Set Telegram Username / ID / Channel Link
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400 font-mono font-bold text-sm">
                        @
                      </span>
                      <input
                        value={telegramSupportId}
                        onChange={(e) => setTelegramSupportId(e.target.value)}
                        placeholder="e.g. ShopVaultSupport or hitman00339"
                        className="input-premium w-full pl-9 pr-4 py-3.5 rounded-xl text-sm font-mono font-bold text-white border-cyan-500/40 focus:border-cyan-400"
                      />
                    </div>
                    <p className="text-[11px] text-silver-500">
                      You can enter a Telegram username (e.g. <code className="text-silver-300">@ShopVaultSupport</code>) or a direct Telegram link. The system automatically formats it into an instant chat link.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      onClick={saveTelegramSupport}
                      disabled={savingSettings}
                      className="btn-gold px-8 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(245,166,35,0.3)] flex-1"
                    >
                      <span>💾</span> {savingSettings ? "Updating..." : "Save & Update Telegram Support"}
                    </button>
                    <a
                      href={telegramSupportUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-3.5 rounded-xl text-xs font-bold bg-[#0088cc]/20 text-cyan-300 border border-[#0088cc]/40 hover:bg-[#0088cc]/30 transition-all flex items-center justify-center gap-2"
                    >
                      <span>✈️</span> Verify Telegram Link
                    </a>
                  </div>
                </div>
              </div>

              {/* Status Overview Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="glass-dark p-6 rounded-2xl border border-silver-800">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">⚡</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <h5 className="font-bold text-silver-100 text-sm mt-3">Floating Widget</h5>
                  <p className="text-[11px] text-silver-400 mt-1">
                    Active on all member catalog & deal pages. Users can click to message your Telegram directly.
                  </p>
                </div>

                <div className="glass-dark p-6 rounded-2xl border border-silver-800">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">🛡️</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                  </div>
                  <h5 className="font-bold text-silver-100 text-sm mt-3">Member Desk</h5>
                  <p className="text-[11px] text-silver-400 mt-1">
                    Featured prominently on <code className="text-silver-300">/support</code> for members seeking 1-on-1 VIP order assistance.
                  </p>
                </div>

                <div className="glass-dark p-6 rounded-2xl border border-silver-800">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">📱</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-gold-400" />
                  </div>
                  <h5 className="font-bold text-silver-100 text-sm mt-3">Mobile Friendly</h5>
                  <p className="text-[11px] text-silver-400 mt-1">
                    Deep-links directly to the Telegram app on iOS and Android devices for friction-free chat.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
