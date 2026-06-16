/**
 * Roastmap brand mark — terracotta coffee-bean glyph + wordmark.
 *
 * Colours are token-driven so the mark sits correctly on any themed surface:
 * the wordmark follows `--color-fg` (dark ink in light mode, warm off-white in
 * dark mode) and the bean fills `--color-accent` (terracotta) with a crease cut
 * from `--color-surface`. No `dark` prop needed any more — the header is a
 * themed surface now, not a fixed brown bar.
 */
export default function Logo({ size = 'md' }) {
  const dims = size === 'sm' ? { glyph: 22, text: 'text-xl' }
             : size === 'lg' ? { glyph: 34, text: 'text-3xl' }
             : { glyph: 27, text: 'text-2xl' };
  return (
    <span className="inline-flex items-center gap-2 select-none text-fg">
      <BeanGlyph size={dims.glyph} />
      <span className={`font-bold tracking-tight ${dims.text}`} style={{ letterSpacing: '-0.02em' }}>
        Roastmap
      </span>
    </span>
  );
}

function BeanGlyph({ size = 27 }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <g transform="translate(32 32) rotate(-25)">
        <ellipse cx="0" cy="0" rx="22" ry="13" fill="var(--color-accent)" />
        <path
          d="M -19 -1 Q -10 -6, 0 0 Q 10 6, 19 1"
          fill="none"
          stroke="var(--color-surface)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
