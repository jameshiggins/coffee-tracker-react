import { useState } from 'react';
import { authFetch, useAuth } from '../auth.jsx';

const BREW_METHODS = ['', 'espresso', 'v60', 'aeropress', 'french press', 'chemex', 'moka pot', 'cold brew', 'other'];

export default function TastingForm({ coffee, onSaved, onCancel }) {
  const { token } = useAuth();
  const [rating, setRating] = useState(8);
  const [notes, setNotes] = useState('');
  const [brewMethod, setBrewMethod] = useState('');
  const [tastedOn, setTastedOn] = useState(() => new Date().toISOString().slice(0, 10));
  const [isPublic, setIsPublic] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  function submit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    authFetch(token, '/tastings', {
      method: 'POST',
      body: JSON.stringify({
        coffee_id: coffee.id,
        rating,
        notes: notes.trim() || null,
        brew_method: brewMethod || null,
        tasted_on: tastedOn,
        is_public: isPublic,
      }),
    })
      .then((d) => onSaved?.(d.tasting))
      .catch((e) => setError(e.body?.message || e.message))
      .finally(() => setSubmitting(false));
  }

  return (
    <form onSubmit={submit} className="bg-white border border-amber-200 rounded-lg p-4 space-y-3">
      <div>
        <label className="text-xs uppercase tracking-wide text-amber-700">Rating: {(rating / 2).toFixed(1)} / 5</label>
        <input type="range" min="1" max="10" value={rating} onChange={(e) => setRating(+e.target.value)}
               className="w-full accent-amber-700" />
      </div>
      <div>
        <label className="text-xs uppercase tracking-wide text-amber-700 block">Notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                  rows={3} placeholder="What did you taste? How did it brew?"
                  className="w-full p-2 border border-amber-200 rounded-md text-sm focus:outline-none focus:border-amber-700" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs uppercase tracking-wide text-amber-700 block">Brew method</label>
          <select value={brewMethod} onChange={(e) => setBrewMethod(e.target.value)}
                  className="w-full p-2 border border-amber-200 rounded-md text-sm">
            {BREW_METHODS.map((m) => <option key={m} value={m}>{m || '— pick —'}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide text-amber-700 block">Tasted on</label>
          <input type="date" value={tastedOn} onChange={(e) => setTastedOn(e.target.value)}
                 className="w-full p-2 border border-amber-200 rounded-md text-sm" />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-amber-800">
        <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="accent-amber-700" />
        Share publicly (others can see your rating + notes on this coffee)
      </label>

      {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">{error}</div>}

      <div className="flex gap-2 justify-end">
        {onCancel && <button type="button" onClick={onCancel} className="px-3 py-1.5 text-amber-700 hover:underline text-sm">Cancel</button>}
        <button type="submit" disabled={submitting}
                className="bg-amber-800 hover:bg-amber-900 disabled:opacity-50 text-white px-4 py-1.5 rounded-md text-sm">
          {submitting ? 'Saving…' : 'Save tasting'}
        </button>
      </div>
    </form>
  );
}
