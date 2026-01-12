/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'selector',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        // Фирменный синий (Lifeguard Brand)
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6', // Основной цвет кнопок
          600: '#2563eb', // Ховер
          700: '#1d4ed8',
          900: '#1e3a8a', // Темно-синий для текстов
        },
        gray: {
          750: '#2d3748',
          850: '#1a202c', // Глубокий темный фон для сайдбара
          900: '#111827',
          950: '#0d1117',
        },
        slate: {
          850: '#151e2e', // Глубокий темный фон для сайдбара
        }
      },
      boxShadow: {
        'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02)',
        'card': '0 0 0 1px rgba(0,0,0,0.03), 0 2px 8px rgba(0,0,0,0.04)',
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up-fade': {
          '0%': { opacity: '0', transform: 'translateY(20px) scale(0.96)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        }
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.2s ease-out',
        'slide-up-fade': 'slide-up-fade 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      }
    },
  },
  plugins: [],
}