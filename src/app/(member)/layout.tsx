"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth?action=me")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setUser(data.data);
        } else {
          router.push("/login");
        }
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-obsidian-deep flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
          <p className="text-xs font-bold text-silver-400 uppercase tracking-widest">
            Loading Member Portal...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidian-deep pb-24 md:pb-16 text-silver-100">
      {/* ─── UNIFIED RESPONSIVE NAVBAR ─── */}
      <Navbar user={user} />

      {/* ─── PAGE CONTENT (Spacious & Breathable) ─── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {children}
      </main>
    </div>
  );
}