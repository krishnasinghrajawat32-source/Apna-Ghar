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
        forest: {
          50: '#F0F5F2',
          100: '#DCE8E2',
          500: '#2A5A44',
          700: '#1F4333',
          800: '#173327',
          900: '#10241B',
        },
        warmOrange: {
          50: '#FDF6F0',
          100: '#FAEBDE',
          500: '#E06D3B',
          600: '#C85A2A',
          700: '#A4441D',
        },
        sand: {
          50: '#FCFBF7',
          100: '#F7F5EE',
          200: '#ECE8DD',
          300: '#DDD7C7',
          800: '#3D3A33',
          900: '#23211D',
        },
        charcoal: {
          800: '#1E252B',
          900: '#13191E',
          950: '#0B0F12',
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
    },
  },
  plugins: [],
};

export default config;
