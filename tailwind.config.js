/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#0B1221',
          900: '#141E33',
          DEFAULT: '#1E3A5F',
          light: '#2B5180',
        },
        electric: {
          500: '#3B82F6',
          600: '#2563EB',
          400: '#60A5FA',
        },
        semantic: {
          green: '#10B981',
          amber: '#F59E0B',
          red: '#EF4444',
        },
        slate: {
          50:  '#F8FAFC',
          100: '#F1F5F9',
          800: '#1E293B',
          900: '#0F172A',
        }
      },
      fontFamily: {
        sans: ['Inter', '"DM Sans"', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
      },
      animation: {
        'scan': 'scan 3s ease-in-out infinite',
        'pulse-subtle': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        scan: {
          '0%, 100%': { transform: 'translateY(0%)', opacity: 0.2 },
          '50%': { transform: 'translateY(250%)', opacity: 1 },
        }
      },
      borderRadius: {
        'xl': '16px',
        '2xl': '24px',
      }
    },
  },
  plugins: [],
}
