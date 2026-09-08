/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Verde extraído do logo Tchê (favicon.png)
        primary: '#0A7D3D',
        'primary-dark': '#075C2C',
        secondary: '#6C757D',
        // Teal para não colidir visualmente com o verde primário da marca
        success: '#0D9488',
        warning: '#FFC107',
        danger: '#DC3545',
        info: '#0DCAF0',
        surface: '#F8F9FA',
        ink: '#212529',
        border: '#DEE2E6',
      },
      fontFamily: {
        heading: ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
