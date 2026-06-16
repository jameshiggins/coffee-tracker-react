import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { formatBagWeight, labelContainsGrams } from '../utils/units';
import { ratingToStars, formatStars } from '../utils/rating.js';
import { splitTastingNotes } from '../utils/flavorColor.js';
import { TONE_TRIOS, ROAST_TONES } from '../ui/tones.js';
import TastingNoteChips from './TastingNoteChips.jsx';
import WishlistHeart from './WishlistHeart.jsx';
import Icon from './Icon.jsx';
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
  const cardRef = useRef(null);

  // Lazy-load tastings only when card expands. Reload if the coffee changes.
  useEffect(() => {
    if (!isExpanded) return;
    setTastings(null);
    api.getCoffeeTastings(coffee.id)
      .then((d) => setTastings(d.tastings))
      .catch(() => setTastings([]));
  }, [isExpanded, coffee.id]);

  // When a card expands it jumps to col-span-full and reflows the grid row,
  // which can push its top out of view (the row it lands on depends on column
  // count). Pull the freshly-expanded card back into view so the details the
  // user just asked for are actually on screen. block:'nearest' keeps it from
  // scrolling when the card is already fully visible.
  useEffect(() => {
    if (isExpanded) cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [isExpanded]);

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
      ref={cardRef}
      onClick={onCardClick}
      className={`bg-surface rounded-xl border shadow-sm transition-all cursor-pointer ${
        isExpanded
          ? 'border-accent/40 shadow-lg col-span-full ring-2 ring-accent/30'
          : 'border-border hover:border-border-strong hover:shadow-md'
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
              className={`flex-shrink-0 rounded-lg object-cover border border-border cursor-zoom-in hover:brightness-95 transition ${
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
                className="group/roaster flex items-center gap-1.5 max-w-full text-xs text-fg-muted hover:text-fg uppercase tracking-wide"
                title={`Filter by ${coffee.roaster.name}`}
              >
                <RoasterAvatar name={coffee.roaster.name} faviconUrl={coffee.roaster.favicon_url} />
                <span className="truncate group-hover/roaster:underline">{coffee.roaster.name}</span>
              </button>
            )}
            <h3 className="text-base font-semibold text-fg leading-tight mt-1">
              {coffee.name}
              {coffee.is_removed && (
                <span className="ml-2 text-[11px] sm:text-[10px] uppercase tracking-wide bg-red-50 text-red-700 border-red-100 dark:bg-red-400/10 dark:text-red-300 dark:border-red-400/25 px-1.5 py-0.5 rounded border align-middle">
                  no longer sold
                </span>
              )}
            </h3>

            {/* Front-and-center chip row: blend, process, region, varietal */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <Chip
                label="Type"
                value={coffee.is_blend ? 'Blend' : 'Single Origin'}
                onClick={() => onChipClick('blend', coffee.is_blend ? 'blend' : 'single-origin')}
                tone={coffee.is_blend ? 'cyan' : 'emerald'}
              />
              {coffee.process && (
                <Chip
                  label="Process"
                  value={coffee.process}
                  onClick={() => onChipClick('process', coffee.process)}
                  tone="amber"
                />
              )}
              {coffee.origin && (
                <Chip
                  label="Origin"
                  value={coffee.origin}
                  onClick={() => onChipClick('origin', coffee.origin)}
                  tone="sky"
                />
              )}
              {coffee.varietal && (
                <Chip
                  label="Varietal"
                  value={coffee.varietal}
                  onClick={() => onChipClick('varietal', coffee.varietal)}
                  tone="stone"
                />
              )}
              {coffee.roast_level && (
                <Chip
                  label="Roast"
                  value={coffee.roast_level}
                  onClick={() => onChipClick('roast_level', coffee.roast_level)}
                  tone={ROAST_TONES[coffee.roast_level.toLowerCase()] || 'stone'}
                />
              )}
              {coffee.elevation_meters && (
                <span
                  data-no-expand
                  onClick={(e) => e.stopPropagation()}
                  className={`text-xs px-2 py-0.5 rounded-full border ${TONE_TRIOS.violet}`}
                  title="Elevation above sea level"
                  aria-label={`Elevation: ${coffee.elevation_meters.toLocaleString()} metres above sea level`}
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

            {/* Aggregate rating + cheapest price + heart row. The rating only
                appears on the list when one EXISTS — an unrated bean shows
                nothing here (no "no ratings yet" noise); expand the card to rate
                it. Keeps the row balanced via justify-between either way. */}
            <div className="flex items-center justify-between gap-2 mt-3">
              <div className="flex items-center gap-2 text-xs">
                {stars != null && (
                  <>
                    <span className="text-amber-500 dark:text-amber-400">{formatStars(stars)}</span>
                    <span className="text-fg-muted">{stars.toFixed(1)} · {coffee.rating.count}</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                {cheapest && (
                  <div className="text-right whitespace-nowrap">
                    <div className="font-bold text-fg leading-none">
                      ${cheapest.price.toFixed(2)}
                    </div>
                    <div className="text-fg-muted font-normal text-[11px] leading-none mt-1">
                      {formatBagWeight(cheapest.bag_weight_grams)}
                    </div>
                    {cheapest.cents_per_gram != null && (
                      <div className="text-[11px] text-fg-muted font-mono leading-none mt-1">
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
        <div className="border-t border-border p-5" data-no-expand onClick={(e) => e.stopPropagation()}>
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
            <div className="mb-5 border border-border rounded-lg overflow-x-auto">
              <table className="w-full text-sm min-w-[440px]">
                <thead>
                  <tr className="bg-surface-muted text-fg text-xs uppercase tracking-wide">
                    <th className="text-left px-2 sm:px-4 py-2">Container</th>
                    <th className="text-right px-2 sm:px-4 py-2">Price</th>
                    <th className="text-right px-2 sm:px-4 py-2">¢/g</th>
                    <th className="text-center px-2 sm:px-4 py-2">Stock</th>
                    <th className="text-right px-2 sm:px-4 py-2">Buy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {coffee.variants.map((v) => (
                    <tr key={v.id} className={!v.in_stock ? 'opacity-40' : ''}>
                      <td className="px-2 sm:px-4 py-2 font-medium text-fg whitespace-nowrap">
                        {v.source_size_label ? (
                          <>
                            <span>{v.source_size_label}</span>
                            {/* Only show the parenthetical grams when the
                                source label doesn't already include them —
                                "100 g tin" should NOT render as
                                "100 g tin (100g)". */}
                            {!labelContainsGrams(v.source_size_label, v.bag_weight_grams) && (
                              <span className="text-fg-subtle text-[11px] ml-1">({v.bag_weight_grams}g)</span>
                            )}
                          </>
                        ) : (
                          <>
                            <span className="sm:hidden">{v.bag_weight_grams}g</span>
                            <span className="hidden sm:inline">{formatBagWeight(v.bag_weight_grams)}</span>
                          </>
                        )}
                      </td>
                      <td className="px-2 sm:px-4 py-2 text-right font-medium text-fg whitespace-nowrap">
                        {v.currency_code !== 'CAD' && <span className="text-fg-subtle text-xs mr-1">{v.currency_code}</span>}
                        ${v.price.toFixed(2)}
                      </td>
                      <td className="px-2 sm:px-4 py-2 text-right text-fg-muted font-mono text-xs whitespace-nowrap">{v.cents_per_gram?.toFixed(1)}¢</td>
                      <td className="px-2 sm:px-4 py-2 text-center">
                        <span
                          className={`inline-block w-2 h-2 rounded-full ${v.in_stock ? 'bg-emerald-500' : 'bg-red-400'}`}
                          title={v.in_stock ? 'In stock' : 'Out of stock'}
                        />
                      </td>
                      <td className="px-2 sm:px-4 py-2 text-right">
                        {v.purchase_link && !coffee.is_removed && v.in_stock ? (
                          <a
                            href={v.purchase_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block bg-accent hover:bg-accent-hover text-accent-fg text-xs font-medium px-2 sm:px-3 py-1 rounded whitespace-nowrap"
                          >
                            Buy ↗
                          </a>
                        ) : (
                          <span className="text-fg-subtle text-xs">—</span>
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
                  className="inline-flex items-center gap-1.5 bg-accent hover:bg-accent-hover text-accent-fg text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
                >
                  <Icon name="cup" size={16} /> Add your tasting
                </button>
              )}
              {savedMsg && (
                <div className="text-sm text-green-700 bg-green-50 border border-green-200 dark:text-emerald-300 dark:bg-emerald-500/10 dark:border-emerald-500/30 rounded p-2">
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
            <div className="text-fg-subtle text-xs italic">Loading tastings…</div>
          ) : tastings.length > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-fg">
                  Recent tastings ({tastings.length})
                </h4>
                {tastings.length > 3 && (
                  <button
                    onClick={() => setShowAllTastingsModal(true)}
                    className="text-xs text-accent hover:underline"
                  >
                    See all {tastings.length} →
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {tastings.slice(0, 3).map((t) => <TastingRow key={t.id} t={t} />)}
              </div>
            </div>
          ) : (
            // Empty state: unlike the list (which stays quiet), the expanded view
            // names the gap and points to the action — the signed-in "Add your
            // tasting" button above, or a sign-in link for signed-out visitors.
            <p className="text-sm text-fg-muted">
              No tastings yet.{' '}
              {user ? (
                'Be the first to add one.'
              ) : (
                <>
                  <Link to="/sign-in" className="font-medium text-accent hover:underline">Sign in</Link>{' '}
                  to add the first tasting.
                </>
              )}
            </p>
          )}
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

// TONES + ROAST_TONES are imported from ../ui/tones.js (shared with the Chip
// and Badge primitives) so colours — and their dark-mode variants — stay in
// one place.
function Chip({ value, onClick, tone = 'stone', label }) {
  const cls = TONE_TRIOS[tone] || TONE_TRIOS.stone;
  // `label` names the field category (Process, Origin, …). Folding it into the
  // accessible name makes chips distinguishable without relying on tone color
  // (a11y#2) and gives screen-reader users the context the color conveys.
  const accessibleName = label ? `Filter by ${label}: ${value}` : `Filter by ${value}`;
  return (
    <button
      data-no-expand
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      className={`text-xs px-2 py-0.5 rounded-full border capitalize hover:brightness-95 transition-all ${cls}`}
      title={accessibleName}
      aria-label={accessibleName}
    >
      {value}
    </button>
  );
}

/**
 * Roaster avatar. Prefers the roaster's actual favicon/logo — the same
 * `favicon_url` the roaster lists render — so the chip shows a real brand
 * mark instead of generic initials ("ON", "CC"). Falls back to a
 * deterministic tinted monogram when there's no favicon or the image fails
 * to load (404 / blocked). Decorative — the roaster name sits right beside
 * it, so it's aria-hidden.
 */
function RoasterAvatar({ name, faviconUrl, className = '' }) {
  const [imgFailed, setImgFailed] = useState(false);

  if (faviconUrl && !imgFailed) {
    return (
      <img
        src={faviconUrl}
        alt=""
        aria-hidden="true"
        loading="lazy"
        onError={() => setImgFailed(true)}
        className={`w-6 h-6 rounded-sm flex-shrink-0 object-contain bg-surface-muted border border-border ${className}`}
      />
    );
  }

  const initials = roasterInitials(name);
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  const hue = Math.abs(hash) % 360;
  return (
    <span
      aria-hidden="true"
      className={`inline-flex items-center justify-center rounded-md font-bold leading-none flex-shrink-0 w-6 h-6 text-[10px] text-white ${className}`}
      style={{ backgroundColor: `hsl(${hue} 42% 42%)` }}
    >
      {initials}
    </span>
  );
}

function roasterInitials(name) {
  const words = (name || '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
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
      <p className="text-sm text-fg leading-relaxed">
        {expanded ? t : teaser}
        {hasMore && !expanded && (
          <button
            onClick={onToggle}
            className="text-accent hover:underline text-xs ml-1"
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
    <div className="border border-border rounded-md p-2.5 bg-surface-muted">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {t.user.avatar_url && (
            <img src={t.user.avatar_url} alt="" className="w-6 h-6 rounded-full border border-border" />
          )}
          <div className="text-xs text-fg truncate">
            <span className="font-medium">{t.user.display_name || `User #${t.user.id}`}</span>
            <span className="text-fg-muted mx-1.5">·</span>
            <span className="text-fg-muted">{t.tasted_on}</span>
            {t.brew_method && <span className="text-fg-muted"> · {t.brew_method}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {stars != null && <span className="text-amber-500 dark:text-amber-400 text-sm">{formatStars(stars)}</span>}
          <ReportTastingButton tastingId={t.id} />
        </div>
      </div>
      {t.notes && <div className="text-xs text-fg-muted italic mt-1.5 leading-snug">{t.notes}</div>}
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
        className="bg-surface-elevated rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-border flex items-center justify-between gap-3">
          <h3 className="font-bold text-fg min-w-0 truncate">
            All tastings ({tastings.length}) · {coffee.name}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-fg-muted hover:text-fg text-xl leading-none flex-shrink-0 w-11 h-11 -mr-2 inline-flex items-center justify-center"
          >
            ✕
          </button>
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
        className="absolute text-white/80 hover:text-white text-3xl leading-none w-11 h-11 inline-flex items-center justify-center"
        style={{
          top: 'calc(env(safe-area-inset-top) + 0.5rem)',
          right: 'calc(env(safe-area-inset-right) + 0.75rem)',
        }}
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
