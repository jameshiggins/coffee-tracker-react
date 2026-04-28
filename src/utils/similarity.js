/**
 * Score how similar `candidate` is to `seed` for the "Find similar" feature.
 * Pure function — no side effects, no DOM, easy to unit-test.
 *
 * Per Q5: AND-style exact-match filters returned near-zero results because
 * few beans share all four facets. Overlap-score: each matching dimension
 * contributes points; we sum and rank descending.
 *
 * Weights tuned to surface meaningful matches first:
 *   - country         +3  (origin is the strongest similarity signal)
 *   - varietal        +3  (Pink Bourbon vs Heirloom is a personality choice)
 *   - process         +2  (washed vs natural is a flavor profile choice)
 *   - roast_level     +2  (light vs dark fundamentally changes the cup)
 *   - same blend kind +1  (single-origin lovers stick with single-origin)
 *   - tasting tokens  +1 each, capped at +5 (avoid runaway scores from
 *     beans with 20-word descriptions)
 *
 * Returns the composite numeric score and an array of human-readable
 * "matches:" labels for the UI caption.
 */
export function similarityScore(seed, candidate) {
  if (!seed || !candidate || seed.id === candidate.id) {
    return { score: -1, matches: [] };
  }

  let score = 0;
  const matches = [];

  if (seed.country && candidate.country && seed.country === candidate.country) {
    score += 3;
    matches.push(seed.country);
  }
  if (seed.varietal && candidate.varietal && seed.varietal === candidate.varietal) {
    score += 3;
    matches.push(seed.varietal);
  }
  if (seed.process && candidate.process && seed.process === candidate.process) {
    score += 2;
    matches.push(seed.process);
  }
  if (seed.roast_level && candidate.roast_level && seed.roast_level === candidate.roast_level) {
    score += 2;
    matches.push(`${seed.roast_level} roast`);
  }
  if (seed.is_blend === candidate.is_blend && (seed.is_blend || candidate.is_blend !== undefined)) {
    score += 1;
    // No caption — same blend-kind is too implicit for the chip row.
  }

  const seedTokens = new Set(seed.tokens ?? []);
  const sharedTokens = (candidate.tokens ?? []).filter((t) => seedTokens.has(t));
  if (sharedTokens.length > 0) {
    score += Math.min(sharedTokens.length, 5);
    matches.push(...sharedTokens.slice(0, 3));
  }

  return { score, matches };
}

/**
 * Rank an array of beans by similarity to `seed`, descending. Returns the top
 * `limit` candidates with their score + matches attached. Beans that share
 * nothing (score 0) are omitted.
 */
export function findSimilarBeans(seed, candidates, limit = 12) {
  if (!seed) return [];
  return candidates
    .map((b) => ({ ...b, ...similarityScore(seed, b) }))
    .filter((b) => b.score > 0)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, limit);
}
