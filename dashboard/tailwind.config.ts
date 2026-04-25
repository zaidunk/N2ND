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
        bg:        "#07080F",
        surface:   "#0D1117",
        surface2:  "#161B27",
        border:    "#1E2D3D",
        primary:   "#3B82F6",
        "primary-hover": "#2563EB",
        accent:    "#F59E0B",
        text:      "#EEF2FF",
        muted:     "#6B7BB6",
        positive:  "#10B981",
        negative:  "#F85149",
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
        "ticker": "ticker 30s linear infinite",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        ticker: {
          "0%":   { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
