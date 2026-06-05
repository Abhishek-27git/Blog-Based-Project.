/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "background": "var(--color-background)",
        "surface": "var(--color-surface)",
        "surface-container": "var(--color-surface-container)",
        "surface-container-low": "var(--color-surface-container-low)",
        "surface-container-lowest": "var(--color-surface-container-lowest)",
        "surface-container-high": "var(--color-surface-container-high)",
        "surface-container-highest": "var(--color-surface-container-highest)",
        "on-surface": "var(--color-on-surface)",
        "on-surface-variant": "var(--color-on-surface-variant)",
        "primary": "var(--color-primary)",
        "on-primary": "var(--color-on-primary)",
        "secondary": "var(--color-secondary)",
        "on-secondary": "var(--color-on-secondary)",
        "secondary-container": "var(--color-secondary-container)",
        "on-secondary-container": "var(--color-on-secondary-container)",
        "primary-container": "var(--color-primary-container)",
        "on-primary-container": "var(--color-on-primary-container)",
        "outline": "var(--color-outline)",
        "outline-variant": "var(--color-outline-variant)",
        "error": "var(--color-error)",
        "on-error": "var(--color-on-error)",
        "error-container": "var(--color-error-container)",
        "on-error-container": "var(--color-on-error-container)",
        "tertiary": "var(--color-tertiary)",
        "on-tertiary": "var(--color-on-tertiary)",
        "tertiary-container": "var(--color-tertiary-container)",
        "on-tertiary-container": "var(--color-on-tertiary-container)",
        "surface-variant": "var(--color-surface-variant)",
        "inverse-surface": "var(--color-inverse-surface)",
        "inverse-on-surface": "var(--color-inverse-on-surface)"
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
      spacing: {
        "margin-page": "4rem",
        "margin-mobile": "1.5rem",
        "stack-md": "2rem",
        "stack-lg": "4rem",
        "reading-column-max": "720px",
        "stack-sm": "1rem",
        "gutter": "2rem"
      },
      fontFamily: {
        "body-lg": ["DM Sans", "sans-serif"],
        "display-lg-mobile": ["DM Sans", "sans-serif"],
        "headline-sm": ["DM Sans", "sans-serif"],
        "body-md": ["DM Sans", "sans-serif"],
        "ui-label": ["DM Sans", "sans-serif"],
        "ui-small": ["DM Sans", "sans-serif"],
        "display-lg": ["DM Sans", "sans-serif"],
        "headline-md": ["DM Sans", "sans-serif"],
        "sans": ["DM Sans", "sans-serif"],
        "mono": ["DM Mono", "monospace"]
      },
    },
  },
  plugins: [],
}
