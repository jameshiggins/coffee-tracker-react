import { useCallback, useEffect, useState } from 'react';

/**
 * ux#10: Saved views — persist named filter combinations in localStorage.
 *
 * A "view" is just a saved /beans query string under a user-given name,
 * plus the in-stock match count at save time (so the UI can flag when more
 * beans match now — a no-backend "restock" hint). Everything lives in
 * localStorage so it survives reloads and needs no account.
 *
 * Shape persisted: [{ id, name, query, count, createdAt }]
 *
 * All reads/writes are wrapped in try/catch so a blocked or unavailable
 * localStorage (private mode, quota) degrades to an in-memory list for the
 * session instead of throwing.
 */
const KEY = 'roastmap_saved_views';

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function write(views) {
  try {
    localStorage.setItem(KEY, JSON.stringify(views));
  } catch {
    /* ignore — non-persistent for this session is acceptable */
  }
}

export function useSavedViews() {
  const [views, setViews] = useState(read);

  // Stay in sync if another tab (or another instance of this hook) edits the
  // list. The native 'storage' event only fires in *other* tabs, so same-tab
  // updates rely on the shared setState below.
  useEffect(() => {
    function onStorage(e) {
      if (e.key === KEY) setViews(read());
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Save (or overwrite a same-named view — saving "Light Ethiopians" twice
  // updates it rather than duplicating). Newest sorts last.
  const save = useCallback((name, query, count = null) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setViews((prev) => {
      const id =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `v_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const without = prev.filter((v) => v.name.toLowerCase() !== trimmed.toLowerCase());
      const next = [...without, { id, name: trimmed, query, count, createdAt: Date.now() }];
      write(next);
      return next;
    });
  }, []);

  const remove = useCallback((id) => {
    setViews((prev) => {
      const next = prev.filter((v) => v.id !== id);
      write(next);
      return next;
    });
  }, []);

  return { views, save, remove };
}
