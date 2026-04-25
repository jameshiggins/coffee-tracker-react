import { describe, it, expect } from 'vitest';
import { pricePerGram, centsPerGram, slugify } from './coffee.js';

describe('pricePerGram', () => {
  it('returns price/grams to 4 decimal places', () => {
    expect(pricePerGram({ bag_weight_grams: 340, price: 22.0 })).toBe(0.0647);
    expect(pricePerGram({ bag_weight_grams: 250, price: 24.0 })).toBe(0.096);
    expect(pricePerGram({ bag_weight_grams: 1000, price: 58.0 })).toBe(0.058);
  });

  it('returns 0 for zero or missing weight (no division-by-zero)', () => {
    expect(pricePerGram({ bag_weight_grams: 0, price: 10 })).toBe(0);
    expect(pricePerGram({ bag_weight_grams: undefined, price: 10 })).toBe(0);
  });
});

describe('centsPerGram', () => {
  it('returns price-per-gram * 100 to 1 decimal', () => {
    expect(centsPerGram({ bag_weight_grams: 340, price: 22.0 })).toBe(6.5);
    expect(centsPerGram({ bag_weight_grams: 250, price: 24.0 })).toBe(9.6);
  });

  it('returns 0 for zero weight', () => {
    expect(centsPerGram({ bag_weight_grams: 0, price: 10 })).toBe(0);
  });
});

describe('slugify', () => {
  it('lowercases and dashes', () => {
    expect(slugify('Discovery Coffee')).toBe('discovery-coffee');
  });

  it('strips ampersands to "and"', () => {
    expect(slugify('Bows & Arrows')).toBe('bows-and-arrows');
  });

  it('drops apostrophes and other punctuation', () => {
    expect(slugify("Joe's Beans")).toBe('joes-beans');
  });
});
