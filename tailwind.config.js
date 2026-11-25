/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cr: {
          bg: "#F4F7FC",
          surface: "#FFFFFF",
          "surface-alt": "#F8FAFD",
          "surface-muted": "#EDF2F9",
          border: "#E2E8F0",
          "border-focus": "#3478F6",
          text: "#20283A",
          muted: "#7B8497",
          primary: {
            DEFAULT: "#3478F6",
            hover: "#2563EB",
            light: "#EBF3FF",
            glow: "rgba(52, 120, 246, 0.35)",
          },
          orange: {
            DEFAULT: "#FF9F43",
            hover: "#F3902E",
            light: "#FFF4EB",
            glow: "rgba(255, 159, 67, 0.35)",
          },
          violet: {
            DEFAULT: "#8B5CF6",
            hover: "#7C3AED",
            light: "#F5F3FF",
            glow: "rgba(139, 92, 246, 0.35)",
          },
          success: "#29B765",
          error: "#EF5350",
          warning: "#F59E0B",
          gold: "#F59E0B",
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Cabinet Grotesk"', '"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        esports: ['"Teko"', '"Chakra Petch"', 'Impact', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 4px 20px -2px rgba(32, 40, 58, 0.06), 0 2px 6px -1px rgba(32, 40, 58, 0.04)',
        'card-hover': '0 12px 32px -4px rgba(52, 120, 246, 0.16), 0 4px 12px -2px rgba(32, 40, 58, 0.06)',
        'glow-blue': '0 0 24px rgba(52, 120, 246, 0.4)',
        'glow-orange': '0 0 24px rgba(255, 159, 67, 0.45)',
        'glow-violet': '0 0 24px rgba(139, 92, 246, 0.4)',
        'badge': '0 2px 10px rgba(0, 0, 0, 0.12)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        radarScan: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        }
      },
      animation: {
        float: 'float 4s ease-in-out infinite',
        'pulse-slow': 'pulseGlow 3s ease-in-out infinite',
        shimmer: 'shimmer 2.5s infinite linear',
        'radar-spin': 'radarScan 4s linear infinite',
      }
    },
  },
  plugins: [],
}
