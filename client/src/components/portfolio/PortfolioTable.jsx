import PriceChangeTag from '../stocks/PriceChangeTag';
import LoadingSpinner from '../common/LoadingSpinner';

export default function PortfolioTable({ positions, loading, onDelete }) {
  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>;
  if (!positions.length) return (
    <div className="text-center py-12 text-gray-500">
      No positions yet. Add trades using the form above.
    </div>
  );

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800 bg-gray-900/60">
            {['Symbol', 'Qty', 'Avg Cost', 'Current Price', 'Market Value', 'Unrealized P&L', ''].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs text-gray-400 font-medium uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {positions.map((p) => (
            <tr key={p.symbol} className="hover:bg-gray-800/40 transition-colors">
              <td className="px-4 py-3 font-semibold text-gray-100">{p.symbol}</td>
              <td className="px-4 py-3 text-gray-300">{p.quantity}</td>
              <td className="px-4 py-3 text-gray-300">${p.avgCost.toFixed(2)}</td>
              <td className="px-4 py-3 text-gray-100">
                {p.currentPrice != null ? `$${p.currentPrice.toFixed(2)}` : <span className="text-gray-500">Loading…</span>}
              </td>
              <td className="px-4 py-3 text-gray-100">
                {p.marketValue != null ? `$${p.marketValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'}
              </td>
              <td className="px-4 py-3">
                {p.unrealizedPL != null ? (
                  <span className={p.unrealizedPL >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                    ${p.unrealizedPL.toFixed(2)} <PriceChangeTag value={p.plPct} />
                  </span>
                ) : '—'}
              </td>
              <td className="px-4 py-3" />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
