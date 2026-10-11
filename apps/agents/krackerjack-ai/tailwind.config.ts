import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        mono: ["JetBrains Mono", "Courier New", "monospace"],
        hive: ["Rajdhani", "sans-serif"],
        sans: ["Rajdhani", "sans-serif"],
      },
      colors: {
        gold: {
          DEFAULT: "#f5a623",
          light: "#ffd700",
          dim: "#c4861a",
          dark: "#7a5210",
        },
        hive: {
          black: "#0a0a0a",
          dark: "#111111",
          card: "#161616",
          border: "#222222",
          muted: "#1a1a1a",
        },
        terminal: {
          green: "#00ff41",
          dim: "#00cc33",
          dark: "#003311",
        },
        neon: {
          blue: "#00d4ff",
          red: "#ff3333",
          purple: "#bb00ff",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
      },
      animation: {
        "pulse-gold": "pulseGold 2s ease-in-out infinite",
        "scan": "scan 3s linear infinite",
        "flicker": "flicker 0.15s infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
        "typing": "typing 0.1s steps(1) infinite",
      },
      keyframes: {
        pulseGold: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        flicker: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.85" },
        },
        glow: {
          "0%": { textShadow: "0 0 4px #f5a623, 0 0 8px #f5a623" },
          "100%": { textShadow: "0 0 8px #ffd700, 0 0 20px #f5a623, 0 0 40px #c4861a" },
        },
        typing: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
