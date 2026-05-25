import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import L from 'leaflet';
// Side-effect: registers L.markerClusterGroup on the global Leaflet object.
import 'leaflet.markercluster';
// Spider-leg lines + cluster animations. We deliberately do NOT import
// MarkerCluster.Default.css — our createClusterIcon supplies its own
// brand-styled bubble and we don't want the default-blue leaking through.
import 'leaflet.markercluster/dist/MarkerCluster.css';
import { isCoffeeInStock } from '../utils/stock.js';
import { beanIcon } from './MapMarkerIcon.jsx';
import { createClusterIcon } from './MapClusterIcon.jsx';
import MapPopupCard from './MapPopupCard.jsx';

/**
 * Cluster nearby map markers into a single brand-styled bubble with a
 * count badge — same UX as the standard react-leaflet-cluster wrapper,
 * but implemented directly against leaflet.markercluster because the
 * React wrappers (v2 AND v4) silently render no children in this
 * codebase's React/Leaflet/peer-dep combination.
 *
 * Imperative integration: we create plain L.marker instances inside a
 * useEffect, attach them to an L.markerClusterGroup, and bind popups
 * whose HTML is the renderToStaticMarkup output of <MapPopupCard>.
 * MemoryRouter provides router context so the popup's <Link> elements
 * render as plain <a href> — clicking them does a full navigation to
 * /beans?roaster=… or external. Acceptable trade-off for popup links;
 * the user is leaving the map anyway.
 *
 * Mount inside a <MapContainer>; renders nothing of its own (Leaflet
 * owns the cluster group's DOM).
 */
export default function ClusterLayer({ markers }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const group = L.markerClusterGroup({
      iconCreateFunction: createClusterIcon,
      // Tuned for ~90 Canadian roasters: at country zoom the BC coast
      // collapses to one or two clusters; zoom-to-city splits cleanly.
      maxClusterRadius: 50,
      // Splay overlapping markers at max zoom so each is individually
      // clickable instead of permanently clustered.
      spiderfyOnMaxZoom: true,
      // The default cluster-bounds polygon on hover is ugly — off.
      showCoverageOnHover: false,
      // Async-load chunks of markers for large sets. Harmless at our
      // current scale; future-proof if the directory grows.
      chunkedLoading: true,
    });

    for (const r of markers) {
      const rotation = -50 + ((r.id * 17) % 50);
      const inStockCount = (r.coffees || []).filter(isCoffeeInStock).length;

      const marker = L.marker([r.latitude, r.longitude], {
        icon: beanIcon({ rotation }),
      });

      // Pre-render the popup HTML once per marker. MemoryRouter provides
      // the router context the <Link> elements need to render without
      // erroring; the resulting <a href> works for navigation (full
      // reload on click, which is fine for popup-driven navigation).
      const popupHtml = renderToStaticMarkup(
        <MemoryRouter>
          <MapPopupCard roaster={r} inStockCount={inStockCount} />
        </MemoryRouter>
      );
      marker.bindPopup(popupHtml, {
        minWidth: 240,
        maxWidth: 280,
        autoPan: true,
      });

      group.addLayer(marker);
    }

    map.addLayer(group);

    return () => {
      map.removeLayer(group);
    };
  }, [markers, map]);

  return null;
}
