import { useState } from 'react';
import { api } from '../api.js';

/**
 * Q17: tiny "Report" link shown next to public tastings. Anyone (logged
 * in or not) can flag — the API endpoint is rate-limited and idempotent.
 * No auto-hide on flag; the admin moderation queue makes the decision.
 */
export default function ReportTastingButton({ tastingId }) {
  const [state, setState] = useState('idle'); // idle | sending | done | error

  function onClick() {
    if (state !== 'idle') return;
    if (!confirm('Report this tasting for moderator review?')) return;
    setState('sending');
    api.reportTasting(tastingId)
      .then(() => setState('done'))
      .catch(() => setState('error'));
  }

  if (state === 'done') {
    return <span className="text-xs text-amber-600">Reported · thanks</span>;
  }
  if (state === 'error') {
    return <span className="text-xs text-red-600">Couldn’t report</span>;
  }

  return (
    <button
      onClick={onClick}
      disabled={state === 'sending'}
      className="text-xs text-amber-500 hover:text-red-700 underline disabled:opacity-50"
      title="Report this tasting for review"
    >
      {state === 'sending' ? 'Reporting…' : 'Report'}
    </button>
  );
}
