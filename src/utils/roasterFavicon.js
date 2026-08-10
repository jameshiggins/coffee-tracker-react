/**
 * Roaster favicon/avatar helpers, shared by every surface that renders a
 * roaster brand mark (roaster directory rows, bean-card chips, image
 * placeholders). One home for the logic that used to be triplicated.
 */

const S2_PATTERN = /\bgoogle\.com\/s2\/favicons/;

function withSize(url, sz) {
  if (/[?&]sz=\d+/.test(url)) return url.replace(/([?&])sz=\d+/, `$1sz=${sz}`);
  return url + (url.includes('?') ? '&' : '?') + `sz=${sz}`;
}

/**
 * Build `src`/`srcSet` for a favicon URL. Google S2 URLs are parameterized
 * by size, so we can serve 64px to 1x displays and 128px to 2x+ — the
 * backend defaults to sz=128 but this makes the density explicit either
 * way. Non-S2 URLs (scraped apple-touch-icons, admin overrides) pass
 * through untouched: we can't resize what we don't control.
 */
export function getFaviconSources(url) {
  if (!url) return { src: null, srcSet: undefined };
  if (S2_PATTERN.test(url)) {
    return {
      src: withSize(url, 128),
      srcSet: `${withSize(url, 64)} 1x, ${withSize(url, 128)} 2x`,
    };
  }
  return { src: url, srcSet: undefined };
}

/**
 * Deterministic per-roaster tint for monogram/placeholder tiles. Same
 * name → same color everywhere. The second hash byte varies saturation so
 * two roasters landing on nearby hues still get visibly different tiles.
 */
export function roasterTint(name) {
  let hash = 0;
  const s = name || '';
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) | 0;
  return {
    hue: Math.abs(hash) % 360,
    sat: 35 + (Math.abs(hash >> 9) % 25),
  };
}

/** "Monogram" initials: first letters of the first two words. */
export function roasterInitials(name) {
  const words = (name || '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}
