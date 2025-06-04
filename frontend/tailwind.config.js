/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        chat: "#000000", // Example main content background
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
