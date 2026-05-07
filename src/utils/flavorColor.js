/**
 * Map a tasting-note string to a Tailwind color class set, based on the
 * SCA Coffee Taster's Flavor Wheel categories. Each note matches the
 * first category whose keyword list contains a hit; falls back to a
 * neutral stone palette when nothing matches.
 *
 * Returns an object: { bg, text, border, ring } for use as Tailwind
 * classes on a chip element.
 */

const CATEGORIES = [
  // Floral — pink/rose
  {
    name: 'floral',
    bg: 'bg-pink-50',
    text: 'text-pink-800',
    border: 'border-pink-200',
    keywords: ['floral', 'jasmine', 'rose', 'rose petal', 'hibiscus', 'lavender',
               'chamomile', 'elderflower', 'orange blossom', 'honeysuckle', 'violet',
               'bergamot', 'perfume'],
  },
  // Berry / red fruit — red
  {
    name: 'berry',
    bg: 'bg-red-50',
    text: 'text-red-800',
    border: 'border-red-200',
    keywords: ['berry', 'blackberry', 'raspberry', 'strawberry', 'blueberry',
               'cranberry', 'cherry', 'red currant', 'pomegranate', 'red fruit',
               'red wine', 'rhubarb'],
  },
  // Stone fruit / orchard fruit — orange/peach
  {
    name: 'stone-fruit',
    bg: 'bg-orange-50',
    text: 'text-orange-800',
    border: 'border-orange-200',
    keywords: ['peach', 'apricot', 'plum', 'nectarine', 'mango', 'papaya',
               'apple', 'pear', 'quince'],
  },
  // Citrus — yellow
  {
    name: 'citrus',
    bg: 'bg-yellow-50',
    text: 'text-yellow-800',
    border: 'border-yellow-200',
    keywords: ['citrus', 'lemon', 'lime', 'orange', 'grapefruit', 'tangerine',
               'mandarin', 'yuzu', 'lemongrass', 'meyer lemon'],
  },
  // Tropical — fuchsia (avoid clashing with stone fruit orange)
  {
    name: 'tropical',
    bg: 'bg-fuchsia-50',
    text: 'text-fuchsia-800',
    border: 'border-fuchsia-200',
    keywords: ['tropical', 'pineapple', 'passion fruit', 'passionfruit', 'guava',
               'lychee', 'watermelon', 'melon', 'kiwi', 'banana', 'coconut'],
  },
  // Sweet / sugar / caramel — amber
  {
    name: 'sweet',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    keywords: ['caramel', 'butterscotch', 'toffee', 'honey', 'maple', 'molasses',
               'brown sugar', 'sugar', 'syrup', 'sweet', 'vanilla', 'marshmallow'],
  },
  // Chocolate / cocoa — brown (note: stone-200 is too light, using brown via amber-900 family)
  {
    name: 'chocolate',
    bg: 'bg-stone-100',
    text: 'text-stone-800',
    border: 'border-stone-300',
    keywords: ['chocolate', 'cocoa', 'cacao', 'dark chocolate', 'milk chocolate',
               'mocha', 'fudge'],
  },
  // Nutty — warm tan
  {
    name: 'nutty',
    bg: 'bg-orange-100',
    text: 'text-orange-900',
    border: 'border-orange-300',
    keywords: ['nut', 'nutty', 'almond', 'hazelnut', 'walnut', 'pecan', 'peanut',
               'cashew', 'praline'],
  },
  // Spices — deep red/brown
  {
    name: 'spice',
    bg: 'bg-rose-100',
    text: 'text-rose-900',
    border: 'border-rose-300',
    keywords: ['spice', 'cinnamon', 'clove', 'nutmeg', 'cardamom', 'pepper',
               'anise', 'allspice', 'ginger'],
  },
  // Herbal / vegetal — green
  {
    name: 'herbal',
    bg: 'bg-green-50',
    text: 'text-green-800',
    border: 'border-green-200',
    keywords: ['herbal', 'herbs', 'mint', 'basil', 'sage', 'thyme', 'rosemary',
               'green', 'grassy', 'hay', 'tea', 'green tea', 'black tea',
               'bell pepper'],
  },
  // Earthy / wood — brown-green
  {
    name: 'earthy',
    bg: 'bg-lime-50',
    text: 'text-lime-900',
    border: 'border-lime-300',
    keywords: ['earthy', 'earth', 'cedar', 'pine', 'wood', 'woody', 'tobacco',
               'leather', 'forest', 'mushroom'],
  },
  // Roasty / smoky — slate
  {
    name: 'roasty',
    bg: 'bg-slate-100',
    text: 'text-slate-800',
    border: 'border-slate-300',
    keywords: ['roasted', 'smoky', 'smoke', 'ash', 'burnt', 'tobacco', 'malt',
               'bread', 'toast', 'graham'],
  },
  // Wine / fermented — purple
  {
    name: 'wine',
    bg: 'bg-purple-50',
    text: 'text-purple-800',
    border: 'border-purple-200',
    keywords: ['wine', 'wine-like', 'winey', 'fermented', 'boozy', 'rum',
               'whiskey', 'bourbon', 'sherry', 'port', 'champagne'],
  },
];

