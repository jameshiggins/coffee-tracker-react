import { forwardRef } from 'react';
import { cn } from './cn.js';

/**
 * Chip — small interactive (or static) tag.
 *
 * Encodes the TONE system that lives inline in BeanCard.jsx today
 * (`bg-amber-50 text-amber-700 border-amber-200` style trios). The live
 * BeanCard keeps its own copy of TONES intentionally — adoption is a
 * separate phase. Once adoption lands, BeanCard's helper can disappear and
 * everyone consumes the Chip primitive instead.
 *
 * Renders <button> when `onClick` is provided, otherwise <span>. This
 * matches the BeanCard pattern where some chips are filter triggers and
 * others (e.g. the elevation chip) are pure display.
 *
 * Tones:
 *   amber emerald cyan sky stone yellow orange red accent neutral
 *
 *   - The first 8 mirror BeanCard's TONES verbatim (so chip colors look
 *     identical when adoption happens).
 *   - `accent` is the brand brown — use it when a chip represents an
 *     accented filter that's currently active.
 *   - `neutral` is a low-contrast slate — use it for inert metadata.
 *
 * Sizes: xs (default in BeanCard), sm, md.
 *
 * Optional `count` renders subtle text inside the chip, e.g. for "5"
 * appended to a category filter.
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
};

const SIZES = {
  xs: 'text-xs px-2 py-0.5 gap-1',
  sm: 'text-sm px-2.5 py-0.5 gap-1.5',
  md: 'text-sm px-3 py-1 gap-1.5',
};

const BASE =
  'inline-flex items-center rounded-full border ' +
  'transition-all whitespace-nowrap';

const INTERACTIVE =
  'cursor-pointer hover:brightness-95 ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ' +
  'focus-visible:ring-offset-2 focus-visible:ring-offset-surface';

const Chip = forwardRef(function Chip(
  {
    tone = 'stone',
    size = 'xs',
    onClick,
    count,
    className,
    children,
    type,
    ...rest
  },
  ref
) {
  const toneCls = TONES[tone] || TONES.stone;
  const sizeCls = SIZES[size] || SIZES.xs;
  const interactive = typeof onClick === 'function';
  const Tag = interactive ? 'button' : 'span';

  // <button> gets a real type to keep it from accidentally submitting forms.
  const tagProps = interactive ? { type: type || 'button', onClick } : {};

  return (
    <Tag
      ref={ref}
      className={cn(BASE, sizeCls, toneCls, interactive && INTERACTIVE, className)}
      {...tagProps}
      {...rest}
    >
      <span>{children}</span>
      {count != null && (
        <span className="text-fg-subtle opacity-75 font-normal">{count}</span>
      )}
    </Tag>
  );
});

export default Chip;
