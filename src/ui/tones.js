/**
 * Centralized tone vocabulary for the whole app.
 *
 * Before this module, the same colour trios were copy-pasted in three places
 * (Chip.jsx, Badge.jsx, BeanCard.jsx) and a richer multi-part variant lived in
 * FilterDropdown.jsx. Centralizing them means:
 *   - one place to tune a tone,
 *   - dark-mode variants ride along automatically wherever a tone is used,
 *   - Tailwind's JIT sees every literal class string here (so the shades are
 *     always compiled even if a consumer picks a tone dynamically).
 *
 * Two shapes are exported:
 *   TONE_TRIOS         — `bg / text / border` trio for chips & badges.
 *   FILTER_TONE_BUNDLES — multi-part chrome for the FilterDropdown widget.
 *
 * Light classes are preserved verbatim from the prior art so light mode is
 * pixel-identical; each entry only *adds* `dark:` variants.
 */

// Chip / Badge trios. `accent` and `neutral` use semantic tokens, so they're
// already theme-aware via tokens.css and need no explicit dark: variant.
export const TONE_TRIOS = {
  amber:   'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-400/10 dark:text-amber-300 dark:border-amber-400/25',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-300 dark:border-emerald-400/25',
  cyan:    'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-400/10 dark:text-cyan-300 dark:border-cyan-400/25',
  sky:     'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-400/10 dark:text-sky-300 dark:border-sky-400/25',
  stone:   'bg-stone-50 text-stone-700 border-stone-200 dark:bg-stone-400/10 dark:text-stone-300 dark:border-stone-400/30',
  yellow:  'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-400/10 dark:text-yellow-300 dark:border-yellow-400/25',
  orange:  'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-400/10 dark:text-orange-300 dark:border-orange-400/25',
  red:     'bg-red-50 text-red-700 border-red-200 dark:bg-red-400/10 dark:text-red-300 dark:border-red-400/25',
  violet:  'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-400/10 dark:text-violet-300 dark:border-violet-400/25',
  // Semantic (token-backed — theme-aware already)
  accent:  'bg-surface-muted text-accent border-border-strong',
  neutral: 'bg-surface-muted text-fg-muted border-border',
  // Status aliases used by Badge
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-300 dark:border-emerald-400/25',
  warning: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-400/10 dark:text-yellow-300 dark:border-yellow-400/25',
  danger:  'bg-red-50 text-red-700 border-red-200 dark:bg-red-400/10 dark:text-red-300 dark:border-red-400/25',
  info:    'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-400/10 dark:text-sky-300 dark:border-sky-400/25',
};

// Roast level → trio tone name. Used by BeanCard's roast-level chip.
export const ROAST_TONES = {
  light: 'yellow',
  medium: 'orange',
  'medium-dark': 'orange',
  dark: 'red',
};

