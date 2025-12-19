import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Monochrome palette
        background: '#FFFFFF',
        foreground: '#171717',
        surface: {
          DEFAULT: '#FFFFFF',
          alt: '#FAFAFA',
          hover: '#F5F5F5',
        },
        border: '#E5E5E5',
        'text-secondary': '#525252',
        'text-muted': '#A3A3A3',

        // Primary (Black)
        primary: {
          DEFAULT: '#171717',
          light: '#404040',
          dark: '#0A0A0A',
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },

        // Secondary (Gray)
        secondary: {
          DEFAULT: '#737373',
          light: '#A3A3A3',
          dark: '#525252',
        },

        // Status
        success: '#22C55E',
        warning: '#F59E0B',
        error: '#EF4444',
      },

      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Hiragino Sans', 'Segoe UI', 'Roboto', 'sans-serif'],
      },

      boxShadow: {
        'xs': '0 1px 2px rgba(0, 0, 0, 0.03)',
        'card': '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
        'card-hover': '0 10px 25px rgba(0, 0, 0, 0.08)',
        'lift': '0 10px 25px rgba(0, 0, 0, 0.08)',
        'dropdown': '0 10px 40px -5px rgba(0, 0, 0, 0.1)',
      },

      borderRadius: {
        'card': '4px',
        'button': '2px',
        'input': '2px',
        'badge': '2px',
      },

      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'scale-in': 'scale-in 0.15s ease-out',
      },

      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.98)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
export default config
