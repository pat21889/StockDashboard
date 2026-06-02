import { useEffect, useMemo, useState } from 'react';
import TopBar from '../components/layout/TopBar';
import TradeForm from '../components/portfolio/TradeForm';
import PortfolioTable from '../components/portfolio/PortfolioTable';
import PLSummary from '../components/portfolio/PLSummary';
import StockChart from '../components/stocks/StockChart';
import usePortfolioStore from '../store/usePortfolioStore';
import { useFinnhubSocket } from '../hooks/useFinnhubSocket';
import { useMergedPrices } from '../hooks/useMergedPrices';

export default function NasdaqPortfolioPage() {
  const { trades, loading, fetchTrades, getPositions, fetchQuotePrices } = usePortfolioStore();
  const mergedPrices = useMergedPrices();
  const [chartSymbol, setChartSymbol] = useState(null);

  const positions = useMemo(() => getPositions(mergedPrices), [mergedPrices, getPositions]);
  const symbols = useMemo(() => positions.map((p) => p.symbol), [positions]);

  useFinnhubSocket(symbols);

  useEffect(() => { fetchTrades(); }, []);

  useEffect(() => {
    if (symbols.length) fetchQuotePrices(symbols);
  }, [symbols.join(',')]);

  return (
    <div className="flex flex-col h-full">
      <TopBar title="NASDAQ Portfolio" />
      <main className="flex-1 p-6 overflow-auto">
        <TradeForm onAdded={() => fetchTrades()} />
        <PLSummary positions={positions} />
        <PortfolioTable positions={positions} loading={loading} />

        {symbols.length > 0 && (
          <div className="mt-6">
            <h2 className="text-xs text-gray-400 uppercase tracking-wider mb-3">Price Chart</h2>
            <div className="flex gap-2 mb-4 flex-wrap">
              {symbols.map((s) => (
                <button
                  key={s}
                  onClick={() => setChartSymbol(s)}
                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                    chartSymbol === s
                      ? 'bg-sky-600 border-sky-600 text-white'
                      : 'border-gray-700 text-gray-400 hover:border-sky-500'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            {chartSymbol && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <p className="text-sm font-semibold text-gray-300 mb-3">{chartSymbol} — 30 Day</p>
                <StockChart symbol={chartSymbol} />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
