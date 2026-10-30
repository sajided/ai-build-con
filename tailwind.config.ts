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
        // Warm off-white app surfaces
        canvas: "#F5F4ED",
        backdrop: "#E7EBF2",
        line: "#E6E3D8",
        ink: {
          DEFAULT: "#1F2328",
          soft: "#4A4F57",
          muted: "#8A8E95",
        },
        // Pastel tiles: DEFAULT = tile fill, strong = round action button, ink = text on tile
        pastel: {
          blue: { DEFAULT: "#CFE0FA", strong: "#7FA7EE", ink: "#1F3D72" },
          lime: { DEFAULT: "#E1ECB2", strong: "#9DB98C", ink: "#3C4C17" },
          peach: { DEFAULT: "#F8D697", strong: "#E9A440", ink: "#6A420E" },
          coral: { DEFAULT: "#F4B193", strong: "#E97C4D", ink: "#6D2A10" },
          lilac: { DEFAULT: "#D5C8F7", strong: "#9F88EA", ink: "#3A2A72" },
        },
        // Traffic-light risk ratings, mapped onto the pastel set
        risk: {
          safe: "#E1ECB2",
          safeInk: "#3C5A12",
          caution: "#F8D697",
          cautionInk: "#6A420E",
          danger: "#F4B193",
          dangerInk: "#7A2610",
        },
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
        sans: ["var(--font-nunito)", "var(--font-bengali)", "system-ui", "sans-serif"],
        heading: ["var(--font-nunito)", "var(--font-bengali)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(31,35,40,0.04), 0 10px 28px -14px rgba(31,35,40,0.18)",
        float: "0 12px 32px -12px rgba(31,35,40,0.28)",
        glow: "0 0 25px -5px rgba(5, 150, 105, 0.35)",
        "glow-lg": "0 0 40px -10px rgba(5, 150, 105, 0.45)",
      },
    },
  },
  plugins: [],
};
export default config;
