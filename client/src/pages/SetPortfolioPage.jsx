import { useState } from 'react';
import TopBar from '../components/layout/TopBar';
import PLSummary from '../components/portfolio/PLSummary';
import LoadingSpinner from '../components/common/LoadingSpinner';
import PriceChangeTag from '../components/stocks/PriceChangeTag';
import { useSETPortfolio } from '../hooks/useSETPortfolio';
import toast from 'react-hot-toast';

const empty = { symbol: '', side: 'BUY', quantity: '', price: '', trade_date: new Date().toISOString().slice(0, 10), note: '' };

function SETTradeForm({ addTrade, onAdded }) {
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await addTrade({ ...form, quantity: parseFloat(form.quantity), price: parseFloat(form.price) });
      toast.success(`${form.side} ${form.symbol.toUpperCase()} added`);
      setForm(empty);
      onAdded?.();
    } catch (err) {
      toast.error(err.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  };

  const input = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-1 focus:ring-sky-500';

  return (
    <form onSubmit={submit} className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
      <h3 className="text-sm font-semibold text-gray-300 mb-4">Log SET Trade (from Finansia)</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Symbol</label>
          <input className={input} placeholder="PTT" value={form.symbol} onChange={e => set('symbol', e.target.value.toUpperCase())} required />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Side</label>
          <select className={input} value={form.side} onChange={e => set('side', e.target.value)}>
            <option>BUY</option>
            <option>SELL</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Shares</label>
          <input className={input} type="number" min="1" step="1" placeholder="100" value={form.quantity} onChange={e => set('quantity', e.target.value)} required />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Price (THB)</label>
          <input className={input} type="number" min="0.01" step="any" placeholder="35.50" value={form.price} onChange={e => set('price', e.target.value)} required />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Date</label>
          <input className={input} type="date" value={form.trade_date} onChange={e => set('trade_date', e.target.value)} required />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Note</label>
          <input className={input} placeholder="Optional" value={form.note} onChange={e => set('note', e.target.value)} />
        </div>
      </div>
      <div className="mt-3 text-xs text-gray-500">
        Live prices via FCS API (cached 10 min). Free key at{' '}
        <a href="https://fcsapi.com" target="_blank" rel="noreferrer" className="text-sky-400 hover:underline">fcsapi.com</a>
        {' '}→ add to <code className="bg-gray-800 px-1 rounded">server/.env</code> as <code className="bg-gray-800 px-1 rounded">FCS_API_KEY</code>.
      </div>
      <button type="submit" disabled={saving}
        className="mt-4 px-5 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
        {saving ? 'Saving…' : 'Add Trade'}
      </button>
    </form>
  );
}

export default function SetPortfolioPage() {
  const { loading, error, positions, fetchTrades, addTrade } = useSETPortfolio();

  return (
    <div className="flex flex-col h-full">
      <TopBar title="SET Portfolio (Finansia)" />
      <main className="flex-1 p-6 overflow-auto">
        <SETTradeForm addTrade={addTrade} onAdded={fetchTrades} />
        <PLSummary positions={positions} currency="฿" />

        {loading && <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>}

        {error && !loading && (
          <div className="bg-red-900/20 border border-red-700 rounded-xl p-4 text-sm text-red-300 mb-4">{error}</div>
        )}

        {!loading && positions.length === 0 && (
          <div className="text-center py-12 text-gray-500 text-sm">
            No positions yet. Log your Finansia trades using the form above.
          </div>
        )}

        {!loading && positions.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-gray-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-900/60">
                  {['Symbol', 'Shares', 'Avg Cost (฿)', 'Current (฿)', 'Today', 'Market Value (฿)', 'Unrealized P&L'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs text-gray-400 font-medium uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {positions.map(p => (
                  <tr key={p.symbol} className="hover:bg-gray-800/40 transition-colors">
                    <td className="px-4 py-3 font-semibold text-gray-100">{p.symbol}</td>
                    <td className="px-4 py-3 text-gray-300">{p.quantity.toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-300">{p.avgCost.toFixed(2)}</td>
                    <td className="px-4 py-3 text-gray-100">
                      {p.currentPrice != null ? p.currentPrice.toFixed(2) : <span className="text-gray-500 text-xs">No key set</span>}
                    </td>
                    <td className="px-4 py-3"><PriceChangeTag value={p.changePct} /></td>
                    <td className="px-4 py-3 text-gray-100">
                      {p.marketValue != null ? p.marketValue.toLocaleString('th-TH', { minimumFractionDigits: 2 }) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {p.unrealizedPL != null ? (
                        <span className={p.unrealizedPL >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                          {p.unrealizedPL >= 0 ? '+' : ''}฿{p.unrealizedPL.toFixed(2)} <PriceChangeTag value={p.plPct} />
                        </span>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
