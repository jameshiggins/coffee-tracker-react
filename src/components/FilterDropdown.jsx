import { useEffect, useRef, useState } from 'react';

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
 */

// Tone → Tailwind class bundles. Each bundle covers the button (idle +
// active), the dropdown panel border, and the option hover/selected state.
// Tailwind's JIT scans source files for literal class strings, so each
// `bg-emerald-100` etc. must appear verbatim somewhere in the codebase
// (this object satisfies that for every supported tone).
const TONES = {
  amber:   { btnActive: 'bg-amber-100 border-amber-300 text-amber-900',     btnIdle: 'bg-white border-amber-200 text-amber-700 hover:border-amber-400',     hover: 'hover:bg-amber-50',   selected: 'font-semibold text-amber-800 bg-amber-50',   border: 'border-amber-200', accent: 'accent-amber-700',   countText: 'text-amber-500',  divider: 'border-amber-100', clearText: 'text-amber-600' },
  emerald: { btnActive: 'bg-emerald-100 border-emerald-300 text-emerald-900', btnIdle: 'bg-white border-emerald-200 text-emerald-700 hover:border-emerald-400', hover: 'hover:bg-emerald-50', selected: 'font-semibold text-emerald-800 bg-emerald-50', border: 'border-emerald-200', accent: 'accent-emerald-700', countText: 'text-emerald-500', divider: 'border-emerald-100', clearText: 'text-emerald-600' },
  sky:     { btnActive: 'bg-sky-100 border-sky-300 text-sky-900',           btnIdle: 'bg-white border-sky-200 text-sky-700 hover:border-sky-400',           hover: 'hover:bg-sky-50',     selected: 'font-semibold text-sky-800 bg-sky-50',       border: 'border-sky-200',   accent: 'accent-sky-700',     countText: 'text-sky-500',    divider: 'border-sky-100',   clearText: 'text-sky-600' },
  stone:   { btnActive: 'bg-stone-200 border-stone-400 text-stone-900',     btnIdle: 'bg-white border-stone-300 text-stone-700 hover:border-stone-500',     hover: 'hover:bg-stone-100',  selected: 'font-semibold text-stone-900 bg-stone-100',  border: 'border-stone-300', accent: 'accent-stone-700',   countText: 'text-stone-500',  divider: 'border-stone-200', clearText: 'text-stone-600' },
  violet:  { btnActive: 'bg-violet-100 border-violet-300 text-violet-900',  btnIdle: 'bg-white border-violet-200 text-violet-700 hover:border-violet-400',  hover: 'hover:bg-violet-50',  selected: 'font-semibold text-violet-800 bg-violet-50', border: 'border-violet-200', accent: 'accent-violet-700', countText: 'text-violet-500', divider: 'border-violet-100', clearText: 'text-violet-600' },
  cyan:    { btnActive: 'bg-cyan-100 border-cyan-300 text-cyan-900',        btnIdle: 'bg-white border-cyan-200 text-cyan-700 hover:border-cyan-400',        hover: 'hover:bg-cyan-50',    selected: 'font-semibold text-cyan-800 bg-cyan-50',     border: 'border-cyan-200',  accent: 'accent-cyan-700',    countText: 'text-cyan-500',   divider: 'border-cyan-100',  clearText: 'text-cyan-600' },
  rose:    { btnActive: 'bg-rose-100 border-rose-300 text-rose-900',        btnIdle: 'bg-white border-rose-200 text-rose-700 hover:border-rose-400',        hover: 'hover:bg-rose-50',    selected: 'font-semibold text-rose-800 bg-rose-50',     border: 'border-rose-200',  accent: 'accent-rose-700',    countText: 'text-rose-500',   divider: 'border-rose-100',  clearText: 'text-rose-600' },
};

export default function FilterDropdown({ label, value, options, onPick, multi = false, tone = 'amber' }) {
  const t = TONES[tone] || TONES.amber;
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e) {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    }
    function onEsc(e) { if (e.key === 'Escape') setOpen(false); }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
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
  }

  return (
    <div ref={wrapRef} className="relative inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`text-sm px-3 py-2 rounded-lg border transition-colors max-w-full truncate ${
          active ? `${t.btnActive} font-medium` : t.btnIdle
        }`}
      >
        {label}{buttonSummary}
        <span className="ml-1 opacity-60">▾</span>
      </button>
      {open && (
        // Width is clamped to the viewport (minus the page gutter) so a
        // 220px panel never causes horizontal scroll or clips on a 360px
        // phone. left-0 + max-width keeps it on-screen near either edge.
        <div className={`absolute left-0 mt-1 bg-white text-amber-900 rounded-lg shadow-xl border ${t.border} z-30 w-[max(13.75rem,0px)] max-w-[calc(100vw-2.5rem)] max-h-[60vh] overflow-y-auto py-1`}>
          {active && (
            <>
              <button
                onClick={clearAll}
                className={`block w-full text-left px-3 py-2 text-sm ${t.clearText} ${t.hover}`}
              >
                ✕ Clear {multi && selected.length > 1 ? `${selected.length} filters` : 'filter'}
              </button>
              <hr className={`my-1 ${t.divider}`} />
            </>
          )}
          {options.length === 0 ? (
            <div className="px-3 py-2 text-sm text-amber-400 italic">No options</div>
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
                onClick={() => { onPick(opt.value); setOpen(false); }}
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
      )}
    </div>
  );
}
