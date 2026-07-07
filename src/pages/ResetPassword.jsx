import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import Field from '../ui/Field.jsx';

// Match the page's original label treatment (Field's default is text-sm).
const LABEL_CLASS = 'text-xs font-normal uppercase tracking-wide text-fg-muted';
const INPUT_CLASS =
  'w-full p-2 border border-border rounded-md focus:outline-none focus:border-accent bg-surface text-fg placeholder:text-fg-subtle';

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
        <h2 className="text-2xl font-bold text-red-700 dark:text-red-400">Invalid reset link</h2>
        <p className="text-fg-muted mt-2">Request a new reset email.</p>
        <Link to="/forgot-password" className="text-accent underline mt-4 inline-block">Send a new link</Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-2xl font-bold text-fg">Password updated</h2>
        <p className="text-fg-muted mt-2">You can now sign in with your new password.</p>
        <Link to="/sign-in" className="bg-accent hover:bg-accent-hover text-accent-fg px-5 py-2 rounded-lg mt-4 inline-block">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-fg mb-4">Set a new password</h1>
      <p className="text-sm text-fg-muted mb-3">For <strong>{email}</strong></p>
      <form onSubmit={submit} className="space-y-3 bg-surface p-5 rounded-xl border border-border shadow-sm">
        <Field label="New password" labelClassName={LABEL_CLASS} hint="At least 8 characters.">
          <input type="password" name="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                 autoComplete="new-password" minLength={8}
                 className={INPUT_CLASS} />
        </Field>
        <Field label="Confirm password" labelClassName={LABEL_CLASS}>
          <input type="password" name="password_confirmation" required value={confirm} onChange={(e) => setConfirm(e.target.value)}
                 autoComplete="new-password"
                 className={INPUT_CLASS} />
        </Field>
        {error && <div role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/30">{error}</div>}
        <button type="submit" disabled={submitting}
                className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-accent-fg py-2 rounded-md font-medium">
          {submitting ? 'Updating…' : 'Set password'}
        </button>
      </form>
    </div>
  );
}
