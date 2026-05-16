import { describe, it, expect } from 'vitest';
import { flavorColor, splitTastingNotes } from './flavorColor.js';

describe('flavorColor', () => {
  it('matches floral notes to pink', () => {
    expect(flavorColor('rose petals').name).toBe('floral');
    expect(flavorColor('jasmine').name).toBe('floral');
  });

  it('matches berry notes to red', () => {
    expect(flavorColor('blueberry').name).toBe('berry');
    expect(flavorColor('strawberry').name).toBe('berry');
  });

  it('matches tropical to fuchsia (watermelon, etc.)', () => {
    expect(flavorColor('watermelon').name).toBe('tropical');
    expect(flavorColor('passion fruit').name).toBe('tropical');
  });

  it('matches sweet/caramel to amber', () => {
    expect(flavorColor('caramel').name).toBe('sweet');
    expect(flavorColor('honey').name).toBe('sweet');
  });

  it('matches chocolate to stone (dark brown)', () => {
    expect(flavorColor('dark chocolate').name).toBe('chocolate');
    expect(flavorColor('cocoa').name).toBe('chocolate');
  });

  it('falls back to neutral for unknown notes', () => {
    expect(flavorColor('unicorn dust').name).toBe('other');
    expect(flavorColor('').name).toBe('other');
    expect(flavorColor(null).name).toBe('other');
  });

  it('does not false-positive on substrings', () => {
    // "sublime" should NOT match "lime" — word boundary check
    expect(flavorColor('sublime').name).toBe('other');
  });
});

describe('splitTastingNotes', () => {
  // Notes are normalized to Title Case on the way out (so chips render
  // consistently regardless of how the roaster wrote them).
  it('splits on comma', () => {
    expect(splitTastingNotes('jasmine, bergamot, honey')).toEqual(['Jasmine', 'Bergamot', 'Honey']);
  });
  it('splits on slash', () => {
    expect(splitTastingNotes('blueberry / chocolate / caramel'))
      .toEqual(['Blueberry', 'Chocolate', 'Caramel']);
  });
  it('splits on " and "', () => {
    expect(splitTastingNotes('jasmine and honey')).toEqual(['Jasmine', 'Honey']);
  });
  it('splits on " & "', () => {
    expect(splitTastingNotes('peach & cream')).toEqual(['Peach', 'Cream']);
  });
  it('drops empty fragments and overly long ones', () => {
    expect(splitTastingNotes('honey,, , this is way too long to be a tasting note really'))
      .toEqual(['Honey']);
  });
  it('normalizes casing — lowercase, ALL CAPS, and mixed all become Title Case', () => {
    expect(splitTastingNotes('blueberry, DARK CHOCOLATE, CARAMEL'))
      .toEqual(['Blueberry', 'Dark Chocolate', 'Caramel']);
  });
  it('returns empty for null/empty input', () => {
    expect(splitTastingNotes(null)).toEqual([]);
    expect(splitTastingNotes('')).toEqual([]);
  });
});
