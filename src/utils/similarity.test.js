import { describe, it, expect } from 'vitest';
import { similarityScore, findSimilarBeans } from './similarity.js';

const ethiopia = {
  id: 1, name: 'Ethiopia Yirgacheffe', country: 'Ethiopia',
  varietal: 'Heirloom', process: 'natural', roast_level: 'light',
  is_blend: false, tokens: ['blueberry', 'jasmine', 'lemon'],
};

describe('similarityScore', () => {
  it('returns -1 when comparing a bean to itself', () => {
    expect(similarityScore(ethiopia, ethiopia).score).toBe(-1);
  });

  it('scores 0 for unrelated beans', () => {
    const sumatra = {
      id: 2, country: 'Indonesia', varietal: null,
      process: 'wet-hulled', roast_level: 'dark', is_blend: false, tokens: ['earthy'],
    };
    // No overlap on country/varietal/process/roast/tokens. Same is_blend → +1.
    expect(similarityScore(ethiopia, sumatra).score).toBe(1);
  });

  it('scores high for a bean sharing country + process + roast', () => {
    const otherEth = {
      id: 3, country: 'Ethiopia', varietal: null,
      process: 'natural', roast_level: 'light', is_blend: false, tokens: [],
    };
    // country +3, process +2, roast +2, same blend +1 = 8
    expect(similarityScore(ethiopia, otherEth).score).toBe(8);
  });

  it('caps tasting-token contribution at +5', () => {
    const flavorTwin = {
      id: 4, country: null, varietal: null, process: null, roast_level: null,
      is_blend: false,
      tokens: ['blueberry', 'jasmine', 'lemon', 'rose', 'peach', 'wine', 'apricot'],
    };
    // shared with seed: blueberry, jasmine, lemon = 3 tokens. Plus same blend +1.
    expect(similarityScore(ethiopia, flavorTwin).score).toBe(4);

    // Six shared tokens should still cap at 5 (+ same blend = 6).
    const allShared = { ...flavorTwin, tokens: ethiopia.tokens.concat(['x','y','z','q','r','s']) };
    // wait — only ethiopia.tokens (3) are shared. Let's craft 6 shared:
    const sixSeed = { ...ethiopia, tokens: ['a','b','c','d','e','f','g'] };
    const sixCand = { id: 5, is_blend: false, tokens: ['a','b','c','d','e','f','x','y'] };
    expect(similarityScore(sixSeed, sixCand).score).toBe(6); // capped at 5 + same blend +1
  });

  it('returns matches array describing the overlap', () => {
    const cousin = {
      id: 6, country: 'Ethiopia', varietal: 'Heirloom',
      process: 'washed', roast_level: 'light', is_blend: false, tokens: [],
    };
    const result = similarityScore(ethiopia, cousin);
    expect(result.matches).toContain('Ethiopia');
    expect(result.matches).toContain('Heirloom');
    expect(result.matches).toContain('light roast');
  });
});

describe('findSimilarBeans', () => {
  const candidates = [
    { id: 2, name: 'Ethiopia Guji', country: 'Ethiopia', varietal: 'Heirloom',
      process: 'natural', roast_level: 'light', is_blend: false, tokens: ['blueberry'] },
    { id: 3, name: 'Sumatra Mandheling', country: 'Indonesia', varietal: null,
      process: 'wet-hulled', roast_level: 'dark', is_blend: false, tokens: ['earthy'] },
    { id: 4, name: 'House Blend', country: null, varietal: null,
      process: null, roast_level: 'medium', is_blend: true, tokens: [] },
  ];

  it('omits the seed bean itself from results', () => {
    const result = findSimilarBeans(ethiopia, [ethiopia, ...candidates]);
    expect(result.find((b) => b.id === ethiopia.id)).toBeUndefined();
  });

  it('returns matches sorted by score descending', () => {
    const result = findSimilarBeans(ethiopia, candidates);
    // Ethiopia Guji shares country + varietal + process + roast + token = 11
    expect(result[0].id).toBe(2);
    expect(result[0].score).toBeGreaterThan(result[result.length - 1].score);
  });

  it('omits beans with score 0', () => {
    const seedAlone = { id: 99, country: 'Mars', varietal: null, process: null,
      roast_level: null, is_blend: undefined, tokens: [] };
    // Nothing matches; nothing returned.
    expect(findSimilarBeans(seedAlone, candidates)).toHaveLength(0);
  });

  it('respects limit parameter', () => {
    expect(findSimilarBeans(ethiopia, candidates, 1)).toHaveLength(1);
  });
});
