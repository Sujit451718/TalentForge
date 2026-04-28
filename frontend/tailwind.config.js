/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        night: '#0f172a',
        ink: '#111827',
        neon: '#22d3ee',
        brandViolet: '#8b5cf6',
        pulse: '#f472b6',
      },
      boxShadow: {
        glow: '0 0 34px rgba(34, 211, 238, 0.22)',
        violet: '0 0 34px rgba(139, 92, 246, 0.26)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        scan: {
          '0%': { transform: 'translateX(-120%)' },
          '100%': { transform: 'translateX(120%)' },
        },
      },
      animation: {
        float: 'float 5s ease-in-out infinite',
        scan: 'scan 3.6s linear infinite',
      },
    },
  },
  plugins: [],
};
