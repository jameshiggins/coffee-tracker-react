import React from 'react';
import ReactDOM from 'react-dom/client';
import '../styles/tokens.css';
import '../index.css';
import Showcase from './_Showcase.jsx';

/**
 * Entry point for the standalone showcase HTML. Lives outside App.jsx so
 * the routing tree stays untouched and the showcase has zero impact on
 * the production bundle a user actually loads.
 *
 * Vite builds this as a second entry; see vite.config.js rollupOptions.
 */
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Showcase />
  </React.StrictMode>
);
