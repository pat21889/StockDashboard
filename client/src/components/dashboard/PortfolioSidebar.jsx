import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import usePortfolioStore from '../../store/usePortfolioStore';
import { useSETPortfolio } from '../../hooks/useSETPortfolio';
import { useMergedPrices } from '../../hooks/useMergedPrices';
import { useExchangeRate } from '../../hooks/useExchangeRate';
import MarketBadge from '../common/MarketBadge';

const FILTERS = ['All', 'US', 'TH'];

const COLORS = [
  '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#f97316', '#ec4899', '#84cc16', '#6366f1',
];

function fmt(val, currency) {
  if (val == null || isNaN(val)) return '--';
  const abs = Math.abs(val);
  const sign = val < 0 ? '-' : '';
  if (currency === 'THB') {
    return `${sign}฿${abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `${sign}$${abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const CustomPieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs">
      <div className="text-white font-semibold">{d.symbol}</div>
      <div className="text-gray-300">{d.pct?.toFixed(1)}%</div>
    </div>
  );
};

export default function PortfolioSidebar() {
  const [filter, setFilter] = useState('All');
  const [currency, setCurrency] = useState('USD');

  const mergedPrices = useMergedPrices();
  const usdThbRate = useExchangeRate();
  const getNasdaqPositions = usePortfolioStore(s => s.getPositions);
  const { positions: rawSetPositions } = useSETPortfolio();

  const nasdaqPositions = useMemo(
    () => getNasdaqPositions(mergedPrices).map(p => ({ ...p, market: 'US' })),
    [mergedPrices, getNasdaqPositions]
  );
  const setPositions = useMemo(
    () => rawSetPositions.map(p => ({ ...p, market: 'TH' })),
    [rawSetPositions]
  );

  const allPositions = useMemo(() => [...nasdaqPositions, ...setPositions], [nasdaqPositions, setPositions]);
  const visiblePositions = useMemo(
    () => filter === 'All' ? allPositions : allPositions.filter(p => p.market === filter),
    [allPositions, filter]
  );

  const toDisplayValue = (pos) => {
    const mv = pos.marketValue ?? (pos.currentPrice != null ? pos.currentPrice * pos.quantity : null);
    if (mv == null) return null;
    if (currency === 'USD') return pos.market === 'TH' ? mv / usdThbRate : mv;
    return pos.market === 'US' ? mv * usdThbRate : mv;
  };

  const toDisplayPL = (pos) => {
    const pl = pos.unrealizedPL ?? 0;
    if (currency === 'USD') return pos.market === 'TH' ? pl / usdThbRate : pl;
    return pos.market === 'US' ? pl * usdThbRate : pl;
  };

  // Pre-compute display values once per position to avoid repeated currency conversion
  const enrichedPositions = useMemo(
    () => visiblePositions.map(p => ({ ...p, displayValue: toDisplayValue(p), displayPL: toDisplayPL(p) })),
    [visiblePositions, currency, usdThbRate]
  );

  const piePositions = enrichedPositions.filter(p => p.displayValue != null && p.displayValue > 0);
  const totalValue = piePositions.reduce((s, p) => s + p.displayValue, 0);
  const pieData = piePositions.map(p => ({
    symbol: p.symbol,
    value: p.displayValue,
    pct: totalValue > 0 ? (p.displayValue / totalValue) * 100 : 0,
  }));
  const totalDisplayPL = enrichedPositions.reduce((s, p) => s + (p.displayPL || 0), 0);

  return (
    <div className="w-72 flex-shrink-0 bg-gray-800 rounded-xl flex flex-col p-3 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 flex-shrink-0">
        <span className="text-sm font-semibold text-white">Portfolio</span>
        <button
          onClick={() => setCurrency(c => c === 'USD' ? 'THB' : 'USD')}
          className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-0.5 rounded transition-colors"
        >
          {currency}
        </button>
      </div>

      {/* Market filter */}
      <div className="flex gap-1 mb-3 flex-shrink-0">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-0.5 text-xs rounded transition-colors ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Pie chart */}
      {pieData.length > 0 ? (
        <div className="flex-shrink-0 h-36">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="symbol"
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={60}
                paddingAngle={2}
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomPieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex-shrink-0 h-36 flex items-center justify-center text-xs text-gray-500">
          No positions yet
        </div>
      )}

      {/* Total P&L */}
      {enrichedPositions.length > 0 && (
        <div className="flex-shrink-0 flex justify-between items-center py-2 border-t border-gray-700 mb-1">
          <span className="text-xs text-gray-400">Total P&L</span>
          <span className={`text-sm font-semibold ${totalDisplayPL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {totalDisplayPL >= 0 ? '+' : ''}{fmt(totalDisplayPL, currency)}
          </span>
        </div>
      )}

      {/* Positions list */}
      <div className="overflow-y-auto flex-1 space-y-1 min-h-0">
        {enrichedPositions.length === 0 && (
          <div className="text-xs text-gray-500 text-center py-4">
            {allPositions.length === 0 ? 'Add trades to see portfolio' : 'No positions in this market'}
          </div>
        )}
        {enrichedPositions.map((pos, i) => {
          const allocPct = pos.displayValue != null && totalValue > 0 ? (pos.displayValue / totalValue) * 100 : null;
          return (
            <div key={`${pos.symbol}-${pos.market}`} className="px-2 py-2 rounded hover:bg-gray-700 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: COLORS[i % COLORS.length] }}
                  />
                  <span className="text-sm font-medium text-white truncate">{pos.symbol}</span>
                  <MarketBadge market={pos.market} />
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {allocPct != null && (
                    <span className="text-xs text-gray-500">{allocPct.toFixed(1)}%</span>
                  )}
                  <span className="text-xs text-gray-400">{pos.quantity} sh</span>
                </div>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-gray-400">{pos.displayValue != null ? fmt(pos.displayValue, currency) : '--'}</span>
                <span className={`text-xs font-medium ${pos.displayPL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {pos.displayPL >= 0 ? '+' : ''}{fmt(pos.displayPL, currency)}
                  {pos.plPct != null && ` (${pos.plPct >= 0 ? '+' : ''}${pos.plPct.toFixed(1)}%)`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
