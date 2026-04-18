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
          DEFAULT: '#FF6B00',
          light: '#FF9A3C',
          dark: '#E55C00',
        },
        success: {
          DEFAULT: '#22C55E',
          light: '#4ADE80',
          dark: '#16A34A',
        },
        background: '#F7F7F7',
        card: '#FFFFFF',
        border: '#ECECEC',
        textPrimary: '#1A1A1A',
        textSecondary: '#6B7280',
        textMuted: '#9CA3AF',
        lightOrange: '#FFF5EE',
      },
      fontFamily: {
        sans: ['Nunito', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 16px rgba(0,0,0,0.1)',
        'button': '0 2px 8px rgba(255,107,0,0.3)',
      },
    },
  },
  plugins: [],
}
