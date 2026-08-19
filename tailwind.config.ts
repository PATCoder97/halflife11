import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#080a08",
        cream: "#d8d3c2",
        panel: "#111511",
        concrete: "#85887d",
        leaf: "#ff6a00",
        lime: "#ffc247",
        rust: "#d94335",
      },
      fontFamily: {
        sans: ["IBM Plex Mono", "monospace"],
        serif: ["Barlow Condensed", "sans-serif"],
      },
      boxShadow: {
        card: "0 20px 70px rgba(0, 0, 0, 0.42)",
        glow: "0 0 32px rgba(255, 106, 0, 0.16)",
      },
    },
  },
  plugins: [],
} satisfies Config;
