import { Component } from 'react';
import { safeSession } from '../utils/safeStorage.js';

// A stale tab that was opened before a Vercel deploy asks for chunk filenames
// that no longer exist. Depending on the host, that surfaces as a failed
// dynamic import OR (because our SPA rewrite serves index.html for unknown
// paths) an HTML response where a module was expected — several distinct
// messages across browsers. Any of them means "your app is out of date".
const CHUNK_ERROR = /Failed to fetch dynamically imported module|Importing a module script failed|Failed to load module script|error loading dynamically imported module/i;
const RELOAD_GUARD = 'rm_chunk_reload';

export function isChunkLoadError(error) {
  return !!error && CHUNK_ERROR.test(error.message || String(error));
}

// One-shot reload: if a chunk error is really a stale deploy, a single reload
// fixes it. The sessionStorage guard stops a reload loop when the reload itself
// keeps failing (offline, genuinely broken build) — then we fall through to the
// fallback UI instead. Exported so main.jsx's vite:preloadError handler shares
// the exact same guard.
export function reloadOnceForChunkError() {
  if (safeSession.get(RELOAD_GUARD)) return false;
  safeSession.set(RELOAD_GUARD, '1');
  window.location.reload();
  return true;
}

// Clear the guard after a clean load so the NEXT future deploy still gets its
// one free reload. Called from componentDidMount of the boundary.
function clearReloadGuard() {
  safeSession.remove(RELOAD_GUARD);
}

/**
 * Catches render/lifecycle errors in its subtree and shows `fallback` instead
 * of unmounting the whole React tree (the default, which white-screens the app).
 *
 * - `resetKey`: when it changes, the boundary clears its error state. Pass the
 *   route pathname so navigating away from a broken page recovers automatically.
 * - `fallback`: (error, reset) => ReactNode. Rendered when caught.
 * - Chunk-load errors trigger a single auto-reload (stale-deploy recovery)
 *   before ever showing the fallback.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
    this.reset = this.reset.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidMount() {
    // A fresh mount with no error means the app loaded cleanly — release the
    // one-shot guard for the next deploy.
    if (!this.state.error) clearReloadGuard();
  }

  componentDidCatch(error, info) {
    if (isChunkLoadError(error)) {
      // Returns false if the guard is already set (reload already tried) — then
      // we keep the error state and render the fallback below.
      reloadOnceForChunkError();
      return;
    }
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary] caught:', error, info?.componentStack);
  }

  componentDidUpdate(prev) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  reset() {
    this.setState({ error: null });
  }

  render() {
    if (this.state.error) {
      const { fallback } = this.props;
      if (typeof fallback === 'function') return fallback(this.state.error, this.reset);
      return fallback ?? null;
    }
    return this.props.children;
  }
}
