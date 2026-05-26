import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './features/**/*.{js,ts,jsx,tsx,mdx}',
    './contexts/**/*.{js,ts,jsx,tsx,mdx}',
    './hooks/**/*.{js,ts,jsx,tsx,mdx}',
    '../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: 'rgb(var(--primary) / <alpha-value>)',
        'primary-dark': 'rgb(var(--primary-dark) / <alpha-value>)',
        'primary-light': 'rgb(var(--primary-light) / <alpha-value>)',
        background: 'rgb(var(--background) / <alpha-value>)',
        'background-light': 'rgb(var(--background) / <alpha-value>)',
        'background-light-web': 'rgb(var(--neutral-100) / <alpha-value>)',
        surface: {
          DEFAULT: 'rgb(var(--surface) / <alpha-value>)',
          light: 'rgb(var(--surface) / <alpha-value>)',
          low: 'rgb(var(--surface-low) / <alpha-value>)',
          high: 'rgb(var(--surface-high) / <alpha-value>)',
          border: 'rgb(var(--border-subtle) / <alpha-value>)',
        },
        'surface-border': 'rgb(var(--border-subtle) / <alpha-value>)',
        border: {
          light: 'rgb(var(--border-subtle) / <alpha-value>)',
          subtle: 'rgb(var(--border-subtle) / <alpha-value>)',
        },
        'text-body': 'rgb(var(--text-body) / <alpha-value>)',
        'text-muted': 'rgb(var(--text-muted) / <alpha-value>)',
        'accent-teal': 'rgb(var(--accent-teal) / <alpha-value>)',
        'secondary-text': 'rgb(var(--neutral-800) / <alpha-value>)',
        gold: 'rgb(var(--gold) / <alpha-value>)',
      },

      fontFamily: {
        display: ['var(--font-inter)', 'Inter', 'sans-serif'],
        sans: ['var(--font-inter)', 'Inter', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
        full: '9999px',
      },
      backgroundImage: {
        'banner-gradient': 'linear-gradient(to bottom right, rgb(var(--banner-blue-start)), rgb(var(--banner-blue-end)))',
      },
      boxShadow: {
        soft: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
      },
    },
  },
};

export default config;
