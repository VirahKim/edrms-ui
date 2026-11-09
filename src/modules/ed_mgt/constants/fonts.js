// Single source of truth for the EDMS module's typeface — the "Inter var"
// font already loaded app-wide (public/assets/fonts/inter/inter.css, wired
// up as --bs-font-sans-serif in the Bootstrap theme). Declared explicitly
// here instead of relying on inheritance so it stays consistent even inside
// SVG-rendered chart text and detached/portal content.
export const FONT_FAMILY = "'Inter var', sans-serif";
