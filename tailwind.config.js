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
          bg: "#F0F4F2",
          surface: "#FFFFFF",
          card: "#FFFFFF",
          border: "#DCE5E0",
          "text-primary": "#14201C",
          "text-secondary": "#4D6359",
        },
        accent: {
          champagne: "#D4AF37",
          brass: "#92400E",
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
