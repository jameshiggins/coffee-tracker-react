import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';

/**
 * Q15b: completes the reset using the emailed token. The reset link
 * Laravel mails points at /reset-password?token=...&email=...
 */
export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  const token = params.get('token') ?? '';
  const email = params.get('email') ?? '';

  function submit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    api.resetPassword({
      token, email,
      password,
      password_confirmation: confirm,
    })
      .then(() => setDone(true))
      .catch((body) => setError(body?.error || 'Could not reset password.'))
      .finally(() => setSubmitting(false));
  }

  if (!token || !email) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-2xl font-bold text-red-700">Invalid reset link</h2>
        <p className="text-amber-700 mt-2">Request a new reset email.</p>
        <Link to="/forgot-password" className="text-amber-800 underline mt-4 inline-block">Send a new link</Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-2xl font-bold text-amber-900">Password updated</h2>
        <p className="text-amber-700 mt-2">You can now sign in with your new password.</p>
        <Link to="/sign-in" className="bg-amber-800 hover:bg-amber-900 text-white px-5 py-2 rounded-lg mt-4 inline-block">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-amber-900 mb-4">Set a new password</h1>
      <p className="text-sm text-amber-700 mb-3">For <strong>{email}</strong></p>
      <form onSubmit={submit} className="space-y-3 bg-white p-5 rounded-xl border border-amber-100 shadow-sm">
        <div>
          <label className="text-xs uppercase tracking-wide text-amber-700">New password</label>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                 autoComplete="new-password" minLength={8}
                 className="w-full p-2 border border-amber-200 rounded-md focus:outline-none focus:border-amber-700" />
          <div className="text-xs text-amber-500 mt-0.5">At least 8 characters.</div>
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide text-amber-700">Confirm password</label>
          <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)}
                 autoComplete="new-password"
                 className="w-full p-2 border border-amber-200 rounded-md focus:outline-none focus:border-amber-700" />
        </div>
        {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">{error}</div>}
        <button type="submit" disabled={submitting}
                className="w-full bg-amber-800 hover:bg-amber-900 disabled:opacity-50 text-white py-2 rounded-md font-medium">
          {submitting ? 'Updating…' : 'Set password'}
        </button>
      </form>
    </div>
  );
}
