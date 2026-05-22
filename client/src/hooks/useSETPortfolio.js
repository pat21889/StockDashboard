import { useState, useEffect, useCallback } from 'react';
import backend from '../api/backend';

export function useSETPortfolio() {
  const [trades, setTrades] = useState([]);
  const [prices, setPrices] = useState({});  // { [symbol]: { price, change_pct } }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTrades = useCallback(async () => {
    try {
      const { data } = await backend.get('/api/set/trades');
      setTrades(data);
      setError(null);
      return data;
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPrices = useCallback(async (tradeList) => {
    const symbols = [...new Set(tradeList.map(t => t.symbol))];
    if (!symbols.length) return;
    try {
      const { data } = await backend.get('/api/set/prices', { params: { symbols: symbols.join(',') } });
      const map = {};
      for (const item of data) map[item.symbol] = item;
      setPrices(map);
    } catch {
      // non-fatal — prices just won't show
    }
  }, []);

  useEffect(() => {
    fetchTrades().then((data) => fetchPrices(data));
  }, [fetchTrades, fetchPrices]);

  const addTrade = async (trade) => {
    const { data } = await backend.post('/api/set/trades', trade);
    const updated = [data, ...trades];
    setTrades(updated);
    fetchPrices(updated);
    return data;
  };

  const deleteTrade = async (id) => {
    await backend.delete(`/api/set/trades/${id}`);
    const updated = trades.filter(t => t.id !== id);
    setTrades(updated);
    fetchPrices(updated);
  };

  // Compute aggregated positions
  const getPositions = () => {
    const map = {};
    for (const t of trades) {
      if (!map[t.symbol]) map[t.symbol] = { symbol: t.symbol, totalQty: 0, totalCost: 0 };
      const qty = t.side === 'BUY' ? t.quantity : -t.quantity;
      map[t.symbol].totalQty += qty;
      if (t.side === 'BUY') map[t.symbol].totalCost += t.quantity * t.price;
    }
    return Object.values(map)
      .filter(p => p.totalQty > 0)
      .map(p => {
        const avgCost = p.totalCost / p.totalQty;
        const livePrice = prices[p.symbol]?.price ?? null;
        const marketValue = livePrice != null ? livePrice * p.totalQty : null;
        const unrealizedPL = marketValue != null ? marketValue - avgCost * p.totalQty : null;
        const plPct = unrealizedPL != null ? (unrealizedPL / (avgCost * p.totalQty)) * 100 : null;
        const changePct = prices[p.symbol]?.change_pct ?? null;
        return { symbol: p.symbol, quantity: p.totalQty, avgCost, currentPrice: livePrice, marketValue, unrealizedPL, plPct, changePct };
      });
  };

  return { trades, prices, loading, error, fetchTrades, addTrade, deleteTrade, getPositions };
}
