import { useEffect } from 'react';

/**
 * Per-route SEO/meta management for the SPA (seo epic).
 *
 * Vite ships a single static index.html, so without this every route shares
 * one title and description — bad for search results, browser history, and
 * social shares. This hook updates document.title plus the description,
 * Open Graph, Twitter, and canonical tags on mount, creating any tag that
 * isn't already in <head> (the base set lives in index.html as the no-JS
 * fallback). Pages call it with a route-appropriate title/description.
 *
 * Canonical + og:url deliberately use the path WITHOUT the query string:
 * /beans?roaster=x and /beans?country=Ethiopia are filtered views of one
 * page, not separate indexable URLs, so they all canonicalise to /beans.
 */
const SITE_NAME = 'Roastmap';
const SITE_URL = 'https://roastmap.ca';
const DEFAULT_DESCRIPTION =
  'Roastmap — the map of Canadian specialty coffee. Find micro-roasters near you, browse current beans, compare prices and stock.';

function upsertMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export function useSeo({ title, description } = {}) {
  useEffect(() => {
    const fullTitle = title
      ? `${title} — ${SITE_NAME}`
      : `${SITE_NAME} — Canadian specialty coffee`;
    const desc = description || DEFAULT_DESCRIPTION;
    const url = `${SITE_URL}${window.location.pathname}`;

    document.title = fullTitle;
    upsertMeta('name', 'description', desc);
    upsertMeta('property', 'og:title', fullTitle);
    upsertMeta('property', 'og:description', desc);
    upsertMeta('property', 'og:url', url);
    upsertMeta('name', 'twitter:title', fullTitle);
    upsertMeta('name', 'twitter:description', desc);
    upsertCanonical(url);
  }, [title, description]);
}
