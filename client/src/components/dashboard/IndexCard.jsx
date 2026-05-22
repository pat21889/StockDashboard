import LoadingSpinner from '../common/LoadingSpinner';

export default function IndexCard({ label, price, change_pct, loading }) {
  const isPositive = change_pct != null && change_pct >= 0;
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col gap-2">
      <span className="text-xs text-gray-400 uppercase tracking-wider">{label}</span>
      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <span className="text-2xl font-bold text-gray-100">
            {price != null ? price.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '—'}
          </span>
          <span className={`text-sm font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
            {change_pct != null ? `${isPositive ? '+' : ''}${change_pct.toFixed(2)}%` : '—'}
          </span>
        </>
      )}
    </div>
  );
}
