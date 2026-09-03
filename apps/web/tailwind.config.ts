import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#050816",
          900: "#0b1220",
          800: "#10192f",
        },
        gold: {
          50: "#fff8e1",
          100: "#ffedb0",
          200: "#ffd96d",
          300: "#f6bf42",
          400: "#e39b19",
        },
        mint: {
          50: "#e8fff9",
          100: "#bff8eb",
          200: "#7af0d1",
          300: "#31d4aa",
          400: "#14b58d",
        },
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(255,255,255,0.04), 0 24px 60px rgba(0,0,0,0.35)",
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
      backgroundImage: {
        "mesh-radial": "radial-gradient(circle at top left, rgba(20,181,141,0.24), transparent 30%), radial-gradient(circle at top right, rgba(227,155,25,0.18), transparent 28%), radial-gradient(circle at bottom left, rgba(255,255,255,0.08), transparent 26%)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
