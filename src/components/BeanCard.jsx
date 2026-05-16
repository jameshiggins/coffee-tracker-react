import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { formatBagWeight } from '../utils/units.js';
import { ratingToStars, formatStars } from '../utils/rating.js';
import { splitTastingNotes } from '../utils/flavorColor.js';
import TastingNoteChips from './TastingNoteChips.jsx';
import WishlistHeart from './WishlistHeart.jsx';
import TastingForm from './TastingForm.jsx';
import ReportTastingButton from './ReportTastingButton.jsx';

/**
 * Card for a single coffee bean. Two modes:
 *
 *  - Collapsed (default): image + name + roaster + chips + cheapest price + heart.
 *    Click anywhere outside the heart/chips to expand.
 *  - Expanded: + roaster blurb, full variants table with per-bag Buy buttons,
 *    aggregate community rating, top 3 recent public tastings, "I tasted this"
 *    form. Click the close-X to collapse.
 *
 * Expansion is controlled by the parent (only ONE card open at a time per
 * the c3 design lock-in). The parent passes isExpanded + onExpandToggle.
 *
 * Chips are filter triggers — click any chip and onChipClick(key, value)
 * fires. Parent typically pushes that into the URL query state and reflows
 * the list. Heart and chip clicks stop event propagation so the card
 * doesn't expand when you're really trying to filter or wishlist.
 */
