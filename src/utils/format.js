// Centralized human-facing date + currency formatting (design review:
// hand-rolled formats had drifted across 7 call sites, and raw ISO dates
// line-break at their hyphens inside narrow mobile columns).

const dateFmt = new Intl.DateTimeFormat('en-CA', { dateStyle: 'medium' });

/**
 * "2026-06-17" → "Jun 17, 2026".
 *
 * Parses the Y-M-D parts as a LOCAL date on purpose: `new Date('2026-06-17')`
 * is UTC midnight, which renders as the previous day in every western
 * timezone — the classic off-by-one. Non-date input passes through untouched.
 */
export function formatDate(isoDate) {
  if (!isoDate) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(isoDate));
  if (!m) return String(isoDate);
  return dateFmt.format(new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
}

const cadCents = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' });
const cadWhole = new Intl.NumberFormat('en-CA', {
  style: 'currency', currency: 'CAD', minimumFractionDigits: 0, maximumFractionDigits: 0,
});

/** 24.5 → "$24.50" (or "$25" with {cents:false}). Nullish/non-numeric → ''. */
export function formatCAD(amount, { cents = true } = {}) {
  // Number(null) is 0, not NaN — guard nullish/empty explicitly so a missing
  // price renders as nothing rather than "$0.00".
  if (amount === null || amount === undefined || amount === '') return '';
  const n = Number(amount);
  if (!Number.isFinite(n)) return '';
  return (cents ? cadCents : cadWhole).format(n);
}
