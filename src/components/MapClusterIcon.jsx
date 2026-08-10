import L from 'leaflet';

/**
 * Custom cluster bubble for the marker cluster group. Replaces the library's
 * default blue circles with brand bubbles in three size tiers.
 *
 * Tiers:
 *   2–9   → 40px, light halo
 *   10–49 → 48px, medium halo
 *   50+   → 58px, heavy halo
 *
 * Sizing stays inline (it's data-driven); colors live in
 * leaflet-overrides.css (`.rm-cluster-bubble`) so mounted clusters follow a
 * theme flip via CSS, same contract as the markers and popups.
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
    <div class="rm-cluster-bubble" style="
      width:${size}px;height:${size}px;
      font-size:${fontSize}px;
      --rm-cluster-halo:${haloPx}px;
    ">${count}</div>
  `;

  return L.divIcon({
    className: 'roastmap-cluster',
    html,
    iconSize: L.point(size, size, true),
  });
}
