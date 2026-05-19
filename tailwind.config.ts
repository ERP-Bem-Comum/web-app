import { Config } from 'tailwindcss'
import plugin from 'tailwindcss/plugin'

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
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
        menu: {
          bgHover: '#009FD0',
          bgSelected: '#E8EEF0',
          bgDefault: '#464E78',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        erp: {
          primary: '#32C6F4',
          secondary: '#FAA21A',
          gradient: '#B0B0B0',
          success: '#64BC47',
          info: '#3B70BF',
          danger: '#FF5353',
          warning: '#F5D35E',
          baseDark: '#04222B',
          baseLight: '#F6FAFB',
          deepDark: '#000000',
          deepLight: '#FFFFFF',
          grayscale: '#9C9C9C',
          neutrals: '#C4DADF',
          nav: '#464E78',
          background: '#E8EEF0',
          positive: '#58AA3D',
          divide: '#8C999D',
          disabled: '#E0E4E4',
          negativeValue: '#D13C3C',
          button: {
            primary: {
              normal: '#32C6F4',
              textNormal: '#000000',
              hover: '#76D9F8',
              disabled: '#E0E0E0',
              textDisabled: '#6F6F6F',
            },
            secondary: {
              normal: '#FFFFFF',
              textNormal: '#155366',
              hover: '#5BD1F6',
              disabled: 'FFFFFF',
              textDisabled: '#8E8E8E',
            },
          },
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
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
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    plugin(({ addComponents }) => {
      addComponents({
        '.reconciled-border': {
          '@apply border rounded-lg border-erp-positive': '',
        },
        '.future-border': {
          '@apply border rounded-lg border-[#5BD1F6]': '',
        },
      })
    }),
  ],
}
export default config
