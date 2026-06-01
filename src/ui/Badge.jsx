import { forwardRef } from 'react';
import { cn } from './cn.js';
import { TONE_TRIOS } from './tones.js';

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
// Tones are centralized in ./tones.js (shared with Chip + BeanCard).
const TONES = TONE_TRIOS;

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
