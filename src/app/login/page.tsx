"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/deals";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) { toast.error("Please fill all fields"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth?action=login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Login failed"); return; }
      toast.success("Welcome back! 👑");
      if (data.data?.user?.role === "ADMIN") router.push("/admin");
      else router.push(redirect);
      router.refresh();
    } catch { toast.error("Something went wrong"); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-5">
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-widest text-gold-400">Email Address</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@example.com"
          className="input-premium w-full px-4 py-3.5 rounded-xl text-sm font-medium"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-widest text-gold-400">Password</label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="input-premium w-full px-4 py-3.5 pr-16 rounded-xl text-sm font-medium"
            required
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gold-500 hover:text-gold-400">
            {showPassword ? "HIDE" : "SHOW"}
          </button>
        </div>
      </div>

      <button type="submit" disabled={loading}
        className="btn-gold w-full py-4 rounded-xl text-sm uppercase tracking-wider animate-gold-pulse">
        {loading ? "Signing in..." : "Enter Vault →"}
      </button>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-silver-800" /></div>
        <div className="relative flex justify-center">
          <span className="bg-obsidian-deep px-4 text-[10px] text-silver-500 font-bold uppercase tracking-widest">New Member?</span>
        </div>
      </div>

      <Link href="/register" className="btn-silver block w-full py-3.5 text-center rounded-xl text-sm font-bold">
        Create Free Account ✨
      </Link>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-obsidian-deep relative overflow-hidden p-4">
      {/* Animated gold orbs */}
      <div className="absolute top-20 -left-32 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl animate-glow pointer-events-none" />
      <div className="absolute bottom-20 -right-32 w-96 h-96 bg-gold-600/10 rounded-full blur-3xl animate-glow pointer-events-none" style={{ animationDelay: "1.5s" }} />

      <div className="relative z-10 w-full max-w-md animate-fade-in-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-block animate-float mb-4">
            <img src="/logo.png" alt="ShopVault" className="w-28 h-28 object-contain drop-shadow-[0_0_30px_rgba(245,166,35,0.5)]" />
          </div>
          <h1 className="font-display text-4xl font-black tracking-tight">
            <span className="text-silver-gradient">SHOP</span>
            <span className="text-gold-gradient">VAULT</span>
          </h1>
          <p className="text-silver-500 text-xs font-semibold uppercase tracking-widest mt-2">
            Premium Review Deals Portal
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-dark rounded-3xl p-8 shadow-2xl">
          <Suspense fallback={<div className="text-center py-10 text-silver-400">Loading...</div>}>
            <LoginForm />
          </Suspense>
        </div>

        <p className="text-center text-[10px] text-silver-600 mt-6 font-semibold uppercase tracking-widest">
          🔒 Secured by Advanced Encryption
        </p>
      </div>
    </div>
  );
}
