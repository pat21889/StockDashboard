import { useState } from 'react';
import useSocketStore from '../../store/useSocketStore';
import MarketBadge from '../common/MarketBadge';

const FILTERS = ['all', 'US', 'TH'];

export default function FavoritesPanel({ favorites, onRemove, onSelect, selectedSymbol }) {
  const [filter, setFilter] = useState('all');
  const prices = useSocketStore(s => s.prices);

  const visible = filter === 'all'
    ? favorites
    : favorites.filter(f => f.market === filter);

  return (
    <div className="bg-gray-800 rounded-xl flex flex-col p-3 h-full">
      <div className="flex items-center justify-between mb-2 flex-shrink-0">
        <span className="text-sm font-semibold text-white">Watchlist</span>
        <div className="flex gap-1">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2 py-0.5 text-xs rounded transition-colors ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white'
              }`}
            >
              {f === 'all' ? 'All' : f}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-y-auto flex-1 space-y-1 min-h-0">
        {visible.length === 0 && (
          <div className="text-xs text-gray-500 text-center py-4">
            {favorites.length === 0 ? 'Search and add stocks to watchlist' : 'No stocks in this market'}
          </div>
        )}
        {visible.map(fav => {
          const livePrice = fav.market === 'US' ? prices[fav.symbol] : null;
          const price = livePrice?.price;
          const isSelected = selectedSymbol === fav.symbol;

          return (
            <div
              key={fav.symbol}
              onClick={() => onSelect(fav)}
              className={`flex items-center justify-between px-2 py-1.5 rounded cursor-pointer group transition-colors ${
                isSelected ? 'bg-blue-900/50 border border-blue-700' : 'hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-white truncate">{fav.symbol}</div>
                  {fav.name && <div className="text-xs text-gray-400 truncate">{fav.name}</div>}
                </div>
                <MarketBadge market={fav.market} />
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {price != null && (
                  <span className="text-sm text-white font-mono">${price.toFixed(2)}</span>
                )}
                <button
                  onClick={e => { e.stopPropagation(); onRemove(fav.symbol); }}
                  className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all text-lg leading-none"
                  title="Remove from watchlist"
                >
                  ×
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
