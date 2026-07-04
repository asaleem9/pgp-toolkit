/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3538cd',
          50: '#f0f5ff',
          100: '#e0eaff',
          200: '#c7d7fe',
          300: '#a4bcfd',
          400: '#8098f9',
          500: '#6172f3',
          600: '#444ce7',
          700: '#3538cd',
          800: '#2d31a6',
          900: '#2d3282',
          950: '#1f235f',
        },
        secondary: '#64748b',
        success: '#16a34a',
        warning: '#d97706',
        error: '#dc2626',
        accent: {
          blue: '#3b82f6',
          purple: '#8b5cf6',
          cyan: '#06b6d4',
        },
      },
      fontFamily: {
        display: ['Bricolage Grotesque Variable', 'DM Sans', 'system-ui', 'sans-serif'],
        sans: ['DM Sans', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['Fira Code', 'JetBrains Mono', 'Consolas', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        // Faint tile of hex-fingerprint glyphs, drawn as an inline SVG so the
        // whole texture ships with the CSS (img-src data: is allowed by the CSP)
        'cipher-tile': `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cg font-family='Fira Code,monospace' font-size='11' fill='%232d3282'%3E%3Ctext x='8' y='24'%3E9C4F%3C/text%3E%3Ctext x='78' y='24'%3E22A7%3C/text%3E%3Ctext x='42' y='66'%3ED3E1%3C/text%3E%3Ctext x='8' y='108'%3E41F0%3C/text%3E%3Ctext x='78' y='108'%3E08BC%3C/text%3E%3C/g%3E%3C/svg%3E")`,
        'gradient-mesh': 'radial-gradient(at 27% 37%, hsla(215, 98%, 61%, 0.15) 0px, transparent 50%), radial-gradient(at 97% 21%, hsla(125, 98%, 72%, 0.08) 0px, transparent 50%), radial-gradient(at 52% 99%, hsla(354, 98%, 61%, 0.08) 0px, transparent 50%), radial-gradient(at 10% 29%, hsla(256, 96%, 67%, 0.1) 0px, transparent 50%), radial-gradient(at 97% 96%, hsla(38, 60%, 74%, 0.08) 0px, transparent 50%), radial-gradient(at 33% 50%, hsla(222, 67%, 73%, 0.12) 0px, transparent 50%), radial-gradient(at 79% 53%, hsla(343, 68%, 79%, 0.08) 0px, transparent 50%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'glow': 'glow 2s ease-in-out infinite',
        'rise': 'rise 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
        'pop': 'pop 0.3s ease-out',
        'sweep': 'sweep 0.9s ease-out 0.1s 1 both',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        rise: {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pop: {
          '0%': { transform: 'scale(0.8)' },
          '55%': { transform: 'scale(1.12)' },
          '100%': { transform: 'scale(1)' },
        },
        sweep: {
          '0%': { transform: 'translateX(-120%)' },
          '100%': { transform: 'translateX(320%)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(68, 76, 231, 0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(68, 76, 231, 0.5)' },
        },
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'glow': '0 0 20px rgba(68, 76, 231, 0.25)',
        'glow-lg': '0 0 30px rgba(68, 76, 231, 0.35)',
      },
    },
  },
  plugins: [],
}
