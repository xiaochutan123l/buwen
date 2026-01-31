/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // 预设项目色彩
        buwen: {
          pink: '#FF6B9D',
          teal: '#4ECDC4',
          gold: '#FFD93D',
          mint: '#A8E6CF',
          lavender: '#C7CEEA',
        },
      },
      backgroundImage: {
        'main-gradient': 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)',
        'today-gradient': 'linear-gradient(135deg, #fff8f9 0%, #ffe8ed 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-in-out',
        'float-in': 'floatIn 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        floatIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
