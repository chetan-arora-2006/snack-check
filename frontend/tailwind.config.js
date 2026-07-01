/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        health: {
          excellent: '#22c55e', # Green
          moderate: '#eab308',  # Yellow/Orange
          poor: '#ef4444',      # Red
        }
      }
    },
  },
  plugins: [],
}
