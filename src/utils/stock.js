/**
 * A coffee is "in stock" if at least one of its variants is currently
 * available for purchase. Use this everywhere that needs to decide
 * whether to surface a coffee as buyable.
 */
export function isCoffeeInStock(coffee) {
  const variants = coffee?.variants ?? [];
  return variants.some((v) => v?.in_stock === true);
}

/**
 * Given a roaster, derive how many of its coffees are currently buyable.
 * Used by IndexPage when the show-out-of-stock toggle is OFF.
 */
export function inStockCount(roaster) {
  return (roaster?.coffees ?? []).filter(isCoffeeInStock).length;
}
