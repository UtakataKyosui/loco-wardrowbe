import type { LismConfig } from "lism-css/config-types";

// Colors are NOT defined here: light/dark values live in src/styles/theme.css
// so that `prefers-color-scheme` can swap them without a rebuild.
export default {
  tokens: {
    ff: {
      base: "'Geist', -apple-system, 'BlinkMacSystemFont', 'Hiragino Sans', sans-serif",
      accent: "'Bodoni Moda', 'Hiragino Mincho ProN', Georgia, serif",
    },
  },
} satisfies LismConfig;
