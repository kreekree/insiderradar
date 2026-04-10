/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['var(--font-mono)', 'monospace'],
      },
      animation: {
        'border-beam': 'border-beam calc(var(--duration)*1s) infinite linear',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        'border-beam': {
          '100%': { 'offset-distance': '100%' },
        },
        shimmer: {
          '0%, 90%, 100%': { 'background-position': 'calc(-100% - var(--shimmer-width)) 0' },
          '30%, 60%': { 'background-position': 'calc(100% + var(--shimmer-width)) 0' },
        },
      },
    },
  },
  plugins: [],
};
