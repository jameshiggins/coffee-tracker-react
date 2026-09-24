import { describe, it, expect } from 'vitest';
import { resolveTileLayer, readCartoKey, INVERTED_TILES_CLASS } from './mapTiles.js';

describe('resolveTileLayer', () => {
  it('uses CARTO light/dark with the key on the query string when a key is configured', () => {
    const light = resolveTileLayer({ isDark: false, cartoKey: 'abc123' });
    const dark = resolveTileLayer({ isDark: true, cartoKey: 'abc123' });

    expect(light.provider).toBe('carto');
    expect(light.url).toBe(
      'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png?key=abc123',
    );
    expect(dark.url).toBe(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?key=abc123',
    );
    expect(light.subdomains).toBe('abcd');
    expect(light.attribution).toContain('carto.com/attributions');
    expect(light.className).toBeUndefined();
    expect(dark.className).toBeUndefined();
  });

  it('URL-encodes the key', () => {
    expect(resolveTileLayer({ isDark: false, cartoKey: 'a b&c' }).url).toMatch(/\?key=a%20b%26c$/);
  });

  it('falls back to keyless OpenStreetMap tiles without a key', () => {
    const light = resolveTileLayer({ isDark: false, cartoKey: null });

    expect(light.provider).toBe('osm');
    expect(light.url).toBe('https://tile.openstreetmap.org/{z}/{x}/{y}.png');
    expect(light.url).not.toContain('cartocdn');
    expect(light.attribution).toContain('openstreetmap.org/copyright');
    expect(light.attribution).not.toContain('CARTO');
    expect(light.subdomains).toBeUndefined();
    expect(light.className).toBeUndefined();
  });

  it('inverts the OSM fallback in dark mode via a CSS class', () => {
    expect(resolveTileLayer({ isDark: true, cartoKey: null }).className).toBe(INVERTED_TILES_CLASS);
  });
});

describe('readCartoKey', () => {
  it('returns the trimmed key or null', () => {
    expect(readCartoKey({ VITE_CARTO_API_KEY: '  k1  ' })).toBe('k1');
    expect(readCartoKey({ VITE_CARTO_API_KEY: '' })).toBeNull();
    expect(readCartoKey({ VITE_CARTO_API_KEY: '   ' })).toBeNull();
    expect(readCartoKey({})).toBeNull();
    expect(readCartoKey(undefined)).toBeNull();
  });
});
