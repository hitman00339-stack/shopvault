"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import Logo from "@/components/Logo";

export default function RegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Please enter your full name");
      return;
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (!formData.phone.trim() || formData.phone.length < 10) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }
    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth?action=register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Registration failed");
        return;
      }

      toast.success("Welcome to ShopVault! 🎉");
      router.push("/deals");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-obsidian-deep relative overflow-hidden p-4 sm:p-6">
      {/* Ambient gold glow orbs */}
      <div className="absolute top-1/4 -right-40 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-40 w-96 h-96 bg-gold-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg animate-fade-in-up py-8">
        {/* Header with Official Logo */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="inline-block mb-4">
            <Logo size="xl" href="/deals" showText={false} />
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-black tracking-tight">
            <span className="text-silver-gradient">JOIN</span>
            <span className="text-gold-gradient ml-1">SHOPVAULT</span>
          </h1>
          <p className="text-silver-400 text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] mt-2">
            Unlock 100% Refund Review Campaigns
          </p>
        </div>

        {/* Registration Card */}
        <div className="glass-vault rounded-3xl p-6 sm:p-10 shadow-2xl border border-gold-500/25">
          <form onSubmit={handleRegister} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-gold-400">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Rahul Sharma"
                className="input-premium w-full px-4 py-3.5 rounded-2xl text-sm font-medium"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-gold-400">
                Email Address *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="rahul@example.com"
                className="input-premium w-full px-4 py-3.5 rounded-2xl text-sm font-medium"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-gold-400">
                Phone Number (WhatsApp) *
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => updateField("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="9876543210"
                maxLength={10}
                className="input-premium w-full px-4 py-3.5 rounded-2xl text-sm font-medium"
                required
              />
              <p className="text-[10px] text-silver-500">
                Used for instant UPI payment notifications and order verification.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-gold-400">
                Password *
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => updateField("password", e.target.value)}
                placeholder="Minimum 6 characters"
                className="input-premium w-full px-4 py-3.5 rounded-2xl text-sm font-medium"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-gold w-full py-4 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-wider shadow-gold-md mt-2"
            >
              {loading ? "Creating Vault Account..." : "Create Free Account 🚀"}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-silver-800" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-[#0e1017] px-4 text-[11px] text-silver-400 font-bold uppercase tracking-widest">
                  Already a member?
                </span>
              </div>
            </div>

            <Link
              href="/login"
              className="btn-silver block w-full py-3.5 text-center rounded-2xl text-xs sm:text-sm font-bold tracking-wide"
            >
              Sign In to Your Account →
            </Link>
          </form>
        </div>

        <p className="text-center text-[10px] text-silver-500 mt-6 font-semibold uppercase tracking-widest flex items-center justify-center gap-1.5">
          <span>🛡️</span> Zero Fees • 100% Refund Campaigns
        </p>
      </div>
    </div>
  );
}
