// Province + territory bounding boxes for Canada.
// Used by MapPage to fitBounds() the map to a province on first load
// (driven by IP geolocation) or when the user picks one from the sidebar.
//
// Bounds are [[swLat, swLng], [neLat, neLng]] — Leaflet's LatLngBounds shape.

export const PROVINCE_BOUNDS = {
  BC: { name: 'British Columbia',          bounds: [[48.3, -139.1], [60.0, -114.0]] },
  AB: { name: 'Alberta',                   bounds: [[49.0, -120.0], [60.0, -110.0]] },
  SK: { name: 'Saskatchewan',              bounds: [[49.0, -110.0], [60.0, -101.4]] },
  MB: { name: 'Manitoba',                  bounds: [[49.0, -101.4], [60.0,  -89.0]] },
  ON: { name: 'Ontario',                   bounds: [[41.7,  -95.2], [56.9,  -74.3]] },
  QC: { name: 'Quebec',                    bounds: [[45.0,  -79.8], [62.6,  -57.1]] },
  NB: { name: 'New Brunswick',             bounds: [[44.6,  -69.1], [48.1,  -63.8]] },
  NS: { name: 'Nova Scotia',               bounds: [[43.4,  -66.4], [47.0,  -59.7]] },
  PE: { name: 'Prince Edward Island',      bounds: [[45.9,  -64.4], [47.1,  -61.9]] },
  NL: { name: 'Newfoundland and Labrador', bounds: [[46.6,  -67.8], [60.4,  -52.6]] },
  YT: { name: 'Yukon',                     bounds: [[60.0, -141.0], [69.7, -123.8]] },
  NT: { name: 'Northwest Territories',     bounds: [[60.0, -136.5], [78.8, -102.0]] },
  NU: { name: 'Nunavut',                   bounds: [[60.0, -120.0], [83.0,  -56.0]] },
};

// Whole country, used as the fallback when no province match is possible.
export const CANADA_BOUNDS = [[42.0, -141.0], [83.0, -52.0]];

// Aliases — the seed data sometimes stores the full name ("Quebec",
// "British Columbia") and sometimes the postal code. Normalize on read.
const NAME_TO_CODE = {
  'British Columbia': 'BC',
  'Alberta': 'AB',
  'Saskatchewan': 'SK',
  'Manitoba': 'MB',
  'Ontario': 'ON',
  'Quebec': 'QC',
  'Québec': 'QC',
  'New Brunswick': 'NB',
  'Nova Scotia': 'NS',
  'Prince Edward Island': 'PE',
  'Newfoundland and Labrador': 'NL',
  'Newfoundland': 'NL',
  'Yukon': 'YT',
  'Northwest Territories': 'NT',
  'Nunavut': 'NU',
};

/**
 * Normalize a region string ("British Columbia", "BC", "Quebec") to a
 * 2-letter province/territory code. Returns the input unchanged if it's
 * already a known code, or null if unrecognized.
 */
export function provinceCodeForName(region) {
  if (!region) return null;
  if (PROVINCE_BOUNDS[region]) return region;
  return NAME_TO_CODE[region] || null;
}

/**
 * Returns the province code whose bounding box contains the given lat/lng,
 * or null. Provinces are checked in population order so the more-likely
 * answer wins when bboxes overlap (Ontario and Quebec both stretch north
 * into territory near Hudson Bay, etc.).
 */
export function provinceForLatLng(lat, lng) {
  if (lat == null || lng == null) return null;
  const order = ['ON', 'QC', 'BC', 'AB', 'MB', 'SK', 'NS', 'NB', 'NL', 'PE', 'YT', 'NT', 'NU'];
  for (const code of order) {
    const [[swLat, swLng], [neLat, neLng]] = PROVINCE_BOUNDS[code].bounds;
    if (lat >= swLat && lat <= neLat && lng >= swLng && lng <= neLng) return code;
  }
  return null;
}
