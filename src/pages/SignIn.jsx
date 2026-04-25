import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { authFetch, GOOGLE_REDIRECT_URL, useAuth } from '../auth.jsx';

export default function SignIn() {
  const { user, setAuthToken } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

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
      .catch((e) => setError(e.body?.errors?.email?.[0] || e.body?.message || e.message))
      .finally(() => setSubmitting(false));
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-amber-900 mb-4">Sign in</h1>
      <form onSubmit={submit} className="space-y-3 bg-white p-5 rounded-xl border border-amber-100 shadow-sm">
        <div>
          <label className="text-xs uppercase tracking-wide text-amber-700">Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                 autoComplete="email"
                 className="w-full p-2 border border-amber-200 rounded-md focus:outline-none focus:border-amber-700" />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide text-amber-700">Password</label>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                 autoComplete="current-password"
                 className="w-full p-2 border border-amber-200 rounded-md focus:outline-none focus:border-amber-700" />
        </div>
        {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">{error}</div>}
        <button type="submit" disabled={submitting}
                className="w-full bg-amber-800 hover:bg-amber-900 disabled:opacity-50 text-white py-2 rounded-md font-medium">
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <div className="text-center text-amber-600 text-sm my-4">or</div>

      <a href={GOOGLE_REDIRECT_URL}
         className="block w-full text-center bg-white border border-amber-200 hover:border-amber-400 text-amber-900 py-2 rounded-md font-medium">
        Continue with Google
      </a>

      <p className="text-center text-sm text-amber-700 mt-6">
        New here? <Link to="/sign-up" className="underline font-medium">Create an account</Link>
      </p>
    </div>
  );
}
