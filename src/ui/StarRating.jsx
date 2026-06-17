import { useState } from 'react';
import { cn } from './cn.js';

/**
 * StarRating — interactive half-star rating.
 *
 * `value` / `onChange` are in STAR units (0–max, step 0.5), e.g. 3.5. Half
 * support: the LEFT half of a star sets x.5, the RIGHT half sets x.0.
 *
 * Interaction:
 *   - Mouse/touch: hover previews, click commits. Click the already-set value
 *     again to clear it back to 0 (no rating).
 *   - Keyboard: focus the control, ←/↓ decrease and →/↑ increase by 0.5,
 *     Home = 0, End = max.
 *
 * a11y: the wrapper is a single role="slider" (valuemin/now/max/text), so AT
 * sees one labelled control rather than ten nested buttons. The per-half hit
 * targets are decorative pointer affordances (aria-hidden).
 */
function StarShape({ size, className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3-5.8 3 1.1-6.5L2.6 9.4l6.5-.9L12 2.6z" />
    </svg>
  );
}

export default function StarRating({
  value = 0,
  onChange,
  max = 5,
  size = 28,
  readOnly = false,
  id,
  className,
  'aria-labelledby': ariaLabelledby,
}) {
  const [hover, setHover] = useState(null);
  const shown = hover ?? value;
  const interactive = !readOnly && typeof onChange === 'function';

  const clamp = (v) => Math.min(max, Math.max(0, v));
  const set = (v) => interactive && onChange(clamp(v));

  function onKeyDown(e) {
    if (!interactive) return;
    let next;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next = value + 0.5;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next = value - 0.5;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = max;
    else return;
    e.preventDefault();
    set(next);
  }

  return (
    <div
      id={id}
      role="slider"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={value ? `${value} of ${max} stars` : 'No rating'}
      aria-readonly={readOnly || undefined}
      aria-labelledby={ariaLabelledby}
      tabIndex={interactive ? 0 : -1}
      onKeyDown={onKeyDown}
      onMouseLeave={() => setHover(null)}
      className={cn(
        'inline-flex items-center gap-1 rounded-md',
        interactive && 'cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
        className
      )}
    >
      {Array.from({ length: max }, (_, i) => {
        const fill = Math.max(0, Math.min(1, shown - i)); // 0, 0.5 or 1 of this star
        const leftVal = i + 0.5;
        const rightVal = i + 1;
        return (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
            <StarShape size={size} className="absolute inset-0 text-border-strong" />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <StarShape size={size} className="text-accent" />
            </span>
            {interactive && (
              <>
                <span
                  aria-hidden="true"
                  data-value={leftVal}
                  onMouseEnter={() => setHover(leftVal)}
                  onClick={() => set(value === leftVal ? 0 : leftVal)}
                  className="absolute inset-y-0 left-0 z-10 w-1/2"
                />
                <span
                  aria-hidden="true"
                  data-value={rightVal}
                  onMouseEnter={() => setHover(rightVal)}
                  onClick={() => set(value === rightVal ? 0 : rightVal)}
                  className="absolute inset-y-0 right-0 z-10 w-1/2"
                />
              </>
            )}
          </span>
        );
      })}
    </div>
  );
}
