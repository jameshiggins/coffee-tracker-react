import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { authFetch, useAuth } from '../auth.jsx';
import { useFavoriteRoasters } from '../hooks/useFavoriteRoasters.jsx';
import { useSeo } from '../hooks/useSeo.js';
import Card from '../ui/Card.jsx';
import Field from '../ui/Field.jsx';
import Dialog from '../ui/Dialog.jsx';
import Snackbar from '../ui/Snackbar.jsx';
import RoasterAvatar from '../components/RoasterAvatar.jsx';
import Icon from '../components/Icon.jsx';

/**
 * Account settings (/me/settings). Independent sections, each its own form
 * with its own submit — a failed password change shouldn't hold the profile
 * hostage. Field-level 422 errors render inline via <Field error>; success
 * confirms via Snackbar.
 *
 * Google-linked accounts were created with a random password they never saw,
 * so anywhere current_password gates a change we surface the forgot-password
 * escape hatch.
 */

const inputClass =
  'w-full px-3 py-2.5 rounded-lg text-sm bg-surface border border-border text-fg ' +
  'placeholder:text-fg-subtle focus:outline-none focus:border-accent';

const primaryBtn =
  'px-4 py-2.5 rounded-lg bg-accent text-accent-fg text-sm font-medium ' +
  'hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

/** Pull field-level messages out of an authFetch 422 error. */
function fieldErrors(err) {
  const errors = err?.body?.errors;
  if (!errors) return {};
  return Object.fromEntries(
    Object.entries(errors).map(([k, v]) => [k, Array.isArray(v) ? v[0] : String(v)]),
  );
}

export default function AccountSettings() {
  useSeo({ title: 'Account settings', description: 'Manage your Roastmap account.' });
  const { token, user, setUser, setAuthToken, loading } = useAuth();
  const [snackbar, setSnackbar] = useState(null);
  const snack = (message) => setSnackbar({ id: Date.now(), message });

  if (loading || (token && !user)) return <div className="p-10 text-center text-fg">Loading…</div>;
  if (!token) return <Navigate to="/sign-in" replace />;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-fg mb-1">Account settings</h1>
      <p className="text-sm text-fg-muted mb-6">
        Signed in as <span className="font-medium text-fg">{user.email}</span>
      </p>

      <div className="space-y-5">
        <ProfileSection user={user} token={token} setUser={setUser} snack={snack} />
        <PinnedRoastersSection />
        <EmailSection user={user} token={token} setUser={setUser} snack={snack} />
        <PasswordSection user={user} token={token} snack={snack} />
        <ShortcutsSection user={user} />
        <DangerZone user={user} token={token} setAuthToken={setAuthToken} />
      </div>

      {snackbar && (
        <Snackbar
          key={snackbar.id}
          kind="added"
          message={snackbar.message}
          onDismiss={() => setSnackbar(null)}
        />
      )}
    </div>
  );
}

