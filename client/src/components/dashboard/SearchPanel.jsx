import { useStockSearch } from '../../hooks/useStockSearch';

export default function SearchPanel({ onSelect, onAddFavorite, isFavorite }) {
  const { query, setQuery, results, loading } = useStockSearch('all');

  return (
    <div className="bg-gray-800 rounded-xl flex flex-col p-3 h-full">
      <div className="text-sm font-semibold text-white mb-2 flex-shrink-0">Search</div>

      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Symbol or company name..."
        className="w-full bg-gray-700 text-white text-sm rounded px-3 py-1.5 outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-500 flex-shrink-0"
      />

      <div className="overflow-y-auto flex-1 mt-2 space-y-1 min-h-0">
        {loading && (
          <div className="text-xs text-gray-500 text-center py-3">Searching...</div>
        )}
        {!loading && query.trim() && results.length === 0 && (
          <div className="text-xs text-gray-500 text-center py-3">No results for "{query}"</div>
        )}
        {!loading && !query.trim() && (
          <div className="text-xs text-gray-500 text-center py-3">Type to search US & TH stocks</div>
        )}
        {results.map(r => {
          const faved = isFavorite(r.symbol);
          return (
            <div
              key={`${r.symbol}-${r.market}`}
              className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-gray-700 cursor-pointer group transition-colors"
              onClick={() => onSelect(r)}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-white truncate">{r.symbol}</div>
                  {r.name && <div className="text-xs text-gray-400 truncate">{r.name}</div>}
                </div>
                <span className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 ${
                  r.market === 'US' ? 'bg-blue-900/60 text-blue-300' : 'bg-orange-900/60 text-orange-300'
                }`}>
                  {r.market}
                </span>
              </div>
              <button
                onClick={e => { e.stopPropagation(); onAddFavorite(r.symbol, r.market, r.name); }}
                className={`flex-shrink-0 text-sm transition-colors ${
                  faved
                    ? 'text-yellow-400'
                    : 'text-gray-500 hover:text-yellow-400'
                }`}
                title={faved ? 'In watchlist' : 'Add to watchlist'}
              >
                {faved ? '★' : '☆'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
