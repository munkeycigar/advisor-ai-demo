/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"DM Serif Display"', 'serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        navy: {
          50: '#f0f3f9',
          100: '#d9e0ef',
          200: '#b3c1df',
          300: '#8da2cf',
          400: '#6783bf',
          500: '#4164af',
          600: '#34508c',
          700: '#273c69',
          800: '#1a2846',
          900: '#0d1423',
          950: '#070a12',
        },
        gold: {
          50: '#fdf9ef',
          100: '#f9f0d5',
          200: '#f3e0ab',
          300: '#ecd07f',
          400: '#e5c054',
          500: '#d4a932',
          600: '#b8892a',
          700: '#996823',
          800: '#7a531c',
          900: '#654416',
        },
      },
    },
  },
  plugins: [],
}
