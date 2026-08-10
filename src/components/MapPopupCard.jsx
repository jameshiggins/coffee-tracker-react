import { Link } from 'react-router-dom';
import { formatCAD } from '../utils/format.js';
import Icon from './Icon.jsx';

/**
 * Roaster popup contents shown above a map marker.
 *
 * Rendered via renderToStaticMarkup (see ClusterLayer), so there is NO React
 * state/context at display time — theming must be pure CSS. The classes
 * below are styled in leaflet-overrides.css with the app's semantic tokens
 * (`--color-*`), which pierce into the popup because the static HTML lives
 * in the real DOM under `html.dark`. That's also why colors are classes, not
 * inline styles: an open popup restyles instantly when the theme flips.
 */
export default function MapPopupCard({ roaster, inStockCount }) {
  const cityRegion = [roaster.city, roaster.region].filter(Boolean).join(', ');
  const beansUrl = `/beans?roaster=${roaster.slug}`;
  return (
    <div className="rm-popup">
      <Link to={beansUrl} className="rm-popup__title">
        {roaster.name}
      </Link>
      {cityRegion && <div className="rm-popup__meta">{cityRegion}</div>}

      <div className="rm-popup__stock">
        <strong>{inStockCount}</strong> {inStockCount === 1 ? 'bean' : 'beans'} in stock
      </div>
      {roaster.free_shipping_over != null && (
        <div className="rm-popup__ship">
          Free shipping over {formatCAD(roaster.free_shipping_over, { cents: false })}
        </div>
      )}

      <div className="rm-popup__actions">
        <Link to={beansUrl} className="rm-popup-btn rm-popup-btn--primary">
          View {inStockCount > 0 ? inStockCount + ' ' : ''}beans
        </Link>
        {roaster.website_url && (
          <a
            href={roaster.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="rm-popup-btn rm-popup-btn--secondary"
          >
            Visit site <Icon name="externalLink" size={12} className="rm-popup-btn__icon" />
          </a>
        )}
      </div>
    </div>
  );
}
