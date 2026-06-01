import { useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';
import { flattenBeans } from '../utils/beans.js';

/**
 * Load the roaster directory once and expose it both as the raw roaster
 * list and as a flattened bean list (one entry per coffee, each carrying
 * its parent roaster). Shared by the bean directory and anything else
 * that needs the same data without re-fetching.
 *
 * Returns { roasters, beans, error, loading }:
 *   roasters  null until loaded, then the array
 *   beans     [] until loaded, then flattenBeans(roasters)
 *   error     null | string  (message of a failed fetch)
 *   loading   true until the first fetch resolves or rejects
 */
export function useBeans() {
  const [roasters, setRoasters] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api.listRoasters()
      .then((d) => { if (!cancelled) setRoasters(d.roasters); })
      .catch((e) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, []);

  const beans = useMemo(() => (roasters ? flattenBeans(roasters) : []), [roasters]);
  const loading = roasters === null && error === null;

  return { roasters, beans, error, loading };
}
