import { forwardRef } from 'react';
import { cn } from './cn.js';

/**
 * Button — the canonical action primitive.
 *
 * Variants:
 *   - primary   solid accent (the brand brown), white text
 *   - secondary border + accent text, transparent fill
 *   - ghost     no border, accent text, hover bg
 *   - danger    solid danger (red), white text
 *
 * Sizes:
 *   - sm   compact (32px tap target; use inside dense rows)
 *   - md   default (≥44px tap target — mirrors mobile pass)
 *   - lg   prominent (≥48px tap target)
 *
 * Props:
 *   as          tag override — defaults to 'button'; pass 'a' for links
 *   leftIcon    ReactNode rendered before children
 *   rightIcon   ReactNode rendered after children
 *   loading     replaces leftIcon with a spinner; disables the button
 *   disabled    standard disabled state (or aria-disabled when `as='a'`)
 *
 * Uses the semantic accent token (NOT raw espresso shades) so a palette
 * change in tokens.css ripples through every button automatically.
 */
const VARIANTS = {
  primary:
    'bg-accent text-accent-fg hover:bg-accent-hover ' +
    'disabled:bg-fg-subtle disabled:cursor-not-allowed',
  secondary:
    'bg-transparent text-accent border border-accent ' +
    'hover:bg-surface-muted ' +
    'disabled:text-fg-subtle disabled:border-border-strong disabled:cursor-not-allowed',
  ghost:
    'bg-transparent text-accent border border-transparent ' +
    'hover:bg-surface-muted ' +
    'disabled:text-fg-subtle disabled:cursor-not-allowed',
  danger:
    'bg-danger text-danger-fg hover:brightness-95 ' +
    'disabled:bg-fg-subtle disabled:cursor-not-allowed',
};

// Min-heights chosen so `md` and `lg` both clear the 44px tap-target floor
// shipped in the mobile pass. `sm` is below 44px on purpose — only use it in
// dense, mouse-driven contexts (e.g. admin tables) where the user explicitly
// opted into compactness.
const SIZES = {
  sm: 'text-xs px-2 py-1 min-h-[32px] gap-1.5 rounded-md',
  md: 'text-sm px-3 py-2 min-h-[44px] gap-2 rounded-lg',
  lg: 'text-base px-4 py-2.5 min-h-[48px] gap-2 rounded-lg',
};

const BASE =
  'inline-flex items-center justify-center font-medium ' +
  'transition-colors duration-150 ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ' +
  'focus-visible:ring-offset-2 focus-visible:ring-offset-surface ' +
  'select-none';

const Button = forwardRef(function Button(
  {
    as: Tag = 'button',
    variant = 'primary',
    size = 'md',
    leftIcon,
    rightIcon,
    loading = false,
    disabled = false,
    type,
    className,
    children,
    ...rest
  },
  ref
) {
  const variantCls = VARIANTS[variant] || VARIANTS.primary;
  const sizeCls = SIZES[size] || SIZES.md;
  const isDisabled = disabled || loading;

  // <a> doesn't support disabled — fall back to aria-disabled + a click trap.
  // <button> gets a real type to keep it from accidentally submitting forms.
  const tagProps =
    Tag === 'button'
      ? { type: type || 'button', disabled: isDisabled }
      : { 'aria-disabled': isDisabled || undefined };

  return (
    <Tag
      ref={ref}
      className={cn(BASE, sizeCls, variantCls, className)}
      {...tagProps}
      {...rest}
    >
      {loading ? <Spinner /> : leftIcon}
      {children != null && <span>{children}</span>}
      {rightIcon}
    </Tag>
  );
});

function Spinner() {
  // 1em-sized SVG so it inherits the button's font-size. Aria-hidden because
  // the button's accessible name (children) already conveys context; the
  // loading state is communicated to AT by disabled / aria-busy if needed.
  return (
    <svg
      aria-hidden="true"
      data-testid="button-spinner"
      className="animate-spin"
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
      <path
        d="M4 12a8 8 0 0 1 8-8"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default Button;
