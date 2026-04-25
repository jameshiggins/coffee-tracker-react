export function pricePerGram(coffee) {
  if (!coffee.bag_weight_grams) return 0;
  return Math.round((coffee.price / coffee.bag_weight_grams) * 10000) / 10000;
}

export function centsPerGram(coffee) {
  if (!coffee.bag_weight_grams) return 0;
  return Math.round((coffee.price / coffee.bag_weight_grams) * 100 * 10) / 10;
}

export function slugify(name) {
  return name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}
