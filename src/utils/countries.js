// ISO 3166-1 alpha-2 → display name. Limited to countries we currently seed; extend as needed.
export const COUNTRY_NAMES = {
  AU: 'Australia',
  CA: 'Canada',
  DE: 'Germany',
  DK: 'Denmark',
  GB: 'United Kingdom',
  JP: 'Japan',
  NL: 'Netherlands',
  NO: 'Norway',
  SE: 'Sweden',
  US: 'United States',
};

export function countryName(code) {
  if (!code) return 'Unknown';
  return COUNTRY_NAMES[code] || code;
}

// Convert a 2-letter country code to its flag emoji (regional indicator letters).
export function countryFlag(code) {
  if (!code || code.length !== 2) return '🏳️';
  const A = 0x1F1E6;
  const charA = 'A'.charCodeAt(0);
  return String.fromCodePoint(
    A + (code.charCodeAt(0) - charA),
    A + (code.charCodeAt(1) - charA)
  );
}
