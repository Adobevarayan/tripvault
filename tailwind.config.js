/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#101B2D',
        forest: '#183D35',
        cream: '#F7F4EC',
        beige: '#DCCCB5',
        orange: '#E99A52'
      },
      boxShadow: {
        premium: '0 20px 45px -20px rgba(16,27,45,0.35)'
      },
      backgroundImage: {
        mesh: 'radial-gradient(circle at top left, rgba(233,154,82,0.16), transparent 32%), radial-gradient(circle at top right, rgba(24,61,53,0.16), transparent 28%)'
      }
    }
  },
  plugins: []
};
