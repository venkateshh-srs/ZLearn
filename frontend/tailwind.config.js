/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      animation: {
        // Creates the flowing border effect
        "border-flow": "border-flow 3s linear infinite",
      },
      keyframes: {
        // Defines the animation's start and end points
        "border-flow": {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "200% 50%" },
        },
      },
      colors: {
        chat: "#000000", // Example main content background
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
