import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17251c",
        cream: "#f5f0df",
        leaf: "#2f6d42",
        lime: "#dbe88f",
        rust: "#b84b2f",
      },
      boxShadow: {
        card: "0 18px 55px rgba(42, 58, 42, 0.11)",
      },
    },
  },
  plugins: [],
} satisfies Config;
