import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          base: "#070b14",
          card: "#0d1424",
          elevated: "#0f1929",
          border: "#1e2d45",
        },
        cyan: {
          DEFAULT: "#00d4ff",
          dim: "#00d4ff44",
          subtle: "#00d4ff18",
        },
        green: {
          neon: "#00ff88",
          dim: "#00ff8844",
          subtle: "#00ff8818",
        },
        red: {
          alert: "#ff4646",
          dim: "#ff464644",
        },
        yellow: {
          warn: "#ffc400",
          dim: "#ffc40033",
        },
        orange: {
          alert: "#ff8c42",
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Courier New", "monospace"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "slide-in-right": "slideInRight 0.3s ease-out",
        "fade-in": "fadeIn 0.2s ease-out",
        "ticker": "ticker 0.4s ease-out",
      },
      keyframes: {
        slideInRight: {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        ticker: {
          "0%": { opacity: "0.3", transform: "scale(0.97)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
