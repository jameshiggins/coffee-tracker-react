import { forwardRef } from 'react';
import { cn } from './cn.js';

/**
 * Card — the canonical container primitive.
 *
 * Variants:
 *   - default   white surface, soft border, sm shadow (the workhorse)
 *   - elevated  white surface, soft border, lg shadow (lifts off the page)
 *   - flat      white surface, soft border, NO shadow (nested or dense lists)
 *
 * Children-driven. Pass any layout you want — Card is just the chrome.
 * `padding` is opt-in via prop (default `md`); pass `padding="none"` when
 * you need to control padding on inner sections (e.g. a header row that
 * spans the card with its own background).
 *
 * Mirrors the live pattern `bg-white rounded-xl border border-amber-100
 * shadow-sm` used across BeanCard, RoasterMap popups, and most list cards.
 * The Tailwind compile expands `bg-surface` → white via the CSS variable.
 */
const VARIANTS = {
  default: 'shadow-sm',
  elevated: 'shadow-lg',
  flat: '',
};

const PADDINGS = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
};

const BASE = 'bg-surface rounded-xl border border-border';

const Card = forwardRef(function Card(
  { variant = 'default', padding = 'md', className, children, ...rest },
  ref
) {
  // Use hasOwn so `variant="flat"` (which maps to '') doesn't fall through
  // the `||` default and accidentally pick up shadow-sm.
  const variantCls = Object.prototype.hasOwnProperty.call(VARIANTS, variant)
    ? VARIANTS[variant]
    : VARIANTS.default;
  const padCls = Object.prototype.hasOwnProperty.call(PADDINGS, padding)
    ? PADDINGS[padding]
    : PADDINGS.md;
  return (
    <div ref={ref} className={cn(BASE, variantCls, padCls, className)} {...rest}>
      {children}
    </div>
  );
});

export default Card;
