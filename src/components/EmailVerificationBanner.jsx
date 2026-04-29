import { useState } from 'react';
import { authFetch, useAuth } from '../auth.jsx';

/**
 * Q15: pestered-but-not-blocked banner shown to logged-in users whose
 * email_verified flag is false. Lets them resend the link inline.
 * Hidden once verification completes (via /me re-fetch on next page load).
 */
export default function EmailVerificationBanner() {
  const { token, user } = useAuth();
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error

  if (!user || user.email_verified) return null;

  function resend() {
    setStatus('sending');
    authFetch(token, '/email/verify/resend', { method: 'POST' })
      .then(() => setStatus('sent'))
      .catch(() => setStatus('error'));
  }

  return (
    <div className="bg-yellow-50 border-b border-yellow-200 text-yellow-900 px-4 py-2 text-sm flex items-center justify-between gap-3 flex-wrap">
      <span>
        ⚠️ <strong>Verify your email</strong> — we sent a link to{' '}
        <code className="bg-yellow-100 px-1 rounded">{user.email}</code>.
        Restock alerts won't fire until you verify.
      </span>
      <button
        onClick={resend}
        disabled={status === 'sending' || status === 'sent'}
        className="bg-yellow-800 hover:bg-yellow-900 disabled:opacity-50 text-white text-xs px-3 py-1 rounded"
      >
        {status === 'sent' ? 'Sent ✓' : status === 'sending' ? 'Sending…' : 'Resend link'}
      </button>
    </div>
  );
}
