import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { parseList } from '../utils/beanFilters.js';

/**
 * Shared URL-encoded filter state for the directory pages.
 *
 * Filters live in the query string so they're shareable, back-button-
 * friendly, and survive reloads. This hook is the single place that
 * knows how to read/write them, so /beans and /roasters can share the
 * same encoding (multi-select fields are comma-joined; single-select
 * fields are plain strings) without duplicating the parse/serialise glue.
 *
 * Config:
 *   singleKeys     string[]  keys whose value is a plain string ('' = unset)
 *   multiKeys      Set<string>  keys whose value is a comma-separated list
 *   extraResetKeys string[]  params to also clear on any setFilter (e.g.
 *                            'bean' — changing a filter cancels a deep-link
 *                            card expansion)
 *   onMutate       ()=>void  optional side-effect run after setFilter and
 *                            clearAll (NOT clearFilter), e.g. collapse the
 *                            expanded card. Mirrors the prior BeansPage
 *                            behaviour exactly.
 *
 * Returns { filters, setFilter, clearFilter, clearAll, activeFilterChips,
 *           params, setParams }. `filters` only ever contains the declared
 *           keys; unrelated params (sort, similar_to, …) pass through the
 *           URL untouched and never show up as filter chips.
 */
export function useDirectoryFilters({ singleKeys = [], multiKeys = new Set(), extraResetKeys = [], onMutate } = {}) {
  const [params, setParams] = useSearchParams();

  const filters = useMemo(() => {
    const out = {};
    for (const key of singleKeys) out[key] = params.get(key) ?? '';
    for (const key of multiKeys) out[key] = parseList(params.get(key));
    return out;
    // singleKeys / multiKeys are module-level constants at every call site,
    // so params is the only meaningful dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  // Set (or clear) a single filter key. Accepts a string or an array; an
  // empty value deletes the key so the URL stays tidy. Works for any key,
  // including non-filter params like `sort`.
  const setFilter = useCallback((key, value) => {
    const next = new URLSearchParams(params);
    if (Array.isArray(value)) {
      if (value.length === 0) next.delete(key);
      else next.set(key, value.join(','));
    } else {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    for (const k of extraResetKeys) next.delete(k);
    setParams(next, { replace: true });
    onMutate?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, setParams]);

  // Remove one filter. For multi keys, pass `value` to drop just that one
  // selection (keeping siblings); omit it to clear the whole key.
  const clearFilter = useCallback((key, value = null) => {
    const next = new URLSearchParams(params);
    if (value !== null && multiKeys.has(key)) {
      const remaining = parseList(next.get(key)).filter((v) => v !== value);
      if (remaining.length === 0) next.delete(key);
      else next.set(key, remaining.join(','));
    } else {
      next.delete(key);
    }
    setParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, setParams]);

  const clearAll = useCallback(() => {
    setParams(new URLSearchParams(), { replace: true });
    onMutate?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setParams]);

  // Flatten active filters to one chip per value (multi keys → N chips).
  const activeFilterChips = useMemo(() => {
    const chips = [];
    for (const [key, value] of Object.entries(filters)) {
      if (multiKeys.has(key) && Array.isArray(value) && value.length) {
        for (const v of value) chips.push({ key, value: v });
      } else if (!multiKeys.has(key) && value) {
        chips.push({ key, value });
      }
    }
    return chips;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  return { filters, setFilter, clearFilter, clearAll, activeFilterChips, params, setParams };
}
