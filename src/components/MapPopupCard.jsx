import { Link } from 'react-router-dom';

/**
 * Roaster popup contents shown above a map marker. Uses inline styles
 * (not Tailwind classes) because Leaflet's .leaflet-popup-content
 * wrapper has its own margin/font-family resets that fight Tailwind
 * specificity — inline guarantees the design lands as drawn.
 */
export default function MapPopupCard({ roaster, inStockCount }) {
  const cityRegion = [roaster.city, roaster.region].filter(Boolean).join(', ');
  const beansUrl = `/beans?roaster=${roaster.slug}`;
  return (
    <div style={{ minWidth: 240, fontFamily: 'Inter, system-ui, sans-serif' }}>
      <Link
        to={beansUrl}
        style={{
          display: 'block',
          fontWeight: 700,
          fontSize: 15,
          color: '#6f4326',
          textDecoration: 'none',
          lineHeight: 1.2,
        }}
      >
        {roaster.name}
      </Link>
      {cityRegion && (
        <div style={{ fontSize: 12, color: '#7a5a3a', marginTop: 3 }}>{cityRegion}</div>
      )}

      <div style={{ fontSize: 12, color: '#3a2614', marginTop: 8 }}>
        <strong>{inStockCount}</strong> {inStockCount === 1 ? 'bean' : 'beans'} in stock
      </div>
      {roaster.free_shipping_over != null && (
        <div style={{ fontSize: 11, color: '#7a5a3a', marginTop: 2 }}>
          Free shipping over ${Number(roaster.free_shipping_over).toFixed(0)}
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
        <Link
          to={beansUrl}
          className="rm-popup-btn"
          style={{
            flex: 1,
            textAlign: 'center',
            padding: '7px 10px',
            background: '#6f4326',
            color: '#fef6e7',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          View {inStockCount > 0 ? inStockCount + ' ' : ''}beans
        </Link>
        {roaster.website_url && (
          <a
            href={roaster.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="rm-popup-btn"
            style={{
              flex: 1,
              textAlign: 'center',
              padding: '7px 10px',
              border: '1px solid #6f4326',
              color: '#6f4326',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              textDecoration: 'none',
              background: 'transparent',
            }}
          >
            Visit site ↗
          </a>
        )}
      </div>
    </div>
  );
}
