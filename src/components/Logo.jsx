/**
 * Roastmap brand mark — coffee-bean glyph + wordmark.
 *
 * The bean SVG is the same shape used in /public/favicon.svg, copied
 * inline so it can be tinted via the `dark` prop without an extra HTTP
 * roundtrip. Use `dark` when rendering on a dark/coloured background
 * (e.g. the gradient header).
 */
export default function Logo({ dark = false, size = 'md' }) {
  const dims = size === 'sm' ? { glyph: 22, text: 'text-xl' }
             : size === 'lg' ? { glyph: 36, text: 'text-3xl' }
             : { glyph: 28, text: 'text-2xl' };
  const wordColor = dark ? '#fef6e7' : '#6f4326';
  return (
    <span className="inline-flex items-center gap-2 select-none">
      <BeanGlyph size={dims.glyph} dark={dark} />
      <span
        className={`font-bold tracking-tight ${dims.text}`}
        style={{ color: wordColor, letterSpacing: '-0.02em' }}
      >
        Roastmap
      </span>
    </span>
  );
}

function BeanGlyph({ size = 28, dark = false }) {
  // On a dark header the cream + dark-brown contrast disappears, so we
  // flip the bean's outline + crease colors.
  const body = dark ? '#fef6e7' : '#6f4326';
  const stroke = dark ? '#a87650' : '#3e2412';
  const highlight = dark ? '#3e2412' : '#a87650';
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <g transform="translate(32 32) rotate(-25)">
        <ellipse cx="0" cy="0" rx="22" ry="13" fill={body} stroke={stroke} strokeWidth="1.5" />
        <path d="M -19 -1 Q -10 -6, 0 0 Q 10 6, 19 1"
              fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
        <path d="M -16 -3 Q -8 -7, 0 -2 Q 8 3, 16 -1"
              fill="none" stroke={highlight} strokeWidth="1" strokeLinecap="round" opacity="0.7" />
      </g>
    </svg>
  );
}
