import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        emerald: {
          brand: "#059669",
          glow: "#34d399",
          dark: "#064e3b",
          deep: "#022c22",
        },
        glycemic: {
          green: "#10b981",
          greenBg: "rgba(16, 185, 129, 0.12)",
          yellow: "#f59e0b",
          yellowBg: "rgba(245, 158, 11, 0.12)",
          red: "#ef4444",
          redBg: "rgba(239, 68, 68, 0.12)",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        heading: ["var(--font-outfit)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 25px -5px rgba(5, 150, 105, 0.35)",
        "glow-lg": "0 0 40px -10px rgba(5, 150, 105, 0.45)",
      },
    },
  },
  plugins: [],
};
export default config;
