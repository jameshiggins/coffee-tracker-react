// Bean thumbnails render at 80–128px but the stored image_url is the full-size
// storefront original — often multi-megabyte. Shopify and Squarespace CDNs both
// resize on the fly via a query param, so ask them for a thumbnail-sized image.
// Any other host (or a malformed URL) passes through UNCHANGED — we never risk
// breaking an image we don't understand, and the card's onError already hides
// a thumbnail that fails to load.
//
// `width` is the CSS pixel size; pass a 2x value for retina crispness.
export function thumbnailUrl(url, width = 200) {
  if (!url || typeof url !== 'string') return url;
  let u;
  try {
    u = new URL(url);
  } catch {
    return url; // relative or malformed — leave it
  }
  const host = u.hostname.toLowerCase();

  // Shopify: cdn.shopify.com, *.myshopify.com, *.shopifycdn.com — ?width=N.
  if (/(^|\.)shopify\.com$|(^|\.)myshopify\.com$|(^|\.)shopifycdn\.com$/.test(host)) {
    u.searchParams.set('width', String(width));
    return u.toString();
  }

  // Squarespace: images.squarespace-cdn.com, *.squarespace.com — ?format=Nw.
  if (/(^|\.)squarespace-cdn\.com$|(^|\.)squarespace\.com$/.test(host)) {
    u.searchParams.set('format', `${width}w`);
    return u.toString();
  }

  return url;
}
