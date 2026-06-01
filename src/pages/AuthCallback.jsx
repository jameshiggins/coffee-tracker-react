import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth.jsx';

export default function AuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { setAuthToken } = useAuth();
  const token = params.get('token');
  const error = params.get('auth_error');

  useEffect(() => {
    if (token) {
      setAuthToken(token);
      navigate('/me', { replace: true });
    }
  }, [token, setAuthToken, navigate]);

  if (error) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-xl font-bold text-red-700 dark:text-red-400">Sign-in failed</h2>
        <p className="text-fg-muted mt-2">Please try again.</p>
        <a href="/" className="text-accent underline mt-4 inline-block">← Home</a>
      </div>
    );
  }

  return <div className="p-10 text-center text-fg-muted">Signing you in…</div>;
}
