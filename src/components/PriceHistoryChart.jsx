import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import { api } from '../api.js';

const COLORS = ['#92400e', '#0e7490', '#9333ea', '#dc2626', '#15803d'];

export default function PriceHistoryChart({ variants, mode = 'price' }) {
  const [series, setSeries] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all(variants.map((v) => api.getVariantHistory(v.id)))
      .then((results) => {
        if (cancelled) return;
        const dateSet = new Set();
        const byVariant = results.map((r, i) => {
          const map = {};
          for (const p of r.history) {
            const d = p.recorded_at.slice(0, 10);
            dateSet.add(d);
            map[d] = mode === 'price'
              ? p.price
              : Math.round((p.price / variants[i].bag_weight_grams) * 100 * 10) / 10;
          }
          return map;
        });
        const dates = Array.from(dateSet).sort();
        const data = dates.map((date) => {
          const row = { date };
          variants.forEach((v, i) => { row[`${v.bag_weight_grams}g`] = byVariant[i][date] ?? null; });
          return row;
        });
        setSeries(data);
      })
      .catch((e) => !cancelled && setError(e.message));
    return () => { cancelled = true; };
  }, [variants, mode]);

  if (error) return <div className="text-sm text-red-600">Failed to load history: {error}</div>;
  if (!series) return <div className="text-sm text-amber-700">Loading chart…</div>;
  if (series.length === 0) return <div className="text-sm text-amber-600">No history yet.</div>;

  const yLabel = mode === 'price' ? '$' : '¢/g';
  const fmt = (v) => mode === 'price' ? `$${Number(v).toFixed(2)}` : `${Number(v).toFixed(1)}¢`;

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <LineChart data={series} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3e9dc" />
          <XAxis dataKey="date" stroke="#6f4732" fontSize={11} />
          <YAxis stroke="#6f4732" fontSize={11} tickFormatter={fmt}
                 width={60} domain={['auto', 'auto']} />
          <Tooltip formatter={(v) => fmt(v)} contentStyle={{ fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {variants.map((v, i) => (
            <Line
              key={v.id}
              type="monotone"
              dataKey={`${v.bag_weight_grams}g`}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
