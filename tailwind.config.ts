import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        customBlue: "#0a3d62",
      },
    },
  },
  plugins: [],
};

export default config;
