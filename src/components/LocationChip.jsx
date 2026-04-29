import { useState } from 'react';
import { useUserLocation } from '../hooks/useUserLocation.js';

/**
 * Q11/Q12a header chip: "Showing nearest to {City} · change". Click to
 * open a tiny dropdown with a manual city pick (one of the major
 * Canadian metros) or "Anywhere" to clear. Pure client-side; persists
 * via the useUserLocation hook.
 */
const PRESETS = [
  { label: 'Vancouver',  lat: 49.2827, lng: -123.1207 },
  { label: 'Victoria',   lat: 48.4284, lng: -123.3656 },
  { label: 'Calgary',    lat: 51.0447, lng: -114.0719 },
  { label: 'Edmonton',   lat: 53.5461, lng: -113.4938 },
  { label: 'Toronto',    lat: 43.6532, lng: -79.3832  },
  { label: 'Ottawa',     lat: 45.4215, lng: -75.6972  },
  { label: 'Montreal',   lat: 45.5017, lng: -73.5673  },
  { label: 'Halifax',    lat: 44.6488, lng: -63.5752  },
];

export default function LocationChip() {
  const { location, setLocation, clearLocation } = useUserLocation();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-xs text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full transition-colors"
      >
        {location ? `📍 Near ${location.label || 'you'}` : '📍 Set location'}
        <span className="ml-1 opacity-60">▾</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-1 bg-white text-amber-900 rounded-lg shadow-xl border border-amber-200 z-20 min-w-[200px] py-1">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => { setLocation({ ...p, source: 'manual' }); setOpen(false); }}
              className={`block w-full text-left px-3 py-1.5 text-sm hover:bg-amber-50 ${
                location?.label === p.label ? 'font-semibold text-amber-800' : ''
              }`}
            >
              {p.label}
            </button>
          ))}
          <hr className="my-1 border-amber-100" />
          <button
            onClick={() => { clearLocation(); setOpen(false); }}
            className="block w-full text-left px-3 py-1.5 text-sm hover:bg-amber-50 text-amber-600"
          >
            Anywhere
          </button>
        </div>
      )}
    </div>
  );
}
