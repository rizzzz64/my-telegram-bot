/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0A0A14',
          secondary: '#12121F',
          card: '#1A1A2E',
          hover: '#22223A',
        },
        accent: {
          purple: '#8B5CF6',
          blue: '#3B82F6',
          cyan: '#06B6D4',
          pink: '#EC4899',
          green: '#10B981',
          yellow: '#F59E0B',
          red: '#EF4444',
          orange: '#F97316',
        },
        text: {
          primary: '#F1F5F9',
          secondary: '#94A3B8',
          muted: '#64748B',
        },
        rarity: {
          common: '#94A3B8',
          uncommon: '#10B981',
          rare: '#3B82F6',
          epic: '#8B5CF6',
          legendary: '#F59E0B',
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      animation: {
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
        'bounce-soft': 'bounce-soft 1s ease-in-out infinite',
        'slide-up': 'slide-up 0.3s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'roulette': 'roulette 3s cubic-bezier(0.17, 0.67, 0.12, 0.99) forwards',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 10px rgba(139, 92, 246, 0.4)' },
          '50%': { boxShadow: '0 0 25px rgba(139, 92, 246, 0.8)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'bounce-soft': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        'slide-up': {
          from: { transform: 'translateY(20px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      boxShadow: {
        'glow-purple': '0 0 20px rgba(139, 92, 246, 0.4)',
        'glow-blue': '0 0 20px rgba(59, 130, 246, 0.4)',
        'glow-gold': '0 0 20px rgba(245, 158, 11, 0.4)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.4)',
      }
    },
  },
  plugins: [],
}
