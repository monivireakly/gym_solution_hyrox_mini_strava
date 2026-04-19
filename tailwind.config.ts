import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        sea: {
          DEFAULT: '#006D77',
          dark: '#004D54',
          light: '#E8F4F5',
        },
        'cyan-brand': '#00C9D4',
        'cyan-dim': '#83E0E5',
        bg: '#F5FAFB',
        surface: '#FFFFFF',
        'app-text': '#0D2B2E',
        muted: '#5A7F84',
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
