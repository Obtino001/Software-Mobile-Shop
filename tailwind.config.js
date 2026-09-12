/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        coral: {
          50: '#FDF5F3',
          100: '#FCEBE7',
          200: '#F8D4CC',
          300: '#F3B4A6',
          400: '#EC8873',
          500: '#E06349', // user's exact color
          600: '#C94E36',
          700: '#A83B25',
          800: '#8A2F1D',
          900: '#732718',
        },
        canvas: '#F8F8F8',
        surface: '#FFFFFF',
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        pakgreen: {
          50: '#f2fbf5',
          100: '#e1f6e9',
          500: '#107c41',
          700: '#0b5c30',
          900: '#05381d',
        },
        navy: {
          950: '#070B12',
          900: '#0B0F19',
          850: '#0F1523',
          800: '#151D2F',
          700: '#1E293B',
          600: '#334155',
        }
      },
      boxShadow: {
        'mobile-nav': '0 -4px 20px rgba(0, 0, 0, 0.08)',
        'mobile-card': '0 2px 10px rgba(0, 0, 0, 0.04)',
        'glow-brand': '0 0 25px rgba(16, 185, 129, 0.25)',
        'card': '0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.03)',
        'card-hover': '0 4px 12px -2px rgba(15, 23, 42, 0.06), 0 2px 4px -2px rgba(15, 23, 42, 0.04)',
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
