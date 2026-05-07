import L from 'leaflet';

/**
 * Custom cluster bubble for react-leaflet-cluster. Replaces the library's
 * default blue circles with brown coffee-themed bubbles in three size tiers.
 *
 * Tiers:
 *   2–9   → 40px, light halo
 *   10–49 → 48px, medium halo
 *   50+   → 56px, heavy halo
 *
 * The halo is a translucent ring around the bubble — visually echoes the
 * "pile of beans" idea without the cost of rendering N tiny SVGs.
 */
export function createClusterIcon(cluster) {
  const count = cluster.getChildCount();
  let size;
  let fontSize;
  let haloPx;
  if (count < 10) {
    size = 40; fontSize = 14; haloPx = 4;
  } else if (count < 50) {
    size = 48; fontSize = 16; haloPx = 6;
  } else {
    size = 58; fontSize = 18; haloPx = 9;
  }

  const html = `
    <div style="
      position:relative;width:${size}px;height:${size}px;
      display:flex;align-items:center;justify-content:center;
      background:#6f4326;color:#fef6e7;
      border:2px solid #fef6e7;
      border-radius:50%;
      font-weight:700;font-size:${fontSize}px;
      font-family:Inter,system-ui,-apple-system,sans-serif;
      box-shadow:
        0 0 0 ${haloPx}px rgba(111,67,38,0.25),
        0 2px 4px rgba(0,0,0,0.25);
      cursor:pointer;
      transition:transform 120ms ease-out;
    ">${count}</div>
  `;

  return L.divIcon({
    className: 'roastmap-cluster',
    html,
    iconSize: L.point(size, size, true),
  });
}
