export function originCountry(origin) {
  if (!origin) return null;
  const c = origin.split(/[,/]/)[0].trim();
  return c || null;
}

export function tastingTokens(notes) {
  if (!notes) return [];
  return notes
    .toLowerCase()
    .split(/[,;/]| and /)
    .map((s) => s.trim())
    .filter((s) => s.length > 1 && s.length < 40);
}

export function flattenBeans(roasters) {
  const beans = [];
  for (const r of roasters) {
    for (const c of r.coffees) {
      const def = c.default_variant ?? c.variants[0];
      beans.push({
        ...c,
        roaster: r,
        country: originCountry(c.origin),
        roaster_country: r.country_code || null,
        roaster_region: r.region || null,
        tokens: tastingTokens(c.tasting_notes),
        default_variant: def,
      });
    }
  }
  return beans;
}

export function uniqueSorted(arr) {
  return Array.from(new Set(arr.filter(Boolean))).sort();
}
