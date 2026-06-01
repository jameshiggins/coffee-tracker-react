import { useEffect, useId, useRef, useState } from 'react';
import { FILTER_TONE_BUNDLES } from '../ui/tones.js';

/**
 * Compact dropdown filter for the /beans page header.
 *
 * Two modes:
 *   - Single-pick (default): clicking an option closes the dropdown and
 *     replaces the active value. Used for Type (Blend vs Single Origin).
 *   - Multi-pick (multi=true): renders checkboxes; clicking toggles a
 *     value in the array; dropdown stays open until click-outside.
 *
 * Props:
 *   label    - "Type", "Origin", "Tasting note", etc.
 *   value    - selected value(s). String for single, string[] for multi.
 *   options  - array of { value, label, count? }, sorted by parent.
 *   onPick   - single mode: (value) => void; pass '' to clear all.
 *              multi mode: (newArray) => void after toggle.
 *   multi    - boolean, default false.
 *   tone     - color theme matching the BeanCard chip for the same field
 *              ("emerald" for Type, "amber" for Process, "sky" for Region,
 *              "stone" for Varietal, "violet" for Elevation, etc.).
 *              Defaults to "amber" — the page's brand color.
 *
 * Accessibility (a11y#1 / a11y#4):
 *   - Trigger is a menu button: aria-haspopup="menu", aria-expanded,
 *     aria-controls. ArrowDown/Up opens it from the keyboard.
 *   - Panel is role="menu"; options are menuitemradio (single) /
 *     menuitemcheckbox (multi) so selection state is announced, and the
 *     Clear action is a plain menuitem.
 *   - Roving focus: Arrow keys move between items, Home/End jump to ends,
 *     native Enter/Space activate (button click / checkbox toggle).
 *   - Focus management: opening moves focus to the active (or first) item;
 *     Escape, selecting, or clearing closes and restores focus to the
 *     trigger so keyboard users aren't dumped at the top of the page.
 */

// Tone → Tailwind class bundles now live in ../ui/tones.js (FILTER_TONE_BUNDLES,
// shared and dark-mode aware). Each bundle covers the trigger button (idle +
// active), the panel border, option hover/selected, the checkbox accent, count
// text, divider, and clear link.

