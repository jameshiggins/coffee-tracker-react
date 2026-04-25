// 1 lb = 453.592 g; round to 2 decimals so common sizes look clean
// (340g → "0.75 lb", 454g → "1.00 lb", 1000g → "2.20 lb").
const G_PER_LB = 453.592;

export function gramsToPounds(grams) {
  if (!grams || grams <= 0) return 0;
  return Math.round((grams / G_PER_LB) * 100) / 100;
}

export function formatBagWeight(grams) {
  if (!grams || grams <= 0) return '—';
  const lb = gramsToPounds(grams);
  return `${grams}g · ${lb.toFixed(2)} lb`;
}
