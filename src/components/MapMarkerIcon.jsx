import L from 'leaflet';

/**
 * Coffee-bean Leaflet divIcon. Uses the same SVG shape as the favicon
 * and the header logo so the brand reads consistently.
 *
 * The marker is a tinted bean with a slight rotation (per-roaster, so
 * the 50+ markers don't all face the same way — small detail that makes
 * the map feel hand-placed rather than auto-generated).
 *
 * When `active` is true (popup open for this marker), we add a soft
 * cream ring + outer brown ring as a focus indicator.
 */
function beanSvg(rotation) {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="100%" height="100%">
      <g transform="translate(32 32) rotate(${rotation})">
        <ellipse cx="0" cy="0" rx="22" ry="13"
                 fill="#6f4326" stroke="#3e2412" stroke-width="1.5"/>
        <path d="M -19 -1 Q -10 -6, 0 0 Q 10 6, 19 1"
              fill="none" stroke="#3e2412" stroke-width="2" stroke-linecap="round"/>
        <path d="M -16 -3 Q -8 -7, 0 -2 Q 8 3, 16 -1"
              fill="none" stroke="#a87650" stroke-width="1" stroke-linecap="round" opacity="0.7"/>
      </g>
    </svg>
  `;
}

export function beanIcon({ active = false, rotation = -25 } = {}) {
  const ringHtml = active
    ? `<div style="position:absolute;inset:-6px;border-radius:50%;
                   border:2px solid #fef6e7;
                   box-shadow:0 0 0 2px #6f4326,0 4px 8px rgba(0,0,0,0.4);
                   pointer-events:none;"></div>`
    : '';
  return L.divIcon({
    className: 'roastmap-bean-marker',
    html: `
      <div style="position:relative;width:36px;height:36px;
                  filter:drop-shadow(0 2px 3px rgba(0,0,0,0.3));
                  transition:transform 120ms ease-out;">
        ${ringHtml}
        ${beanSvg(rotation)}
      </div>
    `,
    iconSize: [36, 36],
    // Anchor at the center: the marker IS the location; no pin tail to
    // worry about. Popup floats above.
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
}
