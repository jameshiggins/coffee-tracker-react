/**
 * Shapes returned by the Laravel API (coffee-tracker-laravel). One source of
 * truth for the directory data so TypeScript modules can import these instead
 * of re-deriving field names ad hoc.
 *
 * Mirrors the controllers' `transform*()` output exactly:
 *   - RoasterApiController::transformRoaster / stats
 *   - CoffeeApiController::transform
 *   - TastingController::transform / publicForCoffee
 *
 * All fields are nullable exactly where the API can emit null. Keep this in
 * sync when an endpoint's payload changes.
 */

/** Which cascade step produced a roaster's resolved address (null = city-centroid placeholder). */
export type AddressSource = 'jsonld' | 'website' | 'osm' | 'google' | 'manual';

/** Coarse outcome of a roaster's most recent import (error detail stays admin-only). */
export type ImportStatus = 'success' | 'empty' | 'error';

/** A purchasable bag size for a coffee. */
export interface CoffeeVariant {
  id: number;
  bag_weight_grams: number | null;
  /** Present on the directory/roaster payloads; omitted by the coffee-detail endpoint. */
  source_size_label?: string | null;
  price: number;
  currency_code: string;
  in_stock: boolean;
  purchase_link: string | null;
  price_per_gram: number | null;
  cents_per_gram: number | null;
}

/** Aggregate public-tasting rating for a coffee (internal scale is 1–10). */
export interface CoffeeRating {
  count: number;
  /** Mean rating on the raw 1–10 scale, rounded to 1 dp. */
  average: number | null;
  /** Mean rating mapped to a 1–5 star scale (average / 2). */
  average_stars: number | null;
}

/**
 * A coffee as embedded in a roaster payload. The standalone coffee-detail
 * endpoint returns a near-identical object but omits the directory-only
 * aggregates (`elevation_meters`, `best_price_per_gram`, `default_variant`).
 */
export interface Coffee {
  id: number;
  name: string;
  origin: string | null;
  process: string | null;
  roast_level: string | null;
  varietal: string | null;
  elevation_meters?: number | null;
  tasting_notes: string | null;
  description: string | null;
  product_url: string | null;
  image_url: string | null;
  is_blend: boolean;
  is_removed: boolean;
  best_price_per_gram?: number | null;
  default_variant?: CoffeeVariant | null;
  variants: CoffeeVariant[];
  rating: CoffeeRating;
}

/**
 * A roaster row from `GET /roasters` (list) or `GET /roasters/{slug}` (detail).
 * `description` is null in the list response and populated in the detail one.
 */
export interface Roaster {
  id: number;
  slug: string;
  name: string;
  city: string | null;
  region: string | null;
  country_code: string | null;
  street_address: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  address_source: AddressSource | null;
  is_online_only: boolean;
  ships_to: string[];
  website: string | null;
  instagram: string | null;
  favicon_url: string | null;
  description: string | null;
  has_shipping: boolean;
  shipping_cost: number | null;
  free_shipping_over: number | null;
  shipping_notes: string | null;
  has_subscription: boolean;
  subscription_notes: string | null;
  last_imported_at: string | null;
  last_import_status: ImportStatus | null;
  coffees: Coffee[];
  best_price_per_gram: number | null;
  coffees_count: number;
  variants_count: number;
}

/** `GET /roasters` envelope. */
export interface RoastersResponse {
  roasters: Roaster[];
}

/** `GET /coffees/{id}` envelope. */
export interface CoffeeResponse {
  coffee: Coffee & {
    roaster: Pick<
      Roaster,
      'id' | 'name' | 'slug' | 'city' | 'region' | 'country_code' | 'website'
    >;
  };
}

/** `GET /stats` — directory coverage + freshness summary (Trust#1). */
export interface DirectoryStats {
  roasters_total: number;
  coffees_total: number;
  last_imported_at: string | null;
  freshness: {
    fresh: number;
    stale: number;
    never: number;
    fresh_within_days: number;
  };
  map_coverage: {
    located: number;
    online_only: number;
    unplaced: number;
  };
}

/** Frozen snapshot of a coffee at the moment a tasting was recorded. */
export interface CoffeeSnapshot {
  name: string | null;
  origin: string | null;
  process: string | null;
  roast_level: string | null;
  varietal: string | null;
  is_blend: boolean;
  [key: string]: unknown;
}

/** The authoring user's own tasting (`GET /tastings`, `POST/PUT /tastings`). */
export interface Tasting {
  id: number;
  coffee_id: number;
  coffee: {
    id: number;
    name: string;
    image_url: string | null;
    is_removed: boolean;
    roaster: { name: string; slug: string };
  } | null;
  coffee_snapshot: CoffeeSnapshot | null;
  coffee_changed: boolean;
  rating: number | null;
  notes: string | null;
  brew_method: string | null;
  /** ISO date (YYYY-MM-DD). */
  tasted_on: string;
  is_public: boolean;
}

/** A public author reference attached to a public tasting. */
export interface PublicTastingUser {
  id: number;
  display_name: string | null;
  avatar_url: string | null;
}

/** A public tasting from `GET /coffees/{id}/tastings`. */
export interface PublicTasting {
  id: number;
  rating: number | null;
  notes: string | null;
  brew_method: string | null;
  /** ISO date (YYYY-MM-DD). */
  tasted_on: string;
  user: PublicTastingUser;
}

/** `GET /me` — the signed-in user. */
export interface AuthUser {
  id: number;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
}

/** A wishlist row (`GET /wishlist`). */
export interface WishlistEntry {
  coffee_id: number;
  coffee: Coffee & { roaster: Pick<Roaster, 'id' | 'name' | 'slug'> };
  is_removed: boolean;
}
