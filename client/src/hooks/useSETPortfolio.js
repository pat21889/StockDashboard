import { useState, useEffect, useCallback, useMemo } from 'react';
import backend from '../api/backend';
import { calculatePositions } from '../utils/calculatePositions';

export function useSETPortfolio() {
  const [trades, setTrades] = useState([]);
  const [prices, setPrices] = useState({});
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

  const positions = useMemo(() => calculatePositions(trades, prices), [trades, prices]);

  return { trades, prices, loading, error, fetchTrades, addTrade, deleteTrade, positions };
}
