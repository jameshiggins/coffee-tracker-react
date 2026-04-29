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
        <h1 className="text-2xl font-bold text-amber-900 mb-3">Check your email</h1>
        <p className="text-amber-800">
          If an account exists for <strong>{email}</strong>, we've sent a password
          reset link. The link expires in 60 minutes.
        </p>
        <p className="text-sm text-amber-600 mt-4">
          Didn't receive it? Check your spam folder, or{' '}
          <button onClick={() => setSubmitted(false)} className="underline">try a different address</button>.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-amber-900 mb-4">Forgot password?</h1>
      <form onSubmit={submit} className="space-y-3 bg-white p-5 rounded-xl border border-amber-100 shadow-sm">
        <div>
          <label className="text-xs uppercase tracking-wide text-amber-700">Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                 autoComplete="email"
                 className="w-full p-2 border border-amber-200 rounded-md focus:outline-none focus:border-amber-700" />
        </div>
        <button type="submit" disabled={submitting}
                className="w-full bg-amber-800 hover:bg-amber-900 disabled:opacity-50 text-white py-2 rounded-md font-medium">
          {submitting ? 'Sending…' : 'Send reset link'}
        </button>
      </form>
      <p className="text-center text-sm text-amber-700 mt-6">
        <Link to="/sign-in" className="underline">Back to sign in</Link>
      </p>
    </div>
  );
}
