/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      boxShadow: {
        glow: "0 0 20px rgba(255, 255, 255, 0.12)", // normal subtle glow
        "glow-hover": "0 0 30px rgba(255, 255, 255, 0.2)", // stronger on hover ✨
      },
    },
  },
  plugins: [],
};
