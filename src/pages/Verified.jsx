import { Link, useSearchParams } from 'react-router-dom';

/**
 * Landing page after Laravel's signed verification URL marks the user
 * verified and redirects here. The /api/email/verify/{id}/{hash}
 * endpoint forwards a query string telling us which case happened.
 */
export default function Verified() {
  const [params] = useSearchParams();
  const ok = params.get('ok') === '1';
  const already = params.get('already') === '1';
  const error = params.get('error');

  if (error) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-2xl font-bold text-red-700 dark:text-red-400">Verification failed</h2>
        <p className="text-fg-muted mt-2">
          The link was invalid or expired. Sign in and click "Resend verification" to try again.
        </p>
        <Link to="/sign-in" className="text-accent underline mt-4 inline-block">Sign in</Link>
      </div>
    );
  }

  return (
    <div className="p-10 text-center">
      <h2 className="text-2xl font-bold text-fg">
        {already ? 'Already verified' : 'Email verified'}
      </h2>
      <p className="text-fg-muted mt-2">
        {already
          ? 'Your email was verified previously. You can use every feature of the directory.'
          : 'Thanks. You can now receive restock alerts on your wishlisted beans.'}
      </p>
      <Link to="/" className="bg-accent hover:bg-accent-hover text-accent-fg px-5 py-2 rounded-lg mt-4 inline-block">
        Browse roasters
      </Link>
    </div>
  );
}
