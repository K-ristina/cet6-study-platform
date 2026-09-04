/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Starbucks Official Color System
        sb: {
          green: '#0c8a60',         // Historic Starbucks Green (h1, brand moments)
          accent: '#00754A',        // Green Accent (primary filled-CTA, Frap)
          house: '#3c807d',         // House Green (deep near-black hero bands, footers)
          uplift: '#2b5148',        // Secondary mid-dark green
          mint: '#d4e9e2',          // Green Light / mint wash
          gold: '#cba258',          // Gold (Rewards status, stars, premium)
          'gold-light': '#dfc49d',  // Soft gold
          'gold-lightest': '#faf6ee', // Warm cream-gold surface
          cream: '#f2f0eb',         // Neutral Warm (primary page canvas)
          ceramic: '#edebe9',       // Ceramic off-white (zone separators)
          cool: '#f9f9f9',          // Neutral Cool
          text: 'rgba(0, 0, 0, 0.87)',        // 87% black body/heading on light
          'text-soft': 'rgba(0, 0, 0, 0.58)', // 58% secondary text
          'text-dark-soft': 'rgba(255, 255, 255, 0.70)', // 70% secondary text on House Green
          'rewards-green': '#33433d',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'SF Pro Text', 'SF Pro Display', 'Inter', 'Manrope', 'sans-serif'],
        serif: ['"Iowan Old Style"', 'Lora', 'Georgia', 'serif'],
        mono: ['SF Mono', 'Fira Code', 'monospace'],
      },
      letterSpacing: {
        tight: '-0.015em',
        loose: '0.1em',
        looser: '0.15em',
      },
      // iOS Standard Radius Hierarchy (Continuous Squircle Scale)
      borderRadius: {
        'ios-xs': '6px',      // Micro badges, indicators
        'ios-sm': '9px',      // Segmented control items, small tags
        'ios-md': '13px',     // Buttons, input fields, inner cells
        'ios-card': '18px',   // Inset grouped cards, widgets, list containers
        'ios-lg': '22px',     // Big containers, feature banners
        'ios-sheet': '28px',  // Modal sheets, popovers, full action dialogs
        'ios-pill': '9999px', // Full capsules
      },
      boxShadow: {
        'xs': '0 1px 2px rgba(0,0,0,0.05)',
        'sb-card': '0 0 0.5px rgba(0,0,0,0.14), 0 1px 1px rgba(0,0,0,0.24)',
        'sb-nav': '0 1px 3px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)',
        'sb-frap': '0 2px 8px rgba(0,0,0,0.18), 0 8px 16px rgba(0,0,0,0.12)',
        'ios-sheet': '0 10px 30px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.05)',
      },
    },
  },
  plugins: [],
}
