import { useState } from 'react';
import usePortfolioStore from '../../store/usePortfolioStore';
import toast from 'react-hot-toast';

const empty = { symbol: '', side: 'BUY', quantity: '', price: '', trade_date: new Date().toISOString().slice(0, 10), note: '' };

export default function TradeForm({ onAdded }) {
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const addTrade = usePortfolioStore((s) => s.addTrade);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

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
      <h3 className="text-sm font-semibold text-gray-300 mb-4">Log NASDAQ Trade</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Symbol</label>
          <input className={input} placeholder="AAPL" value={form.symbol} onChange={(e) => set('symbol', e.target.value.toUpperCase())} required />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Side</label>
          <select className={input} value={form.side} onChange={(e) => set('side', e.target.value)}>
            <option>BUY</option>
            <option>SELL</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Quantity</label>
          <input className={input} type="number" min="0.0001" step="any" placeholder="10" value={form.quantity} onChange={(e) => set('quantity', e.target.value)} required />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Price (USD)</label>
          <input className={input} type="number" min="0.0001" step="any" placeholder="150.00" value={form.price} onChange={(e) => set('price', e.target.value)} required />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Date</label>
          <input className={input} type="date" value={form.trade_date} onChange={(e) => set('trade_date', e.target.value)} required />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Note</label>
          <input className={input} placeholder="Optional" value={form.note} onChange={(e) => set('note', e.target.value)} />
        </div>
      </div>
      <button
        type="submit"
        disabled={saving}
        className="mt-4 px-5 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
      >
        {saving ? 'Saving…' : 'Add Trade'}
      </button>
    </form>
  );
}
