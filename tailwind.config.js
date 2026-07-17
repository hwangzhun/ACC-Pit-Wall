/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    fontSize: {
      xs: ['var(--type-caption)', { lineHeight: '1.5' }],
      sm: ['var(--type-body)', { lineHeight: '1.5' }],
      base: ['var(--type-section)', { lineHeight: '1.4' }],
      lg: ['var(--type-heading)', { lineHeight: '1.35' }],
      xl: ['var(--type-heading)', { lineHeight: '1.35' }],
      '2xl': ['var(--type-page)', { lineHeight: '1.25' }],
      '3xl': ['var(--type-page)', { lineHeight: '1.25' }],
    },
    fontWeight: {
      thin: 'var(--weight-regular)',
      extralight: 'var(--weight-regular)',
      light: 'var(--weight-regular)',
      normal: 'var(--weight-regular)',
      medium: 'var(--weight-emphasis)',
      semibold: 'var(--weight-emphasis)',
      bold: 'var(--weight-emphasis)',
      extrabold: 'var(--weight-emphasis)',
      black: 'var(--weight-emphasis)',
    },
    extend: {
      colors: {
        tech: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        neon: {
          blue: '#00d4ff',
          green: '#00ff88',
          orange: '#ff6b35',
          purple: '#a855f7',
          red: '#ff3366',
          yellow: '#fbbf24',
        },
        dashboard: {
          dark: '#0a0e17',
          card: '#111827',
          border: '#1f2937',
          hover: '#1e293b',
          text: '#f9fafb',
          muted: '#9ca3af',
          'light-bg': '#ffffff',
          'light-card': '#f9fafb',
          'light-border': '#e5e7eb',
          'light-hover': '#f3f4f6',
          'light-text': '#1f2937',
          'light-muted': '#6b7280',
        },
        win11: {
          bg: 'rgb(var(--win11-bg-rgb) / <alpha-value>)',
          surface: 'rgb(var(--win11-surface-rgb) / <alpha-value>)',
          'surface-hover': 'rgb(var(--win11-surface-hover-rgb) / <alpha-value>)',
          /* 使用 CSS 变量以支持明暗 rgba；勿与 /50 等透明度修饰符混用 */
          border: 'var(--win11-border)',
          text: 'rgb(var(--win11-text-rgb) / <alpha-value>)',
          'text-secondary': 'rgb(var(--win11-text-secondary-rgb) / <alpha-value>)',
          icon: 'rgb(var(--win11-icon-rgb) / <alpha-value>)',
          'control-bg': 'rgb(var(--win11-control-bg-rgb) / <alpha-value>)',
          'control-hover-bg': 'rgb(var(--win11-control-hover-bg-rgb) / <alpha-value>)',
          accent: 'rgb(var(--win11-accent-rgb) / <alpha-value>)',
          'accent-hover': 'rgb(var(--win11-accent-hover-rgb) / <alpha-value>)',
        }
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
      },
      boxShadow: {
        'glow-blue': '0 0 20px rgba(0, 212, 255, 0.3)',
        'glow-green': '0 0 20px rgba(0, 255, 136, 0.3)',
        'glow-purple': '0 0 20px rgba(168, 85, 247, 0.3)',
        'inner-glow': 'inset 0 0 20px rgba(0, 212, 255, 0.1)',
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'scan-line': 'scanLine 8s linear infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scanLine: {
          '0%': { transform: 'translateY(-100vh)' },
          '100%': { transform: 'translateY(100vh)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      transitionDuration: {
        '250': '250ms',
      },
    },
  },
  plugins: [],
}