export default function FilterDropdown({ label, value, options, onPick, multi = false, tone = 'amber' }) {
  const t = FILTER_TONE_BUNDLES[tone] || FILTER_TONE_BUNDLES.amber;
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const panelId = useId();

  // Close on click-outside (no focus move — the user clicked elsewhere) or
  // Escape (restore focus to the trigger so keyboard users keep their place).
  useEffect(() => {
    if (!open) return;
    function onDocClick(e) {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    }
    function onEsc(e) {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  // On open, pull focus into the menu — onto the selected/checked item if
  // there is one, else the first. Lets keyboard users act without a manual Tab.
  useEffect(() => {
    if (!open || !panelRef.current) return;
    const items = panelRef.current.querySelectorAll('[data-menuitem]');
    if (!items.length) return;
    const selectedEl = panelRef.current.querySelector('[data-menuitem][data-selected="true"]');
    (selectedEl || items[0]).focus();
  }, [open]);

  // mobile#1: when the panel renders as a bottom sheet (narrow viewport), lock
  // body scroll so the page behind doesn't slide under the sheet. No-op at sm:+
  // where the panel is a small anchored popover that shouldn't lock the page.
  useEffect(() => {
    if (!open) return;
    if (!window.matchMedia('(max-width: 639px)').matches) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const selected = multi ? (Array.isArray(value) ? value : []) : value;
  const active = multi ? selected.length > 0 : !!selected;
  const buttonSummary = !active
    ? null
    : multi
      ? `: ${selected.length === 1 ? (options.find((o) => o.value === selected[0])?.label ?? selected[0]) : `${selected.length} selected`}`
      : `: ${options.find((o) => o.value === selected)?.label ?? selected}`;

  function toggleMulti(optValue) {
    const arr = Array.isArray(value) ? [...value] : [];
    const idx = arr.indexOf(optValue);
    if (idx >= 0) arr.splice(idx, 1);
    else arr.push(optValue);
    onPick(arr);
  }

  function clearAll() {
    if (multi) onPick([]);
    else onPick('');
    setOpen(false);
    triggerRef.current?.focus();
  }

  function pickSingle(optValue) {
    onPick(optValue);
    setOpen(false);
    triggerRef.current?.focus();
  }

  // Roving Arrow/Home/End navigation across the menu items.
  function onPanelKeyDown(e) {
    const items = [...(panelRef.current?.querySelectorAll('[data-menuitem]') || [])];
    if (!items.length) return;
    const i = items.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      items[(i + 1) % items.length]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      items[(i - 1 + items.length) % items.length]?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      items[0]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      items[items.length - 1]?.focus();
    }
  }

  // Menu-button convention: ArrowDown/Up opens the closed menu.
  function onTriggerKeyDown(e) {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault();
      setOpen(true);
    }
  }

  return (
    <div ref={wrapRef} className="relative inline-block">
      <button
        ref={triggerRef}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onTriggerKeyDown}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        className={`text-sm px-3 py-2 min-h-[44px] sm:min-h-0 rounded-lg border transition-colors max-w-full inline-flex items-center justify-center ${
          active ? `${t.btnActive} font-medium` : t.btnIdle
        }`}
      >
        <span className="truncate">{label}{buttonSummary}</span>
        <span className="ml-1 opacity-60 flex-shrink-0" aria-hidden="true">▾</span>
      </button>
      {open && (
        <>
          {/* mobile#1: dim, tap-to-close backdrop behind the bottom sheet.
              Hidden at sm:+ where the panel is a small anchored popover and the
              document mousedown handler already covers click-outside. */}
          <div
            className="fixed inset-0 bg-black/40 z-40 sm:hidden"
            aria-hidden="true"
            onClick={() => { setOpen(false); triggerRef.current?.focus(); }}
          />
          {/* On a phone this is a full-width bottom sheet (thumb-reachable, no
              tiny popover to aim at); at sm:+ it's the original anchored menu,
              width-clamped to the viewport so it never clips near a screen edge. */}
          <div
            ref={panelRef}
            id={panelId}
            role="menu"
            aria-label={label}
            aria-multiselectable={multi ? true : undefined}
            onKeyDown={onPanelKeyDown}
            className={`fixed sm:absolute inset-x-0 sm:inset-x-auto bottom-0 sm:bottom-auto left-0 sm:mt-1 bg-surface-elevated text-fg rounded-t-2xl sm:rounded-lg shadow-xl border ${t.border} z-50 sm:z-30 w-full sm:w-[max(13.75rem,0px)] sm:max-w-[calc(100vw-2.5rem)] max-h-[78vh] sm:max-h-[60vh] overflow-y-auto pt-0 sm:pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:pb-1`}
          >
            {/* mobile-only sheet header: grab handle + label + Done, so a
                multi-select sheet can be dismissed without reaching outside it.
                Sticky so it stays put while the options scroll. */}
            <div className="sm:hidden sticky top-0 z-10 bg-surface-elevated border-b border-border">
              <div className="mx-auto mt-2 h-1 w-9 rounded-full bg-border-strong" aria-hidden="true" />
              <div className="flex items-center justify-between px-4 py-2">
                <span className="font-semibold text-fg">{label}</span>
                <button
                  type="button"
                  onClick={() => { setOpen(false); triggerRef.current?.focus(); }}
                  className="text-accent font-semibold text-sm px-3 py-2 -mr-2 min-h-[44px]"
                >
                  Done
                </button>
              </div>
            </div>
          {active && (
            <>
              <button
                data-menuitem
                role="menuitem"
                tabIndex={-1}
                onClick={clearAll}
                className={`block w-full text-left px-3 py-2 text-sm ${t.clearText} ${t.hover}`}
              >
                ✕ Clear {multi && selected.length > 1 ? `${selected.length} filters` : 'filter'}
              </button>
              <hr className={`my-1 ${t.divider}`} />
            </>
          )}
          {options.length === 0 ? (
            <div className="px-3 py-2 text-sm text-fg-subtle italic">No options</div>
          ) : multi ? (
            options.map((opt) => {
              const checked = selected.includes(opt.value);
              return (
                <label
                  key={opt.value}
                  className={`flex items-center gap-2 px-3 py-2.5 sm:py-1.5 text-sm ${t.hover} cursor-pointer ${
                    checked ? t.selected : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    data-menuitem
                    data-selected={checked}
                    role="menuitemcheckbox"
                    aria-checked={checked}
                    tabIndex={-1}
                    checked={checked}
                    onChange={() => toggleMulti(opt.value)}
                    className={t.accent}
                  />
                  <span className="flex-1">{opt.label}</span>
                  {opt.count != null && (
                    <span className={`${t.countText} text-xs`}>({opt.count})</span>
                  )}
                </label>
              );
            })
          ) : (
            options.map((opt) => (
              <button
                key={opt.value}
                data-menuitem
                data-selected={selected === opt.value}
                role="menuitemradio"
                aria-checked={selected === opt.value}
                tabIndex={-1}
                onClick={() => pickSingle(opt.value)}
                className={`block w-full text-left px-3 py-2.5 sm:py-1.5 text-sm ${t.hover} ${
                  selected === opt.value ? t.selected : ''
                }`}
              >
                {opt.label}
                {opt.count != null && (
                  <span className={`${t.countText} text-xs ml-1.5`}>({opt.count})</span>
                )}
              </button>
            ))
          )}
          </div>
        </>
      )}
    </div>
  );
}
