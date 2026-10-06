"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Logo from "./Logo";

interface NavbarProps {
  user?: any;
}

export default function Navbar({ user: initialUser }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(initialUser || null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  useEffect(() => {
    if (!initialUser) {
      fetch("/api/auth?action=me")
        .then((r) => r.json())
        .then((data) => {
          if (data.success) setUser(data.data);
        })
        .catch(() => {});
    }
  }, [initialUser]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth?action=logout", { method: "POST" });
    } catch {
      // ignore
    } finally {
      document.cookie = "shopvault_token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      toast.success("Signed out successfully");
      window.location.href = "/login";
    }
  };

  const navLinks = [
    { href: "/deals", label: "Deals", icon: "🏷️" },
    { href: "/my-orders", label: "My Orders", icon: "📋" },
    { href: "/support", label: "Support", icon: "🎫" },
  ];

  return (
    <>
      {/* ─── DESKTOP & TOP NAVBAR ─── */}
      <header className="sticky top-0 z-40 bg-obsidian-900/85 backdrop-blur-2xl border-b border-gold-500/15 px-4 sm:px-8 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <Logo size="md" href="/deals" />

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 glass-dark px-3 py-1.5 rounded-2xl border border-silver-800/80">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                    isActive
                      ? "btn-gold"
                      : "text-silver-400 hover:text-silver-100 hover:bg-white/5"
                  }`}
                >
                  <span>{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action / Profile */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {user?.role === "ADMIN" && (
              <Link
                href="/admin"
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black bg-gold-500/15 text-gold-400 border border-gold-500/30 hover:bg-gold-500/25 transition-all"
              >
                👑 <span>Admin Panel</span>
              </Link>
            )}

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl glass-dark hover:border-gold-500/30 border border-silver-800 transition-all text-left"
                >
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-obsidian-deep font-black text-xs shadow-gold-sm">
                    {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div className="hidden lg:block">
                    <p className="text-xs font-bold text-silver-100 leading-tight max-w-[120px] truncate">{user.name}</p>
                    <p className="text-[10px] text-gold-500 font-semibold leading-tight">Member</p>
                  </div>
                  <span className="text-silver-500 text-xs hidden sm:inline">▾</span>
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserDropdownOpen(false)} />
                    <div className="absolute right-0 mt-2 w-60 glass-vault rounded-2xl p-2 z-50 border border-gold-500/25 shadow-2xl animate-fade-in-up">
                      <div className="px-3 py-2.5 border-b border-silver-800/80 mb-1">
                        <p className="text-xs font-bold text-silver-100">{user.name}</p>
                        <p className="text-[11px] text-silver-400 truncate mt-0.5">{user.email}</p>
                        {user.upiId && (
                          <div className="mt-1.5 inline-block px-2 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono">
                            UPI: {user.upiId}
                          </div>
                        )}
                      </div>

                      {user.role === "ADMIN" && (
                        <Link
                          href="/admin"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-gold-400 hover:bg-gold-500/10 transition-colors"
                        >
                          👑 Admin Panel
                        </Link>
                      )}

                      <Link
                        href="/support"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-silver-300 hover:bg-white/5 transition-colors"
                      >
                        ⚙️ Profile & UPI Setup
                      </Link>

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-red-400 hover:bg-red-500/10 transition-colors text-left"
                      >
                        🚪 Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="btn-silver px-4 py-2 rounded-xl text-xs font-bold">
                  Sign In
                </Link>
                <Link href="/register" className="btn-gold px-4 py-2 rounded-xl text-xs font-bold">
                  Join Free
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2.5 rounded-xl glass-dark border border-silver-800 text-silver-300 hover:text-gold-400 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>
      </header>

      {/* ─── MOBILE DRAWER MENU ─── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-obsidian-deep/95 backdrop-blur-2xl animate-fade-in-up">
          <div className="p-5 flex flex-col h-full">
            <div className="flex justify-between items-center pb-4 border-b border-silver-800">
              <Logo size="md" href="/deals" />
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-9 h-9 rounded-xl glass-dark border border-silver-800 text-silver-300 flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {user && (
              <div className="my-5 p-4 rounded-2xl glass-vault border border-gold-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-obsidian-deep font-black text-sm shadow-gold-sm">
                    {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-silver-100">{user.name}</p>
                    <p className="text-xs text-silver-400">{user.email}</p>
                    <p className="text-[10px] text-gold-500 font-bold uppercase mt-0.5">
                      {user.role === "ADMIN" ? "Administrator" : "Verified Member"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2 flex-1 overflow-y-auto py-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between p-4 rounded-2xl text-sm font-bold transition-all ${
                    pathname === link.href
                      ? "btn-gold shadow-gold-sm"
                      : "glass-dark border border-silver-800/80 text-silver-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{link.icon}</span>
                    <span>{link.label}</span>
                  </div>
                  <span>→</span>
                </Link>
              ))}

              {user?.role === "ADMIN" && (
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-4 rounded-2xl text-sm font-bold bg-gold-500/15 border border-gold-500/40 text-gold-400"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">👑</span>
                    <span>Admin Command Center</span>
                  </div>
                  <span>→</span>
                </Link>
              )}
            </div>

            <div className="pt-4 border-t border-silver-800 space-y-2">
              {user ? (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full py-3.5 rounded-2xl btn-silver text-red-400 border border-red-500/20 text-xs font-bold"
                >
                  🚪 Sign Out
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="btn-silver py-3 text-center rounded-xl text-xs font-bold">
                    Sign In
                  </Link>
                  <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="btn-gold py-3 text-center rounded-xl text-xs font-bold">
                    Join Free
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── MOBILE BOTTOM BAR (Native App Feel on Phones) ─── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-obsidian-950/90 backdrop-blur-2xl border-t border-gold-500/20 px-3 py-2 safe-area-pb">
        <div className="flex items-center justify-around">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
                  isActive ? "text-gold-400" : "text-silver-500 hover:text-silver-300"
                }`}
              >
                <span className={`text-base transition-transform ${isActive ? "scale-110" : ""}`}>{link.icon}</span>
                <span className={`text-[10px] font-bold tracking-tight ${isActive ? "text-gold-400" : ""}`}>
                  {link.label}
                </span>
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-gold-500 mt-0.5" />}
              </Link>
            );
          })}

          {user?.role === "ADMIN" && (
            <Link
              href="/admin"
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
                pathname.startsWith("/admin") ? "text-gold-400" : "text-silver-500"
              }`}
            >
              <span className="text-base">👑</span>
              <span className="text-[10px] font-bold">Admin</span>
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
