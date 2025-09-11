import type {Config} from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    {
      pattern: /bg-(blue|green|red|orange)-500/,
    },
    {
      pattern: /border-(blue|green|red|orange)-600/,
    },
  ],
  darkMode: ["class"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      backgroundImage: {
        'gradient-blue': 'linear-gradient(to right bottom, hsl(var(--chart-1)), hsl(210, 90%, 65%))',
        'gradient-green': 'linear-gradient(to right bottom, hsl(var(--chart-3)), hsl(160, 70%, 55%))',
        'gradient-purple': 'linear-gradient(to right bottom, #7e22ce, #a855f7)',
        'gradient-orange': 'linear-gradient(to right bottom, hsl(var(--chart-2)), hsl(25, 90%, 70%))',
        'gradient-pink': 'linear-gradient(to right bottom, hsl(var(--chart-5)), hsl(340, 85%, 75%))',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 8px)",
        '2xl': '1rem',
      },
      fontFamily: {
        body: ['var(--font-body)', 'sans-serif'],
        headline: ['var(--font-headline)', 'sans-serif'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        sidebar: {
          background: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          muted: {
            foreground: 'hsl(var(--sidebar-muted-foreground))',
          },
          accent: {
            DEFAULT: 'hsl(var(--sidebar-accent))',
            foreground: 'hsl(var(--sidebar-accent-foreground))',
          },
          border: 'hsl(var(--sidebar-border))',
        },
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
        'press': {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.92)' },
          'to': { transform: 'scale(1)' },
        },
        'throw': {
            '0%': { transform: 'translateY(20px) scale(0.95)', opacity: '0' },
            '100%': { transform: 'translateY(0) scale(1)', opacity: '1' }
        },
        'caret-blink': {
          '0%, 70%, 100%': { opacity: '1' },
          '20%, 50%': { opacity: '0' },
        },
        'spin-slow': {
            from: { transform: 'rotate(0deg)' },
            to: { transform: 'rotate(360deg)' },
        },
        'bloom': {
          '0%, 100%': { transform: 'scale(0.8)', opacity: 0.7 },
          '50%': { transform: 'scale(1.1)', opacity: 1 },
        },
        'aurora-1': {
            '0%, 100%': { transform: 'translate(0%, 0%) scale(1)', opacity: 0.2 },
            '25%': { transform: 'translate(20%, -10%) scale(1.1)', opacity: 0.3 },
            '50%': { transform: 'translate(10%, 20%) scale(0.9)', opacity: 0.25 },
            '75%': { transform: 'translate(-10%, 10%) scale(1.2)', opacity: 0.3 },
        },
        'aurora-2': {
            '0%, 100%': { transform: 'translate(0%, 0%) scale(1)', opacity: 0.2 },
            '25%': { transform: 'translate(-15%, 10%) scale(0.9)', opacity: 0.25 },
            '50%': { transform: 'translate(10%, -15%) scale(1.1)', opacity: 0.3 },
            '75%': { transform: 'translate(5%, 5%) scale(1)', opacity: 0.2 },
        },
        'aurora-3': {
            '0%, 100%': { transform: 'translate(0%, 0%) scale(1)', opacity: 0.15 },
            '25%': { transform: 'translate(10%, 15%) scale(1.2)', opacity: 0.2 },
            '50%': { transform: 'translate(-15%, -10%) scale(0.8)', opacity: 0.1 },
            '75%': { transform: 'translate(5%, -5%) scale(1.1)', opacity: 0.18 },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'press': 'press 0.2s 1 linear',
        'throw': 'throw 0.4s ease-out forwards',
        'caret-blink': 'caret-blink 1.25s ease-out infinite',
        'spin-slow': 'spin-slow 3s linear infinite',
        'bloom': 'bloom 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'aurora-1': 'aurora-1 20s ease-in-out infinite',
        'aurora-2': 'aurora-2 25s ease-in-out infinite',
        'aurora-3': 'aurora-3 18s ease-in-out infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
export default config;
