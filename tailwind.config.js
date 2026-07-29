/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#12151B',
        surface: '#1B2029',
        'surface-hover': '#222834',
        edge: '#2A3140',
        'text-primary': '#EDEEF0',
        'text-secondary': '#8B93A1',
        safe: '#3ECF8E',
        soon: '#FFB020',
        urgent: '#FF4D4F',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        card: '8px',
        btn: '4px',
      },
    },
  },
  plugins: [],
};
