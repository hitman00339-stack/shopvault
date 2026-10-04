import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    container: { center: true, padding: "1.5rem" },
    extend: {
      colors: {
        // 🥇 Luxury Gold Palette
        gold: {
          50: "#FFF9E6",
          100: "#FFF0BF",
          200: "#FFE280",
          300: "#FFD24D",
          400: "#FFBF1A",
          500: "#F5A623",
          600: "#D4891A",
          700: "#A66B14",
          800: "#78500E",
          900: "#4A3209",
          glow: "#FFB84D",
        },
        // 🥈 Silver Palette  
        silver: {
          50: "#FAFAFA",
          100: "#F4F4F5",
          200: "#E4E4E7",
          300: "#D4D4D8",
          400: "#A1A1AA",
          500: "#71717A",
          600: "#52525B",
          700: "#3F3F46",
          800: "#27272A",
          900: "#18181B",
        },
        // ⚫ Pure Dark Palette
        obsidian: {
          50: "#F8F8F8",
          900: "#0A0A0A",
          950: "#050505",
          deep: "#000000",
        },
        brand: {
          50: "#FFF9E6",
          500: "#F5A623",
          600: "#D4891A",
          700: "#A66B14",
        },
      },
      fontFamily: {
        display: ["'Playfair Display'", "serif"],
        sans: ["'Inter'", "system-ui", "sans-serif"],
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        glow: {
          "0%, 100%": { opacity: "0.4", transform: "scale(1)" },
          "50%": { opacity: "0.8", transform: "scale(1.1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(30px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        goldPulse: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(245, 166, 35, 0.3)" },
          "50%": { boxShadow: "0 0 40px rgba(245, 166, 35, 0.6)" },
        },
      },
      animation: {
        float: "float 4s ease-in-out infinite",
        glow: "glow 3s ease-in-out infinite",
        shimmer: "shimmer 3s linear infinite",
        "fade-in-up": "fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-in-right": "slideInRight 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        "gold-pulse": "goldPulse 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
