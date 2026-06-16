import { useEffect, useRef, useState } from 'react';
import Icon from '../components/Icon.jsx';

/**
 * Toast — a small, transient confirmation pill.
 *
 * Shows ONE message, animates in, holds for `duration`, animates out, then
 * calls `onDismiss` so the parent can drop it from state. The parent gives
 * each event a fresh `key` (so a repeat action replays the pop instead of
 * resetting a shared timer) and owns *what* the message says; this stays a
 * dumb presentational pill.
 *
 * Positioning: anchored to the TOP on phones — the /beans multi-select filter
 * opens a bottom sheet and the floating "Filters" button sits bottom-right, so
 * the bottom edge is busy — and to the BOTTOM on sm:+, where the header and
 * filter bar are up top. It never captures pointer events.
 *
 * a11y: aria-hidden on purpose. The /beans page already exposes an aria-live
 * result-count status, and each dropdown option announces its own checked
 * state, so a screen reader is told the filter changed without a third,
 * redundant announcement from here.
 */
export default function Toast({ kind = 'added', message, duration = 2200, onDismiss }) {
  const [show, setShow] = useState(false);
  const [atTop, setAtTop] = useState(false);
  // Keep the latest onDismiss without re-running the mount-once timer effect
  // (the parent passes a fresh inline closure on every render).
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    // Guard matchMedia (absent in jsdom / SSR) the same way useTheme does;
    // falling back to the bottom anchor is the safe default.
    const isPhone = typeof window !== 'undefined'
      && typeof window.matchMedia === 'function'
      && window.matchMedia('(max-width: 639px)').matches;
    setAtTop(isPhone);
    // Flip to shown on the next frame so the enter transition runs from the
    // hidden start state.
    const enter = requestAnimationFrame(() => setShow(true));
    const leave = setTimeout(() => setShow(false), duration);
    // Unmount a beat after the 200ms exit transition. Timer-driven (not
    // transitionend) so it still fires under prefers-reduced-motion, where the
    // transition is near-instant and may emit no transitionend event.
    const done = setTimeout(() => onDismissRef.current?.(), duration + 250);
    return () => {
      cancelAnimationFrame(enter);
      clearTimeout(leave);
      clearTimeout(done);
    };
  }, [duration]);

  return (
    <div
      className="fixed inset-x-0 z-[60] flex justify-center px-4 pointer-events-none"
      style={atTop
        ? { top: 'calc(env(safe-area-inset-top) + 1rem)' }
        : { bottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}
      aria-hidden="true"
    >
      <div
        className={`inline-flex items-center gap-2 max-w-[90vw] rounded-full
                    bg-fg text-surface shadow-lg ring-1 ring-black/10
                    px-4 py-2.5 text-sm font-medium
                    transition duration-200 ease-out
                    ${show
                      ? 'opacity-100 translate-y-0'
                      : `opacity-0 ${atTop ? '-translate-y-3' : 'translate-y-3'}`}`}
      >
        <Icon name={kind === 'removed' ? 'x' : 'check'} size={16} className="flex-shrink-0" />
        <span className="min-w-0 truncate">{message}</span>
      </div>
    </div>
  );
}
