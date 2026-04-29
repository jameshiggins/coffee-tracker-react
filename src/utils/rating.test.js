import { describe, it, expect } from 'vitest';
import { ratingToStars, formatStars, ratingGlyphs } from './rating.js';

describe('ratingToStars', () => {
  it('halves the 1-10 value', () => {
    expect(ratingToStars(1)).toBe(0.5);
    expect(ratingToStars(2)).toBe(1.0);
    expect(ratingToStars(8)).toBe(4.0);
    expect(ratingToStars(10)).toBe(5.0);
  });

  it('rounds non-integer averages', () => {
    expect(ratingToStars(8.4)).toBe(4.0); // 8.4 rounds to 8 → 4.0
    expect(ratingToStars(8.6)).toBe(4.5); // 8.6 rounds to 9 → 4.5
  });

  it('returns null for null', () => {
    expect(ratingToStars(null)).toBeNull();
    expect(ratingToStars(undefined)).toBeNull();
  });
});

describe('formatStars', () => {
  it('renders integer stars', () => {
    expect(formatStars(0)).toBe('☆☆☆☆☆');
    expect(formatStars(3)).toBe('★★★☆☆');
    expect(formatStars(5)).toBe('★★★★★');
  });

  it('renders half-stars with ½ glyph', () => {
    expect(formatStars(0.5)).toBe('½☆☆☆☆');
    expect(formatStars(2.5)).toBe('★★½☆☆');
    expect(formatStars(4.5)).toBe('★★★★½');
  });
});

describe('ratingGlyphs', () => {
  it('full pipeline: internal rating → glyph string', () => {
    expect(ratingGlyphs(8)).toBe('★★★★☆');
    expect(ratingGlyphs(9)).toBe('★★★★½');
    expect(ratingGlyphs(10)).toBe('★★★★★');
    expect(ratingGlyphs(null)).toBeNull();
  });
});
