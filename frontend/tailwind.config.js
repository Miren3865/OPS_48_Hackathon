/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── Theme-aware semantic tokens ──
        primary:       'var(--bg-primary)',
        secondary:     'var(--bg-secondary)',
        card:          'var(--card-bg)',
        textPrimary:   'var(--text-primary)',
        textSecondary: 'var(--text-secondary)',
        accent:        'var(--accent)',
        borderDefault: 'var(--border-color)',

        // ── Legacy brand palette ──
        brand: {
          50:  '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
