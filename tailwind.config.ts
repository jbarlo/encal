import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: { aspectRatio: { "21/10": "21 / 10" } },
  },
  plugins: [],
} satisfies Config;
