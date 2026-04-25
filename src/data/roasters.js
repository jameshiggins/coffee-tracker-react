import { slugify } from '../utils/coffee.js';

const raw = [
  {
    name: 'Fernwood Coffee Company', region: 'Victoria', city: 'Victoria',
    website: 'https://fernwoodcoffee.com', has_shipping: true, is_active: true,
    coffees: [
      { name: 'Ethiopian Yirgacheffe', origin: 'Ethiopia, Yirgacheffe', bag_weight_grams: 340, price: 22.50, purchase_link: 'https://fernwoodcoffee.com', in_stock: true },
    ],
  },
  {
    name: 'Bows & Arrows', region: 'Victoria', city: 'Victoria',
    website: 'https://bowsandarrows.ca', has_shipping: true, has_subscription: true,
    subscription_notes: 'Bi-weekly or monthly, pick your roast preference', is_active: true,
    coffees: [
      { name: 'Colombian Huila', origin: 'Colombia, Huila', process: 'washed', roast_level: 'light', bag_weight_grams: 340, price: 26.00, purchase_link: 'https://bowsandarrows.ca', in_stock: true },
    ],
  },
  {
    name: 'Drumroaster', region: 'Victoria', city: 'Victoria',
    website: 'https://drumroaster.com', has_shipping: true, is_active: true,
    coffees: [
      { name: 'Guatemala Antigua', origin: 'Guatemala, Antigua', process: 'washed', bag_weight_grams: 340, price: 24.00, purchase_link: 'https://drumroaster.com', in_stock: true },
    ],
  },
  {
    name: 'Discovery Coffee', region: 'Victoria', city: 'Victoria',
    website: 'https://discoverycoffee.com', has_shipping: true, has_subscription: true,
    subscription_notes: 'Choose frequency, size, and your preferred roast profile', is_active: true,
    coffees: [
      { name: 'Ethiopia Worka Chelbesa', origin: 'Ethiopia, Gedeo', process: 'washed', roast_level: 'light', varietal: 'Heirloom', tasting_notes: 'Peach, nectarine, floral', bag_weight_grams: 250, price: 24.00, in_stock: true },
      { name: 'Mexico Oaxaca', origin: 'Mexico, Oaxaca', process: 'natural', roast_level: 'medium', bag_weight_grams: 250, price: 19.00, in_stock: true },
    ],
  },
  {
    name: 'Oso Negro Coffee', region: 'Interior', city: 'Nelson',
    website: 'https://osonegrocoffee.com', has_shipping: true, is_active: true,
    coffees: [
      { name: 'Costa Rican Tarrazú', origin: 'Costa Rica, Tarrazú', process: 'washed', bag_weight_grams: 340, price: 26.50, purchase_link: 'https://osonegrocoffee.com', in_stock: true },
    ],
  },
  {
    name: 'Seven Summits Coffee', region: 'Interior', city: 'Rossland',
    website: 'https://sevensummitscoffee.com', has_shipping: true, is_active: true,
    coffees: [
      { name: 'Kenyan AA', origin: 'Kenya', process: 'washed', bag_weight_grams: 340, price: 25.00, purchase_link: 'https://sevensummitscoffee.com', in_stock: true },
    ],
  },
  {
    name: 'Side Door Coffee', region: 'Interior', city: 'Prince George',
    has_shipping: false, is_active: true,
    coffees: [
      { name: 'Ethiopia Yirgacheffe', origin: 'Ethiopia, Yirgacheffe', process: 'washed', roast_level: 'light', bag_weight_grams: 250, price: 21.00, in_stock: true },
      { name: 'House Dark', origin: 'Brazil / Colombia', roast_level: 'dark', bag_weight_grams: 340, price: 18.00, in_stock: true },
    ],
  },
  {
    name: 'Anarchy Coffee Roasters', region: 'Okanagan', city: 'Penticton',
    website: 'https://anarchycoffee.ca', has_shipping: true, is_active: true,
    coffees: [
      { name: 'Brazilian Santos', origin: 'Brazil, Santos', process: 'natural', bag_weight_grams: 340, price: 21.00, purchase_link: 'https://anarchycoffee.ca', in_stock: true },
    ],
  },
  {
    name: 'Moja Coffee', region: 'Okanagan', city: 'Kelowna',
    website: 'https://mojacoffee.com', has_shipping: true, is_active: true,
    coffees: [
      { name: 'Ethiopian Single Origin', origin: 'Ethiopia, Guji Shakiso', process: 'natural', roast_level: 'light', varietal: 'Heirloom', tasting_notes: 'Strawberry jam, lemon verbena, wine', bag_weight_grams: 340, price: 16.50, purchase_link: 'https://mojacoffee.com', in_stock: true },
      { name: 'Rwanda Huye Mountain', origin: 'Rwanda, Huye District', process: 'washed', roast_level: 'light', bag_weight_grams: 250, price: 22.00, in_stock: true },
    ],
  },
  {
    name: 'Agro Roasters', region: 'Vancouver', city: 'Vancouver',
    website: 'https://agroroasters.com', has_shipping: true, has_subscription: true,
    subscription_notes: 'Monthly rotation of seasonal single-origins', is_active: true,
    coffees: [
      { name: 'Single Origin Blend', origin: 'Multi-origin', bag_weight_grams: 340, price: 17.00, purchase_link: 'https://agroroasters.com', in_stock: true },
      { name: 'Ethiopia Guji', origin: 'Ethiopia, Guji', process: 'natural', roast_level: 'light', varietal: 'Heirloom', tasting_notes: 'Blueberry, hibiscus, dark chocolate', bag_weight_grams: 250, price: 24.00, in_stock: true },
    ],
  },
  {
    name: 'Timbertrain', region: 'Vancouver', city: 'Vancouver',
    website: 'https://timbertrain.ca', has_shipping: true, has_subscription: true,
    subscription_notes: 'Monthly subscription with curated seasonal selections', is_active: true,
    coffees: [
      { name: 'Colombian Supremo', origin: 'Colombia', process: 'washed', roast_level: 'medium', bag_weight_grams: 340, price: 21.50, purchase_link: 'https://timbertrain.ca', in_stock: true },
    ],
  },
  {
    name: 'Matchstick', region: 'Vancouver', city: 'Vancouver',
    website: 'https://matchstickyvr.com', has_shipping: true, is_active: true,
    coffees: [
      { name: 'Guatemala Huehuetenango', origin: 'Guatemala, Huehuetenango', process: 'washed', roast_level: 'light', bag_weight_grams: 340, price: 21.00, purchase_link: 'https://matchstickyvr.com', in_stock: true },
    ],
  },
  {
    name: 'Pallet', region: 'Vancouver', city: 'Vancouver',
    website: 'https://palletcoffee.com', has_shipping: true, has_subscription: true, is_active: true,
    coffees: [
      { name: 'Premium Single Origin', origin: 'Colombia', process: 'washed', roast_level: 'light', bag_weight_grams: 340, price: 27.50, purchase_link: 'https://palletcoffee.com', in_stock: true },
    ],
  },
  {
    name: 'Nemesis', region: 'Vancouver', city: 'Vancouver',
    website: 'https://nemesiscoffee.ca', has_shipping: true, is_active: true,
    coffees: [
      { name: 'Specialty Single Origin', origin: 'Ethiopia', process: 'natural', roast_level: 'light', bag_weight_grams: 340, price: 27.50, purchase_link: 'https://nemesiscoffee.ca', in_stock: true },
    ],
  },
  {
    name: 'Modus', region: 'Vancouver', city: 'Vancouver',
    website: 'https://moduscoffee.com', has_shipping: true, is_active: true,
    coffees: [
      { name: 'Artisan Single Origin', origin: 'Honduras', process: 'honey', roast_level: 'medium', bag_weight_grams: 340, price: 22.00, purchase_link: 'https://moduscoffee.com', in_stock: true },
    ],
  },
  {
    name: 'Hey Happy', region: 'Vancouver', city: 'Vancouver',
    website: 'https://heyhappycoffee.com', has_shipping: true, is_active: true,
    coffees: [
      { name: 'Signature Single Origin', origin: 'Ethiopia', process: 'washed', roast_level: 'light', bag_weight_grams: 340, price: 24.00, purchase_link: 'https://heyhappycoffee.com', in_stock: true },
    ],
  },
  {
    name: 'JJ Bean', region: 'Vancouver', city: 'Vancouver',
    website: 'https://jjbean.ca', has_shipping: true, has_subscription: true,
    subscription_notes: 'Subscribe and save 10%, choose your cadence', is_active: true,
    coffees: [
      { name: 'Organic Single Origin', origin: 'Peru', process: 'washed', roast_level: 'medium', bag_weight_grams: 340, price: 24.50, purchase_link: 'https://jjbean.ca', in_stock: true },
      { name: 'East Van Espresso', origin: 'Brazil / Colombia blend', process: 'washed', roast_level: 'medium', tasting_notes: 'Chocolate, hazelnut, caramel finish', bag_weight_grams: 340, price: 21.00, in_stock: true },
    ],
  },
  {
    name: '49th Parallel', region: 'Vancouver', city: 'Vancouver',
    website: 'https://49thcoffee.com', has_shipping: true, has_subscription: true, is_active: true,
    coffees: [
      { name: 'Single Origin Reserve', origin: 'Guatemala', process: 'washed', roast_level: 'light', bag_weight_grams: 340, price: 25.00, purchase_link: 'https://49thcoffee.com', in_stock: true },
    ],
  },
  {
    name: 'Kea Coffee', region: 'Vancouver', city: 'Vancouver',
    website: 'https://keacoffee.com', has_shipping: true, is_active: true,
    coffees: [
      { name: 'Hawaiian Kona Style', origin: 'Hawaii / Multi-origin', bag_weight_grams: 300, price: 25.00, purchase_link: 'https://keacoffee.com', in_stock: true },
    ],
  },
  {
    name: 'Prototype', region: 'Vancouver', city: 'Vancouver',
    website: 'https://prototypecoffee.com', has_shipping: true, has_subscription: true,
    subscription_notes: 'Monthly single-origin drops, always fresh-roasted', is_active: true,
    coffees: [
      { name: 'Experimental Single Origin', origin: 'Colombia, Nariño', process: 'washed', roast_level: 'light', varietal: 'Pink Bourbon', tasting_notes: 'Raspberry, rose, citrus zest', bag_weight_grams: 340, price: 23.00, purchase_link: 'https://prototypecoffee.com', in_stock: true },
    ],
  },
  {
    name: 'Moving Coffee', region: 'Vancouver', city: 'Vancouver',
    website: 'https://movingcoffee.com', has_shipping: true, is_active: true,
    coffees: [
      { name: 'Micro-lot Single Origin', origin: 'Kenya', process: 'washed', roast_level: 'light', bag_weight_grams: 340, price: 28.00, purchase_link: 'https://movingcoffee.com', in_stock: true },
    ],
  },
  {
    name: 'East Van Roasters', region: 'Vancouver', city: 'Vancouver',
    website: 'https://eastvanroasters.com', has_shipping: true, is_active: true,
    coffees: [
      { name: 'Local Single Origin', origin: 'Colombia', process: 'washed', roast_level: 'medium', bag_weight_grams: 340, price: 22.00, purchase_link: 'https://eastvanroasters.com', in_stock: true },
    ],
  },
  {
    name: 'Rocanini', region: 'Vancouver', city: 'Vancouver',
    website: 'https://rocanini.com', has_shipping: true, is_active: true,
    coffees: [
      { name: 'Italian Style Single Origin', origin: 'Brazil', process: 'natural', roast_level: 'medium-dark', bag_weight_grams: 340, price: 24.00, purchase_link: 'https://rocanini.com', in_stock: true },
    ],
  },
  {
    name: 'Origins Organic', region: 'Vancouver', city: 'Vancouver',
    website: 'https://originsorganic.com', has_shipping: true, is_active: true,
    coffees: [
      { name: 'Certified Organic Single Origin', origin: 'Peru', process: 'washed', roast_level: 'medium', bag_weight_grams: 340, price: 26.00, purchase_link: 'https://originsorganic.com', in_stock: true },
    ],
  },
  {
    name: 'Salt Spring Coffee', region: 'Vancouver', city: 'Salt Spring Island',
    website: 'https://saltspringcoffee.com', has_shipping: true, has_subscription: true, is_active: true,
    coffees: [
      { name: 'Island Single Origin', origin: 'Sumatra', process: 'wet-hulled', roast_level: 'medium', bag_weight_grams: 340, price: 23.50, purchase_link: 'https://saltspringcoffee.com', in_stock: true },
    ],
  },
  {
    name: 'Luna Coffee', region: 'Vancouver', city: 'Vancouver',
    website: 'https://lunacoffee.ca', has_shipping: true, has_subscription: true, is_active: true,
    coffees: [
      { name: 'Subscription Single Origin', origin: 'Guatemala', process: 'washed', roast_level: 'light', bag_weight_grams: 340, price: 24.00, purchase_link: 'https://lunacoffee.ca', in_stock: true },
    ],
  },
  {
    name: 'Continuum Coffee', region: 'Vancouver', city: 'Vancouver',
    website: 'https://continuumcoffee.com', has_shipping: true, is_active: true,
    coffees: [
      { name: 'Premium Single Origin', origin: 'Ethiopia', process: 'natural', roast_level: 'light', bag_weight_grams: 340, price: 26.00, purchase_link: 'https://continuumcoffee.com', in_stock: true },
    ],
  },
  {
    name: 'West End Coffee Roasters', region: 'Vancouver', city: 'Vancouver',
    website: 'https://westendcoffee.ca', has_shipping: true, is_active: true,
    coffees: [
      { name: 'Jamaican Blue Mountain', origin: 'Jamaica, Blue Mountain', bag_weight_grams: 340, price: 35.00, purchase_link: 'https://westendcoffee.ca', in_stock: true },
    ],
  },
  {
    name: 'Foglifter Coffee Roasters', region: 'Vancouver', city: 'Vancouver',
    website: 'https://foglifter.ca', has_shipping: true, is_active: true,
    coffees: [
      { name: 'Mexican Chiapas', origin: 'Mexico, Chiapas', process: 'washed', roast_level: 'medium', bag_weight_grams: 340, price: 23.50, purchase_link: 'https://foglifter.ca', in_stock: true },
    ],
  },
];

export const roasters = raw.map((r, i) => ({
  id: i + 1,
  slug: slugify(r.name),
  has_shipping: false,
  has_subscription: false,
  is_active: true,
  ...r,
}));

export function findRoaster(slug) {
  return roasters.find((r) => r.slug === slug);
}

export function getAllCoffees() {
  return roasters
    .filter((r) => r.is_active)
    .flatMap((r) => r.coffees.map((c) => ({ ...c, roaster: r })));
}
