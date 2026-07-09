/** @type {import('tailwindcss').Config} */

// ---------------------------------------------------------------------------
// Submitiv Design System — tokens only. Component-level decisions live in
// src/components/ui/*. The identity here is deliberate: a "ledger" aesthetic
// (precise hairlines, tabular timestamps, a warm paper surface instead of
// stark white, ink-navy + Deep Sky Blue) rather than a generic light-blue
// SaaS gradient look. See src/styles/globals.css for motion/elevation CSS
// custom properties that pair with these tokens.
// ---------------------------------------------------------------------------

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
        },
        success: { 50: "#f0fdf4", 500: "#22c55e", 600: "#16a34a" },
        warning: { 50: "#fffbeb", 500: "#f59e0b", 600: "#d97706" },
        danger: { 50: "#fef2f2", 500: "#ef4444", 600: "#dc2626" },

        // Warm paper surface — not stark #fff — the base canvas the whole
        // product sits on. Cards use pure white to lift off this base.
        paper: "#FAFAF8",
        surface: "#ffffff",

        panel: { 900: "#0B1120", 800: "#111827", 700: "#1E293B" },

        ink: {
          900: "#0f172a",
          700: "#334155",
          600: "#475569",
          400: "#64748b",
          300: "#cbd5e1",
        },
      },

      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["\"Source Serif 4\"", "ui-serif", "Georgia", "serif"],
        mono: ["\"IBM Plex Mono\"", "ui-monospace", "SFMono-Regular", "monospace"],
      },

      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem", letterSpacing: "0.02em" }],
      },

      borderRadius: {
        control: "10px",
        card: "18px",
        panel: "26px",
      },

      boxShadow: {
        // Named by elevation level, not by vibe — keeps usage consistent.
        xs: "0 1px 2px rgba(15, 23, 42, 0.05)",
        sm: "0 1px 2px rgba(15,23,42,0.04), 0 4px 10px rgba(15, 23, 42, 0.05)",
        md: "0 2px 4px rgba(15,23,42,0.04), 0 10px 24px rgba(15, 23, 42, 0.07)",
        lg: "0 4px 10px rgba(15,23,42,0.05), 0 20px 48px rgba(15, 23, 42, 0.10)",
        "focus-ring": "0 0 0 4px rgba(14, 165, 233, 0.16)",
      },

      transitionTimingFunction: {
        signature: "cubic-bezier(0.16, 1, 0.3, 1)", // the one easing curve, used everywhere
      },
      transitionDuration: {
        fast: "120ms",
        base: "200ms",
        slow: "420ms",
      },

      keyframes: {
        "fade-up": { "0%": { opacity: 0, transform: "translateY(6px)" }, "100%": { opacity: 1, transform: "translateY(0)" } },
        "scale-in": { "0%": { opacity: 0, transform: "scale(0.97)" }, "100%": { opacity: 1, transform: "scale(1)" } },
        shimmer: { "0%": { backgroundPosition: "-400px 0" }, "100%": { backgroundPosition: "400px 0" } },
      },
      animation: {
        "fade-up": "fade-up 0.42s cubic-bezier(0.16, 1, 0.3, 1) both",
        "scale-in": "scale-in 0.28s cubic-bezier(0.16, 1, 0.3, 1) both",
        shimmer: "shimmer 1.6s infinite linear",
      },
    },
  },
  plugins: [],
};
