import { useState } from 'react';
import { useUserLocation } from '../hooks/useUserLocation.js';
import Icon from './Icon.jsx';

/**
 * Location chip: "Near {City}". Click to open a small dropdown with a
 * precise-location request, a manual city pick (major Canadian metros), or
 * "Anywhere" to clear. Pure client-side; persists via useUserLocation.
 *
 * Lives on the Roasters page next to the "Sort by distance" control it feeds
 * (moved out of the header). Styled with semantic tokens; truncates so it
 * never overflows a narrow row.
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

  return (
    <div className="relative flex min-w-0">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 min-w-0 max-w-[8.5rem] sm:max-w-none min-h-[40px] px-2.5 py-2 rounded-full text-xs font-medium
                   text-fg-muted hover:text-fg bg-surface-muted hover:bg-border transition-colors"
      >
        <Icon name="pin" size={14} className="flex-shrink-0" />
        <span className="truncate">{location ? `Near ${location.label || 'you'}` : 'Set location'}</span>
        <Icon name="chevronDown" size={14} className="flex-shrink-0 opacity-60" />
      </button>
      {open && (
        <div className="absolute left-0 mt-1.5 bg-surface-elevated text-fg rounded-xl shadow-lg border border-border-strong z-30 w-[min(16rem,calc(100vw-2rem))] py-1">
          <button
            onClick={onPreciseClick}
            disabled={gpsState === 'requesting'}
            className="flex w-full items-start gap-2.5 text-left px-3 py-2.5 text-sm hover:bg-surface-muted border-b border-border disabled:opacity-60"
          >
            <Icon name="crosshair" size={16} className="mt-0.5 flex-shrink-0 text-accent" />
            <span className="min-w-0">
              <span className="font-semibold">Use precise location</span>
              <span className="block text-xs text-fg-muted mt-0.5">
                {gpsState === 'denied'
                  ? 'Permission denied — check browser settings'
                  : gpsState === 'requesting'
                  ? 'Asking your browser…'
                  : 'Meter-accurate, asks for permission'}
              </span>
            </span>
          </button>
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => { setLocation({ ...p, source: 'manual' }); setOpen(false); }}
              className={`block w-full text-left px-3 py-2.5 sm:py-2 text-sm hover:bg-surface-muted ${
                location?.label === p.label ? 'font-semibold text-accent' : 'text-fg'
              }`}
            >
              {p.label}
            </button>
          ))}
          <hr className="my-1 border-border" />
          <button
            onClick={() => { clearLocation(); setOpen(false); }}
            className="block w-full text-left px-3 py-2.5 sm:py-2 text-sm hover:bg-surface-muted text-fg-muted"
          >
            Anywhere
          </button>
        </div>
      )}
    </div>
  );
}
