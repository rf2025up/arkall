/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      // V1风格的颜色配置 (橙色主题)
      colors: {
        primary: {
          DEFAULT: '#F97316', // Orange-500 橙色主色
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          400: '#FB923C',
          500: '#F97316',
          600: '#EA580C',
          700: '#C2410C'
        },
        background: {
          DEFAULT: '#F3F4F6', // Gray-100 V1的背景色
          50: '#F8FAFC',
          100: '#F1F5F9'
        },
        // V1的专用橙色系
        orange: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F97316',
          600: '#EA580C',
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12'
        }
      },
      // V1风格的字体配置
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif']
      },
      // V1风格的动画配置
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in-from-bottom-5': 'slideInFromBottom 0.3s ease-out',
        'slide-left': 'slideLeft 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'zoom-in-95': 'zoomIn95 0.2s ease-out'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideInFromBottom: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        slideLeft: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' }
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)' },
          '100%': { transform: 'translateY(0)' }
        },
        zoomIn95: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        }
      }
    }
  },
  plugins: [],
}