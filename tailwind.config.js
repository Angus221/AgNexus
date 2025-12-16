import { heroui } from "@heroui/theme";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/layouts/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/sidepanel/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  darkMode: "class",
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            primary: {
              DEFAULT: "#6366F1",
              foreground: "#FFFFFF",
            },
            background: "#F9FAFB",
            foreground: "#1E293B",
            divider: "#E2E8F0",
          },
        },
        dark: {
          colors: {
            primary: {
              DEFAULT: "#6366F1",
              foreground: "#FFFFFF",
            },
            background: "#111827",
            foreground: "#F3F4F6",
            divider: "#4B5563",
          },
        },
      },
    }),
  ],
};
