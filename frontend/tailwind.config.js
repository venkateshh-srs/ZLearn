/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "sidebar-bg": "#F7F7F8", // Example sidebar background
        "main-bg": "#FFFFFF", // Example main content background
        accent: "#3B82F6", // Example accent color (blue)
        "light-gray": "#E5E7EB",
        "medium-gray": "#9CA3AF",
        "dark-gray": "#4B5563",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
