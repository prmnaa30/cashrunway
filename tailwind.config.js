/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        cypress: {
          bg: "#0C1513",
          surface: "#13211D",
          card: "#192B26",
          border: "#233A34",
          "text-primary": "#EAEFEA",
          "text-secondary": "#8DA499",
        },
        linen: {
          bg: "#F2F6F4",
          surface: "#FFFFFF",
          card: "#E8EFEA",
          border: "#D0DDD7",
          "text-primary": "#1A2421",
          "text-secondary": "#52665E",
        },
        accent: {
          champagne: "#D4AF37",
          brass: "#B8860B",
          gold: "#F3E5AB",
        },
        status: {
          safe: "#10B981",
          warning: "#F59E0B",
          danger: "#EF4444",
        },
      },
    },
  },
  plugins: [],
};
