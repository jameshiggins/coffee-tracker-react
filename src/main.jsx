import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { SpeedInsights } from '@vercel/speed-insights/react';
import App from './App.jsx';
import ErrorBoundary, { reloadOnceForChunkError } from './components/ErrorBoundary.jsx';
import './styles/tokens.css';
import './index.css';

// Vite fires this when a lazy chunk / CSS preload fails to load — the classic
// "user had a tab open across a deploy and the hashed filenames changed" case.
// Recover with the same one-shot reload the ErrorBoundary uses, so a render-time
// chunk error and a preload-time chunk error can't double-reload.
window.addEventListener('vite:preloadError', (e) => {
  e.preventDefault();
  reloadOnceForChunkError();
});

// Top-level, router-free fallback. It renders OUTSIDE any usable router/provider
// state (the tree has crashed), so it uses a plain <a>, not <Link>.
function RootFallback() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: '1rem',
      padding: '2rem', textAlign: 'center', fontFamily: 'system-ui, sans-serif',
      color: '#1c1917', background: '#faf8f5',
    }}>
      <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Something went wrong</h1>
      <p style={{ margin: 0, color: '#57534e', maxWidth: '28rem' }}>
        The page hit an unexpected error. Reloading usually fixes it.
      </p>
      <a href="/" onClick={() => window.location.reload()} style={{
        marginTop: '0.5rem', padding: '0.625rem 1.25rem', borderRadius: '0.5rem',
        background: '#9a3412', color: '#fff', fontWeight: 600, textDecoration: 'none',
      }}>
        Reload Roastmap
      </a>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary fallback={<RootFallback />}>
      <BrowserRouter>
        <App />
        {/* Vercel Speed Insights — collects RES (LCP/CLS/INP/etc) from real
            users in prod. Renders nothing of its own; in dev it's a no-op. */}
        <SpeedInsights />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
