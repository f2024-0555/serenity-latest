/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-outfit)', 'sans-serif'],
        display: ['var(--font-cormorant)', 'serif'],
      },
      colors: {
        void: '#030308',
        abyss: '#07070f',
        deep: '#0d0d1a',
        ink: '#13131f',
        mist: '#1a1a2e',
        haze: '#252538',
        dusk: '#3d3d5c',
        twilight: '#5c5c8a',
        lavender: '#8b8bc4',
        moon: '#c4c4e8',
        star: '#e8e8f8',
        nebula: {
          DEFAULT: '#6366f1',
          dark: '#4f52e0',
          light: '#818cf8',
        },
        aurora: {
          DEFAULT: '#a78bfa',
          dark: '#7c3aed',
          light: '#c4b5fd',
        },
        cosmos: {
          DEFAULT: '#38bdf8',
          dark: '#0284c7',
          light: '#7dd3fc',
        },
      },
      backgroundImage: {
        'gradient-void': 'radial-gradient(ellipse at top, #1a1a2e 0%, #07070f 50%, #030308 100%)',
        'gradient-aurora': 'linear-gradient(135deg, #6366f1 0%, #a78bfa 50%, #38bdf8 100%)',
        'gradient-cosmic': 'radial-gradient(ellipse at center, #252538 0%, #13131f 60%, #07070f 100%)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
