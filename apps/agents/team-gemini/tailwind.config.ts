import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        // Brand
        brand: {
          50: '#e8f5fe',
          100: '#c3e4fd',
          200: '#86c9fb',
          300: '#49adf8',
          400: '#1a96f5',
          500: '#0d7fe8',
          600: '#0861c0',
          700: '#064898',
          800: '#043070',
          900: '#021848',
        },
        // Accent cyan-green
        accent: {
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
        },
        // Surface (dark)
        surface: {
          900: '#050810',
          800: '#0c1120',
          700: '#111827',
          600: '#1a2235',
          500: '#232d42',
          400: '#2d3a52',
          300: '#3d4d66',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'grid-pattern': "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230d7fe8' fill-opacity='0.04'%3E%3Cpath d='M0 0h40v1H0zM0 0v40h1V0z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.25s ease-out',
        'typing': 'typing 1.2s steps(3) infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(10px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        typing: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.2' } },
      },
      borderRadius: {
        lg: '0.625rem',
        xl: '0.875rem',
        '2xl': '1.125rem',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
