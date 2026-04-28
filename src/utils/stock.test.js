import { describe, it, expect } from 'vitest';
import { isCoffeeInStock, inStockCount } from './stock.js';

describe('isCoffeeInStock', () => {
  it('returns true when at least one variant is in_stock', () => {
    expect(isCoffeeInStock({
      variants: [
        { in_stock: false },
        { in_stock: true },
        { in_stock: false },
      ],
    })).toBe(true);
  });

  it('returns false when all variants are out of stock', () => {
    expect(isCoffeeInStock({
      variants: [{ in_stock: false }, { in_stock: false }],
    })).toBe(false);
  });

  it('returns false for a coffee with no variants', () => {
    expect(isCoffeeInStock({ variants: [] })).toBe(false);
    expect(isCoffeeInStock({})).toBe(false);
    expect(isCoffeeInStock(null)).toBe(false);
  });

  it('treats undefined in_stock as not in stock', () => {
    // Defensive: a malformed payload shouldn't accidentally hide nor show.
    // We err on the side of "if it doesn't say it's in stock, treat as not".
    expect(isCoffeeInStock({ variants: [{ in_stock: undefined }] })).toBe(false);
  });
});

describe('inStockCount', () => {
  it('counts coffees with at least one available variant', () => {
    const roaster = {
      coffees: [
        { variants: [{ in_stock: true }] },
        { variants: [{ in_stock: false }, { in_stock: false }] },
        { variants: [{ in_stock: true }, { in_stock: false }] },
      ],
    };
    expect(inStockCount(roaster)).toBe(2);
  });

  it('returns 0 for empty / missing data', () => {
    expect(inStockCount({ coffees: [] })).toBe(0);
    expect(inStockCount({})).toBe(0);
  });
});
