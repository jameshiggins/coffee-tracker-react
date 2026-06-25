import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { authFetch, GOOGLE_REDIRECT_URL, useAuth } from '../auth.jsx';

export default function SignUp() {
  const { user, setAuthToken, setVerificationEmailSent } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  if (user) return <Navigate to="/me" replace />;

  function submit(e) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    authFetch(null, '/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name,
        display_name: displayName || null,
        email,
        password,
        password_confirmation: confirm,
      }),
    })
      .then((d) => {
        // Surfaced by EmailVerificationBanner: if the first send failed, tell
        // the user to resend instead of claiming a link is on its way.
        setVerificationEmailSent(d.verification_email_sent ?? true);
        setAuthToken(d.token);
        navigate('/me', { replace: true });
      })
      .catch((e) => setErrors(e.body?.errors || { _: [e.body?.message || e.message] }))
      .finally(() => setSubmitting(false));
  }

  const errMsg = (k) => errors[k]?.[0];

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-fg mb-4">Create an account</h1>
      <form onSubmit={submit} className="space-y-3 bg-surface p-5 rounded-xl border border-border shadow-sm">
        <Field label="Name" value={name} setter={setName} required autoComplete="name" error={errMsg('name')} />
        <Field label="Display name (optional)" value={displayName} setter={setDisplayName}
               placeholder="how others see you in shared tastings" />
        <Field label="Email" type="email" value={email} setter={setEmail} required autoComplete="email" error={errMsg('email')} />
        <Field label="Password" type="password" value={password} setter={setPassword} required
               autoComplete="new-password" error={errMsg('password')} hint="At least 8 characters." />
        <Field label="Confirm password" type="password" value={confirm} setter={setConfirm} required
               autoComplete="new-password" />

        {errors._ && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/30">{errors._[0]}</div>}

        <button type="submit" disabled={submitting}
                className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-accent-fg py-2 rounded-md font-medium">
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <div className="text-center text-fg-muted text-sm my-4">or</div>

      <a href={GOOGLE_REDIRECT_URL}
         className="block w-full text-center bg-surface border border-border-strong hover:border-border-strong text-fg py-2 rounded-md font-medium">
        Continue with Google
      </a>

      <p className="text-center text-sm text-fg-muted mt-6">
        Already have an account? <Link to="/sign-in" className="underline font-medium">Sign in</Link>
      </p>
    </div>
  );
}

function Field({ label, value, setter, type = 'text', required, autoComplete, placeholder, error, hint }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wide text-fg-muted">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => setter(e.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className={`w-full p-2 border rounded-md focus:outline-none focus:border-accent bg-surface text-fg placeholder:text-fg-subtle ${
          error ? 'border-red-300 dark:border-red-500/30' : 'border-border'
        }`}
      />
      {hint && !error && <div className="text-xs text-fg-subtle mt-0.5">{hint}</div>}
      {error && <div className="text-xs text-red-600 mt-0.5 dark:text-red-400">{error}</div>}
    </div>
  );
}
