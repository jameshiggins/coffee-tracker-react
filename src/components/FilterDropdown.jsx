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
 */
export default function FilterDropdown({ label, value, options, onPick, multi = false }) {
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
        className={`text-sm px-3 py-2 rounded-lg border transition-colors ${
          active
            ? 'bg-amber-100 border-amber-300 text-amber-900 font-medium'
            : 'bg-white border-amber-200 text-amber-700 hover:border-amber-400'
        }`}
      >
        {label}{buttonSummary}
        <span className="ml-1 opacity-60">▾</span>
      </button>
      {open && (
        <div className="absolute left-0 mt-1 bg-white text-amber-900 rounded-lg shadow-xl border border-amber-200 z-30 min-w-[220px] max-h-[60vh] overflow-y-auto py-1">
          {active && (
            <>
              <button
                onClick={clearAll}
                className="block w-full text-left px-3 py-2 text-sm text-amber-600 hover:bg-amber-50"
              >
                ✕ Clear {multi && selected.length > 1 ? `${selected.length} filters` : 'filter'}
              </button>
              <hr className="my-1 border-amber-100" />
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
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-amber-50 cursor-pointer ${
                    checked ? 'font-semibold text-amber-800 bg-amber-50' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleMulti(opt.value)}
                    className="accent-amber-700"
                  />
                  <span className="flex-1">{opt.label}</span>
                  {opt.count != null && (
                    <span className="text-amber-500 text-xs">({opt.count})</span>
                  )}
                </label>
              );
            })
          ) : (
            options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { onPick(opt.value); setOpen(false); }}
                className={`block w-full text-left px-3 py-1.5 text-sm hover:bg-amber-50 ${
                  selected === opt.value ? 'font-semibold text-amber-800 bg-amber-50' : ''
                }`}
              >
                {opt.label}
                {opt.count != null && (
                  <span className="text-amber-500 text-xs ml-1.5">({opt.count})</span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
