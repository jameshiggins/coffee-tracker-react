import { describe, it, expect } from 'vitest';
import { createClusterIcon } from './MapClusterIcon.jsx';

/**
 * The icon factory is mostly visual (Leaflet rendering), but the
 * count→size tier mapping is pure logic and worth pinning so a
 * future tweak to one tier can't silently shift the others.
 */
function mkCluster(count) {
  return { getChildCount: () => count };
}

describe('createClusterIcon', () => {
  it('embeds the child count in the rendered HTML', () => {
    const icon = createClusterIcon(mkCluster(7));
    expect(icon.options.html).toContain('>7</div>');
  });

  it('scales the bubble at each tier boundary (small < 10 < medium < 50 <= large)', () => {
    const small = createClusterIcon(mkCluster(9));    // tier 1: <10
    const medium10 = createClusterIcon(mkCluster(10)); // tier 2 lower edge
    const medium49 = createClusterIcon(mkCluster(49)); // tier 2 upper edge
    const large = createClusterIcon(mkCluster(50));    // tier 3 lower edge

    expect(small.options.html).toContain('width:40px');
    expect(medium10.options.html).toContain('width:48px');
    expect(medium49.options.html).toContain('width:48px');
    expect(large.options.html).toContain('width:58px');
  });

  it('uses the espresso brand palette (no default blue)', () => {
    const icon = createClusterIcon(mkCluster(3));
    expect(icon.options.html).toContain('#6f4326'); // espresso brown bg
    expect(icon.options.html).toContain('#fef6e7'); // cream text + border
    expect(icon.options.html).not.toContain('blue');
  });

  it('iconSize matches the rendered bubble dimensions', () => {
    // Leaflet uses this to anchor the icon; mismatch = drift between
    // hit-target and visible bubble.
    const small = createClusterIcon(mkCluster(2));
    const large = createClusterIcon(mkCluster(100));
    expect(small.options.iconSize.x).toBe(40);
    expect(small.options.iconSize.y).toBe(40);
    expect(large.options.iconSize.x).toBe(58);
    expect(large.options.iconSize.y).toBe(58);
  });
});
