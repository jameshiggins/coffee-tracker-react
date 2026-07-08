import { useState } from 'react';
import { authFetch, useAuth } from '../auth.jsx';
import Field from '../ui/Field.jsx';
import Button from '../ui/Button.jsx';
import StarRating from '../ui/StarRating.jsx';

// Common brew methods + an "Other…" escape hatch that reveals a free-text
// field (the API stores brew_method as free text, so customs are first-class).
const BREW_METHODS = ['espresso', 'v60', 'aeropress', 'french press', 'chemex', 'moka pot', 'cold brew', 'other'];

const inputCls =
  'w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface text-fg ' +
  'placeholder:text-fg-subtle focus:outline-none focus:border-accent';

export default function TastingForm({ coffee, tasting, onSaved, onCancel }) {
  const { token } = useAuth();
  const isEdit = !!tasting;
  // Editing: split the stored brew_method back into the dropdown vs. the custom
  // free-text field — a value outside the preset list becomes "Other…" + custom.
  const initialBrew = tasting?.brew_method ?? '';
  const initialKnown = initialBrew !== '' && BREW_METHODS.includes(initialBrew);

  const [rating, setRating] = useState(tasting?.rating ? tasting.rating / 2 : 0); // STAR units (0–5); 0 = no rating
  const [notes, setNotes] = useState(tasting?.notes ?? '');
  const [brewMethod, setBrewMethod] = useState(initialBrew ? (initialKnown ? initialBrew : 'other') : '');
  const [customBrew, setCustomBrew] = useState(initialBrew && !initialKnown ? initialBrew : '');
  const [tastedOn, setTastedOn] = useState(() => tasting?.tasted_on ?? new Date().toISOString().slice(0, 10));
  const [isPublic, setIsPublic] = useState(tasting ? !!tasting.is_public : true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const isOther = brewMethod === 'other';
  const resolvedBrew = (isOther ? customBrew.trim() : brewMethod) || null;
  const today = new Date().toISOString().slice(0, 10);

  function submit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const body = {
      rating: rating > 0 ? Math.round(rating * 2) : null, // stars → 1–10 half-star scale
      notes: notes.trim() || null,
      brew_method: resolvedBrew,
      tasted_on: tastedOn,
      is_public: isPublic,
    };
    const req = isEdit
      ? authFetch(token, `/tastings/${tasting.id}`, { method: 'PUT', body: JSON.stringify(body) })
      : authFetch(token, '/tastings', { method: 'POST', body: JSON.stringify({ coffee_id: coffee.id, ...body }) });
    req
      .then((d) => onSaved?.(d.tasting))
      .catch((err) => setError(err.body?.message || err.message))
      .finally(() => setSubmitting(false));
  }

  return (
    <form onSubmit={submit} className="bg-surface border border-border-strong rounded-xl p-4 sm:p-5 space-y-4">
      {/* Rating */}
      <div>
        <span id="tf-rating-label" className="text-sm font-medium text-fg">Rating</span>
        <div className="flex items-center gap-3 mt-1">
          <StarRating value={rating} onChange={setRating} size={30} aria-labelledby="tf-rating-label" />
          <span className="text-sm text-fg-muted tabular-nums">
            {rating > 0 ? `${rating.toFixed(1)} / 5` : 'Tap to rate'}
          </span>
        </div>
      </div>

      {/* Notes */}
      <Field label="Notes">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="What did you taste? How did it brew?"
          className={inputCls}
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Brew method */}
        <Field label="Brew method">
          <select value={brewMethod} onChange={(e) => setBrewMethod(e.target.value)} className={inputCls}>
            <option value="">— pick —</option>
            {BREW_METHODS.map((m) => (
              <option key={m} value={m}>{m === 'other' ? 'Other…' : m}</option>
            ))}
          </select>
        </Field>

        {/* Tasted on */}
        <Field label="Tasted on">
          <input
            type="date"
            max={today}
            value={tastedOn}
            onChange={(e) => setTastedOn(e.target.value)}
            className={inputCls}
          />
        </Field>
      </div>

      {/* Custom brew — only when "Other…" is picked */}
      {isOther && (
        <Field label="Custom brew method">
          <input
            type="text"
            value={customBrew}
            onChange={(e) => setCustomBrew(e.target.value)}
            placeholder="e.g. siphon, percolator, Turkish…"
            maxLength={50}
            autoFocus
            className={inputCls}
          />
        </Field>
      )}

      {/* Visibility */}
      <label className="flex items-start gap-2.5 text-sm text-fg cursor-pointer select-none">
        <input
          type="checkbox"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
          className="mt-0.5 w-4 h-4 accent-accent"
        />
        <span>
          Share publicly
          <span className="block text-xs text-fg-subtle">Others can see your rating + notes on this coffee.</span>
        </span>
      </label>

      {error && (
        <div
          role="alert"
          className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-2.5 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/30"
        >
          {error}
        </div>
      )}

      <div className="flex gap-2 justify-end pt-1">
        {onCancel && (
          <Button type="button" variant="ghost" size="md" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" size="md" loading={submitting}>
          {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Save review'}
        </Button>
      </div>
    </form>
  );
}
