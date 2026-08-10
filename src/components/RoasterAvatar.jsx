import { useState } from 'react';
import { getFaviconSources, roasterTint, roasterInitials } from '../utils/roasterFavicon.js';

/**
 * The one shared roaster avatar. Renders the roaster's favicon/logo on a
 * consistent chip, falling back to a deterministic tinted monogram when
 * there's no favicon or the image 404s.
 *
 * Sharpness: Google S2 favicon URLs get a 1x/2x srcSet (64/128px) so retina
 * displays receive a big-enough bitmap; scraped icons pass through as-is.
 *
 * Dark mode: the chip keeps a LIGHT background (`dark:bg-white/95`) on
 * purpose. Favicons are designed for light UI — dark marks vanish on a dark
 * tile, and opaque white-box icons clash. A uniform light chip keeps every
 * mark legible in both themes.
 *
 * Decorative by contract: every call site renders the roaster name directly
 * beside the avatar, so it's aria-hidden with an empty alt.
 */
export default function RoasterAvatar({ name, faviconUrl, size = 40, className = '' }) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImg = Boolean(faviconUrl) && !imgFailed;
  const rounded = size >= 32 ? 'rounded-lg' : 'rounded-md';

  if (!showImg) {
    const { hue } = roasterTint(name);
    return (
      <span
        aria-hidden="true"
        className={`inline-flex flex-shrink-0 items-center justify-center overflow-hidden font-bold leading-none text-white ${rounded} ${className}`}
        style={{
          width: size,
          height: size,
          backgroundColor: `hsl(${hue} 42% 42%)`,
          fontSize: Math.max(9, Math.round(size * 0.3)),
        }}
      >
        {roasterInitials(name)}
      </span>
    );
  }

  const { src, srcSet } = getFaviconSources(faviconUrl);
  return (
    <span
      aria-hidden="true"
      className={`inline-flex flex-shrink-0 items-center justify-center overflow-hidden border border-border bg-surface dark:bg-white/95 ${rounded} ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={src}
        srcSet={srcSet}
        alt=""
        loading="lazy"
        onError={() => setImgFailed(true)}
        className={`w-full h-full object-contain ${size >= 32 ? 'p-1' : 'p-0.5'}`}
      />
    </span>
  );
}
