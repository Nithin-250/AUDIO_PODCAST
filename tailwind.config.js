/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        starwars: ['"Bebas Neue"', 'sans-serif'],
      },
      colors: {
        starwarsGreen: '#00ff00',
      },
    },
  },
  plugins: [],
};




