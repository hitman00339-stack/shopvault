"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import Logo from "@/components/Logo";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/deals";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const performLogin = async (loginEmail: string, loginPass: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth?action=login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPass }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Login failed");
        return;
      }
      toast.success("Welcome back to ShopVault! 👑");
      if (data.data?.user?.role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push(redirect === "/login" ? "/deals" : redirect);
      }
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Please fill in both email and password");
      return;
    }
    await performLogin(email, password);
  };

  const quickDemoLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("vault123");
    await performLogin(demoEmail, "vault123");
  };

  return (
    <div className="space-y-6">
      {/* ─── 1-CLICK INSTANT ACCESS (Never get stuck) ─── */}
      <div className="p-4 rounded-2xl glass-dark border border-gold-500/25 space-y-2.5">
        <p className="text-[10px] text-gold-400 font-black uppercase tracking-widest text-center">
          ⚡ 1-Click Instant Access
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => quickDemoLogin("member@shopvault.com")}
            disabled={loading}
            className="btn-silver py-2.5 px-3 rounded-xl text-xs font-bold text-center border border-silver-700/80 hover:border-gold-500/40 transition-all flex items-center justify-center gap-1.5"
          >
            <span>🛡️</span>
            <span>Member Mode</span>
          </button>
          <button
            type="button"
            onClick={() => quickDemoLogin("hitman00339@gmail.com")}
            disabled={loading}
            className="btn-outline-gold py-2.5 px-3 rounded-xl text-xs font-bold text-center transition-all flex items-center justify-center gap-1.5"
          >
            <span>👑</span>
            <span>Admin Mode</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleLogin} className="space-y-5">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-gold-400">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="hitman00339@gmail.com or member@example.com"
            className="input-premium w-full px-4 py-3.5 rounded-2xl text-sm font-medium"
            required
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold uppercase tracking-widest text-gold-400">
              Password
            </label>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="input-premium w-full px-4 py-3.5 pr-16 rounded-2xl text-sm font-medium"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gold-500 hover:text-gold-400"
            >
              {showPassword ? "HIDE" : "SHOW"}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-gold w-full py-4 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-wider shadow-gold-md"
        >
          {loading ? "Entering Vault..." : "Enter Vault →"}
        </button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-silver-800" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-[#0e1017] px-4 text-[11px] text-silver-400 font-bold uppercase tracking-widest">
              Don't have an account?
            </span>
          </div>
        </div>

        <Link
          href="/register"
          className="btn-silver block w-full py-3.5 text-center rounded-2xl text-xs sm:text-sm font-bold tracking-wide"
        >
          Create Free Member Account ✨
        </Link>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-obsidian-deep relative overflow-hidden p-4 sm:p-6">
      {/* Background radial gold glow ambient highlights */}
      <div className="absolute top-1/4 -left-40 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-40 w-96 h-96 bg-gold-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg animate-fade-in-up py-8">
        {/* Logo & Headline */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="inline-block mb-4">
            <Logo size="xl" href="/deals" showText={false} />
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-black tracking-tight">
            <span className="text-silver-gradient">SHOP</span>
            <span className="text-gold-gradient ml-1">VAULT</span>
          </h1>
          <p className="text-silver-400 text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] mt-2">
            Members Only Review Deals Portal
          </p>
        </div>

        {/* Card */}
        <div className="glass-vault rounded-3xl p-6 sm:p-10 shadow-2xl border border-gold-500/25">
          <Suspense fallback={<div className="text-center py-10 text-silver-400">Loading form...</div>}>
            <LoginForm />
          </Suspense>
        </div>

        <p className="text-center text-[10px] text-silver-500 mt-6 font-semibold uppercase tracking-widest flex items-center justify-center gap-1.5">
          <span>🔒</span> 256-Bit Encrypted Authentication
        </p>
      </div>
    </div>
  );
}
