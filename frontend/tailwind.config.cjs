/**** Tailwind config for PreOrderFood ****/

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#F9FAFB',
        surface: '#FFFFFF',
        primary: '#3B82F6',
        secondary: '#6B7280',
        accent: '#6366F1',
        textPrimary: '#111827',
        textSecondary: '#4B5563',
        border: '#E5E7EB'
      },
      fontFamily: {
        sans: ['system-ui', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
}
