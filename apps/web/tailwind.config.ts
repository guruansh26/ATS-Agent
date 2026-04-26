import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f5f7ff",
          100: "#e7ecff",
          500: "#5a6cff",
          600: "#4856e6",
          700: "#3a45b3"
        }
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Inter",
          "sans-serif"
        ]
      }
    }
  },
  plugins: []
};
export default config;