const NEUTRAL = {
  name: 'other',
  bg: 'bg-stone-50',
  text: 'text-stone-700',
  border: 'border-stone-200',
};

/**
 * Pick a color category for a single tasting note.
 * @param {string} note - e.g. "blueberry", "rose petals", "dark chocolate"
 */
export function flavorColor(note) {
  if (!note || typeof note !== 'string') return NEUTRAL;
  const lower = note.toLowerCase().trim();
  for (const cat of CATEGORIES) {
    for (const kw of cat.keywords) {
      // word-boundary match so "lime" doesn't trigger on "sublime"
      const re = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (re.test(lower)) return cat;
    }
  }
  return NEUTRAL;
}

/**
 * Split a roaster's tasting_notes string into individual notes.
 *
 * Handles:
 *   - HTML entities ("&amp; Brown Sugar" → "Brown Sugar")
 *   - Wide separator set: , ; / | · • + & "and" "with"
 *   - Marketing prefixes ("with notes of chocolate" → "chocolate")
 *   - Run-on phrases (>3 words → keep just the last noun if extractable)
 *   - Label leakage ("Process: WashedRoast: Medium" → dropped)
 *   - One-letter junk ("j" → dropped)
 *
 * Returns clean 1-3-word tokens, no entities, no colons.
 */
export function splitTastingNotes(raw) {
  if (!raw || typeof raw !== 'string') return [];

  const decoded = raw
    .replace(/&amp;/gi, '&')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&ndash;/gi, '–')
    .replace(/&mdash;/gi, '—')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');

  return decoded
    .split(/[,;/|·•+]| and | & | with | plus /i)
    .map(sanitizeNote)
    .filter(Boolean);
}

/** Clean a single tasting-note token. Returns null when nothing usable remains. */
function sanitizeNote(token) {
  let s = (token || '').trim();
  if (!s) return null;

  // Strip marketing prefixes ("with notes of …", "hints of …", etc.)
  s = s.replace(/^(with|including|featuring|hints?\s+of|notes?\s+of|a\s+hint\s+of|tones?\s+of|a\s+touch\s+of|some|the|a)\s+/i, '');

  // Strip leading punctuation/separators ("& Brown Sugar" → "Brown Sugar")
  s = s.replace(/^[&\-•·*+]+\s*/, '').trim();

  // Strip trailing fluff
  s = s.replace(/\s*(?:\.{2,}|…|etc\.?|and\s+more)$/i, '').trim();

  // Run-on phrases ("creamy body with notes of chocolate") — try to keep
  // just the noun the sentence is about.
  if (s.split(/\s+/).length > 3) {
    const m = s.match(/\b(?:of|with|like)\s+([\w\s-]{2,30})$/i);
    if (m) s = m[1].trim();
  }

  // Final shape check: 1-3 words, 2-30 chars, no colons (label leakage),
  // no farming/process keywords.
  const words = s.split(/\s+/).filter(Boolean);
  if (words.length === 0 || words.length > 3) return null;
  if (s.length < 2 || s.length > 30) return null;
  if (/[:]/.test(s)) return null;
  if (/\b(process|roast|smooth|varietal|brewed|grind|altitude|elevation|harvest)\b/i.test(s)) return null;
  if (/^[a-z]{1,2}$/i.test(s)) return null;  // single/double letter junk like "j"
  // Reject any token containing a digit. Real tasting notes are nouns
  // ("blueberry", "milk chocolate"), never years ("2022"), lot numbers
  // ("Lot 17"), or batch IDs ("Microlot 12-A").
  if (/\d/.test(s)) return null;

  // Reject all-caps acronym-style words (2-3 chars all upper) — those are
  // almost always farm/producer codes, not flavor descriptors.
  // "EA De", "Loma EL", "RFA", "AAA Kenya"...
  if (/\b[A-Z]{2,3}\b/.test(s) && !/^(?:SL\d+)$/i.test(s)) return null;
  // Reject CamelCase concatenated label leakage ("MexicoProcess",
  // "caramelOrigins") — a real flavor word doesn't have an internal capital.
  if (/[a-z][A-Z]/.test(s)) return null;

  // Vocabulary sanity: multi-word tokens MUST map to a known flavor
  // category (SCA wheel), otherwise they're probably truncated proper
  // nouns ("EA De", "Mate Matiwos") that slipped through the splitter.
  // Single-word tokens get a pass — niche descriptors ("graham", "miso")
  // might not be in our dictionary yet.
  if (words.length >= 2) {
    const cat = flavorColor(s);
    if (cat.name === 'other') return null;
  }

  return s;
}
