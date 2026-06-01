import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';

/**
 * Q15a: forgot-password form. Always shows the same success message
 * whether or not the email is registered (server-side enumeration
 * prevention is paired with this).
 */
export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function submit(e) {
    e.preventDefault();
    setSubmitting(true);
    api.forgotPassword(email)
      .catch(() => {/* server always returns 200; ignore */})
      .finally(() => { setSubmitted(true); setSubmitting(false); });
  }

  if (submitted) {
    return (
      <div className="p-6 max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-fg mb-3">Check your email</h1>
        <p className="text-fg">
          If an account exists for <strong>{email}</strong>, we've sent a password
          reset link. The link expires in 60 minutes.
        </p>
        <p className="text-sm text-fg-muted mt-4">
          Didn't receive it? Check your spam folder, or{' '}
          <button onClick={() => setSubmitted(false)} className="underline">try a different address</button>.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-fg mb-4">Forgot password?</h1>
      <form onSubmit={submit} className="space-y-3 bg-surface p-5 rounded-xl border border-border shadow-sm">
        <div>
          <label className="text-xs uppercase tracking-wide text-fg-muted">Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                 autoComplete="email"
                 className="w-full p-2 border border-border rounded-md focus:outline-none focus:border-accent bg-surface text-fg placeholder:text-fg-subtle" />
        </div>
        <button type="submit" disabled={submitting}
                className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-accent-fg py-2 rounded-md font-medium">
          {submitting ? 'Sending…' : 'Send reset link'}
        </button>
      </form>
      <p className="text-center text-sm text-fg-muted mt-6">
        <Link to="/sign-in" className="underline">Back to sign in</Link>
      </p>
    </div>
  );
}
