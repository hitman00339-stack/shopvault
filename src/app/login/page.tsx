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

    if (!email.trim() || !password.trim()) {
      toast.error("Please enter email and password");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth?action=login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Login failed");
        return;
      }

      toast.success("Welcome back! 🎉");

      if (data.data?.user?.role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push(redirect);
      }

      router.refresh();
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden backdrop-blur-2xl">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-brand-500/10 to-purple-500/10 rounded-full blur-2xl pointer-events-none" />

      <form onSubmit={handleLogin} className="space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-2">
            <span>✉️</span> Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            className="w-full px-4 py-3.5 rounded-2xl border border-gray-200/80 bg-white/70 text-sm font-medium
              focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 focus:bg-white
              transition-all duration-200 placeholder:text-gray-400"
            required
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-2">
              <span>🔒</span> Password
            </label>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3.5 pr-14 rounded-2xl border border-gray-200/80 bg-white/70 text-sm font-medium
                focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 focus:bg-white
                transition-all duration-200 placeholder:text-gray-400"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 hover:text-brand-600 transition-colors"
            >
              {showPassword ? "HIDE" : "SHOW"}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 px-6 bg-gradient-to-r from-brand-600 via-brand-500 to-indigo-600 text-white font-bold text-sm
            rounded-2xl shadow-lg shadow-brand-500/30 hover:shadow-xl hover:shadow-brand-500/40 hover:scale-[1.01] active:scale-[0.99]
            disabled:opacity-60 transition-all duration-200 flex items-center justify-center gap-2"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Signing in...
            </span>
          ) : (
            <>
              Sign In to Dashboard 🚀
            </>
          )}
        </button>
      </form>

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200/80" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white/90 px-4 text-gray-400 font-semibold uppercase tracking-wider">
            New Member?
          </span>
        </div>
      </div>

      <Link
        href="/register"
        className="flex items-center justify-center gap-2 w-full py-3.5 px-4 text-center text-sm font-bold text-brand-600
          border-2 border-brand-200/80 rounded-2xl hover:bg-brand-50/80 hover:border-brand-400
          active:scale-[0.99] transition-all duration-200"
      >
        Create Free Member Account ✨
      </Link>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5] relative overflow-hidden p-4 sm:p-6">
      {/* Background Animated Glowing Blobs */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-brand-400/20 rounded-full blur-3xl animate-pulse-glow pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse-glow pointer-events-none" style={{ animationDelay: "2s" }} />

      <div className="relative z-10 w-full max-w-md animate-float">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-brand-600 to-indigo-600 rounded-2xl shadow-xl shadow-brand-500/30 mb-4 text-white font-extrabold text-2xl tracking-wider ring-4 ring-white">
            SV
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
            ShopVault
          </h1>
          <p className="text-gray-500 mt-2 text-sm font-medium">
            100% Refund & Cashback Review Marketplace
          </p>
        </div>

        <Suspense fallback={<div className="text-center py-10 text-gray-400">Loading...</div>}>
          <LoginForm />
        </Suspense>

        <p className="text-center text-xs text-gray-400 mt-8 font-medium">
          🔒 Encrypted & Secure Portal · ShopVault Inc.
        </p>
      </div>
    </div>
  );
}
