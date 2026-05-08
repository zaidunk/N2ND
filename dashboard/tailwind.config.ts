import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg:       "rgb(var(--color-bg) / <alpha-value>)",
        surface:  "rgb(var(--color-surface) / <alpha-value>)",
        surface2: "rgb(var(--color-surface2) / <alpha-value>)",
        border:   "rgb(var(--color-border) / <alpha-value>)",
        primary:  "rgb(var(--color-primary) / <alpha-value>)",
        "primary-hover": "rgb(var(--color-primary) / 0.8)",
        accent:   "rgb(var(--color-accent) / <alpha-value>)",
        text:     "rgb(var(--color-text) / <alpha-value>)",
        muted:    "rgb(var(--color-muted) / <alpha-value>)",
        positive: "#10B981",
        negative: "#F85149",
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
      },
      fontWeight: {
        // Force only semibold and above — no thin fonts
        DEFAULT: "700",
      },
      backgroundImage: {
        "grid-pattern": "radial-gradient(circle, #1E2D3D 1px, transparent 1px)",
        "glow-blue": "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(59,130,246,0.15), transparent)",
      },
      animation: {
        "ticker": "ticker 40s linear infinite",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        ticker: {
          "0%":   { transform: "translateX(0)" },
          "100%": { transform: "translateX(-25%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
