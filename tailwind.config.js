/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./frontend/index.html",
    "./frontend/src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '320px',
        'sm': '480px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
        '3xl': '1920px',
        // Breakpoints específicos para dispositivos
        'mobile-s': '320px',
        'mobile-m': '375px',
        'mobile-l': '425px',
        'tablet': '768px',
        'laptop': '1024px',
        'laptop-l': '1440px',
        'desktop': '2560px',
        // Orientación
        'portrait': {'raw': '(orientation: portrait)'},
        'landscape': {'raw': '(orientation: landscape)'},
        // Densidad de píxeles
        'retina': {'raw': '(-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)'},
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
        '7xl': ['4.5rem', { lineHeight: '1' }],
        '8xl': ['6rem', { lineHeight: '1' }],
        '9xl': ['8rem', { lineHeight: '1' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },
      minHeight: {
        'screen-75': '75vh',
        'screen-50': '50vh',
      },
      backdropBlur: {
        'xs': '2px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-subtle': 'bounceSubtle 0.6s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
    },
  },
  plugins: [
    // Plugin para container queries
    function({ addUtilities }) {
      addUtilities({
        '.container-query': {
          'container-type': 'inline-size',
        },
        '.cq-normal': {
          'container-type': 'normal',
        },
        '.cq-size': {
          'container-type': 'size',
        },
      })
    },
    // Plugin para aspect ratios personalizados
    function({ addUtilities }) {
      addUtilities({
        '.aspect-golden': {
          'aspect-ratio': '1.618 / 1',
        },
        '.aspect-card': {
          'aspect-ratio': '3 / 4',
        },
        '.aspect-banner': {
          'aspect-ratio': '5 / 2',
        },
      })
    },
  ],
}