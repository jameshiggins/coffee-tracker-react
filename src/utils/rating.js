/**
 * Q8 rating helpers. Internally we store ratings on a 1–10 integer scale
 * (representing half-stars: 1 = 0.5★, 10 = 5.0★). Users only ever see
 * the 5-star scale, so anything that touches the UI goes through here.
 */

/** 1–10 internal value → 1.0–5.0 star value with 0.5 granularity. */
export function ratingToStars(rating) {
  if (rating == null) return null;
  return Math.round(rating) / 2;
}

/**
 * Render a 1–5 star value as a glyph string. Half-stars get the ½ glyph.
 * Returns null for null/undefined input so the caller can branch.
 */
export function formatStars(stars) {
  if (stars == null) return null;
  const full = Math.floor(stars);
  const half = stars % 1 === 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}

/** Convenience: 1–10 → glyph string. */
export function ratingGlyphs(rating) {
  return formatStars(ratingToStars(rating));
}
