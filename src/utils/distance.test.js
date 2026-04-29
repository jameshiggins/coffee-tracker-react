import { describe, it, expect } from 'vitest';
import { haversineKm, formatKm } from './distance.js';

describe('haversineKm', () => {
  it('returns 0 for the same point', () => {
    const p = { lat: 49.28, lng: -123.12 };
    expect(haversineKm(p, p)).toBe(0);
  });

  it('returns roughly the right distance for known cities', () => {
    // Vancouver → Toronto ≈ 3360 km
    const van = { lat: 49.2827, lng: -123.1207 };
    const tor = { lat: 43.6532, lng: -79.3832 };
    const km = haversineKm(van, tor);
    expect(km).toBeGreaterThan(3300);
    expect(km).toBeLessThan(3400);
  });

  it('returns null on missing coords', () => {
    expect(haversineKm(null, { lat: 0, lng: 0 })).toBeNull();
    expect(haversineKm({ lat: null, lng: 0 }, { lat: 0, lng: 0 })).toBeNull();
  });
});

describe('formatKm', () => {
  it('renders sub-1km as "<1 km"', () => {
    expect(formatKm(0.4)).toBe('<1 km');
  });
  it('renders mid-range as integer km', () => {
    expect(formatKm(7.4)).toBe('7 km');
    expect(formatKm(99)).toBe('99 km');
  });
  it('rounds long distances to nearest 10km', () => {
    expect(formatKm(347)).toBe('350 km');
    expect(formatKm(3360)).toBe('3360 km');
  });
  it('returns dash for null', () => {
    expect(formatKm(null)).toBe('—');
  });
});
