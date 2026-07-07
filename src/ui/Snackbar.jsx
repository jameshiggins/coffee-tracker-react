import { useEffect, useRef, useState } from 'react';
import Icon from '../components/Icon.jsx';

/**
 * Snackbar — a transient floating action bar.
 *
 * Shows ONE message with an optional action button (e.g. "Undo") and a dismiss
 * (✕) button, slides in, auto-dismisses after `duration`, then calls onDismiss
 * so the parent can drop it from state. Hovering or focusing the bar PAUSES the
 * countdown (so it can't vanish mid-read or mid-click); leaving/blurring it
 * resumes the countdown. The parent gives each event a fresh `key`, so a repeat
 * action replays the slide-in and restarts the timer.
 *
 * Unlike a pure toast this is interactive (it owns buttons), so it stays in the
 * a11y tree as a polite live region rather than being aria-hidden.
 *
 * Positioning: anchored TOP on phones — the /beans multi-select opens a bottom
 * sheet and the floating "Filters" button sits bottom-right, so the bottom edge
 * is busy — and BOTTOM on sm:+. Never blocks page clicks (the strip is
 * pointer-events-none; only the bar itself is interactive).
 */
export default function Snackbar({
  kind = 'added',
  message,
  actionLabel,
  onAction,
  duration = 5000,
  onDismiss,
}) {
  const [show, setShow] = useState(false);
  const [atTop, setAtTop] = useState(false);
  // Keep the latest onDismiss without re-running the mount-once effect (the
  // parent passes a fresh inline closure on every render).
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;
  const hideRef = useRef(0);
  const doneRef = useRef(0);

  // (Re)arm the hide + unmount countdown.
  const arm = () => {
    clearTimeout(hideRef.current);
    clearTimeout(doneRef.current);
    hideRef.current = setTimeout(() => setShow(false), duration);
    // Unmount a beat after the 200ms exit transition. Timer-driven (not
    // transitionend) so it still fires under prefers-reduced-motion, where the
    // transition is near-instant and may emit no transitionend event.
    doneRef.current = setTimeout(() => onDismissRef.current?.(), duration + 250);
  };
  const disarm = () => {
    clearTimeout(hideRef.current);
    clearTimeout(doneRef.current);
  };

  useEffect(() => {
    // Guard matchMedia (absent in jsdom / SSR) the same way useTheme does;
    // falling back to the bottom anchor is the safe default.
    const isPhone =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(max-width: 639px)').matches;
    setAtTop(isPhone);
    const enter = requestAnimationFrame(() => setShow(true));
    arm();
    return () => {
      cancelAnimationFrame(enter);
      disarm();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration]);

  // Collapse + unmount immediately (used by the action and dismiss buttons).
  const close = () => {
    setShow(false);
    disarm();
    doneRef.current = setTimeout(() => onDismissRef.current?.(), 250);
  };

  const handleAction = () => {
    onAction?.();
    close();
  };

  return (
    <div
      className="fixed inset-x-0 z-[60] flex justify-center px-4 pointer-events-none"
      style={
        atTop
          ? { top: 'calc(env(safe-area-inset-top) + 1rem)' }
          : { bottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }
      }
    >
      <div
        role="status"
        aria-live="polite"
        onMouseEnter={disarm}
        onMouseLeave={arm}
        onFocusCapture={disarm}
        onBlurCapture={arm}
        // Glassy inverse pill: translucent foreground colour + blur. Inline
        // backgroundColor (not a Tailwind token/opacity, which breaks on the
        // hex-valued CSS-var colours) so it themes correctly in both modes.
        style={{ backgroundColor: 'color-mix(in srgb, var(--color-fg) 90%, transparent)' }}
        className={`pointer-events-auto inline-flex items-center gap-2.5 max-w-[92vw]
                    rounded-full text-surface shadow-xl ring-1 ring-white/10 backdrop-blur-md
                    pl-4 pr-1.5 py-1.5 text-sm font-medium
                    transition duration-200 ease-out
                    ${show ? 'opacity-100 translate-y-0' : `opacity-0 ${atTop ? '-translate-y-3' : 'translate-y-3'}`}`}
      >
        <Icon
          name={kind === 'removed' ? 'x' : 'check'}
          size={16}
          className="flex-shrink-0 opacity-90"
        />
        <span className="min-w-0 truncate">{message}</span>
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={handleAction}
            className="flex-shrink-0 rounded-full bg-accent text-accent-fg font-semibold
                       px-3 py-1.5 hover:bg-accent-hover transition-colors
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-accent
                       focus-visible:ring-offset-2 focus-visible:ring-offset-fg"
          >
            {actionLabel}
          </button>
        )}
        <button
          type="button"
          onClick={close}
          aria-label="Dismiss"
          className="flex-shrink-0 w-8 h-8 inline-flex items-center justify-center rounded-full
                     opacity-70 hover:opacity-100 hover:bg-white/10 transition
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        >
          <Icon name="x" size={16} />
        </button>
      </div>
    </div>
  );
}
