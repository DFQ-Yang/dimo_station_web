/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0052D9',
          light: '#337EFF',
          dark: '#003BA5',
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

