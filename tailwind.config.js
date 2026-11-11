/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        activeTab:'#5856D6',
        item:'#E0E7FF'
        
      }
    },
  },
  plugins: [require('tailwindcss-primeui')]
}

