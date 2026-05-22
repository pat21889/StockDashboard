import PriceChangeTag from '../stocks/PriceChangeTag';

export default function PLSummary({ positions, currency = '$' }) {
  const totalValue = positions.reduce((s, p) => s + (p.marketValue ?? 0), 0);
  const totalPL = positions.reduce((s, p) => s + (p.unrealizedPL ?? 0), 0);
  const totalCost = positions.reduce((s, p) => s + (p.avgCost * p.quantity), 0);
  const plPct = totalCost > 0 ? (totalPL / totalCost) * 100 : null;

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      {[
        { label: 'Portfolio Value', value: `${currency}${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
        { label: 'Unrealized P&L', value: `${currency}${totalPL.toFixed(2)}`, pct: plPct, color: true },
        { label: 'Positions', value: positions.length },
      ].map(({ label, value, pct, color }) => (
        <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <span className="text-xs text-gray-400 block mb-1">{label}</span>
          <span className={`text-xl font-bold ${color ? (totalPL >= 0 ? 'text-emerald-400' : 'text-red-400') : 'text-gray-100'}`}>
            {value}
          </span>
          {pct != null && <div className="mt-0.5"><PriceChangeTag value={pct} /></div>}
        </div>
      ))}
    </div>
  );
}
