/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#050a17',
        bg2: '#0b162e',
        ink: '#f0f6ff',
        mute: '#8295b5',
        mint: '#00d2ff', // Electric Cyan / Ice Cobalt
        coral: '#ff3d71', // Neon Pink / Coral
        card: 'rgba(255, 255, 255, 0.04)',
        line: 'rgba(0, 210, 255, 0.15)',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        display: ['"Bricolage Grotesque"', '"DM Sans"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
