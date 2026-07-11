// Theme tokens. Placeholder palette until the Figma design system lands in
// Phase 2 — components must reference semantic aliases (primary/neutral),
// never raw color values, so the swap is a one-line change here.
export default defineAppConfig({
  ui: {
    colors: {
      primary: 'blue',
      neutral: 'slate',
    },
  },
})
