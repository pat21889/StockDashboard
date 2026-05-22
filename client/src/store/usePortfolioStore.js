import { create } from 'zustand';
import backend from '../api/backend';

const QUOTE_CACHE_MS = 5 * 60 * 1000;

const usePortfolioStore = create((set, get) => ({
  trades: [],
  loading: false,
  error: null,

  // REST-seeded prices (Yahoo Finance via backend) — shared across pages
  quotePrices: {},
  quotesFetchedAt: 0,

  fetchQuotePrices: async (symbols) => {
    if (!symbols.length) return;
    if (Date.now() - get().quotesFetchedAt < QUOTE_CACHE_MS) return;
    try {
      const { data } = await backend.get('/api/market/quotes', {
        params: { symbols: symbols.join(','), market: 'US' },
      });
      const map = {};
      for (const q of data) if (q.price != null) map[q.symbol] = { price: q.price };
      set({ quotePrices: map, quotesFetchedAt: Date.now() });
    } catch {}
  },

  fetchTrades: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await backend.get('/api/nasdaq/trades');
      set({ trades: data, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  addTrade: async (trade) => {
    const { data } = await backend.post('/api/nasdaq/trades', trade);
    set((state) => ({ trades: [data, ...state.trades] }));
    return data;
  },

  deleteTrade: async (id) => {
    await backend.delete(`/api/nasdaq/trades/${id}`);
    set((state) => ({ trades: state.trades.filter((t) => t.id !== id) }));
  },

  // Compute per-symbol aggregated positions from trades list
  getPositions: (livePrices) => {
    const { trades } = get();
    const map = {};
    for (const t of trades) {
      if (!map[t.symbol]) map[t.symbol] = { symbol: t.symbol, totalQty: 0, totalCost: 0 };
      const qty = t.side === 'BUY' ? t.quantity : -t.quantity;
      map[t.symbol].totalQty += qty;
      map[t.symbol].totalCost += t.side === 'BUY' ? t.quantity * t.price : 0;
    }
    return Object.values(map)
      .filter((p) => p.totalQty > 0)
      .map((p) => {
        const avgCost = p.totalCost / p.totalQty;
        const currentPrice = livePrices[p.symbol]?.price ?? null;
        const marketValue = currentPrice != null ? currentPrice * p.totalQty : null;
        const unrealizedPL = marketValue != null ? marketValue - avgCost * p.totalQty : null;
        const plPct = unrealizedPL != null ? (unrealizedPL / (avgCost * p.totalQty)) * 100 : null;
        return { symbol: p.symbol, quantity: p.totalQty, avgCost, currentPrice, marketValue, unrealizedPL, plPct };
      });
  },
}));

export default usePortfolioStore;
