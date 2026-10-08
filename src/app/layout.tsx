import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "ShopVault — Premium Review Deals Portal",
  description: "100% refund + bonus cashback on Amazon, Flipkart, Myntra deals. Verified campaigns, instant payouts.",
  icons: {
    icon: [
      { url: "/logo.png", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-obsidian-deep font-sans antialiased">
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3500,
            style: {
              background: "linear-gradient(135deg, #18181B, #27272A)",
              color: "#FAFAFA",
              border: "1px solid rgba(245, 166, 35, 0.3)",
              borderRadius: "16px",
              padding: "14px 20px",
              fontSize: "14px",
              fontWeight: "600",
              boxShadow: "0 10px 40px rgba(0,0,0,0.5), 0 0 20px rgba(245, 166, 35, 0.1)",
            },
            success: { iconTheme: { primary: "#F5A623", secondary: "#0A0A0A" } },
            error: { iconTheme: { primary: "#EF4444", secondary: "#FAFAFA" } },
          }}
        />
        {children}
      </body>
    </html>
  );
}
