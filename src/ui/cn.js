/**
 * Tiny classnames helper — joins truthy string args with spaces.
 *
 * We deliberately don't pull in `clsx` or `tailwind-merge`; this is a 50-byte
 * function and the primitive layer doesn't need conditional-merge semantics.
 * If a primitive consumer passes a conflicting class via `className`, the LAST
 * class in the resulting string wins per CSS specificity — which is the
 * expected escape hatch (consumer override beats primitive default).
 */
export function cn(...parts) {
  return parts.filter(Boolean).join(' ');
}
