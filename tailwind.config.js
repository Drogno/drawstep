/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        lorcana: {
          amber: '#FFA500',
          amethyst: '#8B5CF6',
          emerald: '#10B981',
          ruby: '#EF4444',
          sapphire: '#3B82F6',
          steel: '#6B7280',
        },
      },
    },
  },
  plugins: [],
}