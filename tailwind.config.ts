import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        // CSS変数を参照（v4形式では自動でtheme()関数が利用可能）
        border: 'theme(colors.border)',
        input: 'theme(colors.input)',
        ring: 'theme(colors.ring)',
        background: 'theme(colors.background)',
        foreground: 'theme(colors.foreground)',
        primary: {
          DEFAULT: 'theme(colors.primary)',
          foreground: 'theme(colors.primary-foreground)',
        },
        secondary: {
          DEFAULT: 'theme(colors.secondary)',
          foreground: 'theme(colors.secondary-foreground)',
        },
        destructive: {
          DEFAULT: 'theme(colors.destructive)',
          foreground: 'theme(colors.destructive-foreground)',
        },
        muted: {
          DEFAULT: 'theme(colors.muted)',
          foreground: 'theme(colors.muted-foreground)',
        },
        accent: {
          DEFAULT: 'theme(colors.accent)',
          foreground: 'theme(colors.accent-foreground)',
        },
        popover: {
          DEFAULT: 'theme(colors.popover)',
          foreground: 'theme(colors.popover-foreground)',
        },
        card: {
          DEFAULT: 'theme(colors.card)',
          foreground: 'theme(colors.card-foreground)',
        },
        // LLMO専用カラー（@themeブロックから参照）
        llmo: {
          primary: 'theme(colors.llmo.primary)',
          secondary: 'theme(colors.llmo.secondary)',
          success: 'theme(colors.llmo.success)',
          warning: 'theme(colors.llmo.warning)',
          error: 'theme(colors.llmo.error)',
        },
      },
      borderRadius: {
        lg: 'theme(radius)',
        md: 'calc(theme(radius) - 2px)',
        sm: 'calc(theme(radius) - 4px)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        noto: ['var(--font-noto-sans-jp)', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'grid-pattern': 
          'linear-gradient(to right, theme(colors.border) 1px, transparent 1px), linear-gradient(to bottom, theme(colors.border) 1px, transparent 1px)',
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'bounce-slow': {
          '0%, 100%': {
            transform: 'translateY(-25%)',
            'animation-timing-function': 'cubic-bezier(0.8, 0, 1, 1)',
          },
          '50%': {
            transform: 'none',
            'animation-timing-function': 'cubic-bezier(0, 0, 0.2, 1)',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.5s ease-out',
        'slide-in': 'slide-in 0.3s ease-out',
        'bounce-slow': 'bounce-slow 3s infinite',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      screens: {
        'xs': '475px',
      },
      maxWidth: {
        '8xl': '90rem',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}

export default config