import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { SpeedInsights } from '@vercel/speed-insights/react';
import App from './App.jsx';
import './styles/tokens.css';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      {/* Vercel Speed Insights — collects RES (LCP/CLS/INP/etc) from real
          users in prod. Renders nothing of its own; in dev it's a no-op. */}
      <SpeedInsights />
    </BrowserRouter>
  </React.StrictMode>
);
