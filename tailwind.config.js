/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Orbitron', 'sans-serif'],
        body: ['Rajdhani', 'sans-serif'],
        mono: ['Share Tech Mono', 'monospace'],
      },
      colors: {
        void: '#060610',
        panel: '#0d0d1a',
        surface: '#111128',
        border: '#1e1e3f',
        neon: {
          cyan: '#00f5ff',
          purple: '#bf00ff',
          pink: '#ff0080',
          green: '#00ff88',
          gold: '#ffd700',
        },
      },
      boxShadow: {
        neon: '0 0 20px rgba(0, 245, 255, 0.5)',
        'neon-purple': '0 0 20px rgba(191, 0, 255, 0.5)',
        'neon-pink': '0 0 20px rgba(255, 0, 128, 0.5)',
        'neon-gold': '0 0 20px rgba(255, 215, 0, 0.4)',
      },
      animation: {
        'pulse-glow': 'pulseGlow 1.5s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'spin-slow': 'spin 4s linear infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(0, 245, 255, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(0, 245, 255, 0.9), 0 0 80px rgba(0, 245, 255, 0.4)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
