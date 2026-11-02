/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#140c33',
        bg2: '#1d1250',
        ink: '#efeaff',
        mute: '#a79fd0',
        mint: '#34f0c8',
        coral: '#ff6f91',
        card: 'rgba(255, 255, 255, 0.06)',
        line: 'rgba(190, 170, 255, 0.16)',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        display: ['"Bricolage Grotesque"', '"DM Sans"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
