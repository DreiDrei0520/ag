/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        agdark: {
          DEFAULT: '#1C2126',
          50: '#F2F3F4',
          100: '#DEE1E4',
          200: '#B9BFC5',
          300: '#8D97A0',
          400: '#5D6874',
          500: '#3E454D',
          600: '#2C3238',
          700: '#22272C',
          800: '#1C2126',
          900: '#141719',
        },
        agorange: {
          DEFAULT: '#F26B21',
          50: '#FFF3EB',
          100: '#FEE1CC',
          200: '#FDC299',
          300: '#FBA366',
          400: '#F98940',
          500: '#F26B21',
          600: '#D9541A',
          700: '#B14415',
          800: '#89340F',
          900: '#5C230A',
        },
        agblue: {
          DEFAULT: '#1B4F8C',
          50: '#EBF2FA',
          100: '#CFE0F2',
          200: '#9EC1E5',
          300: '#6CA2D8',
          400: '#3B83CB',
          500: '#1B4F8C',
          600: '#164073',
          700: '#12335C',
          800: '#0D2645',
          900: '#08192E',
        },
        aggGold: {
          DEFAULT: '#C9A227',
          50: '#FBF6E5',
          100: '#F3E7BF',
        },
      },
      fontFamily: {
        display: ['"Barlow Condensed"', 'sans-serif'],
        sans: ['"Inter"', 'sans-serif'],
        monoData: ['"Roboto Mono"', 'monospace'],
      },
      boxShadow: {
        card: '0 4px 24px -4px rgba(28,33,38,0.12)',
      },
    },
  },
  plugins: [],
};
