// 1 lb = 453.592 g; 1 oz = 28.3495 g.
const G_PER_LB = 453.592;
const G_PER_OZ = 28.3495;

export function gramsToPounds(grams) {
  if (!grams || grams <= 0) return 0;
  return Math.round((grams / G_PER_LB) * 100) / 100;
}

export function gramsToOunces(grams) {
  if (!grams || grams <= 0) return 0;
  return Math.round((grams / G_PER_OZ) * 10) / 10;
}

/**
 * "Clean" pound fractions — sizes that a shopper would actually say out
 * loud as a pound fraction ("a half-pound bag"). Anything outside this
 * set falls through to an ounce display because "0.66 lb" reads weird.
 *
 * Includes ¼ / ⅓ / ½ / ¾ / 1 / 2 / 5 lb. Excludes ⅔, 1.5, etc. — those
 * are used by some roasters but aren't familiar enough to warrant the
 * ambiguity (49th Parallel's 10.6 oz happens to land at 2/3 lb but they
 * call it 10.6 oz, so the oz display matches their own label).
 */
const CLEAN_LB_SIZES = [
  { grams: 113, label: '¼ lb' },
  { grams: 151, label: '⅓ lb' },
  { grams: 227, label: '½ lb' },
  { grams: 340, label: '¾ lb' },
  { grams: 454, label: '1 lb' },
  { grams: 907, label: '2 lb' },
  { grams: 2268, label: '5 lb' },
];
const LB_MATCH_TOLERANCE_G = 5;  // accept 339-345g as "¾ lb", etc.

/** Return the matching clean-lb label for this gram count, or null. */
export function cleanPoundLabel(grams) {
  if (!grams || grams <= 0) return null;
  const hit = CLEAN_LB_SIZES.find((s) => Math.abs(s.grams - grams) <= LB_MATCH_TOLERANCE_G);
  return hit ? hit.label : null;
}

/**
 * Always show grams. Then append either a clean lb fraction (¼/⅓/½/¾/1/2/5)
 * when the grams land near one of those, OR an ounce value otherwise.
 *
 *   113g  → "113g · ¼ lb"
 *   227g  → "227g · ½ lb"
 *   340g  → "340g · ¾ lb"
 *   250g  → "250g · 8.8 oz"
 *   301g  → "301g · 10.6 oz"   (49th Parallel's signature size)
 *   1000g → "1000g · 35.3 oz"  (1 kg, no clean lb match)
 */
export function formatBagWeight(grams) {
  if (!grams || grams <= 0) return '—';
  const lb = cleanPoundLabel(grams);
  if (lb) return `${grams}g · ${lb}`;
  return `${grams}g · ${gramsToOunces(grams)} oz`;
}

/**
 * Does this source-side variant label already include the gram count?
 * "100 g tin" + 100 → true; "Tin" + 100 → false. Used by BeanCard to
 * avoid rendering "100 g tin (100g)" with a redundant parenthetical.
 *
 * Tolerates whitespace ("100 g") and casing ("100G"). Does NOT match
 * a digit substring without a g/gram unit, so "10 oz" + 100 stays false.
 */
export function labelContainsGrams(label, grams) {
  if (!label || !grams) return false;
  // \b<grams>\s*(g|gram|grams)\b — case-insensitive.
  const re = new RegExp(`\\b${grams}\\s*g(?:ram(?:s)?)?\\b`, 'i');
  return re.test(label);
}