// FilterDropdown chrome bundles. Each covers the trigger button (idle/active),
// the panel border, option hover/selected, the checkbox accent-color, the
// option count text, the divider rule, and the "clear" link. `btnIdle` uses
// `bg-surface` (white in light, dark surface in dark) so it themes for free.
export const FILTER_TONE_BUNDLES = {
  amber:   { btnActive: 'bg-amber-100 border-amber-300 text-amber-900 dark:bg-amber-400/15 dark:border-amber-400/40 dark:text-amber-200',      btnIdle: 'bg-surface border-amber-200 text-amber-700 hover:border-amber-400 dark:border-amber-400/30 dark:text-amber-300 dark:hover:border-amber-400/60',      hover: 'hover:bg-amber-50 dark:hover:bg-amber-400/10',   selected: 'font-semibold text-amber-800 bg-amber-50 dark:text-amber-200 dark:bg-amber-400/10',   border: 'border-amber-200 dark:border-amber-400/25', accent: 'accent-amber-700 dark:accent-amber-400',   countText: 'text-amber-500 dark:text-amber-400/70',  divider: 'border-amber-100 dark:border-white/10', clearText: 'text-amber-600 dark:text-amber-300' },
  emerald: { btnActive: 'bg-emerald-100 border-emerald-300 text-emerald-900 dark:bg-emerald-400/15 dark:border-emerald-400/40 dark:text-emerald-200', btnIdle: 'bg-surface border-emerald-200 text-emerald-700 hover:border-emerald-400 dark:border-emerald-400/30 dark:text-emerald-300 dark:hover:border-emerald-400/60', hover: 'hover:bg-emerald-50 dark:hover:bg-emerald-400/10', selected: 'font-semibold text-emerald-800 bg-emerald-50 dark:text-emerald-200 dark:bg-emerald-400/10', border: 'border-emerald-200 dark:border-emerald-400/25', accent: 'accent-emerald-700 dark:accent-emerald-400', countText: 'text-emerald-500 dark:text-emerald-400/70', divider: 'border-emerald-100 dark:border-white/10', clearText: 'text-emerald-600 dark:text-emerald-300' },
  sky:     { btnActive: 'bg-sky-100 border-sky-300 text-sky-900 dark:bg-sky-400/15 dark:border-sky-400/40 dark:text-sky-200',                btnIdle: 'bg-surface border-sky-200 text-sky-700 hover:border-sky-400 dark:border-sky-400/30 dark:text-sky-300 dark:hover:border-sky-400/60',                hover: 'hover:bg-sky-50 dark:hover:bg-sky-400/10',     selected: 'font-semibold text-sky-800 bg-sky-50 dark:text-sky-200 dark:bg-sky-400/10',       border: 'border-sky-200 dark:border-sky-400/25',   accent: 'accent-sky-700 dark:accent-sky-400',     countText: 'text-sky-500 dark:text-sky-400/70',    divider: 'border-sky-100 dark:border-white/10',   clearText: 'text-sky-600 dark:text-sky-300' },
  stone:   { btnActive: 'bg-stone-200 border-stone-400 text-stone-900 dark:bg-stone-400/15 dark:border-stone-400/40 dark:text-stone-200',     btnIdle: 'bg-surface border-stone-300 text-stone-700 hover:border-stone-500 dark:border-stone-400/30 dark:text-stone-300 dark:hover:border-stone-400/60',     hover: 'hover:bg-stone-100 dark:hover:bg-stone-400/10',  selected: 'font-semibold text-stone-900 bg-stone-100 dark:text-stone-200 dark:bg-stone-400/10',  border: 'border-stone-300 dark:border-stone-400/25', accent: 'accent-stone-700 dark:accent-stone-400',   countText: 'text-stone-500 dark:text-stone-400/70',  divider: 'border-stone-200 dark:border-white/10', clearText: 'text-stone-600 dark:text-stone-300' },
  violet:  { btnActive: 'bg-violet-100 border-violet-300 text-violet-900 dark:bg-violet-400/15 dark:border-violet-400/40 dark:text-violet-200', btnIdle: 'bg-surface border-violet-200 text-violet-700 hover:border-violet-400 dark:border-violet-400/30 dark:text-violet-300 dark:hover:border-violet-400/60', hover: 'hover:bg-violet-50 dark:hover:bg-violet-400/10', selected: 'font-semibold text-violet-800 bg-violet-50 dark:text-violet-200 dark:bg-violet-400/10', border: 'border-violet-200 dark:border-violet-400/25', accent: 'accent-violet-700 dark:accent-violet-400', countText: 'text-violet-500 dark:text-violet-400/70', divider: 'border-violet-100 dark:border-white/10', clearText: 'text-violet-600 dark:text-violet-300' },
  cyan:    { btnActive: 'bg-cyan-100 border-cyan-300 text-cyan-900 dark:bg-cyan-400/15 dark:border-cyan-400/40 dark:text-cyan-200',            btnIdle: 'bg-surface border-cyan-200 text-cyan-700 hover:border-cyan-400 dark:border-cyan-400/30 dark:text-cyan-300 dark:hover:border-cyan-400/60',            hover: 'hover:bg-cyan-50 dark:hover:bg-cyan-400/10',    selected: 'font-semibold text-cyan-800 bg-cyan-50 dark:text-cyan-200 dark:bg-cyan-400/10',     border: 'border-cyan-200 dark:border-cyan-400/25',  accent: 'accent-cyan-700 dark:accent-cyan-400',    countText: 'text-cyan-500 dark:text-cyan-400/70',   divider: 'border-cyan-100 dark:border-white/10',  clearText: 'text-cyan-600 dark:text-cyan-300' },
  rose:    { btnActive: 'bg-rose-100 border-rose-300 text-rose-900 dark:bg-rose-400/15 dark:border-rose-400/40 dark:text-rose-200',            btnIdle: 'bg-surface border-rose-200 text-rose-700 hover:border-rose-400 dark:border-rose-400/30 dark:text-rose-300 dark:hover:border-rose-400/60',            hover: 'hover:bg-rose-50 dark:hover:bg-rose-400/10',    selected: 'font-semibold text-rose-800 bg-rose-50 dark:text-rose-200 dark:bg-rose-400/10',     border: 'border-rose-200 dark:border-rose-400/25',  accent: 'accent-rose-700 dark:accent-rose-400',    countText: 'text-rose-500 dark:text-rose-400/70',   divider: 'border-rose-100 dark:border-white/10',  clearText: 'text-rose-600 dark:text-rose-300' },
};