export default function BeanCard({
  coffee,
  isExpanded,
  onExpandToggle,
  onChipClick = () => {},
  showRoasterChip = true,  // /beans wants it; /beans?roaster=X may hide it
}) {
  const { user } = useAuth();
  const [tastings, setTastings] = useState(null);
  const [showTastingForm, setShowTastingForm] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const [showAllTastingsModal, setShowAllTastingsModal] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  // Lazy-load tastings only when card expands. Reload if the coffee changes.
  useEffect(() => {
    if (!isExpanded) return;
    setTastings(null);
    api.getCoffeeTastings(coffee.id)
      .then((d) => setTastings(d.tastings))
      .catch(() => setTastings([]));
  }, [isExpanded, coffee.id]);

  // The collapsed card shows ONE reference variant — the one closest to
  // 1 lb (454 g), the standard specialty bag size. This makes the
  // ¢/g comparison across roasters a fair apples-to-apples — you always
  // see the same size class, even though some shops also sell 250 g or
  // 1 kg. Falls through to whatever's available if 1 lb isn't.
  const cheapest = pickReferenceVariant(coffee.variants);
  const stars = ratingToStars(coffee.rating?.average);

  // Click handler for the card body — expands on collapsed, collapses on expanded.
  function onCardClick(e) {
    // Don't toggle if user is trying to interact with controls inside the card.
    if (e.target.closest('[data-no-expand]')) return;
    onExpandToggle();
  }

  return (
    <div
      onClick={onCardClick}
      className={`bg-white rounded-xl border shadow-sm transition-all cursor-pointer ${
        isExpanded
          ? 'border-amber-300 shadow-lg col-span-full ring-2 ring-amber-200'
          : 'border-amber-100 hover:border-amber-200 hover:shadow-md'
      }`}
    >
      {/* ---------- COLLAPSED HEADER (always visible) ---------- */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {coffee.image_url && (
            <img
              src={coffee.image_url}
              alt={`${coffee.roaster?.name ? coffee.roaster.name + ' — ' : ''}${coffee.name}`}
              loading="lazy"
              data-no-expand
              onClick={(e) => { e.stopPropagation(); setShowImageModal(true); }}
              title="Click to enlarge"
              className={`flex-shrink-0 rounded-lg object-cover border border-amber-50 cursor-zoom-in hover:brightness-95 transition ${
                isExpanded ? 'w-32 h-32' : 'w-20 h-20'
              }`}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          )}
          <div className="flex-1 min-w-0">
            {/* Roaster chip (above name on /beans, hidden on /beans?roaster=) */}
            {showRoasterChip && coffee.roaster && (
              <button
                data-no-expand
                onClick={(e) => { e.stopPropagation(); onChipClick('roaster', coffee.roaster.slug); }}
                className="text-xs text-amber-600 hover:text-amber-900 hover:underline uppercase tracking-wide"
                title={`Filter to ${coffee.roaster.name}`}
              >
                {coffee.roaster.name}
              </button>
            )}
            <h3 className="text-base font-semibold text-amber-900 leading-tight mt-0.5">
              {coffee.name}
              {coffee.is_removed && (
                <span className="ml-2 text-[10px] uppercase tracking-wide bg-red-50 text-red-700 px-1.5 py-0.5 rounded border border-red-100 align-middle">
                  no longer sold
                </span>
              )}
            </h3>

            {/* Front-and-center chip row: blend, process, region, varietal */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <Chip
                value={coffee.is_blend ? 'Blend' : 'Single Origin'}
                onClick={() => onChipClick('blend', coffee.is_blend ? 'blend' : 'single-origin')}
                tone={coffee.is_blend ? 'cyan' : 'emerald'}
              />
              {coffee.process && (
                <Chip
                  value={coffee.process}
                  onClick={() => onChipClick('process', coffee.process)}
                  tone="amber"
                />
              )}
              {coffee.origin && (
                <Chip
                  value={coffee.origin}
                  onClick={() => onChipClick('origin', coffee.origin)}
                  tone="sky"
                />
              )}
              {coffee.varietal && (
                <Chip
                  value={coffee.varietal}
                  onClick={() => onChipClick('varietal', coffee.varietal)}
                  tone="stone"
                />
              )}
              {coffee.roast_level && (
                <Chip
                  value={coffee.roast_level}
                  onClick={() => onChipClick('roast_level', coffee.roast_level)}
                  tone={ROAST_TONES[coffee.roast_level.toLowerCase()] || 'stone'}
                />
              )}
              {coffee.elevation_meters && (
                <span
                  data-no-expand
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs px-2 py-0.5 rounded-full border bg-violet-50 text-violet-700 border-violet-200"
                  title="Elevation above sea level"
                >
                  {coffee.elevation_meters.toLocaleString()} m
                </span>
              )}
            </div>

            {/* Tasting notes — color-coded chips */}
            {coffee.tasting_notes && (
              <div className="mt-2" data-no-expand onClick={(e) => e.stopPropagation()}>
                <TastingNoteChips
                  notes={coffee.tasting_notes}
                  size="xs"
                  onNoteClick={(note) => onChipClick('note', note)}
                />
              </div>
            )}

            {/* Aggregate rating + cheapest price + heart row */}
            <div className="flex items-center justify-between gap-2 mt-3">
              <div className="flex items-center gap-2 text-xs">
                {stars != null ? (
                  <>
                    <span className="text-amber-700">{formatStars(stars)}</span>
                    <span className="text-amber-600">{stars.toFixed(1)} · {coffee.rating.count}</span>
                  </>
                ) : (
                  <span className="text-amber-300 italic">No ratings yet</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {cheapest && (
                  <div className="text-right whitespace-nowrap">
                    <div className="font-bold text-amber-900 leading-none">
                      ${cheapest.price.toFixed(2)}
                    </div>
                    <div className="text-amber-600 font-normal text-[11px] leading-none mt-1">
                      {formatBagWeight(cheapest.bag_weight_grams)}
                    </div>
                    {cheapest.cents_per_gram != null && (
                      <div className="text-[11px] text-amber-700 font-mono leading-none mt-1">
                        {cheapest.cents_per_gram.toFixed(1)}¢/g
                      </div>
                    )}
                  </div>
                )}
                <div data-no-expand onClick={(e) => e.stopPropagation()}>
                  <WishlistHeart coffeeId={coffee.id} size="md" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- EXPANDED BODY ---------- */}
      {isExpanded && (
        <div className="border-t border-amber-100 p-5" data-no-expand onClick={(e) => e.stopPropagation()}>
          {/* Roaster blurb — collapsed teaser by default, "Read more" expands inline. */}
          {coffee.description && (
            <DescriptionBlock
              text={coffee.description}
              expanded={descExpanded}
              onToggle={() => setDescExpanded((v) => !v)}
            />
          )}

          {/* Variants table — narrower padding + scrollable on mobile,
              bag size shown grams-only on small screens (lb suffix dropped). */}
          {coffee.variants?.length > 0 && (
            <div className="mb-5 border border-amber-100 rounded-lg overflow-x-auto">
              <table className="w-full text-sm min-w-[440px]">
                <thead>
                  <tr className="bg-amber-50 text-amber-800 text-xs uppercase tracking-wide">
                    <th className="text-left px-2 sm:px-4 py-2">Bag</th>
                    <th className="text-right px-2 sm:px-4 py-2">Price</th>
                    <th className="text-right px-2 sm:px-4 py-2">¢/g</th>
                    <th className="text-center px-2 sm:px-4 py-2">Stock</th>
                    <th className="text-right px-2 sm:px-4 py-2">Buy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-50">
                  {coffee.variants.map((v) => (
                    <tr key={v.id} className={!v.in_stock ? 'opacity-40' : ''}>
                      <td className="px-2 sm:px-4 py-2 font-medium text-amber-900 whitespace-nowrap">
                        {v.source_size_label ? (
                          <>
                            <span>{v.source_size_label}</span>
                            <span className="text-amber-500 text-[11px] ml-1">({v.bag_weight_grams}g)</span>
                          </>
                        ) : (
                          <>
                            <span className="sm:hidden">{v.bag_weight_grams}g</span>
                            <span className="hidden sm:inline">{formatBagWeight(v.bag_weight_grams)}</span>
                          </>
                        )}
                      </td>
                      <td className="px-2 sm:px-4 py-2 text-right font-medium text-amber-900 whitespace-nowrap">
                        {v.currency_code !== 'CAD' && <span className="text-amber-500 text-xs mr-1">{v.currency_code}</span>}
                        ${v.price.toFixed(2)}
                      </td>
                      <td className="px-2 sm:px-4 py-2 text-right text-amber-700 font-mono text-xs whitespace-nowrap">{v.cents_per_gram?.toFixed(1)}¢</td>
                      <td className="px-2 sm:px-4 py-2 text-center">
                        <span
                          className={`inline-block w-2 h-2 rounded-full ${v.in_stock ? 'bg-green-400' : 'bg-red-300'}`}
                          title={v.in_stock ? 'In stock' : 'Out of stock'}
                        />
                      </td>
                      <td className="px-2 sm:px-4 py-2 text-right">
                        {v.purchase_link && !coffee.is_removed && v.in_stock ? (
                          <a
                            href={v.purchase_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block bg-amber-700 hover:bg-amber-800 text-white text-xs font-medium px-2 sm:px-3 py-1 rounded whitespace-nowrap"
                          >
                            Buy ↗
                          </a>
                        ) : (
                          <span className="text-amber-300 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* "I tasted this" — auth-gated, expand-only */}
          {user && !coffee.is_removed && (
            <div className="mb-5">
              {!showTastingForm && !savedMsg && (
                <button
                  onClick={() => setShowTastingForm(true)}
                  className="bg-green-700 hover:bg-green-800 text-white text-sm px-4 py-2 rounded-md"
                >
                  ☕ I tasted this
                </button>
              )}
              {savedMsg && (
                <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded p-2">
                  Tasting saved.
                </div>
              )}
              {showTastingForm && (
                <TastingForm
                  coffee={coffee}
                  onSaved={() => {
                    setShowTastingForm(false);
                    setSavedMsg(true);
                    api.getCoffeeTastings(coffee.id).then((d) => setTastings(d.tastings)).catch(() => {});
                  }}
                  onCancel={() => setShowTastingForm(false)}
                />
              )}
            </div>
          )}

          {/* Recent public tastings (top 3) + "see all" */}
          {tastings === null ? (
            <div className="text-amber-500 text-xs italic">Loading tastings…</div>
          ) : tastings.length > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-amber-900">
                  Recent tastings ({tastings.length})
                </h4>
                {tastings.length > 3 && (
                  <button
                    onClick={() => setShowAllTastingsModal(true)}
                    className="text-xs text-amber-700 hover:underline"
                  >
                    See all {tastings.length} →
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {tastings.slice(0, 3).map((t) => <TastingRow key={t.id} t={t} />)}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* See-all-tastings modal (t2) */}
      {showAllTastingsModal && (
        <AllTastingsModal
          coffee={coffee}
          tastings={tastings || []}
          onClose={() => setShowAllTastingsModal(false)}
        />
      )}

      {/* Image lightbox — bag labels often have text people want to read */}
      {showImageModal && coffee.image_url && (
        <ImageLightbox
          src={coffee.image_url}
          caption={`${coffee.roaster?.name ? coffee.roaster.name + ' — ' : ''}${coffee.name}`}
          onClose={() => setShowImageModal(false)}
        />
      )}
    </div>
  );
}

/* ----------------- helpers ----------------- */

const TONES = {
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cyan: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  sky: 'bg-sky-50 text-sky-700 border-sky-200',
  stone: 'bg-stone-50 text-stone-700 border-stone-200',
  yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  orange: 'bg-orange-50 text-orange-700 border-orange-200',
  red: 'bg-red-50 text-red-700 border-red-200',
};

const ROAST_TONES = {
  light: 'yellow',
  medium: 'orange',
  'medium-dark': 'orange',
  dark: 'red',
};

function Chip({ value, onClick, tone = 'stone' }) {
  const cls = TONES[tone] || TONES.stone;
  return (
    <button
      data-no-expand
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      className={`text-xs px-2 py-0.5 rounded-full border capitalize hover:brightness-95 transition-all ${cls}`}
      title={`Filter by ${value}`}
    >
      {value}
    </button>
  );
}

function DescriptionBlock({ text, expanded, onToggle }) {
  // Show ~1 sentence (or 130 chars, whichever is shorter) collapsed.
  // "Read more" expands to full text — no "Show less" because nobody who
  // just clicked Read more wants to immediately re-collapse.
  const t = (text || '').trim();
  const sentenceMatch = t.match(/^[^.!?]+[.!?]/);
  const teaserCandidate = sentenceMatch ? sentenceMatch[0] : t;
  const teaser = teaserCandidate.length > 140 ? teaserCandidate.slice(0, 130).trim() + '…' : teaserCandidate;
  const hasMore = teaser.length < t.length;
  return (
    <div className="mb-4">
      <p className="text-sm text-amber-900 leading-relaxed">
        {expanded ? t : teaser}
        {hasMore && !expanded && (
          <button
            onClick={onToggle}
            className="text-amber-700 hover:underline text-xs ml-1"
          >
            Read more →
          </button>
        )}
      </p>
    </div>
  );
}

function pickReferenceVariant(variants) {
  if (!variants || !variants.length) return null;
  const inStock = variants.filter((v) => v.in_stock);
  const pool = inStock.length ? inStock : variants;
  // Closest to 1 lb (454 g). On ties (e.g. equidistant 340 g vs 568 g),
  // prefer the smaller bag — it's usually a more accessible price point.
  return pool.reduce((best, v) => {
    if (best == null) return v;
    const dB = Math.abs(best.bag_weight_grams - 454);
    const dV = Math.abs(v.bag_weight_grams - 454);
    if (dV < dB) return v;
    if (dV === dB && v.bag_weight_grams < best.bag_weight_grams) return v;
    return best;
  }, null);
}

function TastingRow({ t }) {
  const stars = ratingToStars(t.rating);
  return (
    <div className="border border-amber-100 rounded-md p-2.5 bg-amber-50/40">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {t.user.avatar_url && (
            <img src={t.user.avatar_url} alt="" className="w-6 h-6 rounded-full border border-amber-100" />
          )}
          <div className="text-xs text-amber-900 truncate">
            <span className="font-medium">{t.user.display_name || `User #${t.user.id}`}</span>
            <span className="text-amber-600 mx-1.5">·</span>
            <span className="text-amber-600">{t.tasted_on}</span>
            {t.brew_method && <span className="text-amber-600"> · {t.brew_method}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {stars != null && <span className="text-amber-700 text-sm">{formatStars(stars)}</span>}
          <ReportTastingButton tastingId={t.id} />
        </div>
      </div>
      {t.notes && <div className="text-xs text-amber-800 italic mt-1.5 leading-snug">{t.notes}</div>}
    </div>
  );
}

function AllTastingsModal({ coffee, tastings, onClose }) {
  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      data-no-expand
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-amber-100 flex items-center justify-between">
          <h3 className="font-bold text-amber-900">
            All tastings ({tastings.length}) · {coffee.name}
          </h3>
          <button onClick={onClose} className="text-amber-700 hover:text-amber-900 text-xl leading-none">✕</button>
        </div>
        <div className="overflow-y-auto p-4 space-y-2 flex-1">
          {tastings.map((t) => <TastingRow key={t.id} t={t} />)}
        </div>
      </div>
    </div>
  );
}

function ImageLightbox({ src, caption, onClose }) {
  useEffect(() => {
    function onEsc(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-4"
      onClick={onClose}
      data-no-expand
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-5 text-white/80 hover:text-white text-3xl leading-none"
        aria-label="Close image"
      >
        ✕
      </button>
      <img
        src={src}
        alt={caption}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] max-w-[92vw] object-contain rounded-lg shadow-2xl bg-white"
      />
      {caption && (
        <div className="mt-3 text-sm text-white/90 text-center max-w-[92vw] truncate">
          {caption}
        </div>
      )}
    </div>
  );
}
