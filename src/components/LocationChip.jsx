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
  const { location, setLocation, clearLocation, requestPreciseLocation } = useUserLocation();
  const [open, setOpen] = useState(false);
  const [gpsState, setGpsState] = useState('idle'); // idle | requesting | denied

  function onPreciseClick() {
    setGpsState('requesting');
    requestPreciseLocation()
      .then(() => { setGpsState('idle'); setOpen(false); })
      .catch(() => setGpsState('denied'));
  }

  // Show source hint on the chip so the user knows why distances may be coarse.
  const sourceTag = location?.source === 'gps' ? '🎯' : location?.source === 'manual' ? '📍' : '🌐';

  return (
    <div className="relative inline-block min-w-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-xs text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-2 min-h-[44px] sm:min-h-0 rounded-full transition-colors max-w-[10rem] sm:max-w-none truncate inline-flex items-center"
      >
        <span className="truncate">
          {location ? `${sourceTag} Near ${location.label || 'you'}` : '📍 Set location'}
        </span>
        <span className="ml-1 opacity-60 flex-shrink-0">▾</span>
      </button>
      {open && (
        <div className="absolute left-0 mt-1 bg-surface-elevated text-fg rounded-lg shadow-xl border border-border-strong z-20 w-[min(16rem,calc(100vw-2rem))] py-1">
          <button
            onClick={onPreciseClick}
            disabled={gpsState === 'requesting'}
            className="block w-full text-left px-3 py-2 text-sm hover:bg-surface-muted border-b border-border disabled:opacity-60"
          >
            🎯 <span className="font-semibold">Use precise location</span>
            <div className="text-xs text-fg-muted mt-0.5">
              {gpsState === 'denied'
                ? 'Permission denied — check browser settings'
                : gpsState === 'requesting'
                ? 'Asking your browser…'
                : 'Meter-accurate, asks for permission'}
            </div>
          </button>
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => { setLocation({ ...p, source: 'manual' }); setOpen(false); }}
              className={`block w-full text-left px-3 py-2.5 sm:py-1.5 text-sm hover:bg-surface-muted ${
                location?.label === p.label ? 'font-semibold text-fg' : ''
              }`}
            >
              {p.label}
            </button>
          ))}
          <hr className="my-1 border-border" />
          <button
            onClick={() => { clearLocation(); setOpen(false); }}
            className="block w-full text-left px-3 py-2.5 sm:py-1.5 text-sm hover:bg-surface-muted text-fg-muted"
          >
            Anywhere
          </button>
        </div>
      )}
    </div>
  );
}
