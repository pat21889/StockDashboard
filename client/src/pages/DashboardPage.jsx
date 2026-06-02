import { useState, useEffect } from 'react';
import TopBar from '../components/layout/TopBar';
import IndexCard from '../components/dashboard/IndexCard';
import MainChartPanel from '../components/dashboard/MainChartPanel';
import FavoritesPanel from '../components/dashboard/FavoritesPanel';
import SearchPanel from '../components/dashboard/SearchPanel';
import PortfolioSidebar from '../components/dashboard/PortfolioSidebar';
import { useIndices } from '../hooks/useQuote';
import { useFavorites } from '../hooks/useFavorites';
import usePortfolioStore from '../store/usePortfolioStore';
import { useFinnhubSocket } from '../hooks/useFinnhubSocket';

export default function DashboardPage() {
  const { indices, loading: indicesLoading } = useIndices(60000);
  const { favorites, add: addFavorite, remove: removeFavorite, isFavorite } = useFavorites();
  const [selectedStock, setSelectedStock] = useState({ symbol: '^IXIC', market: 'US', name: 'NASDAQ Composite' });

  // Load NASDAQ trades on mount for portfolio sidebar
  const fetchTrades = usePortfolioStore(s => s.fetchTrades);
  const fetchQuotePrices = usePortfolioStore(s => s.fetchQuotePrices);
  const trades = usePortfolioStore(s => s.trades);
  useEffect(() => { fetchTrades(); }, [fetchTrades]);

  // Fetch REST prices for portfolio symbols once trades are loaded
  useEffect(() => {
    const symbols = [...new Set(trades.map(t => t.symbol))];
    if (symbols.length) fetchQuotePrices(symbols);
  }, [trades, fetchQuotePrices]);

  // Collect symbols to subscribe to Finnhub WebSocket (favorites + portfolio holdings)
  const usFavoriteSymbols = favorites.filter(f => f.market === 'US').map(f => f.symbol);
  const portfolioSymbols = [...new Set(trades.map(t => t.symbol))];
  const allUsSymbols = [...new Set([...usFavoriteSymbols, ...portfolioSymbols])];
  useFinnhubSocket(allUsSymbols);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="Dashboard" />

      {/* Index cards */}
      <div className="flex-shrink-0 px-4 pt-3 pb-2">
        <div className="grid grid-cols-3 gap-3">
          {indicesLoading && [1, 2, 3].map(i => <IndexCard key={i} loading />)}
          {!indicesLoading && indices.map(idx => (
            <IndexCard key={idx.symbol} label={idx.label} price={idx.price} change_pct={idx.change_pct} />
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex gap-3 px-4 pb-4 min-h-0">
        {/* Left: chart + panels */}
        <div className="flex-1 flex flex-col gap-3 min-h-0 min-w-0">
          {/* Main chart — takes most of the height */}
          <div className="flex-1 flex flex-col min-h-0">
            <MainChartPanel stock={selectedStock} />
          </div>

          {/* Bottom: favorites + search side by side */}
          <div className="flex gap-3 flex-shrink-0" style={{ height: '220px' }}>
            <div className="flex-1 min-w-0">
              <FavoritesPanel
                favorites={favorites}
                onRemove={removeFavorite}
                onSelect={setSelectedStock}
                selectedSymbol={selectedStock?.symbol}
              />
            </div>
            <div className="flex-1 min-w-0">
              <SearchPanel
                onSelect={setSelectedStock}
                onAddFavorite={addFavorite}
                isFavorite={isFavorite}
              />
            </div>
          </div>
        </div>

        {/* Right: portfolio sidebar */}
        <PortfolioSidebar />
      </div>
    </div>
  );
}
