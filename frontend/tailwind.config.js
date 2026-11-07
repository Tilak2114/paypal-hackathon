/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#050a17',        // Deep Navy Blue
        bg2: '#0b162e',       // Secondary Dark Navy
        ink: '#f0f6ff',       // Crisp White
        mute: '#8295b5',      // Soft Slate Blue
        mint: '#00d2ff',      // Pure Electric Ice-Cyan Blue
        ice: '#00d2ff',       // Alias for ice-blue
        navy: '#050a17',      // Alias for navy
        navy2: '#0b162e',
        coral: '#ff3d71',     // Neon Warning Pink/Red
        card: 'rgba(255, 255, 255, 0.04)',
        line: 'rgba(0, 210, 255, 0.16)',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        display: ['"Bricolage Grotesque"', '"DM Sans"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
