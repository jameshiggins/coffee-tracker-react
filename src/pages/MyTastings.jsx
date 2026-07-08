import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { authFetch, useAuth } from '../auth.jsx';
import TastingForm from '../components/TastingForm.jsx';
import Button from '../ui/Button.jsx';
import Dialog from '../ui/Dialog.jsx';
import StarRating from '../ui/StarRating.jsx';
import { formatDate } from '../utils/format.js';

function tastingName(t) {
  return t.coffee?.name || t.coffee_snapshot?.name || `Coffee #${t.coffee_id}`;
}

export default function MyTastings() {
  const { token, user, loading } = useAuth();
  const [tastings, setTastings] = useState(null);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!token) return;
    authFetch(token, '/tastings')
      .then((d) => setTastings(d.tastings))
      .catch((e) => setError(e.message));
  }, [token]);

  // Merge the updated tasting back into the list (PUT returns the fresh row).
  function handleSaved(updated) {
    setTastings((list) => list.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)));
    setEditingId(null);
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setError(null);
    authFetch(token, `/tastings/${deleteTarget.id}`, { method: 'DELETE' })
      .then(() => {
        setTastings((list) => list.filter((t) => t.id !== deleteTarget.id));
        setDeleteTarget(null);
      })
      .catch((e) => setError(e.body?.message || e.message))
      .finally(() => setDeleting(false));
  }

  if (loading) return <div className="p-10 text-center text-fg">Loading…</div>;
  if (!token) return <Navigate to="/" replace />;
  if (error && !tastings) return <div className="p-10 text-center text-red-700 dark:text-red-400">{error}</div>;
  if (!tastings) return <div className="p-10 text-center text-fg">Loading your reviews…</div>;

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        {user?.avatar_url && (
          <img src={user.avatar_url} alt="" className="w-12 h-12 rounded-full border border-border-strong" />
        )}
        <div>
          <h1 className="text-2xl font-bold text-fg">{user?.display_name || user?.email}</h1>
          <p className="text-sm text-fg-muted">Your reviews</p>
        </div>
      </div>

      {error && (
        <div role="alert" className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-2.5 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/30">
          {error}
        </div>
      )}

      {tastings.length === 0 ? (
        <div className="bg-surface-muted border border-border p-10 text-center rounded-xl text-fg-muted">
          No reviews yet. Visit a roaster or browse the <Link to="/beans" className="underline">beans page</Link> and log one.
        </div>
      ) : (
        <div className="space-y-3">
          {tastings.map((t) =>
            editingId === t.id ? (
              <div key={t.id}>
                <p className="text-xs text-fg-muted mb-1 px-1">
                  Editing your review of <strong className="text-fg">{tastingName(t)}</strong>
                </p>
                <TastingForm tasting={t} onSaved={handleSaved} onCancel={() => setEditingId(null)} />
              </div>
            ) : (
              <TastingRow
                key={t.id}
                tasting={t}
                onEdit={() => setEditingId(t.id)}
                onDelete={() => setDeleteTarget(t)}
              />
            )
          )}
        </div>
      )}

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <Dialog.Content title="Delete this review?">
          <Dialog.Description>
            Your review of <strong className="text-fg">{deleteTarget ? tastingName(deleteTarget) : ''}</strong> will
            be removed from your list. This can't be undone.
          </Dialog.Description>
          <div className="flex justify-end gap-2 mt-5">
            <Dialog.Close asChild>
              <Button variant="ghost" size="sm">Cancel</Button>
            </Dialog.Close>
            <Button variant="danger" size="sm" loading={deleting} onClick={confirmDelete}>
              Delete
            </Button>
          </div>
        </Dialog.Content>
      </Dialog>
    </div>
  );
}

function TastingRow({ tasting: t, onEdit, onDelete }) {
  const c = t.coffee;
  const snap = t.coffee_snapshot;
  const removed = c?.is_removed;
  const name = tastingName(t);
  const img = c?.image_url || snap?.image_url;

  return (
    <div className={`bg-surface border border-border rounded-lg p-4 shadow-sm flex gap-4 ${removed ? 'opacity-70' : ''}`}>
      {img && (
        <img
          src={img}
          alt=""
          loading="lazy"
          className={`w-16 h-16 sm:w-20 sm:h-20 rounded-md object-cover flex-shrink-0 border border-border ${removed ? 'grayscale' : ''}`}
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      )}
      <div className="flex-1 min-w-0">
        {/* flex-wrap + a real minimum on the title column: on narrow phones
            (360px CSS) padding + thumbnail + the star row left the title a
            ~80px micro-column — every word wrapped and the ISO date broke at
            its hyphens (real device screenshot). Below 9rem the rating block
            wraps under the title instead of squeezing it. */}
        <div className="flex flex-wrap justify-between items-start gap-x-3 gap-y-1">
          <div className="flex-1 min-w-[9rem]">
            {c ? (
              <Link to={`/c/${c.id}`} className={`text-fg font-medium hover:underline ${removed ? 'line-through' : ''}`}>
                {name}
              </Link>
            ) : (
              <span className="text-fg font-medium">{name}</span>
            )}
            <div className="text-xs text-fg-subtle">
              {c && <><Link to={`/roasters/${c.roaster.slug}`} className="hover:underline">{c.roaster.name}</Link>{' · '}</>}
              <span className="whitespace-nowrap">{formatDate(t.tasted_on)}</span>
              {t.brew_method ? <> · <span className="whitespace-nowrap">{t.brew_method}</span></> : null}
            </div>
            {removed && (
              <div className="inline-block mt-1 text-[11px] sm:text-[10px] uppercase tracking-wide bg-red-50 text-red-700 px-1.5 py-0.5 rounded border border-red-100 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/30">
                no longer sold
              </div>
            )}
          </div>
          <div className="text-right flex-shrink-0 flex flex-col items-end gap-1 ml-auto">
            {t.rating ? (
              <StarRating value={t.rating / 2} readOnly size={15} />
            ) : (
              <span className="text-fg-subtle text-sm">no rating</span>
            )}
            {!t.is_public && (
              <div className="text-[11px] sm:text-[10px] uppercase tracking-wide text-fg-subtle">private</div>
            )}
          </div>
        </div>
        {t.notes && <div className="text-sm text-fg mt-2 italic whitespace-pre-line">{t.notes}</div>}
        <div className="flex gap-1 mt-3 pt-2 border-t border-border">
          <Button variant="ghost" size="md" onClick={onEdit}>Edit</Button>
          <Button variant="ghost" size="md" onClick={onDelete}>Delete</Button>
        </div>
      </div>
    </div>
  );
}
