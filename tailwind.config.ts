import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    container: { center: true, padding: { DEFAULT: "1rem", sm: "1.5rem", lg: "2rem" } },
    extend: {
      colors: {
        // 🥇 Ultra-Luxury Gold & Amber Palette (matching the official ShopVault logo)
        gold: {
          50: "#FFFDF0",
          100: "#FFF9D6",
          200: "#FFF0A3",
          300: "#FFE46B",
          400: "#FFD538",
          500: "#F5A623", // Primary Logo Gold
          600: "#D9820D",
          700: "#B36306",
          800: "#8C4905",
          900: "#5E3003",
          950: "#381B01",
          glow: "#FFBF1A",
        },
        // 🥈 Metallic Silver / Chrome
        silver: {
          50: "#FFFFFF",
          100: "#F5F5F7",
          200: "#E5E5EB",
          300: "#D1D1DB",
          400: "#9E9EA8",
          500: "#71717E",
          600: "#4B4B58",
          700: "#32323D",
          800: "#1E1F29",
          900: "#13141C",
        },
        // ⚫ Obsidian & Deep Space Dark
        obsidian: {
          50: "#222533",
          800: "#151722",
          900: "#0D0E15",
          950: "#08090D",
          deep: "#050608",
        },
        brand: {
          50: "#FFFDF0",
          100: "#FFF9D6",
          400: "#FFD538",
          500: "#F5A623",
          600: "#D9820D",
          700: "#B36306",
        },
      },
      fontFamily: {
        display: ["'Playfair Display'", "Georgia", "serif"],
        sans: ["'Inter'", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
      boxShadow: {
        "gold-sm": "0 2px 10px rgba(245, 166, 35, 0.2)",
        "gold-md": "0 4px 20px rgba(245, 166, 35, 0.35)",
        "gold-lg": "0 10px 35px rgba(245, 166, 35, 0.45)",
        "vault-card": "0 20px 50px -15px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.06)",
        "vault-card-hover": "0 25px 60px -10px rgba(0, 0, 0, 0.9), 0 0 30px rgba(245, 166, 35, 0.25)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        glow: {
          "0%, 100%": { opacity: "0.35", transform: "scale(1)" },
          "50%": { opacity: "0.75", transform: "scale(1.08)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        goldPulse: {
          "0%, 100%": { boxShadow: "0 0 15px rgba(245, 166, 35, 0.25)" },
          "50%": { boxShadow: "0 0 35px rgba(245, 166, 35, 0.6)" },
        },
      },
      animation: {
        float: "float 5s ease-in-out infinite",
        glow: "glow 4s ease-in-out infinite",
        shimmer: "shimmer 2.5s linear infinite",
        "fade-in-up": "fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        "gold-pulse": "goldPulse 2.5s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