function SectionCard({ title, subtitle, children }) {
  return (
    <Card padding="lg">
      <h2 className="text-base font-semibold text-fg">{title}</h2>
      {subtitle && <p className="mt-0.5 text-sm text-fg-muted">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </Card>
  );
}

/* ---------------- Profile: name + display name ---------------- */

function ProfileSection({ user, token, setUser, snack }) {
  const [name, setName] = useState(user.name || '');
  const [displayName, setDisplayName] = useState(user.display_name || '');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      const d = await authFetch(token, '/me', {
        method: 'PATCH',
        body: JSON.stringify({ name, display_name: displayName }),
      });
      setUser(d.user);
      snack('Profile saved');
    } catch (err) {
      setErrors(fieldErrors(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <SectionCard title="Profile">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Name" error={errors.name}>
          <input
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </Field>
        <Field
          label="Username"
          hint={
            displayName
              ? `Your public profile: /u/${displayName}`
              : 'Letters, numbers, hyphens, and underscores.'
          }
          error={errors.display_name}
        >
          <input
            className={inputClass}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            minLength={2}
            maxLength={50}
            required
          />
        </Field>
        {user.avatar_url && (
          <p className="text-xs text-fg-subtle flex items-center gap-2">
            <img
              src={user.avatar_url}
              alt=""
              className="w-6 h-6 rounded-full border border-border"
            />
            Profile photo is managed by your Google account.
          </p>
        )}
        <button type="submit" disabled={saving} className={primaryBtn}>
          {saving ? 'Saving…' : 'Save profile'}
        </button>
      </form>
    </SectionCard>
  );
}

/* ---------------- Pinned roasters ---------------- */

function PinnedRoastersSection() {
  const { items, remove } = useFavoriteRoasters();

  return (
    <SectionCard
      title="Pinned roasters"
      subtitle="Pinned roasters stay at the top of the roaster directory."
    >
      {items.length === 0 ? (
        <p className="text-sm text-fg-muted">
          Nothing pinned yet. Hit the <Icon name="heart" size={14} className="inline -mt-0.5" /> on
          any roaster in the{' '}
          <Link to="/roasters" className="text-accent hover:underline">
            directory
          </Link>
          .
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((it) => {
            const r = it.roaster;
            if (!r) return null;
            return (
              <li key={it.id} className="py-2.5 flex items-center gap-3">
                <RoasterAvatar name={r.name} faviconUrl={r.favicon_url} size={32} />
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/beans?roaster=${r.slug}`}
                    className="font-medium text-fg hover:text-accent hover:underline truncate block"
                  >
                    {r.name}
                  </Link>
                  <span className="text-xs text-fg-subtle">
                    {[r.city, r.region].filter(Boolean).join(', ')}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => remove(r)}
                  className="text-xs font-medium text-fg-muted hover:text-danger px-2 py-1.5 rounded-md hover:bg-surface-muted transition-colors"
                >
                  Unpin
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}

/* ---------------- Email ---------------- */

function EmailSection({ user, token, setUser, snack }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      const d = await authFetch(token, '/me/email', {
        method: 'PATCH',
        body: JSON.stringify({ email, current_password: password }),
      });
      setUser(d.user);
      setSent(true);
      setEmail('');
      setPassword('');
      snack('Email updated — check your inbox to verify');
    } catch (err) {
      setErrors(fieldErrors(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <SectionCard
      title="Email"
      subtitle={`Current: ${user.email}${user.email_verified ? '' : ' (unverified)'}`}
    >
      {sent && (
        <p className="mb-3 text-sm text-success bg-surface-muted border border-border rounded-lg p-2.5">
          We sent a verification link to your new address — click it to finish the change.
        </p>
      )}
      <form onSubmit={submit} className="space-y-4">
        <Field label="New email" error={errors.email}>
          <input
            type="email"
            className={inputClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Field>
        <Field label="Current password" error={errors.current_password}>
          <input
            type="password"
            className={inputClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </Field>
        <GooglePasswordHint user={user} />
        <button type="submit" disabled={saving} className={primaryBtn}>
          {saving ? 'Updating…' : 'Update email'}
        </button>
      </form>
    </SectionCard>
  );
}

/* ---------------- Password ---------------- */

function PasswordSection({ user, token, snack }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      await authFetch(token, '/me/password', {
        method: 'PATCH',
        body: JSON.stringify({
          current_password: current,
          password: next,
          password_confirmation: confirm,
        }),
      });
      setCurrent('');
      setNext('');
      setConfirm('');
      snack('Password changed — other devices were signed out');
    } catch (err) {
      setErrors(fieldErrors(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <SectionCard title="Password" subtitle="Changing your password signs out every other device.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Current password" error={errors.current_password}>
          <input
            type="password"
            className={inputClass}
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            autoComplete="current-password"
            required
          />
        </Field>
        <Field label="New password" hint="At least 8 characters." error={errors.password}>
          <input
            type="password"
            className={inputClass}
            value={next}
            onChange={(e) => setNext(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </Field>
        <Field label="Confirm new password">
          <input
            type="password"
            className={inputClass}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </Field>
        <GooglePasswordHint user={user} />
        <button type="submit" disabled={saving} className={primaryBtn}>
          {saving ? 'Changing…' : 'Change password'}
        </button>
      </form>
    </SectionCard>
  );
}

/** Google accounts start with a random password the user never saw. */
function GooglePasswordHint({ user }) {
  if (!user.google_linked) return null;
  return (
    <p className="text-xs text-fg-muted bg-surface-muted border border-border rounded-lg p-2.5">
      Signed in with Google and never set a password? Use{' '}
      <Link to="/forgot-password" className="text-accent hover:underline">
        forgot password
      </Link>{' '}
      to create one first.
    </p>
  );
}

/* ---------------- Shortcuts ---------------- */

function ShortcutsSection({ user }) {
  return (
    <SectionCard title="Your stuff">
      <ul className="space-y-2 text-sm">
        <li>
          <Link to="/me" className="text-accent hover:underline">
            Your tastings
          </Link>
        </li>
        <li>
          <Link to="/me/wishlist" className="text-accent hover:underline">
            Your wishlist
          </Link>
        </li>
        {user.display_name && (
          <li>
            <Link to={`/u/${user.display_name}`} className="text-accent hover:underline">
              Your public profile
            </Link>
          </li>
        )}
      </ul>
    </SectionCard>
  );
}

/* ---------------- Danger zone ---------------- */

function DangerZone({ user, token, setAuthToken }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [deleting, setDeleting] = useState(false);

  async function confirmDelete() {
    setDeleting(true);
    setErrors({});
    try {
      await authFetch(token, '/me', {
        method: 'DELETE',
        body: JSON.stringify({ current_password: password }),
      });
      setAuthToken(null); // token is already revoked server-side
      navigate('/', { replace: true });
    } catch (err) {
      setErrors(fieldErrors(err));
      setDeleting(false);
    }
  }

  return (
    <Card padding="lg" className="border-danger/40">
      <h2 className="text-base font-semibold text-danger">Danger zone</h2>
      <p className="mt-0.5 text-sm text-fg-muted">
        Deleting your account permanently removes your tastings, wishlist, and pinned roasters. This
        cannot be undone.
      </p>
      <div className="mt-4">
        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            if (!v) {
              setPassword('');
              setErrors({});
            }
          }}
        >
          <Dialog.Trigger asChild>
            <button
              type="button"
              className="px-4 py-2.5 rounded-lg border border-danger/50 text-danger text-sm font-medium hover:bg-danger hover:text-danger-fg transition-colors"
            >
              Delete account…
            </button>
          </Dialog.Trigger>
          <Dialog.Content title="Delete your account?">
            <Dialog.Description className="text-sm text-fg-muted">
              This permanently deletes <span className="font-medium text-fg">{user.email}</span> and
              everything attached to it. Enter your password to confirm.
            </Dialog.Description>
            <div className="mt-4 space-y-4">
              <Field label="Password" error={errors.current_password}>
                <input
                  type="password"
                  className={inputClass}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </Field>
              <GooglePasswordHint user={user} />
              <div className="flex justify-end gap-2">
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="px-4 py-2.5 rounded-lg border border-border text-fg text-sm font-medium hover:bg-surface-muted transition-colors"
                  >
                    Cancel
                  </button>
                </Dialog.Close>
                <button
                  type="button"
                  disabled={!password || deleting}
                  onClick={confirmDelete}
                  className="px-4 py-2.5 rounded-lg bg-danger text-danger-fg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? 'Deleting…' : 'Delete forever'}
                </button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog>
      </div>
    </Card>
  );
}
