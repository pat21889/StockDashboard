import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import backend from '../../api/backend';

const RANGES = ['today', '5d', '1m', '6m', '1y', '5y', 'ytd'];

function formatLabel(ts, range) {
  const d = new Date(ts * 1000);
  if (range === 'today') {
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  if (range === '5d') {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' +
      d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
}

function formatPrice(price, market) {
  if (price == null) return '--';
  return market === 'TH'
    ? price.toFixed(2) + ' ฿'
    : '$' + price.toFixed(2);
}

const CustomTooltip = ({ active, payload, range, market }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm">
      <div className="text-gray-400">{formatLabel(d.t, range)}</div>
      <div className="text-white font-semibold">{formatPrice(d.c, market)}</div>
    </div>
  );
};

export default function MainChartPanel({ stock }) {
  const [range, setRange] = useState('today');
  const [candles, setCandles] = useState(null);
  const [previousClose, setPreviousClose] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!stock) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    backend.get(`/api/market/candles/${stock.symbol}`, {
      params: { market: stock.market, range }
    })
      .then(r => {
        if (cancelled) return;
        const d = r.data;
        if (!d || d.s === 'no_data' || !d.t?.length) {
          setCandles([]);
          setPreviousClose(null);
        } else {
          const points = d.t.map((t, i) => ({ t, o: d.o[i], h: d.h[i], l: d.l[i], c: d.c[i], v: d.v[i] }));
          setCandles(points);
          setPreviousClose(d.previousClose ?? null);
        }
      })
      .catch(err => { if (!cancelled) setError(err.response?.data?.error || err.response?.statusText || err.message || 'Network error — is the server running?'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [stock, range]);

  if (!stock) {
    return (
      <div className="flex-1 bg-gray-800 rounded-xl flex items-center justify-center text-gray-500 min-h-0">
        <div className="text-center">
          <div className="text-4xl mb-2">📈</div>
          <div>Select a stock to view chart</div>
        </div>
      </div>
    );
  }

  const firstClose = candles?.[0]?.c;
  const lastClose = candles?.[candles.length - 1]?.c;
  // For 'today', compare vs previous session close (matches brokerage app convention).
  // For all other ranges, compare first candle → last candle.
  const baseClose = (range === 'today' && previousClose) ? previousClose : firstClose;
  const changePct = baseClose && lastClose ? ((lastClose - baseClose) / baseClose) * 100 : null;
  const isPositive = changePct == null ? true : changePct >= 0;
  const lineColor = isPositive ? '#22c55e' : '#ef4444';

  const yValues = candles?.map(d => d.c).filter(Boolean) ?? [];
  const yMin = yValues.length ? Math.min(...yValues) : undefined;
  const yMax = yValues.length ? Math.max(...yValues) : undefined;
  const yPad = yMin != null && yMax != null ? (yMax - yMin) * 0.05 || 1 : 1;

  return (
    <div className="h-full bg-gray-800 rounded-xl flex flex-col p-4 min-h-0">
      {/* Header */}
      <div className="flex items-start justify-between mb-3 flex-shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-white">{stock.symbol}</span>
            <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">{stock.market}</span>
          </div>
          {stock.name && <div className="text-sm text-gray-400 mt-0.5">{stock.name}</div>}
          {lastClose != null && (
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-semibold text-white">{formatPrice(lastClose, stock.market)}</span>
              {changePct != null && (
                <span className={`text-sm font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                  {isPositive ? '+' : ''}{changePct.toFixed(2)}%
                </span>
              )}
            </div>
          )}
        </div>
        {/* Range buttons */}
        <div className="flex gap-1">
          {RANGES.map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-2 py-1 text-xs rounded font-medium transition-colors ${
                range === r
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white'
              }`}
            >
              {r.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">Loading...</div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center text-red-400 text-sm px-4 text-center">{error}</div>
        )}
        {!loading && !error && candles?.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">No data available</div>
        )}
        {!loading && !error && candles?.length > 0 && (
          <div className="absolute inset-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={candles} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
              <XAxis
                dataKey="t"
                tickFormatter={ts => {
                  const d = new Date(ts * 1000);
                  if (range === 'today') return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
                  if (range === '5d') return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                }}
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
                minTickGap={40}
              />
              <YAxis
                domain={[yMin - yPad, yMax + yPad]}
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={55}
                tickFormatter={v => stock.market === 'TH' ? v.toFixed(2) : '$' + v.toFixed(0)}
              />
              <Tooltip content={<CustomTooltip range={range} market={stock.market} />} />
              {baseClose != null && (
                <ReferenceLine y={baseClose} stroke="#4b5563" strokeDasharray="4 2" />
              )}
              <Line
                type="monotone"
                dataKey="c"
                stroke={lineColor}
                dot={false}
                strokeWidth={2}
                activeDot={{ r: 4, fill: lineColor }}
              />
            </LineChart>
          </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
