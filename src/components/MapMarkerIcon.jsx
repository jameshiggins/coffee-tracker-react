import L from 'leaflet';

/**
 * Coffee-bean Leaflet divIcon. Uses the same SVG shape as the favicon
 * and the header logo so the brand reads consistently.
 *
 * The marker is a tinted bean with a slight rotation (per-roaster, so
 * the 50+ markers don't all face the same way — small detail that makes
 * the map feel hand-placed rather than auto-generated).
 *
 * When `active` is true (popup open for this marker), we add a ring as a
 * selected/focus indicator (ClusterLayer swaps icons on popupopen/close).
 *
 * Colors live in leaflet-overrides.css (classes below), NOT inline — the
 * divIcon HTML is only re-rendered when the icon is swapped, so dark-mode
 * must arrive via CSS for already-mounted markers to follow a theme flip.
 */
function beanSvg(rotation) {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="100%" height="100%">
      <g transform="translate(32 32) rotate(${rotation})">
        <ellipse class="rm-bean__body" cx="0" cy="0" rx="22" ry="13" stroke-width="1.5"/>
        <path class="rm-bean__crease" d="M -19 -1 Q -10 -6, 0 0 Q 10 6, 19 1"
              fill="none" stroke-width="2" stroke-linecap="round"/>
        <path class="rm-bean__sheen" d="M -16 -3 Q -8 -7, 0 -2 Q 8 3, 16 -1"
              fill="none" stroke-width="1" stroke-linecap="round" opacity="0.7"/>
      </g>
    </svg>
  `;
}

export function beanIcon({ active = false, rotation = -25 } = {}) {
  const ringHtml = active ? '<div class="rm-bean__ring"></div>' : '';
  return L.divIcon({
    className: 'roastmap-bean-marker',
    html: `<div class="rm-bean">${ringHtml}${beanSvg(rotation)}</div>`,
    iconSize: [36, 36],
    // Anchor at the center: the marker IS the location; no pin tail to
    // worry about. Popup floats above.
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
}
