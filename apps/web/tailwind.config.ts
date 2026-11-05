import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Official Apna Ghar Brand Palette
        brand: {
          navy: '#102B50',
          'navy-hover': '#183D68',
          amber: '#F5A623',
          'amber-hover': '#E99A12',
          bg: '#FAF8F3',
          surface: '#FFFFFF',
          slate: '#263445',
          muted: '#687586',
          border: '#E8E5DE',
          success: '#21865B',
          danger: '#D64545',
        },
        // Semantic variable mappings
        primary: {
          DEFAULT: '#102B50',
          hover: '#183D68',
          50: '#F0F4F8',
          100: '#E1E9F2',
          500: '#183D68',
          600: '#102B50',
          700: '#0C203C',
          800: '#102B50',
          900: '#081528',
        },
        accent: {
          DEFAULT: '#F5A623',
          hover: '#E99A12',
          50: '#FEF8EE',
          100: '#FDF0DC',
          500: '#F5A623',
          600: '#E99A12',
          700: '#C77F0B',
        },
        // Graceful legacy aliases mapped to official brand system
        forest: {
          50: '#F0F4F8',
          100: '#E1E9F2',
          500: '#183D68',
          700: '#14345B',
          800: '#102B50',
          900: '#0C203C',
        },
        warmOrange: {
          50: '#FEF8EE',
          100: '#FDF0DC',
          500: '#F5A623',
          600: '#E99A12',
          700: '#C77F0B',
        },
        sand: {
          50: '#FAF8F3',
          100: '#F5F2EB',
          200: '#E8E5DE',
          300: '#D5D1C7',
          800: '#263445',
          900: '#102B50',
        },
        charcoal: {
          800: '#263445',
          900: '#1A232E',
          950: '#102B50',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      boxShadow: {
        'brand-sm': '0 1px 3px 0 rgba(16, 43, 80, 0.06), 0 1px 2px 0 rgba(16, 43, 80, 0.04)',
        'brand-md': '0 4px 12px -2px rgba(16, 43, 80, 0.08), 0 2px 6px -1px rgba(16, 43, 80, 0.04)',
        'brand-lg': '0 12px 24px -4px rgba(16, 43, 80, 0.10), 0 4px 12px -2px rgba(16, 43, 80, 0.05)',
        'brand-card': '0 2px 8px rgba(16, 43, 80, 0.04), 0 0 1px rgba(16, 43, 80, 0.12)',
        'brand-card-hover': '0 12px 28px -6px rgba(16, 43, 80, 0.12), 0 4px 12px -2px rgba(16, 43, 80, 0.06)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
};

export default config;
