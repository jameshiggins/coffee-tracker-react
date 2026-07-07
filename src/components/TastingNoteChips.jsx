import { flavorColor, splitTastingNotes } from '../utils/flavorColor.js';

/**
 * Render a roaster's tasting_notes string as small color-coded chips,
 * one chip per note, colored per the SCA Coffee Taster's Flavor Wheel.
 *
 * Optional onNoteClick handler — when set, chips become buttons that
 * call back with the clicked note (used by the parent to filter the
 * bean list to other beans with the same note).
 */
export default function TastingNoteChips({ notes, onNoteClick = null, size = 'sm' }) {
  const items = typeof notes === 'string' ? splitTastingNotes(notes) : (Array.isArray(notes) ? notes : []);
  if (items.length === 0) return null;

  // xs: 12px on phones (legibility floor — no sub-12px body text on
  // mobile) shrinking back to the original 10px at sm:+ so the desktop
  // card stays pixel-identical.
  const sizeClass = size === 'xs'
    ? 'text-xs sm:text-[10px] px-2 py-0.5 sm:px-1.5'
    : size === 'md'
    ? 'text-sm px-2.5 py-1'
    : 'text-xs px-2 py-0.5';

  return (
    <div className="flex flex-wrap gap-1">
      {items.map((note, i) => {
        const c = flavorColor(note);
        const cls = `inline-flex items-center rounded-full border ${sizeClass} ${c.bg} ${c.text} ${c.border}`;
        if (onNoteClick) {
          return (
            <button
              key={`${note}-${i}`}
              onClick={(e) => { e.stopPropagation(); onNoteClick(note); }}
              className={`${cls} hover:brightness-95 transition-colors cursor-pointer`}
              title={`Filter by "${note}"`}
              aria-label={`Filter by tasting note: ${note}`}
            >
              {note}
            </button>
          );
        }
        return (
          <span key={`${note}-${i}`} className={cls}>
            {note}
          </span>
        );
      })}
    </div>
  );
}
