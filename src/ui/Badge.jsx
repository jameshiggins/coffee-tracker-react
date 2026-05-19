import { forwardRef } from 'react';
import { cn } from './cn.js';

/**
 * Badge — small NON-interactive status pill.
 *
 * Think of it as Chip's sibling: same tonal vocabulary, but never a button.
 * Use Badge for status labels ("no longer sold", "private", "verified"); use
 * Chip for filters and tags the user is meant to click. If a status needs to
 * become clickable, swap in a Chip.
 *
 * Smaller than Chip by default — uses a square border-radius (rounded) rather
 * than rounded-full because the visual prior art ("no longer sold" red bubble
 * in BeanCard.jsx) uses a slightly rectangular pill to differentiate from
 * the round filter chips.
 *
 * Tones mirror Chip exactly so the system stays coherent.
 */
const TONES = {
  amber:   'bg-amber-50 text-amber-700 border-amber-200',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cyan:    'bg-cyan-50 text-cyan-700 border-cyan-200',
  sky:     'bg-sky-50 text-sky-700 border-sky-200',
  stone:   'bg-stone-50 text-stone-700 border-stone-200',
  yellow:  'bg-yellow-50 text-yellow-700 border-yellow-200',
  orange:  'bg-orange-50 text-orange-700 border-orange-200',
  red:     'bg-red-50 text-red-700 border-red-200',
  accent:  'bg-surface-muted text-accent border-border-strong',
  neutral: 'bg-surface-muted text-fg-muted border-border',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  danger:  'bg-red-50 text-red-700 border-red-200',
  info:    'bg-sky-50 text-sky-700 border-sky-200',
};

const BASE =
  'inline-flex items-center rounded border ' +
  'text-[11px] uppercase tracking-wide font-medium px-1.5 py-0.5 ' +
  'whitespace-nowrap align-middle';

const Badge = forwardRef(function Badge(
  { tone = 'stone', className, children, ...rest },
  ref
) {
  const toneCls = TONES[tone] || TONES.stone;
  return (
    <span ref={ref} className={cn(BASE, toneCls, className)} {...rest}>
      {children}
    </span>
  );
});

export default Badge;
