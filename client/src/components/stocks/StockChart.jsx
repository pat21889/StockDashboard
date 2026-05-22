import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { fetchCandles } from '../../api/finnhub';
import LoadingSpinner from '../common/LoadingSpinner';

export default function StockChart({ symbol }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!symbol) return;
    setLoading(true);
    fetchCandles(symbol)
      .then((candles) => {
        if (candles.s === 'ok') {
          const points = candles.t.map((ts, i) => ({
            date: new Date(ts * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            price: candles.c[i],
          }));
          setData(points);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [symbol]);

  if (loading) return <div className="flex justify-center py-8"><LoadingSpinner size="lg" /></div>;
  if (!data.length) return <p className="text-gray-500 text-sm py-4">No chart data available</p>;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
        <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
        <YAxis domain={['auto', 'auto']} tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} width={60} tickFormatter={(v) => `$${v.toFixed(0)}`} />
        <Tooltip
          contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }}
          labelStyle={{ color: '#9ca3af', fontSize: 12 }}
          itemStyle={{ color: '#38bdf8', fontSize: 12 }}
          formatter={(v) => [`$${v.toFixed(2)}`, 'Price']}
        />
        <Line type="monotone" dataKey="price" stroke="#38bdf8" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
