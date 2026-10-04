"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { formatINR, formatDateTime, formatDate, getPlatformConfig, getStatusConfig } from "@/lib/utils";

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

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Data states
  const [stats, setStats] = useState<any>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [forms, setForms] = useState<FormTemplate[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);

  // Form builder state
  const [editingForm, setEditingForm] = useState<FormTemplate | null>(null);
  const [formBuilderFields, setFormBuilderFields] = useState<Partial<FormField>[]>([]);
  const [formBuilderName, setFormBuilderName] = useState("");
  const [formBuilderDesc, setFormBuilderDesc] = useState("");
  const [showFormBuilder, setShowFormBuilder] = useState(false);

  // Deal editor state
  const [showDealEditor, setShowDealEditor] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [dealForm, setDealForm] = useState<any>({});

  // Filter states
  const [subFilter, setSubFilter] = useState("ALL");
  const [exportType, setExportType] = useState("FULL");
  const [exportPlatform, setExportPlatform] = useState("");
  const [exportDateFrom, setExportDateFrom] = useState("");
  const [exportDateTo, setExportDateTo] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    loadTabData();
  }, [activeTab]);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/auth?action=me");
      const data = await res.json();
      if (!data.success || data.data?.role !== "ADMIN") {
        router.push("/login");
        return;
      }
      setUser(data.data);
    } catch {
      router.push("/login");
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
    } catch (error) {
      console.error("Failed to load data:", error);
    }
  };

  // ─── DEAL CRUD ───
  const openDealEditor = (deal?: Deal) => {
    if (deal) {
      setEditingDeal(deal);
      setDealForm({
        title: deal.title, description: deal.description || "", brandName: deal.brandName,
        platform: deal.platform, productUrl: deal.productUrl, imageUrl: deal.imageUrl || "",
        productPrice: deal.productPrice, cashbackAmount: deal.cashbackAmount,
        searchKeyword: deal.searchKeyword || "", sellerName: deal.sellerName || "",
        totalSlots: deal.totalSlots, instructions: deal.instructions || "",
        form1Id: deal.form1Id || "", form2Id: deal.form2Id || "",
      });
    } else {
      setEditingDeal(null);
      setDealForm({
        title: "", description: "", brandName: "", platform: "AMAZON",
        productUrl: "", imageUrl: "", productPrice: "", cashbackAmount: "0",
        searchKeyword: "", sellerName: "", totalSlots: "50", instructions: "",
        form1Id: "", form2Id: "",
      });
    }
    setShowDealEditor(true);
  };

  const saveDeal = async () => {
    if (!dealForm.title || !dealForm.brandName || !dealForm.productUrl || !dealForm.productPrice) {
      toast.error("Title, brand, URL, and price are required");
      return;
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

      toast.success(editingDeal ? "Deal updated!" : "Deal created!");
      setShowDealEditor(false);
      loadTabData();
    } catch {
      toast.error("Failed to save deal");
    }
  };

  const toggleDealVisibility = async (deal: Deal) => {
    try {
      await fetch(`/api/deals?id=${deal.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVisible: !deal.isVisible, status: deal.isVisible ? "EXPIRED" : "ACTIVE" }),
      });
      toast.success(deal.isVisible ? "Deal hidden" : "Deal restored");
      loadTabData();
    } catch { toast.error("Failed"); }
  };

  // ─── FORM BUILDER ───
  const openFormBuilder = (form?: FormTemplate) => {
    if (form) {
      setEditingForm(form);
      setFormBuilderName(form.name);
      setFormBuilderDesc(form.description || "");
      setFormBuilderFields(form.fields.map((f) => ({
        ...f,
        options: f.options ? JSON.parse(f.options) : [],
      })));
    } else {
      setEditingForm(null);
      setFormBuilderName("");
      setFormBuilderDesc("");
      setFormBuilderFields([
        { label: "", fieldType: "SHORT_ANSWER", isRequired: true, placeholder: "", helpText: "", sortOrder: 0 },
      ]);
    }
    setShowFormBuilder(true);
  };

  const addFormField = () => {
    setFormBuilderFields((prev) => [
      ...prev,
      { label: "", fieldType: "SHORT_ANSWER", isRequired: true, placeholder: "", helpText: "", sortOrder: prev.length },
    ]);
  };

  const removeFormField = (index: number) => {
    setFormBuilderFields((prev) => prev.filter((_, i) => i !== index));
  };

  const updateFormField = (index: number, key: string, value: any) => {
    setFormBuilderFields((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [key]: value };
      return updated;
    });
  };

  const moveField = (index: number, direction: "up" | "down") => {
    setFormBuilderFields((prev) => {
      const updated = [...prev];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= updated.length) return prev;
      [updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]];
      return updated;
    });
  };

  const saveForm = async () => {
    if (!formBuilderName.trim()) { toast.error("Form name is required"); return; }
    if (formBuilderFields.length === 0) { toast.error("Add at least one field"); return; }
    for (const f of formBuilderFields) {
      if (!f.label?.trim()) { toast.error("All fields must have a label"); return; }
    }

    try {
      const res = await fetch("/api/admin?action=form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingForm?.id,
          name: formBuilderName,
          description: formBuilderDesc,
          fields: formBuilderFields.map((f, i) => ({
            label: f.label,
            fieldType: f.fieldType,
            placeholder: f.placeholder || "",
            helpText: f.helpText || "",
            isRequired: f.isRequired ?? true,
            options: f.options && Array.isArray(f.options) && f.options.length > 0 ? f.options : null,
            sortOrder: i,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }

      toast.success(editingForm ? "Form updated!" : "Form created!");
      setShowFormBuilder(false);
      loadTabData();
    } catch { toast.error("Failed to save form"); }
  };

  // ─── SUBMISSION ACTIONS ───
  const updateSubmissionStatus = async (id: string, status: string, notes?: string) => {
    try {
      const res = await fetch("/api/submissions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, adminNotes: notes }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success(`Submission ${status.toLowerCase()}`);
      loadTabData();
    } catch { toast.error("Failed"); }
  };

  // ─── USER ACTIONS ───
  const toggleUserActive = async (userId: string, isActive: boolean) => {
    try {
      await fetch("/api/admin?action=toggle-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isActive }),
      });
      toast.success(isActive ? "User activated" : "User deactivated");
      loadTabData();
    } catch { toast.error("Failed"); }
  };

  // ─── EXPORT ───
  const handleExport = async () => {
    try {
      const params = new URLSearchParams({ type: exportType });
      if (exportType === "SELLER_WISE" && exportPlatform) params.set("platform", exportPlatform);
      if (exportDateFrom) params.set("dateFrom", exportDateFrom);
      if (exportDateTo) params.set("dateTo", exportDateTo);

      const res = await fetch(`/api/admin?action=export&${params}`);
      const data = await res.json();

      if (!data.success || !data.data?.length) {
        toast.error("No data to export");
        return;
      }

      // Generate CSV
      const headers = Object.keys(data.data[0]);
      const csvRows = [
        headers.join(","),
        ...data.data.map((row: any) =>
          headers.map((h) => {
            const val = String(row[h] || "").replace(/"/g, '""');
            return `"${val}"`;
          }).join(",")
        ),
      ];

      const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `shopvault_export_${exportType}_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success(`Exported ${data.data.length} records! 📊`);
    } catch { toast.error("Export failed"); }
  };

  // ─── SIDEBAR NAV ───
  const navItems: { key: AdminTab; label: string; icon: string; badge?: number }[] = [
    { key: "dashboard", label: "Dashboard", icon: "📊" },
    { key: "deals", label: "Deals", icon: "🏷️", badge: deals.length },
    { key: "forms", label: "Form Builder", icon: "📝" },
    { key: "submissions", label: "Submissions", icon: "📋", badge: submissions.filter((s) => s.status === "PENDING").length },
    { key: "users", label: "Users", icon: "👥", badge: users.length },
    { key: "export", label: "Export Data", icon: "📤" },
    { key: "support", label: "Support", icon: "🎫" },
  ];

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <svg className="animate-spin w-8 h-8 text-brand-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* ─── SIDEBAR ─── */}
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:sticky top-0 left-0 z-50 lg:z-auto h-screen w-64 bg-white border-r border-gray-200
        flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        {/* Logo */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center shadow-md">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <h1 className="font-bold text-gray-900">ShopVault</h1>
              <p className="text-[11px] text-gray-400 font-medium">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => { setActiveTab(item.key); setSidebarOpen(false); }}
              className={`sidebar-link w-full ${activeTab === item.key ? "active" : ""}`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  item.key === "submissions"
                    ? "bg-red-100 text-red-600"
                    : "bg-gray-100 text-gray-500"
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{user.name}</p>
              <p className="text-[11px] text-red-500 font-medium">Admin</p>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <a href="/deals" className="flex-1 py-1.5 text-center text-xs font-medium text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              View Site
            </a>
            <button
              onClick={async () => {
                await fetch("/api/auth?action=logout", { method: "POST" });
                router.push("/login");
              }}
              className="flex-1 py-1.5 text-center text-xs font-medium text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* ─── MAIN CONTENT ─── */}
      <main className="flex-1 min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">
            {navItems.find((n) => n.key === activeTab)?.icon}{" "}
            {navItems.find((n) => n.key === activeTab)?.label}
          </h2>
          <button onClick={loadTabData} className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
            🔄 Refresh
          </button>
        </header>

        <div className="p-4 sm:p-6 lg:p-8">
          {/* ═══════════════════════════════════════════ */}
          {/* DASHBOARD TAB */}
          {/* ═══════════════════════════════════════════ */}
          {activeTab === "dashboard" && stats && (
            <div className="animate-fade-in space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Total Members", value: stats.totalUsers, icon: "👥", color: "from-blue-500 to-blue-600" },
                  { label: "Active Deals", value: stats.activeDeals, icon: "🏷️", color: "from-green-500 to-green-600" },
                  { label: "Total Submissions", value: stats.totalSubmissions, icon: "📋", color: "from-purple-500 to-purple-600" },
                  { label: "Pending Review", value: stats.pendingSubmissions, icon: "⏳", color: "from-amber-500 to-amber-600" },
                  { label: "Approved", value: stats.approvedSubmissions, icon: "✅", color: "from-emerald-500 to-emerald-600" },
                  { label: "Rejected", value: stats.rejectedSubmissions, icon: "❌", color: "from-red-500 to-red-600" },
                  { label: "Reported Spend", value: formatINR(stats.totalReportedSpend), icon: "💳", color: "from-indigo-500 to-indigo-600" },
                  { label: "Cashback Due", value: formatINR(stats.totalCashbackDue), icon: "💰", color: "from-teal-500 to-teal-600" },
                ].map((s, i) => (
                  <div key={i} className="stat-card">
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-2xl">{s.icon}</span>
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} opacity-10`} />
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                      <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recent Submissions */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-bold text-gray-900">Recent Submissions</h3>
                  <button onClick={() => setActiveTab("submissions")} className="text-xs text-brand-600 font-semibold hover:underline">
                    View All →
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Member</th><th>Deal</th><th>Platform</th><th>Type</th><th>Amount</th><th>Status</th><th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentSubmissions?.slice(0, 8).map((sub: any) => {
                        const p = getPlatformConfig(sub.deal.platform);
                        const st = getStatusConfig(sub.status);
                        return (
                          <tr key={sub.id}>
                            <td className="font-medium text-gray-900">{sub.user.name}</td>
                            <td className="text-gray-600 max-w-[200px] truncate">{sub.deal.title}</td>
                            <td><span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${p.bgColor} ${p.color}`}>{p.label}</span></td>
                            <td className="text-xs">{sub.formType === "FORM1" ? "📦 Order" : "⭐ Review"}</td>
                            <td className="font-semibold">{formatINR(sub.deal.productPrice)}</td>
                            <td><span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${st.bgColor} ${st.color}`}>{sub.status}</span></td>
                            <td className="text-xs text-gray-400">{formatDate(sub.createdAt)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════ */}
          {/* DEALS TAB */}
          {/* ═══════════════════════════════════════════ */}
          {activeTab === "deals" && (
            <div className="animate-fade-in space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{deals.length} total deals</p>
                <button onClick={() => openDealEditor()} className="px-4 py-2.5 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 transition-all shadow-md">
                  + Create Deal
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Product</th><th>Brand</th><th>Platform</th><th>Price</th><th>Cashback</th>
                        <th>Slots</th><th>Status</th><th>Visible</th><th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deals.map((deal) => {
                        const p = getPlatformConfig(deal.platform);
                        const st = getStatusConfig(deal.status);
                        return (
                          <tr key={deal.id}>
                            <td className="font-medium text-gray-900 max-w-[200px] truncate">{deal.title}</td>
                            <td className="text-gray-600">{deal.brandName}</td>
                            <td><span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${p.bgColor} ${p.color}`}>{p.label}</span></td>
                            <td className="font-semibold">{formatINR(deal.productPrice)}</td>
                            <td className="text-green-600 font-semibold">{formatINR(deal.cashbackAmount)}</td>
                            <td>
                              <span className={`text-xs font-bold ${deal.usedSlots >= deal.totalSlots ? "text-red-600" : "text-gray-600"}`}>
                                {deal.usedSlots}/{deal.totalSlots}
                              </span>
                            </td>
                            <td><span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${st.bgColor} ${st.color}`}>{deal.status}</span></td>
                            <td>
                              <span className={`text-xs font-bold ${deal.isVisible ? "text-green-600" : "text-red-500"}`}>
                                {deal.isVisible ? "✅ Yes" : "❌ Hidden"}
                              </span>
                            </td>
                            <td>
                              <div className="flex items-center gap-1">
                                <button onClick={() => openDealEditor(deal)} className="px-2 py-1 text-xs font-medium text-brand-600 bg-brand-50 rounded-lg hover:bg-brand-100 transition-colors">
                                  Edit
                                </button>
                                <button onClick={() => toggleDealVisibility(deal)} className={`px-2 py-1 text-xs font-medium rounded-lg transition-colors ${
                                  deal.isVisible ? "text-red-600 bg-red-50 hover:bg-red-100" : "text-green-600 bg-green-50 hover:bg-green-100"
                                }`}>
                                  {deal.isVisible ? "Hide" : "Restore"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Deal Editor Modal */}
              {showDealEditor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                  <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in">
                    <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between z-10">
                      <h3 className="text-lg font-bold">{editingDeal ? "Edit Deal" : "Create New Deal"}</h3>
                      <button onClick={() => setShowDealEditor(false)} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-gray-600">Title *</label>
                          <input value={dealForm.title} onChange={(e) => setDealForm((p: any) => ({ ...p, title: e.target.value }))}
                            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 outline-none" placeholder="boAt Airdopes 141" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-gray-600">Brand *</label>
                          <input value={dealForm.brandName} onChange={(e) => setDealForm((p: any) => ({ ...p, brandName: e.target.value }))}
                            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 outline-none" placeholder="boAt" />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-gray-600">Platform *</label>
                          <select value={dealForm.platform} onChange={(e) => setDealForm((p: any) => ({ ...p, platform: e.target.value }))}
                            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 outline-none">
                            {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-gray-600">Product URL *</label>
                          <input value={dealForm.productUrl} onChange={(e) => setDealForm((p: any) => ({ ...p, productUrl: e.target.value }))}
                            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 outline-none" placeholder="https://amazon.in/dp/..." />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-gray-600">Price (₹) *</label>
                          <input type="number" value={dealForm.productPrice} onChange={(e) => setDealForm((p: any) => ({ ...p, productPrice: e.target.value }))}
                            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 outline-none" placeholder="999" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-gray-600">Cashback (₹)</label>
                          <input type="number" value={dealForm.cashbackAmount} onChange={(e) => setDealForm((p: any) => ({ ...p, cashbackAmount: e.target.value }))}
                            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 outline-none" placeholder="50" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-gray-600">Total Slots</label>
                          <input type="number" value={dealForm.totalSlots} onChange={(e) => setDealForm((p: any) => ({ ...p, totalSlots: e.target.value }))}
                            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 outline-none" placeholder="50" />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-gray-600">Search Keyword</label>
                          <input value={dealForm.searchKeyword} onChange={(e) => setDealForm((p: any) => ({ ...p, searchKeyword: e.target.value }))}
                            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 outline-none" placeholder="wireless earbuds under 1000" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-gray-600">Target Seller</label>
                          <input value={dealForm.sellerName} onChange={(e) => setDealForm((p: any) => ({ ...p, sellerName: e.target.value }))}
                            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 outline-none" placeholder="Appario Retail" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-600">Image URL</label>
                        <input value={dealForm.imageUrl} onChange={(e) => setDealForm((p: any) => ({ ...p, imageUrl: e.target.value }))}
                          className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 outline-none" placeholder="https://..." />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-gray-600">Form 1 (Order)</label>
                          <select value={dealForm.form1Id} onChange={(e) => setDealForm((p: any) => ({ ...p, form1Id: e.target.value }))}
                            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm outline-none">
                            <option value="">-- No Form --</option>
                            {forms.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-gray-600">Form 2 (Review)</label>
                          <select value={dealForm.form2Id} onChange={(e) => setDealForm((p: any) => ({ ...p, form2Id: e.target.value }))}
                            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm outline-none">
                            <option value="">-- No Form --</option>
                            {forms.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-600">Instructions</label>
                        <textarea value={dealForm.instructions} onChange={(e) => setDealForm((p: any) => ({ ...p, instructions: e.target.value }))}
                          rows={4} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 outline-none resize-none"
                          placeholder="Step-by-step instructions for users..." />
                      </div>
                    </div>
                    <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-gray-100 flex gap-3">
                      <button onClick={() => setShowDealEditor(false)} className="flex-1 py-2.5 border-2 border-gray-200 text-gray-600 font-semibold rounded-xl text-sm hover:bg-gray-50 transition-all">Cancel</button>
                      <button onClick={saveDeal} className="flex-[2] py-2.5 bg-brand-600 text-white font-semibold rounded-xl text-sm hover:bg-brand-700 transition-all shadow-md">
                        {editingDeal ? "Update Deal" : "Create Deal"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════ */}
          {/* FORM BUILDER TAB */}
          {/* ═══════════════════════════════════════════ */}
          {activeTab === "forms" && (
            <div className="animate-fade-in space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{forms.length} form templates</p>
                <button onClick={() => openFormBuilder()} className="px-4 py-2.5 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 transition-all shadow-md">
                  + Create Form
                </button>
              </div>

              {/* Forms List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {forms.map((form) => (
                  <div key={form.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-gray-900">{form.name}</h3>
                        {form.description && <p className="text-xs text-gray-400 mt-0.5">{form.description}</p>}
                      </div>
                      <button onClick={() => openFormBuilder(form)} className="px-3 py-1.5 text-xs font-semibold text-brand-600 bg-brand-50 rounded-lg hover:bg-brand-100 transition-colors">
                        Edit
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      {form.fields.map((field) => (
                        <div key={field.id} className="flex items-center gap-2 text-xs text-gray-600 p-2 bg-gray-50 rounded-lg">
                          <span className="font-mono text-[10px] px-1.5 py-0.5 bg-gray-200 rounded text-gray-500 font-bold">
                            {field.fieldType.replace("_", " ")}
                          </span>
                          <span className="font-medium">{field.label}</span>
                          {field.isRequired && <span className="text-red-500 font-bold">*</span>}
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] text-gray-400 mt-3">{form.fields.length} fields · Created {formatDate(form.createdAt)}</p>
                  </div>
                ))}
              </div>

              {forms.length === 0 && (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                  <div className="text-5xl mb-3">📝</div>
                  <h3 className="text-lg font-semibold text-gray-700">No forms yet</h3>
                  <p className="text-sm text-gray-400 mt-1">Create your first form template to attach to deals</p>
                </div>
              )}

              {/* Form Builder Modal */}
              {showFormBuilder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                  <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in">
                    <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between z-10">
                      <h3 className="text-lg font-bold">📝 {editingForm ? "Edit Form" : "Create Form"}</h3>
                      <button onClick={() => setShowFormBuilder(false)} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <div className="p-6 space-y-6">
                      {/* Form Name & Desc */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-gray-600">Form Name *</label>
                          <input value={formBuilderName} onChange={(e) => setFormBuilderName(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 outline-none"
                            placeholder="e.g., Order Details Form" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-gray-600">Description</label>
                          <input value={formBuilderDesc} onChange={(e) => setFormBuilderDesc(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 outline-none"
                            placeholder="Optional description" />
                        </div>
                      </div>

                      {/* Fields */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-bold text-gray-900">Form Fields ({formBuilderFields.length})</h4>
                          <button onClick={addFormField} className="px-3 py-1.5 text-xs font-semibold text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                            + Add Field
                          </button>
                        </div>

                        <div className="space-y-3">
                          {formBuilderFields.map((field, index) => (
                            <div key={index} className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-400">FIELD {index + 1}</span>
                                <div className="flex items-center gap-1">
                                  <button onClick={() => moveField(index, "up")} disabled={index === 0}
                                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors">↑</button>
                                  <button onClick={() => moveField(index, "down")} disabled={index === formBuilderFields.length - 1}
                                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors">↓</button>
                                  <button onClick={() => removeFormField(index)}
                                    className="p-1 text-red-400 hover:text-red-600 transition-colors ml-1">🗑</button>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="text-[11px] font-semibold text-gray-500">Field Label *</label>
                                  <input value={field.label || ""} onChange={(e) => updateFormField(index, "label", e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-brand-500/30"
                                    placeholder="e.g., Order ID" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[11px] font-semibold text-gray-500">Field Type</label>
                                  <select value={field.fieldType || "SHORT_ANSWER"} onChange={(e) => updateFormField(index, "fieldType", e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-brand-500/30">
                                    {FIELD_TYPES.map((ft) => <option key={ft.value} value={ft.value}>{ft.label}</option>)}
                                  </select>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="text-[11px] font-semibold text-gray-500">Placeholder</label>
                                  <input value={field.placeholder || ""} onChange={(e) => updateFormField(index, "placeholder", e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-brand-500/30"
                                    placeholder="Hint text" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[11px] font-semibold text-gray-500">Help Text</label>
                                  <input value={field.helpText || ""} onChange={(e) => updateFormField(index, "helpText", e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-brand-500/30"
                                    placeholder="Shown below field" />
                                </div>
                              </div>

                              {field.fieldType === "DROPDOWN" && (
                                <div className="space-y-1">
                                  <label className="text-[11px] font-semibold text-gray-500">Dropdown Options (comma-separated)</label>
                                  <input
                                    value={Array.isArray(field.options) ? field.options.join(", ") : ""}
                                    onChange={(e) => updateFormField(index, "options", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-brand-500/30"
                                    placeholder="Option 1, Option 2, Option 3" />
                                </div>
                              )}

                              <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={field.isRequired ?? true}
                                  onChange={(e) => updateFormField(index, "isRequired", e.target.checked)}
                                  className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
                                <span className="text-xs font-semibold text-gray-600">
                                  Mandatory {field.isRequired && <span className="text-red-500">*</span>}
                                </span>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-gray-100 flex gap-3">
                      <button onClick={() => setShowFormBuilder(false)} className="flex-1 py-2.5 border-2 border-gray-200 text-gray-600 font-semibold rounded-xl text-sm hover:bg-gray-50 transition-all">Cancel</button>
                      <button onClick={saveForm} className="flex-[2] py-2.5 bg-brand-600 text-white font-semibold rounded-xl text-sm hover:bg-brand-700 transition-all shadow-md">
                        {editingForm ? "Update Form" : "Create Form"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════ */}
          {/* SUBMISSIONS TAB */}
          {/* ═══════════════════════════════════════════ */}
          {activeTab === "submissions" && (
            <div className="animate-fade-in space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                {["ALL", "PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED"].map((s) => (
                  <button key={s} onClick={() => { setSubFilter(s); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      subFilter === s ? "bg-brand-600 text-white border-brand-600" : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                    }`}>
                    {s.replace("_", " ")} ({s === "ALL" ? submissions.length : submissions.filter((sub) => sub.status === s).length})
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {submissions.filter((s) => subFilter === "ALL" || s.status === subFilter).map((sub) => {
                  const p = getPlatformConfig(sub.deal.platform);
                  return (
                    <div key={sub.id} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${p.bgColor} ${p.color}`}>{p.label}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              sub.formType === "FORM1" ? "bg-blue-50 text-blue-600 border border-blue-200" : "bg-purple-50 text-purple-600 border border-purple-200"
                            }`}>
                              {sub.formType === "FORM1" ? "📦 ORDER" : "⭐ REVIEW"}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusConfig(sub.status).bgColor} ${getStatusConfig(sub.status).color}`}>
                              {sub.status.replace("_", " ")}
                            </span>
                          </div>
                          <h4 className="font-bold text-gray-900 text-sm">{sub.deal.title}</h4>
                          <p className="text-xs text-gray-500 mt-1">
                            👤 {sub.user.name} · {sub.user.email} · 📱 {sub.user.phone}
                            {sub.user.upiId && <span className="text-green-600 ml-2">💳 {sub.user.upiId}</span>}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">{formatDateTime(sub.createdAt)} · Amount: {formatINR(sub.deal.productPrice)}</p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 flex-shrink-0">
                          {sub.status !== "APPROVED" && (
                            <button onClick={() => updateSubmissionStatus(sub.id, "APPROVED")}
                              className="px-3 py-2 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-all shadow-sm">
                              ✅ Approve
                            </button>
                          )}
                          {sub.status !== "REJECTED" && (
                            <button onClick={() => {
                              const notes = prompt("Rejection reason (optional):");
                              if (notes !== null) updateSubmissionStatus(sub.id, "REJECTED", notes);
                            }}
                              className="px-3 py-2 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100 transition-all border border-red-200">
                              ❌ Reject
                            </button>
                          )}
                          {sub.status === "PENDING" && (
                            <button onClick={() => updateSubmissionStatus(sub.id, "UNDER_REVIEW")}
                              className="px-3 py-2 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg hover:bg-blue-100 transition-all border border-blue-200">
                              🔍 Review
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Form Data */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-4 pt-4 border-t border-gray-100">
                        {sub.formData.map((fd) => (
                          <div key={fd.id} className="p-2.5 bg-gray-50 rounded-lg">
                            <p className="text-[10px] font-bold text-gray-400 uppercase">{fd.fieldLabel}</p>
                            {fd.fieldType === "FILE_UPLOAD" ? (
                              fd.value.startsWith("data:") ? (
                                <img src={fd.value} alt="" className="mt-1 max-h-24 rounded border cursor-pointer" onClick={() => window.open(fd.value)} />
                              ) : <p className="text-xs text-brand-600 mt-1">📎 File</p>
                            ) : fd.fieldType === "URL" ? (
                              <a href={fd.value} target="_blank" className="text-xs text-brand-600 mt-1 hover:underline block truncate">{fd.value}</a>
                            ) : (
                              <p className="text-xs text-gray-800 mt-1 font-medium break-all">{fd.value || "—"}</p>
                            )}
                          </div>
                        ))}
                      </div>

                      {sub.adminNotes && (
                        <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                          <p className="text-xs text-amber-700"><strong>Admin Note:</strong> {sub.adminNotes}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════ */}
          {/* USERS TAB */}
          {/* ═══════════════════════════════════════════ */}
          {activeTab === "users" && (
            <div className="animate-fade-in">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Name</th><th>Email</th><th>Phone</th><th>UPI</th>
                        <th>Orders</th><th>Spent</th><th>Cashback</th><th>Status</th><th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id}>
                          <td className="font-semibold text-gray-900">{u.name}</td>
                          <td className="text-gray-600 text-xs">{u.email}</td>
                          <td className="text-gray-600 text-xs">{u.phone}</td>
                          <td className="text-xs font-mono text-green-600">{u.upiId || "—"}</td>
                          <td className="font-semibold">{u.totalOrders}</td>
                          <td className="font-semibold">{formatINR(u.totalSpent)}</td>
                          <td className="text-green-600 font-semibold">{formatINR(u.totalCashback)}</td>
                          <td>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              u.isActive ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
                            }`}>
                              {u.isActive ? "Active" : "Banned"}
                            </span>
                          </td>
                          <td>
                            <button onClick={() => toggleUserActive(u.id, !u.isActive)}
                              className={`px-2 py-1 text-xs font-medium rounded-lg transition-colors ${
                                u.isActive ? "text-red-600 bg-red-50 hover:bg-red-100" : "text-green-600 bg-green-50 hover:bg-green-100"
                              }`}>
                              {u.isActive ? "Ban" : "Unban"}
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

          {/* ═══════════════════════════════════════════ */}
          {/* EXPORT TAB */}
          {/* ═══════════════════════════════════════════ */}
          {activeTab === "export" && (
            <div className="animate-fade-in max-w-2xl">
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-6">
                <h3 className="text-lg font-bold text-gray-900">📤 Export Center</h3>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Export Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: "FULL", label: "📊 Full Data", desc: "All sellers, all dates" },
                        { value: "SELLER_WISE", label: "🏷️ Seller-wise", desc: "Filter by platform" },
                        { value: "DATE_WISE", label: "📅 Date Range", desc: "Filter by dates" },
                        { value: "SELLER_DATE", label: "🎯 Combined", desc: "Platform + dates" },
                      ].map((t) => (
                        <button key={t.value} onClick={() => setExportType(t.value)}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            exportType === t.value ? "border-brand-500 bg-brand-50 ring-2 ring-brand-500/20" : "border-gray-200 hover:border-gray-300"
                          }`}>
                          <p className="text-sm font-semibold text-gray-800">{t.label}</p>
                          <p className="text-xs text-gray-400">{t.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {(exportType === "SELLER_WISE" || exportType === "SELLER_DATE") && (
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Platform</label>
                      <select value={exportPlatform} onChange={(e) => setExportPlatform(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-brand-500/30">
                        <option value="">Select Platform</option>
                        {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                  )}

                  {(exportType === "DATE_WISE" || exportType === "SELLER_DATE") && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">From Date</label>
                        <input type="date" value={exportDateFrom} onChange={(e) => setExportDateFrom(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-brand-500/30" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">To Date</label>
                        <input type="date" value={exportDateTo} onChange={(e) => setExportDateTo(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-brand-500/30" />
                      </div>
                    </div>
                  )}

                  <button onClick={handleExport}
                    className="w-full py-3.5 bg-gradient-to-r from-brand-600 to-brand-700 text-white font-semibold rounded-xl shadow-lg shadow-brand-500/20 hover:shadow-xl active:scale-[0.98] transition-all text-sm">
                    📥 Generate & Download CSV
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════ */}
          {/* SUPPORT TAB */}
          {/* ═══════════════════════════════════════════ */}
          {activeTab === "support" && (
            <div className="animate-fade-in">
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <div className="text-5xl mb-3">🎫</div>
                <h3 className="text-lg font-bold text-gray-700">Support Tickets</h3>
                <p className="text-sm text-gray-400 mt-1">Support ticket management will appear here</p>
                <p className="text-xs text-gray-300 mt-2">Connect the support API endpoint to enable this section</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}