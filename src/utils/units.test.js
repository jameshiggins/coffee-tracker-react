import { describe, it, expect } from 'vitest';
import { gramsToPounds, formatBagWeight } from './units.js';

describe('gramsToPounds', () => {
  it('converts standard sizes', () => {
    expect(gramsToPounds(454)).toBe(1.00);
    expect(gramsToPounds(908)).toBe(2.00);
    expect(gramsToPounds(2268)).toBe(5.00);
    expect(gramsToPounds(340)).toBe(0.75);
  });

  it('returns 0 for zero/missing weight', () => {
    expect(gramsToPounds(0)).toBe(0);
    expect(gramsToPounds(null)).toBe(0);
    expect(gramsToPounds(undefined)).toBe(0);
  });
});

describe('formatBagWeight', () => {
  it('shows grams + pounds', () => {
    expect(formatBagWeight(340)).toBe('340g · 0.75 lb');
    expect(formatBagWeight(454)).toBe('454g · 1.00 lb');
    expect(formatBagWeight(1000)).toBe('1000g · 2.20 lb');
  });

  it('returns dash for empty input', () => {
    expect(formatBagWeight(0)).toBe('—');
    expect(formatBagWeight(null)).toBe('—');
  });
});
