import { describe, it, expect } from 'vitest';
import { gramsToPounds, gramsToOunces, formatBagWeight, cleanPoundLabel } from './units.js';

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

describe('cleanPoundLabel', () => {
  it('matches the named lb sizes within tolerance', () => {
    expect(cleanPoundLabel(113)).toBe('¼ lb');
    expect(cleanPoundLabel(151)).toBe('⅓ lb');
    expect(cleanPoundLabel(227)).toBe('½ lb');
    expect(cleanPoundLabel(340)).toBe('¾ lb');
    expect(cleanPoundLabel(454)).toBe('1 lb');
    expect(cleanPoundLabel(907)).toBe('2 lb');
    expect(cleanPoundLabel(2268)).toBe('5 lb');
  });
  it('tolerates rounding (340 ± 5g still ¾ lb)', () => {
    expect(cleanPoundLabel(338)).toBe('¾ lb');
    expect(cleanPoundLabel(345)).toBe('¾ lb');
  });
  it('returns null for non-clean sizes', () => {
    expect(cleanPoundLabel(250)).toBeNull();   // 250g metric, no lb anchor
    expect(cleanPoundLabel(301)).toBeNull();   // 49th's 10.6 oz, weird fraction
    expect(cleanPoundLabel(1000)).toBeNull();  // 1kg, no clean lb (it's 2.2 lb)
  });
  it('returns null for empty input', () => {
    expect(cleanPoundLabel(0)).toBeNull();
    expect(cleanPoundLabel(null)).toBeNull();
  });
});

describe('gramsToOunces', () => {
  it('converts standard sizes to 1-decimal ounces', () => {
    expect(gramsToOunces(283)).toBe(10);     // 283g ≈ 10 oz
    expect(gramsToOunces(301)).toBe(10.6);   // 49th's bag
    expect(gramsToOunces(250)).toBe(8.8);
    expect(gramsToOunces(1000)).toBe(35.3);
  });
  it('returns 0 for empty', () => {
    expect(gramsToOunces(0)).toBe(0);
    expect(gramsToOunces(null)).toBe(0);
  });
});

describe('formatBagWeight', () => {
  it('uses lb fraction when grams matches a clean lb size', () => {
    expect(formatBagWeight(113)).toBe('113g · ¼ lb');
    expect(formatBagWeight(151)).toBe('151g · ⅓ lb');
    expect(formatBagWeight(227)).toBe('227g · ½ lb');
    expect(formatBagWeight(340)).toBe('340g · ¾ lb');
    expect(formatBagWeight(454)).toBe('454g · 1 lb');
    expect(formatBagWeight(907)).toBe('907g · 2 lb');
    expect(formatBagWeight(2268)).toBe('2268g · 5 lb');
  });
  it('falls back to ounces when no clean lb match', () => {
    expect(formatBagWeight(250)).toBe('250g · 8.8 oz');
    expect(formatBagWeight(301)).toBe('301g · 10.6 oz');     // 49th's bag
    expect(formatBagWeight(1000)).toBe('1000g · 35.3 oz');   // 1kg
  });
  it('returns dash for empty input', () => {
    expect(formatBagWeight(0)).toBe('—');
    expect(formatBagWeight(null)).toBe('—');
  });
});
