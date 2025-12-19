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
        // CSS変数ベース
        background: 'var(--background)',
        'background-secondary': 'var(--background-secondary)',
        foreground: 'var(--foreground)',
        surface: 'var(--surface)',
        'surface-hover': 'var(--surface-hover)',
        'surface-elevated': 'var(--surface-elevated)',
        border: 'var(--border)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',

        // Primary - ネオンシアン
        primary: {
          DEFAULT: '#00f0ff',
          light: '#66f7ff',
          dark: '#00c4cc',
          50: '#e6feff',
          100: '#ccfeff',
          200: '#99fdff',
          300: '#66f7ff',
          400: '#33f3ff',
          500: '#00f0ff',
          600: '#00c4cc',
          700: '#009999',
          800: '#006d6d',
          900: '#004242',
        },

        // Accent - マジェンタ/パープル
        accent: {
          DEFAULT: '#ff00ff',
          light: '#ff66ff',
          dark: '#cc00cc',
          secondary: '#a855f7',
        },

        // Neon カラー
        neon: {
          cyan: '#00f0ff',
          magenta: '#ff00ff',
          purple: '#a855f7',
          yellow: '#ffcc00',
          green: '#00ff88',
          red: '#ff3366',
        },

        // Cyber ダークカラー
        cyber: {
          black: '#0a0a0f',
          dark: '#12121a',
          gray: '#1a1a24',
          'gray-light': '#25253a',
        },
      },

      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },

      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.5)',
        'card': '0 4px 12px rgba(0, 0, 0, 0.6)',
        'card-hover': '0 8px 24px rgba(0, 0, 0, 0.7), 0 0 20px rgba(0, 240, 255, 0.3)',
        'lift': '0 16px 48px rgba(0, 0, 0, 0.8)',

        // ネオングロー
        'glow-primary': '0 0 20px rgba(0, 240, 255, 0.5), 0 0 40px rgba(0, 240, 255, 0.2)',
        'glow-accent': '0 0 20px rgba(255, 0, 255, 0.5), 0 0 40px rgba(255, 0, 255, 0.2)',
        'glow-sm': '0 0 10px rgba(0, 240, 255, 0.3)',
        'neon-border': 'inset 0 0 15px rgba(0, 240, 255, 0.1), 0 0 15px rgba(0, 240, 255, 0.3)',
      },

      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        'cyber': '0.25rem', // シャープな角
      },

      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'shimmer': 'shimmer 3s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'border-pulse': 'border-pulse 2s ease-in-out infinite',
      },

      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 240, 255, 0.5), 0 0 40px rgba(0, 240, 255, 0.2)' },
          '50%': { boxShadow: '0 0 30px rgba(0, 240, 255, 0.7), 0 0 60px rgba(0, 240, 255, 0.4)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'border-pulse': {
          '0%, 100%': { borderColor: 'rgba(0, 240, 255, 0.3)' },
          '50%': { borderColor: 'rgba(0, 240, 255, 0.8)' },
        },
      },

      backgroundImage: {
        'cyber-gradient': 'linear-gradient(135deg, #00f0ff, #ff00ff)',
        'cyber-gradient-dark': 'linear-gradient(135deg, #00c4cc, #cc00cc)',
        'dark-gradient': 'linear-gradient(180deg, #0a0a0f 0%, #12121a 100%)',
      },
    },
  },
  plugins: [],
}
export default config
