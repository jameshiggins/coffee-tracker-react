import { useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { authFetch, GOOGLE_REDIRECT_URL, useAuth } from '../auth.jsx';
import Field from '../ui/Field.jsx';

// Match the page's original label treatment (Field's default is text-sm).
const LABEL_CLASS = 'text-xs font-normal uppercase tracking-wide text-fg-muted';
const INPUT_CLASS =
  'w-full p-2 border border-border rounded-md focus:outline-none focus:border-accent bg-surface text-fg placeholder:text-fg-subtle';

export default function SignIn() {
  const { user, setAuthToken } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  if (user) return <Navigate to="/me" replace />;

  function submit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    authFetch(null, '/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
      .then((d) => {
        setAuthToken(d.token);
        navigate('/me', { replace: true });
      })
      .catch((e) => {
        setError(e.body?.errors?.email?.[0] || e.body?.message || e.message);
        // Put the user back on the first field the server complained about.
        const errs = e.body?.errors || {};
        const first = [
          ['email', emailRef],
          ['password', passwordRef],
        ].find(([key]) => errs[key]);
        (first ? first[1] : emailRef).current?.focus();
      })
      .finally(() => setSubmitting(false));
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-fg mb-4">Sign in</h1>
      <form onSubmit={submit} className="space-y-3 bg-surface p-5 rounded-xl border border-border shadow-sm">
        <Field label="Email" labelClassName={LABEL_CLASS}>
          <input ref={emailRef} type="email" name="email" required value={email}
                 onChange={(e) => setEmail(e.target.value)}
                 autoComplete="email" spellCheck={false}
                 className={INPUT_CLASS} />
        </Field>
        <Field label="Password" labelClassName={LABEL_CLASS}>
          <input ref={passwordRef} type="password" name="password" required value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 autoComplete="current-password"
                 className={INPUT_CLASS} />
        </Field>
        {error && <div role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/30">{error}</div>}
        <button type="submit" disabled={submitting}
                className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-accent-fg py-2 rounded-md font-medium">
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <div className="text-center text-fg-muted text-sm my-4">or</div>

      <a href={GOOGLE_REDIRECT_URL}
         className="block w-full text-center bg-surface border border-border-strong hover:border-border-strong text-fg py-2 rounded-md font-medium">
        Continue with Google
      </a>

      <p className="text-center text-sm text-fg-muted mt-6">
        New here? <Link to="/sign-up" className="underline font-medium">Create an account</Link>
      </p>
      <p className="text-center text-sm text-fg-muted mt-2">
        Forgot your password? <Link to="/forgot-password" className="underline">Reset it</Link>
      </p>
    </div>
  );
}
