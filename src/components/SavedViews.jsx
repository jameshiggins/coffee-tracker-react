import { useEffect, useRef, useState } from 'react';
import { useSavedViews } from '../hooks/useSavedViews.js';

/**
 * ux#10: Saved-views dropdown for the /beans header.
 *
 * Launcher button opens a panel that (a) lists saved views — click to
 * re-apply, ✕ to delete — and (b) lets you name + save the current filter
 * set. Each row shows how many in-stock beans match now and a "+N new"
 * badge when that's grown since the view was saved (the lightweight
 * "restock alert").
 *
 * Props:
 *   currentQuery     string  the active /beans query string to save
 *   hasActiveFilters bool    gate the save form (no point saving "no filters")
 *   onApply          (query) => void   re-apply a saved view's query
 *   countForQuery    (query) => number|null   current in-stock match count
 */
export default function SavedViews({ currentQuery, hasActiveFilters, onApply, countForQuery }) {
  const { views, save, remove } = useSavedViews();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e) {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    }
    function onEsc(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  function handleSave(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || !hasActiveFilters) return;
    save(trimmed, currentQuery, countForQuery ? countForQuery(currentQuery) : null);
    setName('');
  }

  function apply(view) {
    onApply(view.query);
    setOpen(false);
  }

  return (
    <div ref={wrapRef} className="relative inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="text-sm px-3 py-2 rounded-lg border border-border text-fg hover:bg-surface-muted transition-colors"
      >
        <span aria-hidden="true">★</span> Saved views{views.length ? ` (${views.length})` : ''}
        <span className="ml-1 opacity-60" aria-hidden="true">▾</span>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Saved views"
          // Left-aligned to the trigger on every breakpoint: the button sits
          // on the LEFT of the sort row, so a right-aligned panel (the old
          // sm:right-0) extended left off the button and got clipped by the
          // app-shell's overflow-hidden — you'd "only see half of it". Opening
          // rightward keeps the full 20rem panel inside the card. z-40 clears
          // the filter dropdowns' sm:z-30 so an open panel is never underlapped.
          className="absolute left-0 mt-1 bg-surface-elevated text-fg rounded-lg shadow-xl border border-border z-40 w-[min(20rem,calc(100vw-2.5rem))] py-1"
        >
          {views.length === 0 ? (
            <p className="px-3 py-3 text-sm text-fg-subtle italic">
              No saved views yet. Apply some filters, then save them below.
            </p>
          ) : (
            <ul className="max-h-[40vh] overflow-y-auto">
              {views.map((v) => {
                const now = countForQuery ? countForQuery(v.query) : null;
                const delta = now != null && v.count != null ? now - v.count : 0;
                return (
                  <li key={v.id} className="flex items-center gap-2 px-3 py-2 hover:bg-surface-muted">
                    <button
                      role="menuitem"
                      onClick={() => apply(v)}
                      className="flex-1 text-left min-w-0"
                    >
                      <span className="block text-sm font-medium truncate">{v.name}</span>
                      <span className="block text-xs text-fg-muted">
                        {now != null ? `${now} match${now === 1 ? '' : 'es'}` : 'view filters'}
                        {delta > 0 && (
                          <span className="text-accent font-semibold"> · +{delta} new</span>
                        )}
                      </span>
                    </button>
                    <button
                      onClick={() => remove(v.id)}
                      aria-label={`Delete saved view ${v.name}`}
                      title="Delete"
                      className="text-fg-muted hover:text-red-600 dark:hover:text-red-400 text-sm shrink-0 px-1"
                    >
                      ✕
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <hr className="my-1 border-border" />

          <form onSubmit={handleSave} className="px-3 py-2">
            {hasActiveFilters ? (
              <div className="flex items-center gap-2">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Name this view…"
                  aria-label="Name for the saved view"
                  maxLength={40}
                  className="flex-1 min-w-0 text-sm px-2 py-1.5 rounded-md border border-border bg-surface text-fg placeholder:text-fg-subtle focus:outline-none focus:border-accent"
                />
                <button
                  type="submit"
                  disabled={!name.trim()}
                  className="text-sm px-3 py-1.5 rounded-md bg-accent text-accent-fg font-medium disabled:opacity-40 transition-colors"
                >
                  Save
                </button>
              </div>
            ) : (
              <p className="text-xs text-fg-subtle italic">
                Apply some filters, then save them as a view.
              </p>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
