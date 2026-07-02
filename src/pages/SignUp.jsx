import { useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { authFetch, GOOGLE_REDIRECT_URL, useAuth } from '../auth.jsx';
import Field from '../ui/Field.jsx';

// Match the page's original label treatment (Field's default is text-sm).
const LABEL_CLASS = 'text-xs font-normal uppercase tracking-wide text-fg-muted';
const inputClass = (invalid) =>
  `w-full p-2 border rounded-md focus:outline-none focus:border-accent bg-surface text-fg placeholder:text-fg-subtle ${
    invalid ? 'border-red-300 dark:border-red-500/30' : 'border-border'
  }`;

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
  const nameRef = useRef(null);
  const displayNameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmRef = useRef(null);

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
      .catch((e) => {
        const errs = e.body?.errors || { _: [e.body?.message || e.message] };
        setErrors(errs);
        // Put the user back on the first field the server complained about,
        // in form order.
        const first = [
          ['name', nameRef],
          ['display_name', displayNameRef],
          ['email', emailRef],
          ['password', passwordRef],
          ['password_confirmation', confirmRef],
        ].find(([key]) => errs[key]);
        first?.[1].current?.focus();
      })
      .finally(() => setSubmitting(false));
  }

  const errMsg = (k) => errors[k]?.[0];

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-fg mb-4">Create an account</h1>
      <form onSubmit={submit} className="space-y-3 bg-surface p-5 rounded-xl border border-border shadow-sm">
        <Field label="Name" labelClassName={LABEL_CLASS} error={errMsg('name')}>
          <input ref={nameRef} type="text" name="name" required value={name}
                 onChange={(e) => setName(e.target.value)}
                 autoComplete="name"
                 className={inputClass(errMsg('name'))} />
        </Field>
        <Field label="Display name (optional)" labelClassName={LABEL_CLASS} error={errMsg('display_name')}>
          <input ref={displayNameRef} type="text" name="display_name" value={displayName}
                 onChange={(e) => setDisplayName(e.target.value)}
                 autoComplete="nickname" spellCheck={false}
                 placeholder="how others see you in shared tastings"
                 className={inputClass(errMsg('display_name'))} />
        </Field>
        <Field label="Email" labelClassName={LABEL_CLASS} error={errMsg('email')}>
          <input ref={emailRef} type="email" name="email" required value={email}
                 onChange={(e) => setEmail(e.target.value)}
                 autoComplete="email" spellCheck={false}
                 className={inputClass(errMsg('email'))} />
        </Field>
        <Field label="Password" labelClassName={LABEL_CLASS} hint="At least 8 characters." error={errMsg('password')}>
          <input ref={passwordRef} type="password" name="password" required value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 autoComplete="new-password"
                 className={inputClass(errMsg('password'))} />
        </Field>
        <Field label="Confirm password" labelClassName={LABEL_CLASS} error={errMsg('password_confirmation')}>
          <input ref={confirmRef} type="password" name="password_confirmation" required value={confirm}
                 onChange={(e) => setConfirm(e.target.value)}
                 autoComplete="new-password"
                 className={inputClass(errMsg('password_confirmation'))} />
        </Field>

        {errors._ && <div role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/30">{errors._[0]}</div>}

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
