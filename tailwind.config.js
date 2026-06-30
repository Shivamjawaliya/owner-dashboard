/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./features/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          300: "#93C5FD",
          400: "#60A5FA",
          500: "#3B82F6",
          600: "#2563EB",
          700: "#1D4ED8",
          800: "#1E40AF",
          900: "#1E3A5F",
        },
        success: { 50: "#F0FDF4", 500: "#22C55E", 600: "#16A34A" },
        warning: { 50: "#FFFBEB", 500: "#F59E0B", 600: "#D97706" },
        danger:  { 50: "#FEF2F2", 500: "#EF4444", 600: "#DC2626" },
        surface: "#F8FAFC",
      },
      fontFamily: {
        sans: ["System"],
      },
    },
  },
  plugins: [],
};
